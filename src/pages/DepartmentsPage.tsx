import { DEPARTMENT_PERFORMANCE } from "@/lib/mock-data";
import { Building2, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DepartmentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Departments</h1>
        <p className="text-sm text-muted-foreground mt-1">Department-wise performance tracking and compliance</p>
      </div>

      <div className="gov-card-elevated">
        <h3 className="gov-section-title mb-4">Department Performance Overview</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={DEPARTMENT_PERFORMANCE} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
            <XAxis dataKey="department" tick={{ fontSize: 11 }} stroke="hsl(220, 15%, 46%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 15%, 46%)" />
            <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,20%,88%)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="open" fill="hsl(210, 80%, 52%)" radius={[4, 4, 0, 0]} name="Open" />
            <Bar dataKey="resolved" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} name="Resolved" />
            <Bar dataKey="overdue" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Overdue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEPARTMENT_PERFORMANCE.map((dept, i) => (
          <motion.div
            key={dept.department}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="gov-card-elevated"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{dept.department}</h4>
                  <p className="text-[10px] text-muted-foreground">Department performance</p>
                </div>
              </div>
              <span className={`text-lg font-bold ${dept.score >= 80 ? "text-gov-success" : dept.score >= 60 ? "text-gov-warning" : "text-gov-danger"}`}>
                {dept.score}/100
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary mb-3">
              <div
                className={`h-full rounded-full ${dept.score >= 80 ? "bg-gov-success" : dept.score >= 60 ? "bg-gov-warning" : "bg-gov-danger"}`}
                style={{ width: `${dept.score}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-gov-info-light">
                <p className="text-lg font-bold text-gov-info">{dept.open}</p>
                <p className="text-[10px] text-muted-foreground">Open</p>
              </div>
              <div className="p-2 rounded bg-gov-success-light">
                <p className="text-lg font-bold text-gov-success">{dept.resolved}</p>
                <p className="text-[10px] text-muted-foreground">Resolved</p>
              </div>
              <div className="p-2 rounded bg-gov-danger-light">
                <p className="text-lg font-bold text-gov-danger">{dept.overdue}</p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
