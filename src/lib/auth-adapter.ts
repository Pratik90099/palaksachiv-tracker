/**
 * Auth Adapter — pluggable login layer.
 *
 * One swap-point for e-Parichay SSO: when production credentials arrive,
 * only the `parichay-callback` edge function body needs to change.
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
  parichay_uid?: string;
}

/** Attempt SSO login via the Parichay callback edge function. */
export async function loginWithParichay(payload?: Record<string, unknown>): Promise<{
  user: AuthUser | null;
  message: string;
  ready: boolean;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("parichay-callback", {
      body: payload || {},
    });
    if (error) {
      return { user: null, message: "Parichay SSO is awaiting production credentials.", ready: false };
    }
    if (data?.success && data?.user) {
      return { user: data.user as AuthUser, message: "Signed in with Parichay", ready: true };
    }
    return {
      user: null,
      message: data?.message || "Parichay SSO is awaiting production credentials.",
      ready: false,
    };
  } catch {
    return { user: null, message: "Parichay SSO is awaiting production credentials.", ready: false };
  }
}

/** Authenticate a CS Office user via email + password. */
export async function loginWithCSO(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.functions.invoke("authenticate-cso", {
    body: { email: email.trim(), password },
  });
  if (error) throw new Error("Authentication service unavailable. Please try again.");
  if (!data?.success || !data?.user) {
    throw new Error(data?.error || "Invalid email or password");
  }
  return {
    ...data.user,
    is_cso_admin: true,
  } as AuthUser;
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
    parichay_uid: data.parichay_uid || undefined,
  };
}
