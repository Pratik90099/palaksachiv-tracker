import { MOCK_ACTIONABLES } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Globe, IndianRupee, Clock, Building2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const goiItems = MOCK_ACTIONABLES.filter(a => a.isGOIPending);

const MINISTRY_DATA = [
  { name: "MoRTH", value: 8, amount: 420 },
  { name: "MoHUA", value: 6, amount: 310 },
  { name: "MoJS", value: 5, amount: 240 },
  { name: "MoRD", value: 4, amount: 180 },
  { name: "Others", value: 11, amount: 520 },
];

const COLORS = ["hsl(220, 70%, 22%)", "hsl(220, 55%, 35%)", "hsl(42, 92%, 50%)", "hsl(152, 60%, 40%)", "hsl(210, 80%, 52%)"];

export default function GOIPendingPage() {
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

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="gov-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-gov-info" />
            <span className="text-xs font-medium text-muted-foreground">Total GOI Items</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-display">34</p>
        </div>
        <div className="gov-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-gov-gold" />
            <span className="text-xs font-medium text-muted-foreground">Amount Blocked</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-display">₹1,670 Cr</p>
        </div>
        <div className="gov-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gov-danger" />
            <span className="text-xs font-medium text-muted-foreground">Pending 90+ Days</span>
          </div>
          <p className="text-2xl font-bold text-gov-danger font-display">12</p>
        </div>
        <div className="gov-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Ministries Involved</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-display">8</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ministry breakdown chart */}
        <div className="gov-card-elevated">
          <h3 className="gov-section-title mb-4">Ministry-wise Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={MINISTRY_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none">
                {MINISTRY_DATA.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {MINISTRY_DATA.map((m, i) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{m.name}</span>
                </div>
                <span className="font-semibold text-foreground">{m.value} items • ₹{m.amount} Cr</span>
              </div>
            ))}
          </div>
        </div>

        {/* GOI Items list */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="gov-section-title">GOI Dependent Items</h3>
          {goiItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="gov-card border-l-4 border-l-gov-warning"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>📍 {item.district}</span>
                    <span>📂 {item.category}</span>
                    <span>🎯 Target: {item.targetDate}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
