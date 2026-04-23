import { Bell, AlertTriangle, Info, Shield, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";

type AlertLevel = "info" | "warning" | "high" | "critical" | "emergency";

const LEVEL_CONFIG: Record<AlertLevel, { icon: typeof Info; bg: string; border: string; text: string }> = {
  info: { icon: Info, bg: "bg-gov-info-light", border: "border-l-gov-info", text: "text-gov-info" },
  warning: { icon: AlertTriangle, bg: "bg-gov-warning-light", border: "border-l-gov-warning", text: "text-gov-warning" },
  high: { icon: Shield, bg: "bg-orange-50", border: "border-l-gov-orange", text: "text-gov-orange" },
  critical: { icon: AlertTriangle, bg: "bg-gov-danger-light", border: "border-l-gov-danger", text: "text-gov-danger" },
  emergency: { icon: Shield, bg: "bg-red-100", border: "border-l-red-800", text: "text-red-800" },
};

function mapLevel(type: string | null | undefined): AlertLevel {
  switch ((type || "").toLowerCase()) {
    case "error":
    case "critical":
      return "critical";
    case "emergency":
      return "emergency";
    case "high":
      return "high";
    case "warning":
    case "warn":
      return "warning";
    default:
      return "info";
  }
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AlertsPage() {
  const { data, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const notifications = data || [];

  const handleAcknowledge = async (id: string) => {
    try {
      await markAsRead(id);
      toast.success("Alert acknowledged");
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
      toast.success("All alerts marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Alerts & Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount} unacknowledged alert{unreadCount !== 1 ? "s" : ""} requiring attention
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
        >
          <CheckCircle className="h-4 w-4 mr-1" /> Mark All Read
        </Button>
      </div>

      {isLoading && (
        <div className="gov-card text-center py-12 text-sm text-muted-foreground">
          Loading alerts…
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="gov-card text-center py-12">
          <Bell className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No alerts at this time</p>
          <p className="text-xs text-muted-foreground mt-1">
            New escalations and system notifications will appear here in real time.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((n, i) => {
          const level = mapLevel(n.type);
          const cfg = LEVEL_CONFIG[level];
          const Icon = cfg.icon;
          const acknowledged = n.is_read;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className={`gov-card border-l-4 ${cfg.border} ${!acknowledged ? cfg.bg : ""}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.text}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`gov-badge ${cfg.bg} ${cfg.text} text-[10px]`}>
                      {level.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {n.id.slice(0, 8)}
                    </span>
                    {!acknowledged && (
                      <span className="w-2 h-2 rounded-full bg-gov-danger" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTimestamp(n.created_at)}
                    </span>
                    {!acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-6 px-2"
                        onClick={() => handleAcknowledge(n.id)}
                      >
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
