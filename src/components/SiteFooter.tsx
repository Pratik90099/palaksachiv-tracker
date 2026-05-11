import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import emblem from "@/assets/maharashtra-emblem.png";

const SESSION_FLAG = "gs_visit_recorded";
const FONT_KEY = "gs_font_scale";

export function SiteFooter() {
  const [counts, setCounts] = useState<{ total: number; today: number } | null>(null);
  const [scale, setScale] = useState<number>(() => Number(localStorage.getItem(FONT_KEY)) || 1);

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale * 100}%`;
    localStorage.setItem(FONT_KEY, String(scale));
  }, [scale]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!sessionStorage.getItem(SESSION_FLAG)) {
          await supabase.from("site_visits").insert({ session_hash: crypto.randomUUID() });
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

  const links = [
    { to: "/help/user-manual", label: "User Manual" },
    { to: "/accessibility-statement", label: "Accessibility" },
    { to: "/privacy-policy", label: "Privacy Policy" },
    { to: "/terms-of-use", label: "Terms of Use" },
    { to: "/copyright-policy", label: "Copyright" },
    { to: "/hyperlinking-policy", label: "Hyperlinking Policy" },
    { to: "/sitemap", label: "Sitemap" },
    { to: "/contact-us", label: "Contact Us" },
  ];

  return (
    <footer role="contentinfo" className="border-t border-border bg-card text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <img src={emblem} alt="Government of Maharashtra emblem" className="w-12 h-12 object-contain shrink-0" width={48} height={48} loading="lazy" />
          <div>
            <p className="font-semibold text-foreground">Guardian Secretary Portal</p>
            <p>Content owned by Chief Secretary's Office, Government of Maharashtra.</p>
            <p className="mt-1">Last updated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1 md:justify-center md:items-start md:pt-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground hover:underline">{l.label}</Link>
          ))}
        </nav>

        <div className="md:text-right space-y-2">
          <div className="flex md:justify-end items-center gap-2" aria-label="Text size controls">
            <span className="opacity-70">Text size:</span>
            <button onClick={() => setScale((s) => Math.max(0.85, s - 0.1))} aria-label="Decrease text size" className="px-2 py-0.5 rounded border border-border hover:bg-secondary text-[11px]">A-</button>
            <button onClick={() => setScale(1)} aria-label="Reset text size" className="px-2 py-0.5 rounded border border-border hover:bg-secondary text-sm">A</button>
            <button onClick={() => setScale((s) => Math.min(1.4, s + 0.1))} aria-label="Increase text size" className="px-2 py-0.5 rounded border border-border hover:bg-secondary text-base">A+</button>
          </div>
          {counts && (
            <p aria-label="Visitor counter">
              Visitors: <strong className="text-foreground">{counts.total.toLocaleString("en-IN")}</strong>
              {" "}<span className="opacity-70">(today {counts.today.toLocaleString("en-IN")})</span>
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-2 text-center text-[10px] opacity-70">
        © {new Date().getFullYear()} Government of Maharashtra. Designed in compliance with GIGW 3.0 guidelines.
      </div>
    </footer>
  );
}
