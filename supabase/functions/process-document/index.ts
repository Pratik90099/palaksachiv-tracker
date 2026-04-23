import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CONTENT_LENGTH = 500_000; // 500KB text
const VALID_MODES = ["summarize", "extract-projects", "extract-tasks", "extract-action-items"] as const;
type Mode = typeof VALID_MODES[number];

const SYSTEM_PROMPTS: Record<Mode, string> = {
  summarize: `You are a government document analyst for Maharashtra state government. Summarize the document concisely, highlighting key decisions, deadlines, responsible officers, and action items. Return JSON: { "summary": "...", "key_points": ["..."], "deadlines": ["..."] }`,

  "extract-projects": `You are a government data extraction specialist. Extract all projects/schemes mentioned in the document. Return JSON: { "projects": [{ "title": "...", "description": "...", "category": "Infrastructure|Education|Health|Revenue|Other", "priority": "high|medium|low", "status": "not_started|in_progress|completed|delayed", "is_critical": false, "is_goi_pending": false }] }. Only extract clearly identifiable projects.`,

  "extract-tasks": `You are a government data extraction specialist. Extract all actionable tasks from the document. Return JSON: { "tasks": [{ "title": "...", "description": "...", "priority": "high|medium|low", "responsible_officer": "...", "agency": "...", "target_date": "YYYY-MM-DD or null" }] }. Only extract clear, actionable items with identifiable owners.`,

  "extract-action-items": `You are a government meeting minutes analyst. Extract all action items, follow-ups, and pending items. Return JSON: { "action_items": [{ "action": "...", "responsible": "...", "deadline": "...", "priority": "high|medium|low" }] }. Be thorough but only include clearly stated action items.`,
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Lightweight shape validation for AI output (no external deps).
function validateAiResult(mode: Mode, result: unknown): { ok: true; data: any } | { ok: false; reason: string } {
  if (!result || typeof result !== "object") return { ok: false, reason: "AI returned non-object response" };
  const r = result as Record<string, any>;

  switch (mode) {
    case "summarize":
      if (typeof r.summary !== "string") return { ok: false, reason: "Missing 'summary' field" };
      return {
        ok: true,
        data: {
          summary: String(r.summary).slice(0, 10_000),
          key_points: Array.isArray(r.key_points) ? r.key_points.slice(0, 50).map((p: any) => String(p).slice(0, 500)) : [],
          deadlines: Array.isArray(r.deadlines) ? r.deadlines.slice(0, 50).map((d: any) => String(d).slice(0, 300)) : [],
        },
      };
    case "extract-projects":
      if (!Array.isArray(r.projects)) return { ok: false, reason: "Missing 'projects' array" };
      return {
        ok: true,
        data: { projects: r.projects.slice(0, 100).map((p: any) => p && typeof p === "object" ? p : {}) },
      };
    case "extract-tasks":
      if (!Array.isArray(r.tasks)) return { ok: false, reason: "Missing 'tasks' array" };
      return {
        ok: true,
        data: { tasks: r.tasks.slice(0, 200).map((t: any) => t && typeof t === "object" ? t : {}) },
      };
    case "extract-action-items":
      if (!Array.isArray(r.action_items)) return { ok: false, reason: "Missing 'action_items' array" };
      return {
        ok: true,
        data: { action_items: r.action_items.slice(0, 200).map((a: any) => a && typeof a === "object" ? a : {}) },
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse body safely
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { content, mode, fileName } = body || {};

  // Input validation
  if (!content || typeof content !== "string") {
    return jsonResponse({ error: "Document content is required" }, 400);
  }
  if (!mode || typeof mode !== "string" || !VALID_MODES.includes(mode as Mode)) {
    return jsonResponse({ error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}` }, 400);
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return jsonResponse(
      { error: `Content too large. Maximum ${MAX_CONTENT_LENGTH} characters allowed.` },
      400
    );
  }
  const safeFileName = typeof fileName === "string" ? fileName.slice(0, 255) : "Uploaded Document";

  // Audit log (no document content)
  console.log(`[process-document] mode=${mode} fileName=${safeFileName} contentLen=${content.length}`);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return jsonResponse({ error: "AI service not configured" }, 500);
  }

  try {
    const userPrompt = `Document: "${safeFileName}"\n\n---\n${content}\n---\n\nProcess this document according to your instructions. Return valid JSON only, no markdown code fences.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[mode as Mode] },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse(
          { error: "AI service rate limited. Please try again in a few moments." },
          429
        );
      }
      if (response.status === 402) {
        return jsonResponse(
          { error: "AI service credits exhausted. Please contact admin." },
          402
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return jsonResponse({ error: "AI processing failed" }, 500);
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the AI response
    let parsedResult: any;
    try {
      const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    } catch {
      parsedResult = { summary: rawContent, parse_warning: "AI returned non-JSON response" };
    }

    // Validate the shape against the requested mode
    const validation = validateAiResult(mode as Mode, parsedResult);
    if (!validation.ok) {
      console.warn(`[process-document] schema mismatch (${mode}): ${validation.reason}`);
      // Return raw payload so UI can still display something useful
      return jsonResponse(
        {
          result: { ...parsedResult, parse_warning: validation.reason },
          mode,
          fileName: safeFileName,
        },
        200
      );
    }

    return jsonResponse({ result: validation.data, mode, fileName: safeFileName }, 200);
  } catch (e) {
    console.error("process-document error:", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500
    );
  }
});
