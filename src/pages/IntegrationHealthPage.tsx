import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface IntegrationStatus {
  name: string;
  platform: string;
  lastSync: string;
  recordsSynced: number;
  errors: number;
  status: "healthy" | "warning" | "error" | "stale";
  uptime: number;
}

const INTEGRATIONS: IntegrationStatus[] = [
  { name: "PRAGATI", platform: "PMO Portal", lastSync: "2026-03-18T09:15:00", recordsSynced: 342, errors: 0, status: "healthy", uptime: 99.9 },
  { name: "CM War Room", platform: "State Dashboard", lastSync: "2026-03-18T09:10:00", recordsSynced: 1284, errors: 2, status: "warning", uptime: 98.5 },
  { name: "PFMS", platform: "Finance Ministry", lastSync: "2026-03-18T08:45:00", recordsSynced: 5620, errors: 0, status: "healthy", uptime: 99.7 },
  { name: "GEM Portal", platform: "Procurement", lastSync: "2026-03-18T07:30:00", recordsSynced: 891, errors: 0, status: "healthy", uptime: 99.2 },
  { name: "e-Taal", platform: "Service Delivery", lastSync: "2026-03-17T22:00:00", recordsSynced: 2340, errors: 5, status: "stale", uptime: 94.1 },
  { name: "NIC NICNET", platform: "Network Infra", lastSync: "2026-03-18T09:00:00", recordsSynced: 156, errors: 0, status: "healthy", uptime: 99.8 },
  { name: "PM-KISAN", platform: "Agriculture", lastSync: "2026-03-18T06:00:00", recordsSynced: 12450, errors: 1, status: "warning", uptime: 97.3 },
  { name: "Jal Jeevan Mission", platform: "Water Supply", lastSync: "2026-03-18T08:00:00", recordsSynced: 3210, errors: 0, status: "healthy", uptime: 99.4 },
  { name: "PM Awas Yojana", platform: "Housing", lastSync: "2026-03-17T18:00:00", recordsSynced: 4500, errors: 12, status: "error", uptime: 89.6 },
  { name: "Swachh Bharat", platform: "Sanitation", lastSync: "2026-03-18T09:05:00", recordsSynced: 1870, errors: 0, status: "healthy", uptime: 99.6 },
];

const statusConfig = {
  healthy: { icon: CheckCircle2, label: "Healthy", class: "text-gov-success bg-gov-success-light" },
  warning: { icon: AlertTriangle, label: "Warning", class: "text-gov-warning bg-gov-warning-light" },
  error: { icon: XCircle, label: "Error", class: "text-gov-danger bg-gov-danger-light" },
  stale: { icon: Clock, label: "Stale", class: "text-muted-foreground bg-muted" },
};

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function IntegrationHealthPage() {
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const healthy = INTEGRATIONS.filter(i => i.status === "healthy").length;
  const warnings = INTEGRATIONS.filter(i => i.status === "warning").length;
  const errors = INTEGRATIONS.filter(i => i.status === "error" || i.status === "stale").length;

  const handleRefresh = (name: string) => {
    setRefreshing(name);
    setTimeout(() => setRefreshing(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Integration Health Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time status of all external data feeds</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => INTEGRATIONS.forEach(i => handleRefresh(i.name))}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh All
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="gov-card-elevated p-4 border-l-4 border-l-gov-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-gov-success" />
            <div>
              <p className="text-2xl font-bold text-foreground">{healthy}</p>
              <p className="text-xs text-muted-foreground">Healthy</p>
            </div>
          </div>
        </div>
        <div className="gov-card-elevated p-4 border-l-4 border-l-gov-warning">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gov-warning" />
            <div>
              <p className="text-2xl font-bold text-foreground">{warnings}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </div>
        </div>
        <div className="gov-card-elevated p-4 border-l-4 border-l-gov-danger">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gov-danger" />
            <div>
              <p className="text-2xl font-bold text-foreground">{errors}</p>
              <p className="text-xs text-muted-foreground">Errors / Stale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration list */}
      <div className="space-y-3">
        {INTEGRATIONS.map((integration, i) => {
          const cfg = statusConfig[integration.status];
          const StatusIcon = cfg.icon;
          return (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="gov-card-elevated p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${cfg.class}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{integration.platform}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeSince(integration.lastSync)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {integration.recordsSynced.toLocaleString()} records
                      </span>
                      {integration.errors > 0 && (
                        <span className="text-[11px] text-gov-danger font-medium">
                          {integration.errors} error{integration.errors > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right w-20">
                    <p className="text-xs font-medium text-foreground">{integration.uptime}%</p>
                    <Progress value={integration.uptime} className="h-1.5 mt-1" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleRefresh(integration.name)}
                    disabled={refreshing === integration.name}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing === integration.name ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
