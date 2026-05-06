/**
 * CSO auth client.
 *
 * Works in two modes:
 *  1) OFFLINE (default) — built-in admin allow-list with bcrypt-hashed
 *     passwords. No server needed. Anyone can deploy the static frontend
 *     and the two admins below can log in immediately.
 *  2) REMOTE — if VITE_CSO_AUTH_URL is set AND the email is not in the
 *     local allow-list, requests are forwarded to the self-hosted
 *     cso-auth-server (Node/Express).
 *
 * To rotate an admin password, generate a new bcrypt hash:
 *     cd cso-auth-server && node hash.js 'NewPassword'
 * …and paste the resulting "$2b$12$…" string into ADMIN_USERS below.
 */
import bcrypt from "bcryptjs";

const BASE = (import.meta.env.VITE_CSO_AUTH_URL || "").replace(/\/$/, "");

export interface CsoAuthUser {
  id: string;
  name: string;
  email: string;
  designation: string;
  role: string;
}

interface AdminRecord extends CsoAuthUser {
  password_hash: string;
}

// Built-in admin allow-list. Default password for both: Admin@2026
const ADMIN_USERS: AdminRecord[] = [
  {
    id: "admin-bavi",
    name: "Bavi Pratik",
    email: "bavipratik@gmail.com",
    designation: "Chief Secretary's Office",
    role: "system_admin",
    password_hash:
      "$2b$12$dsgV/y16pNCdf9mLeisWoOWXe7.fGiNBbSdcULqGW7D7fh1eNvKni",
  },
  {
    id: "admin-rishi",
    name: "Rishi Shirke",
    email: "rishishirke65@gmail.com",
    designation: "Chief Secretary's Office",
    role: "system_admin",
    password_hash:
      "$2b$12$sq0dTvyTcmcgERWcObL1WOGX3VkarumSHj08tC0pjgxrAvabYUE0i",
  },
];

const DUMMY_HASH =
  "$2b$12$CwTycUXWue0Thq9StjUM0uJ8.JhE1m6QY8xZxRr1fUq7C9Gk5Y7iG";

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let dummy = 0;
    for (let i = 0; i < a.length; i++) dummy |= a.charCodeAt(i);
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function findLocalAdmin(email: string): AdminRecord | null {
  const norm = email.toLowerCase().trim();
  for (const u of ADMIN_USERS) {
    if (timingSafeEqualStr(u.email.toLowerCase(), norm)) return u;
  }
  return null;
}

function isLocalAdminEmail(email: string): boolean {
  const norm = email.toLowerCase().trim();
  return ADMIN_USERS.some((u) => u.email.toLowerCase() === norm);
}

async function remoteFetch(path: string, body: unknown) {
  if (!BASE) {
    return {
      success: false,
      error: "Authentication service unavailable. Please contact support.",
    } as const;
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json().catch(() => ({
      success: false,
      error: "Invalid server response",
    }));
  } catch {
    return {
      success: false,
      error: "Authentication service unavailable. Please try again.",
    };
  }
}

export async function csoLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: CsoAuthUser; error?: string }> {
  const admin = findLocalAdmin(email);
  let ok = false;
  if (admin) {
    try {
      ok = await bcrypt.compare(password, admin.password_hash);
    } catch {
      ok = false;
    }
    if (!ok) {
      return { success: false, error: "Invalid email or password" };
    }
    const { password_hash: _ph, ...safe } = admin;
    return { success: true, user: safe };
  }
  // Constant-ish timing on miss for non-admin emails before remote fallback
  try {
    await bcrypt.compare(password, DUMMY_HASH);
  } catch {
    /* noop */
  }
  return remoteFetch("/api/cso/login", { email, password });
}

export async function csoForgotPassword(
  email: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isLocalAdminEmail(email)) {
    // No SMTP in offline mode — guide the user to the operator.
    return {
      success: true,
      message:
        "Password reset by email is disabled for admin accounts. Please contact the system administrator to reset your password.",
    };
  }
  return remoteFetch("/api/cso/forgot-password", { email });
}

export async function csoResetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!BASE) {
    return {
      success: false,
      error:
        "Password reset is not available in offline mode. Contact the system administrator.",
    };
  }
  return remoteFetch("/api/cso/reset-password", { token, newPassword });
}
