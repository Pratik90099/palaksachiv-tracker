import { useTasks } from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { AlertTriangle, Shield, Clock, ArrowUpRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { ActionableStatus, Priority } from "@/lib/mock-data";

export default function CriticalIssuesPage() {
  const { data: tasks } = useTasks();
  const { filterTasks } = useRoleFilter();
  const allTasks = filterTasks(tasks || []);

  const criticalItems = allTasks.filter(a => a.is_critical || a.priority === "critical");
  const pendingClassification = allTasks.filter(a => a.priority === "high" && !a.is_critical).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Critical Issues</h1>
          <p className="text-sm text-muted-foreground mt-1">Issues classified as Critical by Chief Secretary / CM</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-gov-danger-light border border-destructive/20 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-destructive">
            {criticalItems.length} Active Critical Issue{criticalItems.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Critical issues require fortnightly progress updates and are escalated directly to CS level.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="gov-section-title flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" /> Active Critical Issues
        </h3>
        {criticalItems.map((item, i) => {
          const districtNames = item.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="gov-card-elevated border-l-4 border-l-destructive">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">{item.display_id}</span>
                    <PriorityBadge priority={item.priority as Priority} />
                    <StatusBadge status={item.status as ActionableStatus} />
                    {item.is_goi_pending && <span className="gov-badge bg-gov-warning-light text-gov-warning text-[10px]">GOI Pending</span>}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {districtNames.join(", ") || "—"}</span>
                    <span>👤 {item.responsible_officer || "—"}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Target: {item.target_date || "—"}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs shrink-0 ml-4">
                  View Details <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </motion.div>
          );
        })}
        {criticalItems.length === 0 && <p className="text-sm text-muted-foreground py-4">No critical issues</p>}
      </div>

      <div className="space-y-3">
        <h3 className="gov-section-title flex items-center gap-2">
          <Clock className="h-4 w-4 text-gov-warning" /> Pending Critical Classification
        </h3>
        <p className="text-xs text-muted-foreground">High-priority items awaiting CS/CM classification.</p>
        {pendingClassification.map((item) => {
          const districtNames = item.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
          return (
            <div key={item.id} className="gov-card border-l-4 border-l-gov-warning">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{item.display_id}</span>
                    <span className="gov-badge bg-gov-warning-light text-gov-warning">Pending Classification</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{districtNames.join(", ") || "—"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="text-xs">Classify Critical</Button>
                  <Button size="sm" variant="outline" className="text-xs">Downgrade</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
