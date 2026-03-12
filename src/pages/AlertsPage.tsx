import { Bell, AlertTriangle, Info, Shield, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Alert {
  id: string;
  level: "info" | "warning" | "high" | "critical" | "emergency";
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

const MOCK_ALERTS: Alert[] = [
  { id: "A-001", level: "critical", title: "Quarter visit missed", message: "Guardian Secretary Shri. D. N. Sharma has NOT completed the mandatory quarterly visit to Thane for Q4 2024-25.", timestamp: "2025-03-12 09:00", acknowledged: false },
  { id: "A-002", level: "high", title: "15 days remaining — visit pending", message: "Only 15 days remain in Q4. District visit to Aurangabad not yet completed.", timestamp: "2025-03-15 08:00", acknowledged: false },
  { id: "A-003", level: "critical", title: "Actionable deadline breached", message: "ACT-2025-002: Gadchiroli–Chamorshi road repair overdue by 12 days.", timestamp: "2025-03-12 10:30", acknowledged: false },
  { id: "A-004", level: "warning", title: "T-7 days before deadline", message: "ACT-2025-005: Metro Phase 2 land acquisition deadline in 7 days.", timestamp: "2025-03-13 09:00", acknowledged: true },
  { id: "A-005", level: "info", title: "Status update submitted", message: "Rural Dev. Dept. updated status on ACT-2025-003: PM Awas Yojana beneficiary verification.", timestamp: "2025-03-11 14:22", acknowledged: true },
  { id: "A-006", level: "high", title: "CS Remark posted", message: "Chief Secretary posted a targeted remark on ACT-2025-004: AMRUT 2.0 water pipeline. Response required within 5 working days.", timestamp: "2025-03-10 16:45", acknowledged: false },
  { id: "A-007", level: "info", title: "Issue marked complete", message: "Health Dept. marked ACT-2025-006 (PHC upgrade Trimbakeshwar) as completed. Awaiting GS verification.", timestamp: "2025-03-10 11:00", acknowledged: true },
  { id: "A-008", level: "warning", title: "No update in 14 days", message: "PWD Secretary has not provided updates on 3 actionables for over 14 days.", timestamp: "2025-03-09 09:00", acknowledged: false },
  { id: "A-009", level: "emergency", title: "Critical issue — overdue 15+ days", message: "ACT-2025-007: Nagpur-Mumbai Expressway ROB construction overdue by 71 days. Escalated to CMO.", timestamp: "2025-03-11 08:00", acknowledged: false },
];

const LEVEL_CONFIG = {
  info: { icon: Info, bg: "bg-gov-info-light", border: "border-l-gov-info", text: "text-gov-info" },
  warning: { icon: AlertTriangle, bg: "bg-gov-warning-light", border: "border-l-gov-warning", text: "text-gov-warning" },
  high: { icon: Shield, bg: "bg-orange-50", border: "border-l-gov-orange", text: "text-gov-orange" },
  critical: { icon: AlertTriangle, bg: "bg-gov-danger-light", border: "border-l-gov-danger", text: "text-gov-danger" },
  emergency: { icon: Shield, bg: "bg-red-100", border: "border-l-red-800", text: "text-red-800" },
};

export default function AlertsPage() {
  const unacknowledged = MOCK_ALERTS.filter(a => !a.acknowledged).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Alerts & Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unacknowledged} unacknowledged alert{unacknowledged !== 1 ? "s" : ""} requiring attention
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-muted-foreground">
          <CheckCircle className="h-4 w-4 mr-1" /> Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_ALERTS.map((alert, i) => {
          const cfg = LEVEL_CONFIG[alert.level];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`gov-card border-l-4 ${cfg.border} ${!alert.acknowledged ? cfg.bg : ""}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.text}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`gov-badge ${cfg.bg} ${cfg.text} text-[10px]`}>
                      {alert.level.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{alert.id}</span>
                    {!alert.acknowledged && (
                      <span className="w-2 h-2 rounded-full bg-gov-danger" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {alert.timestamp}
                    </span>
                    {!alert.acknowledged && (
                      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2">
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
