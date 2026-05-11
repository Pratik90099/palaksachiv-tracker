import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_FLAG = "gs_visit_recorded";

export function SiteFooter() {
  const [counts, setCounts] = useState<{ total: number; today: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Record one visit per browser session
      try {
        if (!sessionStorage.getItem(SESSION_FLAG)) {
          await supabase.from("site_visits").insert({
            session_hash: crypto.randomUUID(),
          });
          sessionStorage.setItem(SESSION_FLAG, "1");
        }
      } catch { /* ignore */ }

      try {
        const { data } = await supabase.rpc("get_visitor_counts");
        if (!cancelled && data) setCounts(data as any);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <footer className="border-t border-border bg-card text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          Content owned by Chief Secretary's Office, Government of Maharashtra.
          {" "}Last updated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}.
        </div>
        <div className="flex items-center gap-3">
          {counts && (
            <span aria-label="Visitor counter">
              Visitors: <strong className="text-foreground">{counts.total.toLocaleString("en-IN")}</strong>
              {" "}<span className="opacity-70">(today {counts.today.toLocaleString("en-IN")})</span>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
