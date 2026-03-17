import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/StatCard";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import {
  ClipboardList, AlertTriangle, MapPin, BarChart3, Calendar, Globe,
  TrendingUp, Users, CheckCircle, Clock, Shield, ArrowUpRight
} from "lucide-react";
import { useTasks, useVisits } from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { QUARTERLY_DATA, DEPARTMENT_PERFORMANCE } from "@/lib/mock-data";
import type { ActionableStatus, Priority } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const { data: visits } = useVisits();
  const { filterTasks, filterVisits } = useRoleFilter();

  const allTasks = filterTasks(tasks || []);
  const allVisits = filterVisits(visits || []);

  const totalActionables = allTasks.length;
  const openItems = allTasks.filter(t => !["closed", "completed_pending_closure"].includes(t.status)).length;
  const overdueItems = allTasks.filter(t => t.status === "overdue").length;
  const criticalItems = allTasks.filter(t => t.is_critical || t.priority === "critical").length;
  const escalatedItems = allTasks.filter(t => t.status === "escalated").length;
  const goiPendingItems = allTasks.filter(t => t.is_goi_pending).length;
  const visitsCompleted = allVisits.filter(v => v.status === "completed").length;
  const visitsPending = allVisits.filter(v => v.status === "scheduled").length;

  const statusCounts = allTasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const PIE_DATA = [
    { name: "On Track", value: statusCounts["on_track"] || 0, color: "hsl(152, 60%, 40%)" },
    { name: "In Progress", value: statusCounts["in_progress"] || 0, color: "hsl(210, 80%, 52%)" },
    { name: "At Risk", value: statusCounts["at_risk"] || 0, color: "hsl(38, 92%, 50%)" },
    { name: "Overdue", value: statusCounts["overdue"] || 0, color: "hsl(0, 72%, 51%)" },
    { name: "Escalated", value: statusCounts["escalated"] || 0, color: "hsl(0, 80%, 35%)" },
    { name: "Closed", value: statusCounts["closed"] || 0, color: "hsl(152, 70%, 30%)" },
  ].filter(d => d.value > 0);

  const isCS = user?.role === "chief_secretary";
  const isCMO = user?.role === "cmo";
  const isApex = isCS || isCMO;
  const isDeptSec = user?.role === "department_secretary";

  const titleText = isDeptSec ? `${user?.department || "Department"} Dashboard` :
    user?.role === "divisional_commissioner" ? `${user?.division || ""} Division Dashboard` :
    isApex ? "State Overview" :
    (user?.role === "guardian_secretary" || user?.role === "district_collector") ? `${user?.district || ""} District Dashboard` :
    "Dashboard";

  const subtitleText = user?.district ? `Q4 2024-25 • ${user.district} District` :
    user?.division ? `Q4 2024-25 • ${user.division} Division` :
    user?.department ? `Q4 2024-25 • ${user.department}` :
    "Q4 2024-25 • All 36 Districts";

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">{titleText}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitleText}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="gov-badge bg-gov-success-light text-gov-success">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Live
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Actionables" value={totalActionables} subtitle={`${openItems} open`} icon={ClipboardList} />
        <StatCard title="Overdue Items" value={overdueItems} subtitle="Requires attention" icon={Clock} variant="danger" />
        <StatCard title="Critical Issues" value={criticalItems} subtitle={`${escalatedItems} escalated`} icon={AlertTriangle} variant="warning" />
        <StatCard title="Visit Compliance" value={`${visitsCompleted}/${allVisits.length || 36}`} subtitle={`${visitsPending} pending`} icon={Calendar} variant="info" />
      </div>

      {isApex && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="GOI Pending" value={goiPendingItems} subtitle="Central approvals" icon={Globe} variant="warning" />
          <StatCard title="Departments" value={16} subtitle="Active tracking" icon={Users} />
          <StatCard title="Total Districts" value={36} subtitle="Maharashtra" icon={MapPin} />
          <StatCard title="Escalated" value={escalatedItems} subtitle="Needs CS attention" icon={Shield} variant="danger" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 gov-card-elevated">
          <h3 className="gov-section-title mb-4">Quarterly Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={QUARTERLY_DATA} barGap={4}>
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

        <div className="gov-card-elevated">
          <h3 className="gov-section-title mb-4">Status Distribution</h3>
          {PIE_DATA.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                    {PIE_DATA.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {PIE_DATA.map((item) => (
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="gov-section-title">Recent Actionables</h3>
            <a href="/actionables" className="text-xs text-gov-info font-medium flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-3">
            {allTasks.slice(0, 5).map((item) => {
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
            {allTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>}
          </div>
        </div>

        {isApex ? (
          <div className="gov-card-elevated">
            <h3 className="gov-section-title mb-4">Department Performance</h3>
            <div className="space-y-3">
              {DEPARTMENT_PERFORMANCE.map((dept) => (
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
        ) : (
          <div className="gov-card-elevated">
            <h3 className="gov-section-title mb-4">Recent Visits</h3>
            <div className="space-y-3">
              {allVisits.slice(0, 5).map((visit) => (
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
              {allVisits.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No visits logged yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
