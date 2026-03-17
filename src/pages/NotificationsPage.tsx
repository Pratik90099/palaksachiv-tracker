import { Bell, CheckCircle, AlertTriangle, Clock, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useTasks } from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";

const iconMap: Record<string, typeof AlertTriangle> = {
  warning: AlertTriangle,
  info: Clock,
  success: CheckCircle,
  error: AlertTriangle,
};

const colorMap: Record<string, string> = {
  warning: "text-gov-warning",
  info: "text-gov-info",
  success: "text-gov-success",
  error: "text-gov-danger",
};

export default function NotificationsPage() {
  const { data: notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { data: tasks } = useTasks();
  const { filterTasks } = useRoleFilter();

  const filteredTasks = filterTasks(tasks || []);

  // Generate dynamic alerts from live data
  const overdueCount = filteredTasks.filter(t => t.status === "overdue").length;
  const escalatedCount = filteredTasks.filter(t => t.status === "escalated").length;
  const criticalCount = filteredTasks.filter(t => t.is_critical).length;

  const liveAlerts = [
    ...(overdueCount > 0 ? [{ type: "warning", title: `${overdueCount} actionable${overdueCount > 1 ? "s are" : " is"} overdue`, time: "Live" }] : []),
    ...(escalatedCount > 0 ? [{ type: "error", title: `${escalatedCount} item${escalatedCount > 1 ? "s" : ""} escalated — requires CS attention`, time: "Live" }] : []),
    ...(criticalCount > 0 ? [{ type: "warning", title: `${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} flagged across districts`, time: "Live" }] : []),
  ];

  const dbNotifications = notifications || [];

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} • Stay updated on recent activities
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs">
            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
          </Button>
        )}
      </motion.div>

      {/* Live alerts from data */}
      {liveAlerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Alerts</p>
          {liveAlerts.map((alert, i) => {
            const Icon = iconMap[alert.type] || Clock;
            const color = colorMap[alert.type] || "text-muted-foreground";
            return (
              <div key={i} className="gov-card-elevated flex items-start gap-3 border-l-2 border-l-gov-warning">
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-gov-warning mt-2 shrink-0 animate-pulse" />
              </div>
            );
          })}
        </div>
      )}

      {/* DB notifications */}
      <div className="space-y-2">
        {dbNotifications.length > 0 && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</p>
        )}
        {dbNotifications.map((notif) => {
          const Icon = iconMap[notif.type] || Clock;
          const color = colorMap[notif.type] || "text-muted-foreground";
          return (
            <button
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              className={`w-full text-left gov-card-elevated flex items-start gap-3 transition-colors hover:bg-secondary/30 ${!notif.is_read ? "border-l-2 border-l-primary" : ""}`}
            >
              <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.is_read ? "font-semibold" : "font-medium"} text-foreground`}>{notif.title}</p>
                {notif.message && <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
            </button>
          );
        })}
        {dbNotifications.length === 0 && liveAlerts.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
