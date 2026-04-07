import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Credentials stored server-side only — never exposed in client bundle
const AUTHORIZED_USERS = [
  { id: "cso-001", name: "Pratik Bavi", email: "bavipratik@gmail.com", password: "cso@2026" },
  { id: "cso-002", name: "Rishikesh Shirke", email: "rishishirke65@gmail.com", password: "cso@2026" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    // Input validation
    if (!email || typeof email !== "string" || email.length > 255) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!password || typeof password !== "string" || password.length > 128) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid password is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = AUTHORIZED_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );

    if (!user) {
      // Intentionally vague error to prevent enumeration
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return user info (no password) for client-side session
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          designation: "Chief Secretary's Office",
          role: "system_admin",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("authenticate-cso error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Authentication failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
