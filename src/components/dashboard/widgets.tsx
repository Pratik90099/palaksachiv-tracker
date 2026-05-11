import { StatCard } from "@/components/StatCard";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { ArrowUpRight, Shield } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import type { ActionableStatus, Priority } from "@/lib/mock-data";

export function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <span className="gov-badge bg-gov-success-light text-gov-success">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        Live
      </span>
    </div>
  );
}

export function KpiRow({ items }: { items: { title: string; value: any; subtitle?: string; icon: any; variant?: any }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it) => (
        <StatCard key={it.title} title={it.title} value={it.value} subtitle={it.subtitle} icon={it.icon} variant={it.variant} />
      ))}
    </div>
  );
}

export function QuarterlyTrends({ tasks }: { tasks: any[] }) {
  const data = (() => {
    const buckets: Record<string, { quarter: string; raised: number; resolved: number; overdue: number }> = {};
    tasks.forEach((t: any) => {
      const d = new Date(t.created_at);
      const q = `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
      buckets[q] = buckets[q] || { quarter: q, raised: 0, resolved: 0, overdue: 0 };
      buckets[q].raised += 1;
      if (t.status === "closed" || t.status === "completed_pending_closure") buckets[q].resolved += 1;
      if (t.status === "overdue") buckets[q].overdue += 1;
    });
    return Object.values(buckets).sort((a, b) => a.quarter.localeCompare(b.quarter));
  })();

  return (
    <div className="gov-card-elevated">
      <h3 className="gov-section-title mb-4">Quarterly Trends</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
          <XAxis dataKey="quarter" tick={{ fontSize: 11 }} stroke="hsl(220, 15%, 46%)" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 15%, 46%)" />
          <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 20%, 88%)", borderRadius: "8px", fontSize: "12px" }} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Bar dataKey="raised" fill="hsl(220, 70%, 22%)" radius={[4, 4, 0, 0]} name="Raised" />
          <Bar dataKey="resolved" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} name="Resolved" />
          <Bar dataKey="overdue" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Overdue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPie({ tasks }: { tasks: any[] }) {
  const counts = tasks.reduce((acc: Record<string, number>, t: any) => {
    acc[t.status] = (acc[t.status] || 0) + 1; return acc;
  }, {});
  const data = [
    { name: "On Track", value: counts["on_track"] || 0, color: "hsl(152, 60%, 40%)" },
    { name: "In Progress", value: counts["in_progress"] || 0, color: "hsl(210, 80%, 52%)" },
    { name: "At Risk", value: counts["at_risk"] || 0, color: "hsl(38, 92%, 50%)" },
    { name: "Overdue", value: counts["overdue"] || 0, color: "hsl(0, 72%, 51%)" },
    { name: "Escalated", value: counts["escalated"] || 0, color: "hsl(0, 80%, 35%)" },
    { name: "Closed", value: counts["closed"] || 0, color: "hsl(152, 70%, 30%)" },
  ].filter(d => d.value > 0);

  return (
    <div className="gov-card-elevated">
      <h3 className="gov-section-title mb-4">Status Distribution</h3>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
      )}
    </div>
  );
}

export function RecentActionables({ tasks, title = "Recent Actionables", limit = 5 }: { tasks: any[]; title?: string; limit?: number }) {
  return (
    <div className="gov-card-elevated">
      <div className="flex items-center justify-between mb-4">
        <h3 className="gov-section-title">{title}</h3>
        <a href="/actionables" className="text-xs text-gov-info font-medium flex items-center gap-1 hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
      <div className="space-y-3">
        {tasks.slice(0, limit).map((item: any) => {
          const districtNames = item.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
          return (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{item.display_id}</span>
                  <PriorityBadge priority={item.priority as Priority} />
                  {item.is_critical && (
                    <span className="gov-badge bg-gov-danger-light text-gov-danger">
                      <Shield className="h-2.5 w-2.5" /> Critical
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{districtNames.join(", ") || "—"}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">{item.projects?.category || "—"}</span>
                </div>
              </div>
              <StatusBadge status={item.status as ActionableStatus} />
            </div>
          );
        })}
        {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>}
      </div>
    </div>
  );
}

export function RecentVisits({ visits }: { visits: any[] }) {
  return (
    <div className="gov-card-elevated">
      <h3 className="gov-section-title mb-4">Recent Visits</h3>
      <div className="space-y-3">
        {visits.slice(0, 5).map((visit: any) => (
          <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div>
              <p className="text-sm font-medium text-foreground">{visit.districts?.name || "—"}</p>
              <p className="text-[10px] text-muted-foreground">{visit.guardian_secretaries?.name || "—"}</p>
              <p className="text-[10px] text-muted-foreground">{visit.visit_date || "Not scheduled"}</p>
            </div>
            <span className={`gov-badge ${
              visit.status === "completed" ? "bg-gov-success-light text-gov-success" :
              visit.status === "scheduled" ? "bg-gov-info-light text-gov-info" :
              "bg-gov-danger-light text-gov-danger"
            }`}>
              {visit.status === "completed" ? "Completed" : visit.status === "scheduled" ? "Scheduled" : "Missed"}
            </span>
          </div>
        ))}
        {visits.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No visits logged yet</p>}
      </div>
    </div>
  );
}

export function DepartmentPerformance({ tasks, departments }: { tasks: any[]; departments: any[] }) {
  const rows = (departments || []).map((d: any) => {
    const dTasks = tasks.filter((t: any) =>
      (t.task_departments || []).some((td: any) => td.department_id === d.id)
    );
    const open = dTasks.filter((t: any) => !["closed", "completed_pending_closure"].includes(t.status)).length;
    const resolved = dTasks.filter((t: any) => t.status === "closed" || t.status === "completed_pending_closure").length;
    const overdue = dTasks.filter((t: any) => t.status === "overdue").length;
    const total = dTasks.length;
    const score = total === 0 ? 0 : Math.max(0, Math.round((resolved / total) * 100) - overdue * 5);
    return { department: d.short_name || d.name, open, resolved, overdue, score };
  }).filter(d => d.open + d.resolved + d.overdue > 0);

  return (
    <div className="gov-card-elevated">
      <h3 className="gov-section-title mb-4">Department Performance</h3>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No department data yet</p>}
        {rows.map((dept) => (
          <div key={dept.department} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{dept.department}</span>
              <span className={`text-xs font-bold ${dept.score >= 80 ? "text-gov-success" : dept.score >= 60 ? "text-gov-warning" : "text-gov-danger"}`}>
                {dept.score}/100
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${dept.score >= 80 ? "bg-gov-success" : dept.score >= 60 ? "bg-gov-warning" : "bg-gov-danger"}`} style={{ width: `${dept.score}%` }} />
            </div>
            <div className="flex gap-4 text-[10px] text-muted-foreground">
              <span>Open: {dept.open}</span>
              <span>Overdue: {dept.overdue}</span>
              <span>Resolved: {dept.resolved}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoiPendingPanel({ tasks }: { tasks: any[] }) {
  const items = tasks.filter((t: any) => t.is_goi_pending).slice(0, 5);
  return (
    <div className="gov-card-elevated">
      <div className="flex items-center justify-between mb-4">
        <h3 className="gov-section-title">GOI Pending</h3>
        <a href="/goi-pending" className="text-xs text-gov-info font-medium flex items-center gap-1 hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No GOI-pending items</p>}
        {items.map((t: any) => (
          <div key={t.id} className="p-2.5 rounded-lg bg-secondary/30">
            <p className="text-sm font-medium text-foreground line-clamp-1">{t.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.responsible_officer || "Unassigned"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CriticalIssuesPanel({ tasks }: { tasks: any[] }) {
  const items = tasks.filter((t: any) => t.is_critical || t.priority === "critical").slice(0, 5);
  return (
    <div className="gov-card-elevated">
      <div className="flex items-center justify-between mb-4">
        <h3 className="gov-section-title">Critical Issues</h3>
        <a href="/critical-issues" className="text-xs text-gov-info font-medium flex items-center gap-1 hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No critical issues</p>}
        {items.map((t: any) => (
          <div key={t.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-gov-danger-light/40">
            <Shield className="h-3.5 w-3.5 text-gov-danger mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-1">{t.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.responsible_officer || "Unassigned"}</p>
            </div>
            <StatusBadge status={t.status as ActionableStatus} />
          </div>
        ))}
      </div>
    </div>
  );
}
