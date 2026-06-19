// ============================================================
// PASSWORD RESET REQUEST
// - Rate-limited (3/15min per email, 10/15min per IP)
// - Audits every attempt to public.password_reset_requests + audit_logs
// - Restricts reset emails to officers whose role is allowed for
//   password login (CSO admin / system_admin / chief_secretary, or
//   any officer with password_login_enabled = true)
// - Always returns { ok: true } so the UI cannot enumerate accounts.
// - Sends the recovery link via the existing Gmail gateway (same
//   pattern as send-login-otp) so the external server doesn't depend
//   on Supabase SMTP being configured.
// ============================================================
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function b64url(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function buildHtml(link: string) {
  const safe = escapeHtml(link);
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a2332;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
      <tr><td style="background:#0f1f3d;padding:24px 32px;color:#fff;">
        <div style="font-size:18px;font-weight:700;">GS Portal</div>
        <div style="font-size:12px;opacity:.75;">Government of Maharashtra</div>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:15px;">A password reset was requested for your GS Portal account.</p>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;">Click the button below to choose a new password. The link is valid for 1 hour and can only be used once.</p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${safe}" style="display:inline-block;background:#0f1f3d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Set a new password</a>
        </div>
        <p style="margin:0 0 8px;font-size:12px;color:#64748b;">Or paste this link into your browser:</p>
        <p style="margin:0 0 16px;font-size:11px;color:#475569;word-break:break-all;">${safe}</p>
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

  // Always return ok:true to the client (no enumeration).
  const ok = () =>
    new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = typeof body?.email === "string" ? body.email.trim() : "";
    const redirectTo = typeof body?.redirectTo === "string" ? body.redirectTo : "";
    if (!emailRaw || emailRaw.length > 255 || !emailRaw.includes("@")) {
      return ok();
    }

    // Resolve client IP — first entry of x-forwarded-for, fall back to cf-connecting-ip.
    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: gate, error: gateErr } = await admin.rpc("request_password_reset_check", {
      _email: emailRaw,
      _ip: ip,
    });
    if (gateErr) {
      console.error("[password-reset-request] gate error", gateErr);
      return ok();
    }
    const send = !!(gate && (gate as Record<string, unknown>).send);
    if (!send) {
      console.log("[password-reset-request] not sending", { email: emailRaw, reason: (gate as Record<string, unknown>)?.reason });
      return ok();
    }

    // Generate a recovery link via admin API — works without the user knowing their old password.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: emailRaw,
      options: { redirectTo: redirectTo || undefined },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      // If the user doesn't exist in auth.users yet, fall back to invite so they can set
      // their initial password — same UX from the user's perspective.
      const { data: inviteData, error: inviteErr } = await admin.auth.admin.generateLink({
        type: "invite",
        email: emailRaw,
        options: { redirectTo: redirectTo || undefined },
      });
      if (inviteErr || !inviteData?.properties?.action_link) {
        console.error("[password-reset-request] generateLink failed", linkErr || inviteErr);
        return ok();
      }
      (linkData as unknown as { properties: { action_link: string } }) = inviteData as unknown as { properties: { action_link: string } };
    }

    const actionLink = (linkData as { properties: { action_link: string } }).properties.action_link;

    if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) {
      console.error("[password-reset-request] mail credentials missing");
      return ok();
    }

    const subject = "Reset your GS Portal password";
    const html = buildHtml(actionLink);
    const rfc2822 = [
      `To: ${emailRaw}`,
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
      console.error("[password-reset-request] gmail error", res.status, data);
    } else {
      console.log("[password-reset-request] sent", { to: emailRaw, messageId: (data as Record<string, unknown>).id });
    }

    return ok();
  } catch (e) {
    console.error("password-reset-request error", e);
    return ok();
  }
});
