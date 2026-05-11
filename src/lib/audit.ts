import { supabase } from "@/integrations/supabase/client";

type EntityType = "task" | "meeting_minutes";

const seen = new Map<string, number>();
const TTL_MS = 30_000;

/**
 * Client-side view audit. Debounced to one entry per entity per 30s per session.
 * Writes happen via DB triggers — do not call this for create/update/delete.
 */
export async function logView(entityType: EntityType, entityId: string) {
  if (!entityId) return;
  const key = `${entityType}:${entityId}`;
  const now = Date.now();
  const last = seen.get(key) || 0;
  if (now - last < TTL_MS) return;
  seen.set(key, now);

  try {
    await supabase.from("audit_logs").insert({
      entity_type: entityType,
      entity_id: entityId,
      action: "view",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    });
  } catch {
    // best-effort; never block UI
  }
}
