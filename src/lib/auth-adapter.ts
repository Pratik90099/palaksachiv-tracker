/**
 * Auth Adapter — pluggable login layer.
 *
 * One swap-point for e-Parichay SSO: when production credentials arrive,
 * only the `parichay-callback` edge function body needs to change.
 *
 * Demo role logins are gated behind `VITE_DEMO_MODE`. In production builds
 * (where the env var is unset or "false"), `loginWithMockRole` throws.
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

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true" || import.meta.env.DEV;

const MOCK_USERS: Record<UserRole, AuthUser> = {
  guardian_secretary: {
    id: "gs-001",
    name: "Shri. O P Gupta, IAS",
    designation: "Additional Chief Secretary, Finance",
    role: "guardian_secretary",
    district: "Pune",
    email: "acs.finance@maharashtra.gov.in",
  },
  department_secretary: {
    id: "ds-001",
    name: "Shri. Milind Mhaiskar, IAS",
    designation: "Additional Chief Secretary, Public Works Department",
    role: "department_secretary",
    department: "Public Works Department (PWD)",
    email: "acs.pwd@maharashtra.gov.in",
  },
  district_collector: {
    id: "dc-001",
    name: "Shri. Jitendra Dudi, IAS",
    designation: "District Collector, Pune",
    role: "district_collector",
    district: "Pune",
    email: "collector.pune@maharashtra.gov.in",
  },
  divisional_commissioner: {
    id: "divc-001",
    name: "Dr. Vijay Namdeo Suryawanshi, IAS",
    designation: "Divisional Commissioner, Konkan Division",
    role: "divisional_commissioner",
    division: "Konkan",
    email: "divcom.konkan@maharashtra.gov.in",
  },
  chief_secretary: {
    id: "cs-001",
    name: "Shri. Rajesh Aggarwal, IAS",
    designation: "Chief Secretary, Government of Maharashtra",
    role: "chief_secretary",
    email: "cs@maharashtra.gov.in",
  },
  cmo: {
    id: "cmo-001",
    name: "CMO Team",
    designation: "Chief Minister's Office",
    role: "cmo",
    email: "cmo@maharashtra.gov.in",
  },
  system_admin: {
    id: "admin-001",
    name: "CS Office Team",
    designation: "Chief Secretary's Office",
    role: "system_admin",
    email: "cs.office@maharashtra.gov.in",
    is_cso_admin: true,
  },
};

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

/** Demo-only mock login. Throws in production builds. */
export function loginWithMockRole(role: UserRole): AuthUser {
  if (!DEMO_MODE) {
    throw new Error(
      "Demo role login is disabled in production. Use Parichay SSO or CS Office credentials.",
    );
  }
  return MOCK_USERS[role];
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

export const isDemoMode = DEMO_MODE;
