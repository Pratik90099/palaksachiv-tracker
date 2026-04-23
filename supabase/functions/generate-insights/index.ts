import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Aggregate non-PII stats
    const { data: tasks } = await supabase.from("tasks").select("status, priority, is_critical, is_goi_pending, target_date");
    const { data: projects } = await supabase.from("projects").select("status, is_critical, is_goi_pending");
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

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");
    const payload = JSON.parse(toolCall.function.arguments);

    // Persist
    await supabase.from("ai_insights").insert({ payload, generated_by: "cs_office" });

    return new Response(JSON.stringify({ payload, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function countBy<T extends Record<string, any>>(arr: T[], key: string): Record<string, number> {
  return arr.reduce((acc: Record<string, number>, it) => {
    const v = it[key] || "unknown";
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
}
