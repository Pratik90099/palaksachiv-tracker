import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { LineChart as LineIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogRow {
  id: string;
  function_name: string;
  provider: string;
  status: number;
  latency_ms: number | null;
  error_code: string | null;
  caller_email: string | null;
  created_at: string;
}

export default function AITelemetryPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ai_call_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as LogRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, { date: string; gemini: number; gateway: number; errors: number; latencyTotal: number; latencyCount: number }>();
    rows.forEach((r) => {
      const day = format(new Date(r.created_at), "MMM dd");
      const cur = map.get(day) || { date: day, gemini: 0, gateway: 0, errors: 0, latencyTotal: 0, latencyCount: 0 };
      if (r.provider?.includes("gateway")) cur.gateway++;
      else cur.gemini++;
      if (r.status >= 400) cur.errors++;
      if (r.latency_ms) { cur.latencyTotal += r.latency_ms; cur.latencyCount++; }
      map.set(day, cur);
    });
    return Array.from(map.values()).reverse().map((d) => ({
      ...d,
      avgLatency: d.latencyCount ? Math.round(d.latencyTotal / d.latencyCount) : 0,
    }));
  }, [rows]);

  const totals = useMemo(() => ({
    total: rows.length,
    errors: rows.filter((r) => r.status >= 400).length,
    gemini: rows.filter((r) => !r.provider?.includes("gateway")).length,
    avgLatency: rows.length ? Math.round(rows.reduce((s, r) => s + (r.latency_ms || 0), 0) / rows.length) : 0,
  }), [rows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
            <LineIcon className="h-6 w-6 text-primary" /> AI Telemetry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Calls, providers, latency and errors across AI edge functions.</p>
        </div>
        <Button onClick={load} size="sm" variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total calls" value={totals.total} />
        <Stat label="Errors" value={totals.errors} accent={totals.errors ? "text-gov-danger" : undefined} />
        <Stat label="Direct Gemini" value={`${totals.gemini}/${totals.total}`} />
        <Stat label="Avg latency" value={`${totals.avgLatency} ms`} />
      </div>

      <div className="gov-card-elevated">
        <h3 className="text-sm font-semibold mb-3">Calls per day by provider</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="gemini" stackId="a" fill="hsl(var(--primary))" name="Gemini direct" />
            <Bar dataKey="gateway" stackId="a" fill="hsl(var(--accent))" name="Lovable gateway" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="gov-card-elevated">
        <h3 className="text-sm font-semibold mb-3">Average latency (ms)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="avgLatency" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="gov-card-elevated overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Recent calls (last 100)</h3>
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="text-left border-b border-border">
              <th className="py-2 pr-3">Time</th>
              <th className="py-2 pr-3">Function</th>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Latency</th>
              <th className="py-2 pr-3">Caller</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 100).map((r) => (
              <tr key={r.id} className="border-b border-border/40">
                <td className="py-1.5 pr-3 text-muted-foreground">{format(new Date(r.created_at), "MMM dd HH:mm")}</td>
                <td className="py-1.5 pr-3">{r.function_name}</td>
                <td className="py-1.5 pr-3">{r.provider}</td>
                <td className={`py-1.5 pr-3 font-medium ${r.status >= 400 ? "text-gov-danger" : "text-gov-success"}`}>{r.status}</td>
                <td className="py-1.5 pr-3">{r.latency_ms ?? "—"} ms</td>
                <td className="py-1.5 pr-3 truncate max-w-[200px]">{r.caller_email || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No telemetry yet. Trigger an AI call to populate.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="gov-card-elevated">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold font-display mt-1 ${accent || "text-foreground"}`}>{value}</p>
    </div>
  );
}
