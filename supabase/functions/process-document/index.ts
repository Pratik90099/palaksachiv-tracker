import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CONTENT_LENGTH = 500_000; // 500KB text

const SYSTEM_PROMPTS: Record<string, string> = {
  summarize: `You are a government document analyst for Maharashtra state government. Summarize the document concisely, highlighting key decisions, deadlines, responsible officers, and action items. Return JSON: { "summary": "...", "key_points": ["..."], "deadlines": ["..."] }`,

  "extract-projects": `You are a government data extraction specialist. Extract all projects/schemes mentioned in the document. Return JSON: { "projects": [{ "title": "...", "description": "...", "category": "Infrastructure|Education|Health|Revenue|Other", "priority": "high|medium|low", "status": "not_started|in_progress|completed|delayed", "is_critical": false, "is_goi_pending": false }] }. Only extract clearly identifiable projects.`,

  "extract-tasks": `You are a government data extraction specialist. Extract all actionable tasks from the document. Return JSON: { "tasks": [{ "title": "...", "description": "...", "priority": "high|medium|low", "responsible_officer": "...", "agency": "...", "target_date": "YYYY-MM-DD or null" }] }. Only extract clear, actionable items with identifiable owners.`,

  "extract-action-items": `You are a government meeting minutes analyst. Extract all action items, follow-ups, and pending items. Return JSON: { "action_items": [{ "action": "...", "responsible": "...", "deadline": "...", "priority": "high|medium|low" }] }. Be thorough but only include clearly stated action items.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, mode, fileName } = await req.json();

    // Input validation
    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Document content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!mode || !SYSTEM_PROMPTS[mode]) {
      return new Response(
        JSON.stringify({ error: `Invalid mode. Must be one of: ${Object.keys(SYSTEM_PROMPTS).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Content too large. Maximum ${MAX_CONTENT_LENGTH} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Document: "${fileName || "Uploaded Document"}"\n\n---\n${content}\n---\n\nProcess this document according to your instructions. Return valid JSON only, no markdown code fences.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[mode] },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service rate limited. Please try again in a few moments." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please contact admin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the AI response
    let parsedResult;
    try {
      // Strip markdown code fences if present
      const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return raw text as summary
      parsedResult = { summary: rawContent, parse_warning: "AI returned non-JSON response" };
    }

    return new Response(
      JSON.stringify({ result: parsedResult, mode, fileName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
