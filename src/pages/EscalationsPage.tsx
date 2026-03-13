import { useTasks } from "@/hooks/use-data";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Shield, ArrowUp, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { ActionableStatus, Priority } from "@/lib/mock-data";

const ESCALATION_LEVELS = [
  { level: "L1", trigger: "T-7 days before deadline", to: "Implementation Agency", color: "bg-gov-info-light text-gov-info" },
  { level: "L2", trigger: "T-3 days before deadline", to: "Department Secretary", color: "bg-gov-warning-light text-gov-warning" },
  { level: "L3", trigger: "Deadline breached - Day 1", to: "Divisional Commissioner", color: "bg-orange-100 text-gov-orange" },
  { level: "L4", trigger: "Overdue by 7+ days", to: "Chief Secretary", color: "bg-gov-danger-light text-gov-danger" },
  { level: "L5", trigger: "Overdue 15+ days / Critical", to: "CMO", color: "bg-red-100 text-red-800" },
];

export default function EscalationsPage() {
  const { data: tasks } = useTasks();
  const escalatedItems = (tasks || []).filter(a => a.status === "escalated" || a.status === "overdue");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Escalation Matrix</h1>
        <p className="text-sm text-muted-foreground mt-1">5-tier escalation framework for issue resolution</p>
      </div>

      <div className="gov-card-elevated">
        <h3 className="gov-section-title mb-4">Escalation Levels</h3>
        <div className="space-y-2">
          {ESCALATION_LEVELS.map((level, i) => (
            <motion.div key={level.level} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
              <span className={`gov-badge ${level.color} font-bold min-w-[40px] justify-center`}>{level.level}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{level.trigger}</p>
                <p className="text-xs text-muted-foreground">Escalated to: {level.to}</p>
              </div>
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="gov-section-title">Currently Escalated Items ({escalatedItems.length})</h3>
        {escalatedItems.map((item, i) => {
          const districtNames = item.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="gov-card border-l-4 border-l-destructive">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{item.display_id}</span>
                    <PriorityBadge priority={item.priority as Priority} />
                    <StatusBadge status={item.status as ActionableStatus} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {districtNames.join(", ") || "—"}</span>
                    <span>👤 {item.responsible_officer || "—"}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Target: {item.target_date || "—"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {escalatedItems.length === 0 && <p className="text-sm text-muted-foreground py-4">No escalated items</p>}
      </div>
    </div>
  );
}
