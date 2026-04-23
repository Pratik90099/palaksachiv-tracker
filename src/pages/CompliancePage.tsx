import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDistricts, useDepartments, useTasks, useVisits } from "@/hooks/use-data";

export default function CompliancePage() {
  const { data: districts } = useDistricts();
  const { data: departments } = useDepartments();
  const { data: tasks } = useTasks();
  const { data: visits } = useVisits();

  // Department compliance scores from real tasks
  const deptScores = useMemo(() => {
    if (!departments) return [];
    return departments.map((d: any) => {
      const dTasks = (tasks || []).filter((t: any) =>
        (t.task_departments || []).some((td: any) => td.department_id === d.id)
      );
      const total = dTasks.length;
      const closed = dTasks.filter((t: any) => t.status === "closed" || t.status === "completed_pending_closure").length;
      const overdue = dTasks.filter((t: any) => t.status === "overdue").length;
      const score = total === 0 ? 0 : Math.max(0, Math.round((closed / total) * 100) - overdue * 5);
      return { department: d.short_name || d.name, score };
    });
  }, [departments, tasks]);

  // GS visit compliance per district
  const gsCompliance = useMemo(() => {
    if (!districts) return [];
    return districts.map((d: any) => {
      const dVisits = (visits || []).filter((v: any) => v.district_id === d.id);
      const byQuarter = (q: string) => dVisits.some((v: any) => v.quarter === q && v.status === "completed");
      const completed = dVisits.filter((v: any) => v.status === "completed").length;
      const lastVisit = dVisits
        .filter((v: any) => v.visit_date)
        .map((v: any) => new Date(v.visit_date).getTime())
        .sort((a, b) => b - a)[0];
      const daysSinceVisit = lastVisit ? Math.floor((Date.now() - lastVisit) / 86400000) : null;
      return {
        district: d.name,
        q1: byQuarter("Q1"),
        q2: byQuarter("Q2"),
        q3: byQuarter("Q3"),
        q4: byQuarter("Q4"),
        score: Math.min(100, completed * 25),
        daysSinceVisit,
      };
    });
  }, [districts, visits]);

  const summary = useMemo(() => {
    const completed = (visits || []).filter((v: any) => v.status === "completed").length;
    const pending = (visits || []).filter((v: any) => v.status === "scheduled").length;
    const missed = (visits || []).filter((v: any) => v.status === "missed").length;
    return {
      completed: `${completed}/${(districts || []).length || 36}`,
      pending,
      missed,
    };
  }, [visits, districts]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Visit Compliance</h1>
          <p className="text-sm text-muted-foreground mt-1">Quarterly visit compliance tracking for all 36 Guardian Secretaries</p>
        </div>
        <Button variant="outline" size="sm" className="text-muted-foreground">
          <Download className="h-4 w-4 mr-1" /> Export Report
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Visits Completed", value: summary.completed, color: "text-gov-success", bg: "bg-gov-success-light" },
          { label: "Pending", value: summary.pending, color: "text-gov-warning", bg: "bg-gov-warning-light" },
          { label: "Missed", value: summary.missed, color: "text-gov-danger", bg: "bg-gov-danger-light" },
          { label: "Districts", value: (districts || []).length || 36, color: "text-gov-info", bg: "bg-gov-info-light" },
        ].map((s) => (
          <div key={s.label} className={`gov-stat-card ${s.bg}`}>
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} font-display`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Department compliance chart */}
      <div className="gov-card-elevated">
        <h3 className="gov-section-title mb-4">Department Compliance Scores</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={deptScores} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(220, 15%, 46%)" />
            <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 11 }} stroke="hsl(220, 15%, 46%)" />
            <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,20%,88%)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="hsl(220, 70%, 22%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* GS Visit compliance table */}
      <div className="gov-card-elevated overflow-hidden p-0">
        <div className="p-4 border-b border-border">
          <h3 className="gov-section-title">GS Visit Compliance — Live</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="gov-table-header">
                <th className="text-left px-4 py-3">District</th>
                <th className="text-center px-4 py-3">Q1</th>
                <th className="text-center px-4 py-3">Q2</th>
                <th className="text-center px-4 py-3">Q3</th>
                <th className="text-center px-4 py-3">Q4</th>
                <th className="text-center px-4 py-3">Score</th>
                <th className="text-center px-4 py-3">Days Since Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gsCompliance.map((row, i) => (
                <motion.tr
                  key={row.district}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{row.district}</td>
                  {[row.q1, row.q2, row.q3, row.q4].map((q, qi) => (
                    <td key={qi} className="px-4 py-3 text-center">
                      <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mx-auto ${
                        q ? "bg-gov-success-light text-gov-success" : "bg-muted text-muted-foreground"
                      }`}>
                        {q ? "✓" : "—"}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${row.score >= 80 ? "text-gov-success" : row.score >= 60 ? "text-gov-warning" : "text-gov-danger"}`}>
                      {row.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {row.daysSinceVisit !== null ? `${row.daysSinceVisit}d` : "—"}
                  </td>
                </motion.tr>
              ))}
              {gsCompliance.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No districts loaded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
