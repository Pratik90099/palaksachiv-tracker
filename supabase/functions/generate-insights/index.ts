import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // --- AuthN: require a valid bearer token ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // --- AuthZ: caller must be a CSO admin or senior officer ---
    // Identity comes from a custom header set by the app (since CSO sessions are
    // app-level, not auth.users-level). The header value is cross-checked against
    // the officers table using the service role.
    const callerEmail = (req.headers.get("x-cso-email") || "").toLowerCase().trim();
    if (!callerEmail) {
      return jsonResponse({ error: "Forbidden: caller identity missing" }, 403);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: officer, error: officerError } = await admin
      .from("officers")
      .select("id, role, is_cso_admin, is_active")
      .ilike("email", callerEmail)
      .maybeSingle();

    if (officerError) {
      console.error("officer lookup error:", officerError);
      return jsonResponse({ error: "Authorization check failed" }, 500);
    }

    const allowedRoles = new Set(["chief_secretary", "system_admin"]);
    const isAuthorized =
      !!officer &&
      officer.is_active &&
      (officer.is_cso_admin || allowedRoles.has(officer.role));

    if (!isAuthorized) {
      console.warn(`[generate-insights] forbidden caller=${callerEmail}`);
      return jsonResponse({ error: "Forbidden: CSO admin role required" }, 403);
    }

    // Aggregate non-PII stats
    const { data: tasks } = await admin.from("tasks").select("status, priority, is_critical, is_goi_pending, target_date");
    const { data: projects } = await admin.from("projects").select("status, is_critical, is_goi_pending");
    const today = new Date().toISOString().slice(0, 10);

    const stats = {
      total_tasks: tasks?.length || 0,
      total_projects: projects?.length || 0,
      tasks_by_status: countBy(tasks || [], "status"),
      projects_by_status: countBy(projects || [], "status"),
      critical_tasks: (tasks || []).filter((t: any) => t.is_critical).length,
      critical_projects: (projects || []).filter((p: any) => p.is_critical).length,
      goi_pending_tasks: (tasks || []).filter((t: any) => t.is_goi_pending).length,
      overdue_tasks: (tasks || []).filter((t: any) => t.target_date && t.target_date < today && !["closed", "completed_pending_closure"].includes(t.status)).length,
    };

    const systemPrompt = `You are an executive policy analyst for the Government of Maharashtra Chief Secretary's Office. Generate a brief, actionable insight summary based on the provided governance metrics. Focus on patterns, risks, and concrete next steps. Be concise and specific.`;
    const userPrompt = `Analyze these state governance metrics and produce structured insights:\n\n${JSON.stringify(stats, null, 2)}`;

    const insightsSchema = {
      name: "submit_insights",
      description: "Submit structured governance insights",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string" },
          key_insights: { type: "array", items: { type: "string" } },
          risks: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
        },
        required: ["headline", "key_insights", "risks", "recommendations"],
      },
    };

    // ---- Try Gemini direct, fall back to Lovable AI Gateway on quota/5xx ----
    const t0 = Date.now();
    let payload: any = null;
    let provider = "gemini-direct";
    let lastError = "";

    try {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            tools: [{ functionDeclarations: [insightsSchema] }],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_insights"] } },
          }),
        }
      );

      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        const parts = aiJson.candidates?.[0]?.content?.parts || [];
        payload = parts.find((p: any) => p.functionCall)?.functionCall?.args || null;
        if (!payload) lastError = "Gemini returned no structured response";
      } else {
        const t = await aiRes.text();
        lastError = `Gemini ${aiRes.status}: ${t.slice(0, 300)}`;
        console.warn("[generate-insights] gemini failed", aiRes.status, t.slice(0, 300));
      }
    } catch (err) {
      lastError = `Gemini network: ${err instanceof Error ? err.message : String(err)}`;
      console.warn("[generate-insights]", lastError);
    }

    // Fallback: Lovable AI Gateway (uses LOVABLE_API_KEY auto-managed)
    if (!payload) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        provider = "lovable-gateway";
        try {
          const fbRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              tools: [{ type: "function", function: insightsSchema }],
              tool_choice: { type: "function", function: { name: "submit_insights" } },
            }),
          });
          if (fbRes.ok) {
            const fbJson = await fbRes.json();
            const argsStr = fbJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
            if (argsStr) payload = JSON.parse(argsStr);
            else lastError = "Fallback returned no tool call";
          } else {
            const t = await fbRes.text();
            lastError = `Fallback ${fbRes.status}: ${t.slice(0, 300)}`;
            console.error("[generate-insights] fallback failed", fbRes.status, t.slice(0, 300));
          }
        } catch (err) {
          lastError = `Fallback network: ${err instanceof Error ? err.message : String(err)}`;
        }
      }
    }

    const latencyMs = Date.now() - t0;

    if (!payload) {
      // Best-guess status mapping for the UI
      const status = /quota|RESOURCE_EXHAUSTED/i.test(lastError) ? 402
                   : /429/.test(lastError) ? 429
                   : 502;
      return jsonResponse({ error: `AI generation failed: ${lastError}`, latencyMs }, status);
    }

    // Persist insight + telemetry log (best-effort)
    await admin.from("ai_insights").insert({ payload, generated_by: callerEmail });
    admin.from("ai_call_logs").insert({
      function_name: "generate-insights",
      provider,
      status: 200,
      latency_ms: latencyMs,
      caller_email: callerEmail,
    }).then(() => {}, () => {});

    return new Response(JSON.stringify({ payload, stats, provider, latencyMs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insights error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function countBy<T extends Record<string, any>>(arr: T[], key: string): Record<string, number> {
  return arr.reduce((acc: Record<string, number>, it) => {
    const v = it[key] || "unknown";
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
}
