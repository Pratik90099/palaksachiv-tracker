import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "danger" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "border-border",
  danger: "border-l-4 border-l-gov-danger border-t-border border-r-border border-b-border",
  success: "border-l-4 border-l-gov-success border-t-border border-r-border border-b-border",
  warning: "border-l-4 border-l-gov-warning border-t-border border-r-border border-b-border",
  info: "border-l-4 border-l-gov-info border-t-border border-r-border border-b-border",
};

const iconVariantStyles = {
  default: "bg-secondary text-secondary-foreground",
  danger: "bg-gov-danger-light text-gov-danger",
  success: "bg-gov-success-light text-gov-success",
  warning: "bg-gov-warning-light text-gov-warning",
  info: "bg-gov-info-light text-gov-info",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className={`gov-stat-card ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground font-display">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium ${trend.positive ? "text-gov-success" : "text-gov-danger"}`}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs last quarter
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconVariantStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
