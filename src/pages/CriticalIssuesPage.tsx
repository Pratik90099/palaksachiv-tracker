import { MOCK_ACTIONABLES } from "@/lib/mock-data";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { AlertTriangle, Shield, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const criticalItems = MOCK_ACTIONABLES.filter(a => a.isCritical || a.priority === "critical");
const pendingClassification = MOCK_ACTIONABLES.filter(a => a.priority === "high" && !a.isCritical).slice(0, 3);

export default function CriticalIssuesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Critical Issues</h1>
          <p className="text-sm text-muted-foreground mt-1">Issues classified as Critical by Chief Secretary / CM</p>
        </div>
      </div>

      {/* Alert banner */}
      <div className="p-4 rounded-lg bg-gov-danger-light border border-gov-danger/20 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-gov-danger mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gov-danger">
            {criticalItems.length} Active Critical Issue{criticalItems.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Critical issues require fortnightly progress updates and are escalated directly to CS level.
          </p>
        </div>
      </div>

      {/* Active Critical Issues */}
      <div className="space-y-3">
        <h3 className="gov-section-title flex items-center gap-2">
          <Shield className="h-4 w-4 text-gov-danger" /> Active Critical Issues
        </h3>
        {criticalItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="gov-card-elevated border-l-4 border-l-gov-danger"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                  <PriorityBadge priority={item.priority} />
                  <StatusBadge status={item.status} />
                  {item.isGOIPending && (
                    <span className="gov-badge bg-gov-warning-light text-gov-warning text-[10px]">GOI Pending</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">{item.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>📍 {item.district}</span>
                  <span>📂 {item.category}</span>
                  <span>👤 {item.responsibleOfficer}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Target: {item.targetDate}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs shrink-0 ml-4">
                View Details <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending Classification */}
      <div className="space-y-3">
        <h3 className="gov-section-title flex items-center gap-2">
          <Clock className="h-4 w-4 text-gov-warning" /> Pending Critical Classification
        </h3>
        <p className="text-xs text-muted-foreground">
          These high-priority items have been flagged as 'Potential Critical' and await CS/CM classification.
        </p>
        {pendingClassification.map((item) => (
          <div key={item.id} className="gov-card border-l-4 border-l-gov-warning">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                  <span className="gov-badge bg-gov-warning-light text-gov-warning">Pending Classification</span>
                </div>
                <p className="text-sm font-medium text-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.district} • {item.category}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="text-xs">Classify Critical</Button>
                <Button size="sm" variant="outline" className="text-xs">Downgrade</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
