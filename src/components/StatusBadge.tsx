import { ActionableStatus, Priority, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/mock-data";

export function StatusBadge({ status }: { status: ActionableStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`gov-badge ${config.bgClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`gov-badge ${config.bgClass}`}>
      {config.label}
    </span>
  );
}
