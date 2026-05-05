/**
 * Client for the self-hosted CSO auth server.
 * Set VITE_CSO_AUTH_URL in your frontend .env to the deployed server URL,
 * e.g. VITE_CSO_AUTH_URL=https://auth.yourdomain.com
 */
const BASE = (import.meta.env.VITE_CSO_AUTH_URL || "").replace(/\/$/, "");

export interface CsoAuthUser {
  id: string;
  name: string;
  email: string;
  designation: string;
  role: string;
}

function ensureBase() {
  if (!BASE) {
    throw new Error(
      "CSO auth server is not configured. Set VITE_CSO_AUTH_URL in your frontend environment."
    );
  }
}

export async function csoLogin(email: string, password: string): Promise<{
  success: boolean;
  user?: CsoAuthUser;
  error?: string;
}> {
  ensureBase();
  const res = await fetch(`${BASE}/api/cso/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json().catch(() => ({ success: false, error: "Invalid server response" }));
}

export async function csoForgotPassword(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  ensureBase();
  const res = await fetch(`${BASE}/api/cso/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json().catch(() => ({ success: false, error: "Invalid server response" }));
}

export async function csoResetPassword(token: string, newPassword: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  ensureBase();
  const res = await fetch(`${BASE}/api/cso/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  return res.json().catch(() => ({ success: false, error: "Invalid server response" }));
}
