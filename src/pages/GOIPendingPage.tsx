import { useMemo } from "react";
import { useTasks } from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { StatusBadge } from "@/components/StatusBadge";
import { Globe, Clock, Building2, Download, MapPin, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ActionableStatus } from "@/lib/mock-data";

const COLORS = [
  "hsl(220, 70%, 22%)",
  "hsl(220, 55%, 35%)",
  "hsl(42, 92%, 50%)",
  "hsl(152, 60%, 40%)",
  "hsl(210, 80%, 52%)",
  "hsl(0, 70%, 50%)",
  "hsl(280, 50%, 45%)",
];

export default function GOIPendingPage() {
  const { data: tasks } = useTasks();
  const { filterTasks } = useRoleFilter();
  const goiItems = filterTasks(tasks || []).filter((a: any) => a.is_goi_pending);

  // Live aggregation grouped by agency
  const agencyData = useMemo(() => {
    const counts = new Map<string, number>();
    goiItems.forEach((item: any) => {
      const agency = (item.agency || "Unspecified").trim() || "Unspecified";
      counts.set(agency, (counts.get(agency) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [goiItems]);

  const overdueCount = goiItems.filter((i: any) => i.status === "overdue").length;
  const agenciesInvolved = agencyData.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">GOI Pending Issues</h1>
          <p className="text-sm text-muted-foreground mt-1">Track issues requiring Central Government approvals and fund releases</p>
        </div>
        <Button variant="outline" size="sm" className="text-muted-foreground">
          <Download className="h-4 w-4 mr-1" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="gov-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-gov-info" />
            <span className="text-xs font-medium text-muted-foreground">Total GOI Items</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-display">{goiItems.length}</p>
        </div>
        <div className="gov-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium text-muted-foreground">Overdue Items</span>
          </div>
          <p className="text-2xl font-bold text-destructive font-display">{overdueCount}</p>
        </div>
        <div className="gov-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Agencies Involved</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-display">{agenciesInvolved}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="gov-card-elevated">
          <h3 className="gov-section-title mb-4">Agency-wise Distribution</h3>
          {agencyData.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No GOI items recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mark actionables as “GOI pending” to see distribution here.
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={agencyData} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none">
                    {agencyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {agencyData.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{m.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{m.value} item{m.value !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h3 className="gov-section-title">GOI Dependent Items</h3>
          {goiItems.map((item: any, i: number) => {
            const districtNames = item.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="gov-card border-l-4 border-l-gov-warning">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{item.display_id}</span>
                      <StatusBadge status={item.status as ActionableStatus} />
                      {item.agency && (
                        <span className="text-[10px] gov-badge bg-muted text-muted-foreground">
                          {item.agency}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {districtNames.join(", ") || "—"}</span>
                      <span>🎯 Target: {item.target_date || "—"}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {goiItems.length === 0 && (
            <div className="gov-card text-center py-10">
              <Inbox className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No GOI pending items</p>
              <p className="text-xs text-muted-foreground mt-1">
                Items flagged as Central Government pending will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
