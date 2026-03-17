import { Bell, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const SAMPLE_NOTIFICATIONS = [
  { id: 1, type: "warning", title: "3 actionables are overdue", time: "2 hours ago", read: false },
  { id: 2, type: "info", title: "Visit to Pune district scheduled for next week", time: "5 hours ago", read: false },
  { id: 3, type: "success", title: "Project 'NH-30 Bypass' status updated to On Track", time: "1 day ago", read: true },
  { id: 4, type: "warning", title: "GOI pending approval for Jal Jeevan Mission funds", time: "2 days ago", read: true },
  { id: 5, type: "info", title: "New task assigned: Metro Phase 2 land acquisition follow-up", time: "3 days ago", read: true },
];

const iconMap = {
  warning: AlertTriangle,
  info: Clock,
  success: CheckCircle,
};

const colorMap = {
  warning: "text-gov-warning",
  info: "text-gov-info",
  success: "text-gov-success",
};

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground font-display">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Stay updated on recent activities</p>
      </motion.div>

      <div className="space-y-3">
        {SAMPLE_NOTIFICATIONS.map((notif) => {
          const Icon = iconMap[notif.type as keyof typeof iconMap];
          const color = colorMap[notif.type as keyof typeof colorMap];
          return (
            <div
              key={notif.id}
              className={`gov-card-elevated flex items-start gap-3 ${!notif.read ? "border-l-2 border-l-primary" : ""}`}
            >
              <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.read ? "font-semibold" : "font-medium"} text-foreground`}>{notif.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
              </div>
              {!notif.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
