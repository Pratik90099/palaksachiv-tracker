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

  // Dispatch real email via Gmail edge function.
  const plainCode = r.plain_code as string | undefined;
  const recipient = r.recipient_email as string | undefined;
  const recipientName = r.recipient_name as string | undefined;
  if (plainCode && recipient) {
    supabase.functions
      .invoke("send-login-otp", { body: { to: recipient, code: plainCode, name: recipientName } })
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

/** Look up an officer by ID for CS Office impersonation. */
export async function loginAsOfficer(officerId: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from("officers")
    .select("*, districts(name, division), departments(name, short_name)")
    .eq("id", officerId)
    .single();
  if (error || !data) throw new Error("Officer not found");
  return {
    id: data.id,
    name: data.name,
    designation: data.designation || "",
    role: data.role as UserRole,
    email: data.email || "",
    district: (data as any).districts?.name,
    division: (data as any).districts?.division,
    department: (data as any).departments?.short_name || (data as any).departments?.name,
    is_cso_admin: data.is_cso_admin,
    phone: (data as any).phone || undefined,
  };
}
