import { useState } from "react";
import { Settings, Bell, Shield, Globe, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [escalationAlerts, setEscalationAlerts] = useState(true);

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground font-display">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">System configuration and preferences</p>
      </motion.div>

      {/* Notification Settings */}
      <div className="gov-card-elevated space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
        </div>

        {[
          { label: "Email Notifications", desc: "Receive alerts via email for overdue items and escalations", value: emailNotif, setter: setEmailNotif },
          { label: "SMS Alerts", desc: "Get SMS notifications for critical and emergency issues", value: smsNotif, setter: setSmsNotif },
          { label: "Escalation Alerts", desc: "Auto-notify when items breach escalation thresholds", value: escalationAlerts, setter: setEscalationAlerts },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            <button
              onClick={() => item.setter(!item.value)}
              className={`w-10 h-6 rounded-full transition-colors ${item.value ? "bg-primary" : "bg-muted"} relative`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-card transition-transform ${item.value ? "left-5" : "left-1"}`} />
            </button>
          </div>
        ))}
      </div>

      {/* System Info */}
      <div className="gov-card-elevated space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">System Information</h3>
        </div>

        <div className="space-y-2">
          {[
            { label: "Portal Version", value: "GS Portal v2.1.0" },
            { label: "Environment", value: "Production (Demo Mode)" },
            { label: "Authentication", value: "Parichay SSO (Mock)" },
            { label: "Data Refresh", value: "Real-time via Cloud" },
            { label: "Last Login", value: new Date().toLocaleString("en-IN") },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="gov-card-elevated border-gov-danger/20">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-gov-danger" />
          <h3 className="text-sm font-semibold text-gov-danger">Administration</h3>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full text-sm border-gov-danger/30 text-gov-danger hover:bg-gov-danger-light">
            Clear All Demo Data
          </Button>
          <Button variant="outline" className="w-full text-sm border-gov-danger/30 text-gov-danger hover:bg-gov-danger-light">
            Reset System to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
