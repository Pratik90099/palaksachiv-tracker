// Sends OTP via Gmail (connector gateway).
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function b64url(s: string) {
  // UTF-8 safe base64url
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildHtml(code: string, name: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a2332;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
      <tr><td style="background:#0f1f3d;padding:24px 32px;color:#fff;">
        <div style="font-size:18px;font-weight:700;">GS Portal</div>
        <div style="font-size:12px;opacity:.75;">Government of Maharashtra</div>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 8px;font-size:14px;color:#475569;">Hello ${name || "Officer"},</p>
        <p style="margin:0 0 24px;font-size:15px;">Your one-time sign-in code is:</p>
        <div style="text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:0 0 24px;">
          <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#0f1f3d;">${code}</div>
        </div>
        <p style="margin:0 0 8px;font-size:13px;color:#64748b;">This code is valid for <b>10 minutes</b> and can only be used once.</p>
        <p style="margin:0;font-size:12px;color:#94a3b8;">Didn't request this? You can safely ignore this email — your account stays secure.</p>
      </td></tr>
      <tr><td style="padding:16px 32px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;">
        © 2026 Government of Maharashtra · Guardian Secretary District Monitoring Portal
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, code, name } = await req.json();
    if (!to || !code) {
      return new Response(JSON.stringify({ error: "to and code required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY missing");

    const subject = `Your GS Portal sign-in code: ${code}`;
    const html = buildHtml(String(code), String(name || ""));

    const rfc2822 = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html,
    ].join("\r\n");

    const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: b64url(rfc2822) }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[send-login-otp] gmail error", res.status, data);
      return new Response(JSON.stringify({ error: "gmail_send_failed", status: res.status, detail: data }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[send-login-otp] sent", { to, messageId: data.id });
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-login-otp error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
