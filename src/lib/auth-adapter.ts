/**
 * Auth Adapter — passwordless OTP login backed by Postgres functions.
 */
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "./mock-data";

export interface AuthUser {
  id: string;
  name: string;
  designation: string;
  role: UserRole;
  district?: string;
  division?: string;
  department?: string;
  email: string;
  is_cso_admin?: boolean;
  phone?: string;
}

export interface OtpRequestResult {
  sent: boolean;
  error?: string;
  recipientEmail?: string;
  bypass?: boolean;
}

/** Step 1 — request a one-time code for (email, role). */
export async function requestLoginOtp(email: string, role: UserRole): Promise<OtpRequestResult> {
  const { data, error } = await supabase.rpc("request_login_otp", {
    _email: email.trim().toLowerCase(),
    _role: role,
  });
  if (error) return { sent: false, error: error.message };
  const r = (data ?? {}) as Record<string, unknown>;
  if (!r.sent) return { sent: false, error: (r.error as string) || "Could not send code" };

  // QA bypass — no email needed.
  if (r.bypass) {
    return { sent: true, bypass: true };
  }

  // Dispatch real email via Gmail edge function. The edge function looks up
  // the recipient email from the OTP record (otp_id) — we never trust client-supplied "to".
  const plainCode = r.plain_code as string | undefined;
  const recipient = r.recipient_email as string | undefined;
  const otpId = r.otp_id as string | undefined;
  if (plainCode && otpId) {
    supabase.functions
      .invoke("send-login-otp", { body: { otp_id: otpId, code: plainCode } })
      .catch((e) => console.error("send-login-otp invoke failed", e));
  }

  return { sent: true, recipientEmail: recipient };
}

/** Step 2 — verify the 6-digit code and return the officer. */
export async function verifyLoginOtp(email: string, role: UserRole, code: string): Promise<AuthUser> {
  const { data, error } = await supabase.rpc("verify_login_otp", {
    _email: email.trim().toLowerCase(),
    _role: role,
    _code: code.trim(),
  });
  if (error) throw new Error(error.message);
  const r = (data ?? {}) as Record<string, unknown>;
  if (!r.success) {
    const code = r.error as string;
    const msg =
      code === "invalid_code" ? "Incorrect code. Please try again." :
      code === "no_active_code" ? "Code expired or not found. Request a new one." :
      code === "officer_inactive" ? "Your account is inactive. Contact CSO." :
      "Could not verify code.";
    throw new Error(msg);
  }
  const u = r.user as Record<string, unknown>;
  await bindOfficerSession(u.id as string);
  return {
    id: u.id as string,
    name: u.name as string,
    email: u.email as string,
    designation: (u.designation as string) || "",
    role: u.role as UserRole,
    district: u.district as string | undefined,
    division: u.division as string | undefined,
    department: u.department as string | undefined,
    is_cso_admin: !!u.is_cso_admin,
    phone: u.phone as string | undefined,
  };
}

/** Ensure an anonymous Supabase session exists, then bind it to an officer
 *  so RLS policies that gate writes on `current_officer_id()` will pass. */
export async function bindOfficerSession(officerId: string): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { error: anonErr } = await supabase.auth.signInAnonymously();
      if (anonErr) throw anonErr;
    }
    const { error } = await supabase.rpc("bind_session_officer", { _officer_id: officerId });
    if (error) console.warn("bind_session_officer failed:", error.message);
  } catch (err) {
    console.warn("bindOfficerSession error:", err);
  }
}

/** Look up an officer by ID for CS Office impersonation. */
export async function loginAsOfficer(officerId: string): Promise<AuthUser> {
  const { data, error } = await supabase.rpc("get_officer_full", { _officer_id: officerId });
  if (error || !data) throw new Error("Officer not found or not authorized");
  await bindOfficerSession((data as any).id);
  // Hydrate district/department names
  const { data: meta } = await supabase
    .from("officers")
    .select("districts(name, division), departments(name, short_name)")
    .eq("id", officerId)
    .maybeSingle();
  return {
    id: (data as any).id,
    name: (data as any).name,
    designation: (data as any).designation || "",
    role: (data as any).role as UserRole,
    email: (data as any).email || "",
    district: (meta as any)?.districts?.name,
    division: (meta as any)?.districts?.division,
    department: (meta as any)?.departments?.short_name || (meta as any)?.departments?.name,
    is_cso_admin: (data as any).is_cso_admin,
    phone: (data as any).phone || undefined,
  };
}

/** Password sign-in — authenticates via Supabase Auth, then binds to the matching officer. */
export async function signInWithPasswordAndBindOfficer(
  email: string,
  password: string,
  role: UserRole,
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });
  if (authErr || !authData.session) {
    throw new Error(authErr?.message || "Invalid email or password.");
  }

  // Resolve the officer row that matches (email, role) — same dual-charge rules as OTP.
  const { data: lookup, error: lookupErr } = await supabase.rpc("find_login_officer_public", {
    _email: cleanEmail,
    _role: role,
  });
  const r = (lookup ?? {}) as Record<string, unknown>;
  if (lookupErr || !r.found) {
    await supabase.auth.signOut();
    throw new Error("No officer registered with this email for the selected role.");
  }

  const officerId = r.id as string;
  await supabase.rpc("bind_session_officer", { _officer_id: officerId });

  // Hydrate the full profile (district / department names).
  const { data: full } = await supabase.rpc("get_officer_full", { _officer_id: officerId });
  const { data: meta } = await supabase
    .from("officers")
    .select("districts(name, division), departments(name, short_name)")
    .eq("id", officerId)
    .maybeSingle();
  const o = (full ?? {}) as any;
  return {
    id: o.id,
    name: o.name,
    email: o.email || cleanEmail,
    designation: o.designation || "",
    role: role,
    district: (meta as any)?.districts?.name,
    division: (meta as any)?.districts?.division,
    department: (meta as any)?.departments?.short_name || (meta as any)?.departments?.name,
    is_cso_admin: !!o.is_cso_admin,
    phone: o.phone || undefined,
  };
}

/** Send a password-reset email. Redirects back to /reset-password to set a new one. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}

/** Update the current user's password (used by the reset-password page). */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

