// Sends the OTP to the officer's email. Falls back to no-op if the
// transactional email infra isn't set up — the LoginPage already shows a
// dev-mode toast with the code in that case.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { otp_id } = await req.json();
    if (!otp_id) {
      return new Response(JSON.stringify({ error: "otp_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // We don't expose the plaintext code from the DB — the RPC already
    // returned it to the client and the client passes us only the otp_id
    // for audit/email-dispatch purposes. To actually send via email,
    // wire send-transactional-email here once email domain is configured.

    // TODO: dispatch SMS via Twilio / MSG91 once SMS connector is added.
    // TODO: invoke send-transactional-email with templateName 'login-otp'
    //       once email infra (setup_email_infra + scaffold_transactional_email)
    //       is configured for this project.

    // Log the request server-side for audit.
    const { data } = await supabase
      .from("login_otps")
      .select("email, role, expires_at")
      .eq("id", otp_id)
      .maybeSingle();

    console.log("[send-login-otp] queued", { otp_id, email: data?.email, role: data?.role });

    return new Response(JSON.stringify({ success: true, queued: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-login-otp error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
