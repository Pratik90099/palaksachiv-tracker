import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CsoUser {
  id: string;
  name: string;
  email: string;
  // Stored as bcrypt hash. Plaintext is no longer accepted.
  password_hash: string;
}

function loadUsers(): CsoUser[] | null {
  const raw = Deno.env.get("CSO_USERS_JSON");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (u) => u && u.email && u.password_hash && u.id && u.name,
      )
    ) {
      return parsed as CsoUser[];
    }
    console.warn(
      "CSO_USERS_JSON malformed — expected [{id,name,email,password_hash}].",
    );
  } catch (e) {
    console.warn("CSO_USERS_JSON parse error:", e);
  }
  return null;
}

// Constant-time string comparison for emails
function timingSafeEqual(a: string, b: string): boolean {
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

// In-memory rate limiter (per edge-function instance).
// 5 failed attempts per IP per 15 minutes.
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; firstAttempt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstAttempt > RATE_WINDOW_MS) {
    attempts.set(ip, { count: 0, firstAttempt: now });
    return { allowed: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((RATE_WINDOW_MS - (now - entry.firstAttempt)) / 1000),
    };
  }
  return { allowed: true };
}

function recordFailure(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstAttempt > RATE_WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

function jsonResponse(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Resolve client IP for rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    console.warn(`[authenticate-cso] rate-limited ip=${ip}`);
    return jsonResponse(
      { success: false, error: "Too many attempts. Please try again later." },
      429,
      { "Retry-After": String(rate.retryAfterSec ?? 900) }
    );
  }

  // Parse body safely
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid request body" }, 400);
  }

  const { email, password } = body || {};

  // Input validation
  if (!email || typeof email !== "string" || email.length > 255) {
    return jsonResponse({ success: false, error: "Valid email is required" }, 400);
  }
  if (!password || typeof password !== "string" || password.length > 128) {
    return jsonResponse({ success: false, error: "Valid password is required" }, 400);
  }

  const users = loadUsers();
  if (!users) {
    console.error(
      "[authenticate-cso] CSO_USERS_JSON is not configured. Set this secret with bcrypt-hashed credentials in the format [{id,name,email,password_hash}].",
    );
    return jsonResponse(
      {
        success: false,
        error:
          "CSO authentication is not configured. Administrator must set the CSO_USERS_JSON secret.",
      },
      503,
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log(`[authenticate-cso] attempt ip=${ip} email=${normalizedEmail}`);

  // Find user by constant-time email compare across the whole list
  let candidate: CsoUser | null = null;
  for (const u of users) {
    const emailMatch = timingSafeEqual(u.email.toLowerCase(), normalizedEmail);
    if (emailMatch) candidate = u;
  }

  let passwordOk = false;
  if (candidate) {
    try {
      passwordOk = await bcrypt.compare(password, candidate.password_hash);
    } catch (e) {
      console.error("[authenticate-cso] bcrypt compare error:", e);
      passwordOk = false;
    }
  } else {
    // Perform a dummy hash compare to keep timing roughly uniform.
    try {
      await bcrypt.compare(
        password,
        "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.JhE1m6QY8xZxRr1fUq7C9Gk5Y7iG",
      );
    } catch {
      // ignore
    }
  }

  if (!candidate || !passwordOk) {
    recordFailure(ip);
    return jsonResponse({ success: false, error: "Invalid email or password" }, 401);
  }

  clearAttempts(ip);
  console.log(`[authenticate-cso] success ip=${ip} userId=${candidate.id}`);

  return jsonResponse(
    {
      success: true,
      user: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        designation: "Chief Secretary's Office",
        role: "system_admin",
      },
    },
    200
  );
});
