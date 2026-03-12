import { FileText, Download, Calendar, Building2, MapPin, Globe, AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const REPORTS = [
  { name: "District Quarterly Report", description: "All actionables raised, status, resolution rate, GS visit summary, officer attendance", frequency: "Quarterly", icon: MapPin, lastGenerated: "2025-01-01" },
  { name: "Department Compliance Report", description: "Per-department: assigned items, completed, pending, overdue, compliance score", frequency: "Monthly", icon: Building2, lastGenerated: "2025-03-01" },
  { name: "State-Wide MIS Summary", description: "KPIs: total issues, closed, open, critical, by category, by district, by dept.", frequency: "Monthly", icon: BarChart3, lastGenerated: "2025-03-01" },
  { name: "GS Visit Compliance Report", description: "All 36 GS: visit dates, quarters covered, missed visits, issues logged", frequency: "Quarterly", icon: Calendar, lastGenerated: "2025-01-01" },
  { name: "GOI Pending Issues Report", description: "Ministry-wise, district-wise, amount, duration of pendency", frequency: "Monthly", icon: Globe, lastGenerated: "2025-03-01" },
  { name: "Critical Issues Status Report", description: "All active Critical issues, timeline, responsible officers, CS orders", frequency: "Weekly", icon: AlertTriangle, lastGenerated: "2025-03-10" },
  { name: "Annual Performance Report", description: "Year-long aggregation per GS, per district, per department", frequency: "Annually", icon: FileText, lastGenerated: "2024-04-01" },
];

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">MIS Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate and download management information system reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((report, i) => (
          <motion.div
            key={report.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="gov-card-elevated flex items-start gap-4"
          >
            <div className="p-3 rounded-lg bg-secondary shrink-0">
              <report.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">{report.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="gov-badge bg-secondary text-secondary-foreground">{report.frequency}</span>
                <span className="text-[10px] text-muted-foreground">Last: {report.lastGenerated}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="text-xs">
                <Download className="h-3 w-3 mr-1" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Download className="h-3 w-3 mr-1" /> Excel
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
