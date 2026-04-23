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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_insights",
            description: "Submit structured governance insights",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "One-line executive summary" },
                key_insights: { type: "array", items: { type: "string" }, description: "3-5 key observations" },
                risks: { type: "array", items: { type: "string" }, description: "2-4 critical risks" },
                recommendations: { type: "array", items: { type: "string" }, description: "3-5 actionable next steps" },
              },
              required: ["headline", "key_insights", "risks", "recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_insights" } },
      }),
    });

    if (aiRes.status === 429) return jsonResponse({ error: "Rate limit exceeded. Try again shortly." }, 429);
    if (aiRes.status === 402) return jsonResponse({ error: "AI credits exhausted. Please top up." }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return jsonResponse({ error: "AI service unavailable" }, 500);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");
    const payload = JSON.parse(toolCall.function.arguments);

    // Persist
    await admin.from("ai_insights").insert({ payload, generated_by: callerEmail });

    return new Response(JSON.stringify({ payload, stats }), {
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
