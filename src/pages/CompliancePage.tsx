import { MAHARASHTRA_DISTRICTS, DEPARTMENT_PERFORMANCE } from "@/lib/mock-data";
import { BarChart3, Download, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GS_COMPLIANCE = MAHARASHTRA_DISTRICTS.slice(0, 20).map((d) => ({
  district: d,
  gsName: `GS ${d}`,
  q1: Math.random() > 0.1,
  q2: Math.random() > 0.15,
  q3: Math.random() > 0.1,
  q4: Math.random() > 0.3,
  score: Math.floor(Math.random() * 40) + 60,
  daysSinceVisit: Math.floor(Math.random() * 90),
}));

export default function CompliancePage() {
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
          { label: "Visits Completed", value: "28/36", color: "text-gov-success", bg: "bg-gov-success-light" },
          { label: "Pending", value: "5", color: "text-gov-warning", bg: "bg-gov-warning-light" },
          { label: "Overdue", value: "2", color: "text-gov-danger", bg: "bg-gov-danger-light" },
          { label: "Missed (Q3)", value: "1", color: "text-gov-danger", bg: "bg-gov-danger-light" },
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
          <BarChart data={DEPARTMENT_PERFORMANCE} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(220, 15%, 46%)" />
            <YAxis type="category" dataKey="department" width={80} tick={{ fontSize: 11 }} stroke="hsl(220, 15%, 46%)" />
            <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,20%,88%)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="hsl(220, 70%, 22%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* GS Visit compliance table */}
      <div className="gov-card-elevated overflow-hidden p-0">
        <div className="p-4 border-b border-border">
          <h3 className="gov-section-title">GS Visit Compliance — FY 2024-25</h3>
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
              {GS_COMPLIANCE.map((row, i) => (
                <motion.tr
                  key={row.district}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{row.district}</td>
                  {[row.q1, row.q2, row.q3, row.q4].map((q, qi) => (
                    <td key={qi} className="px-4 py-3 text-center">
                      <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mx-auto ${
                        q ? "bg-gov-success-light text-gov-success" : "bg-gov-danger-light text-gov-danger"
                      }`}>
                        {q ? "✓" : "✗"}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${row.score >= 80 ? "text-gov-success" : row.score >= 60 ? "text-gov-warning" : "text-gov-danger"}`}>
                      {row.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{row.daysSinceVisit}d</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
