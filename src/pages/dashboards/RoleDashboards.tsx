import { useAuth } from "@/lib/auth-context";
import { useTasks, useVisits, useDepartments } from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { motion } from "framer-motion";
import { ClipboardList, AlertTriangle, Calendar, Clock, Globe, Users, MapPin, Shield, CheckCircle, BarChart3 } from "lucide-react";
import {
  DashboardHeader, KpiRow, QuarterlyTrends, StatusPie,
  RecentActionables, RecentVisits, DepartmentPerformance,
  GoiPendingPanel, CriticalIssuesPanel,
} from "@/components/dashboard/widgets";

function useScopedData() {
  const { data: tasks } = useTasks();
  const { data: visits } = useVisits();
  const { data: departments } = useDepartments();
  const { filterTasks, filterVisits } = useRoleFilter();
  return {
    tasks: filterTasks(tasks || []),
    visits: filterVisits(visits || []),
    departments: departments || [],
  };
}

function counts(tasks: any[], visits: any[]) {
  return {
    total: tasks.length,
    open: tasks.filter(t => !["closed", "completed_pending_closure"].includes(t.status)).length,
    overdue: tasks.filter(t => t.status === "overdue").length,
    critical: tasks.filter(t => t.is_critical || t.priority === "critical").length,
    escalated: tasks.filter(t => t.status === "escalated").length,
    goi: tasks.filter(t => t.is_goi_pending).length,
    pendingClosure: tasks.filter(t => t.status === "completed_pending_closure").length,
    visitsCompleted: visits.filter(v => v.status === "completed").length,
    visitsPending: visits.filter(v => v.status === "scheduled").length,
  };
}

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
    {children}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────
export function GuardianSecretaryDashboard() {
  const { user } = useAuth();
  const { tasks, visits } = useScopedData();
  const c = counts(tasks, visits);
  const nextVisit = visits.filter(v => v.status === "scheduled").sort((a: any, b: any) =>
    (a.visit_date || "").localeCompare(b.visit_date || ""))[0];
  return (
    <Wrap>
      <DashboardHeader
        title={`${user?.district || ""} District — Guardian Secretary`}
        subtitle={`Q4 2024-25 • ${user?.district || "District"}`}
      />
      <KpiRow items={[
        { title: "My Open Actionables", value: c.open, subtitle: `${c.total} total`, icon: ClipboardList },
        { title: "Overdue", value: c.overdue, subtitle: "Needs action", icon: Clock, variant: "danger" },
        { title: "Critical", value: c.critical, subtitle: `${c.escalated} escalated`, icon: AlertTriangle, variant: "warning" },
        { title: "Next Visit", value: nextVisit?.visit_date || "—", subtitle: nextVisit?.districts?.name || "Schedule one", icon: Calendar, variant: "info" },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActionables tasks={tasks} title="My District Actionables" limit={8} />
        <RecentVisits visits={visits} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalIssuesPanel tasks={tasks} />
        <GoiPendingPanel tasks={tasks} />
      </div>
    </Wrap>
  );
}

// ─────────────────────────────────────────────────────────────────
export function CollectorDashboard() {
  const { user } = useAuth();
  const { tasks, visits } = useScopedData();
  const c = counts(tasks, visits);
  const compliance = c.total === 0 ? 0 : Math.round(((c.total - c.overdue) / c.total) * 100);
  return (
    <Wrap>
      <DashboardHeader
        title={`${user?.district || ""} Collector Dashboard`}
        subtitle={`Q4 2024-25 • ${user?.district || "District"}`}
      />
      <KpiRow items={[
        { title: "Open Actionables", value: c.open, subtitle: `${c.total} total`, icon: ClipboardList },
        { title: "Overdue", value: c.overdue, subtitle: "Requires attention", icon: Clock, variant: "danger" },
        { title: "Awaiting Sign-off", value: c.pendingClosure, subtitle: "Two-stage closure", icon: CheckCircle, variant: "warning" },
        { title: "Compliance", value: `${compliance}%`, subtitle: `${c.visitsCompleted}/${visits.length || 0} visits`, icon: BarChart3, variant: "info" },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><RecentActionables tasks={tasks} title="District Actionables" limit={8} /></div>
        <StatusPie tasks={tasks} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalIssuesPanel tasks={tasks} />
        <RecentVisits visits={visits} />
      </div>
    </Wrap>
  );
}

// ─────────────────────────────────────────────────────────────────
export function DepartmentSecretaryDashboard() {
  const { user } = useAuth();
  const { tasks, departments } = useScopedData();
  const c = counts(tasks, []);
  return (
    <Wrap>
      <DashboardHeader
        title={`${user?.department || "Department"} Dashboard`}
        subtitle={`Q4 2024-25 • Department-wide`}
      />
      <KpiRow items={[
        { title: "Open", value: c.open, subtitle: `${c.total} total`, icon: ClipboardList },
        { title: "Overdue", value: c.overdue, subtitle: "Across districts", icon: Clock, variant: "danger" },
        { title: "Critical", value: c.critical, subtitle: `${c.escalated} escalated`, icon: AlertTriangle, variant: "warning" },
        { title: "GOI Pending", value: c.goi, subtitle: "Central approvals", icon: Globe, variant: "info" },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><QuarterlyTrends tasks={tasks} /></div>
        <StatusPie tasks={tasks} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActionables tasks={tasks} title="Department Actionables" limit={8} />
        <GoiPendingPanel tasks={tasks} />
      </div>
      <DepartmentPerformance tasks={tasks} departments={departments} />
    </Wrap>
  );
}

// ─────────────────────────────────────────────────────────────────
export function CommissionerDashboard() {
  const { user } = useAuth();
  const { tasks, visits, departments } = useScopedData();
  const { divisionDistricts } = useRoleFilter();
  const c = counts(tasks, visits);
  return (
    <Wrap>
      <DashboardHeader
        title={`${user?.division || ""} Division Overview`}
        subtitle={`Q4 2024-25 • ${divisionDistricts.length} districts`}
      />
      <KpiRow items={[
        { title: "Districts", value: divisionDistricts.length, subtitle: "In division", icon: MapPin },
        { title: "Open", value: c.open, subtitle: `${c.total} total`, icon: ClipboardList },
        { title: "Overdue", value: c.overdue, subtitle: "Across districts", icon: Clock, variant: "danger" },
        { title: "Visit Compliance", value: `${c.visitsCompleted}/${visits.length || 0}`, subtitle: `${c.visitsPending} pending`, icon: Calendar, variant: "info" },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><QuarterlyTrends tasks={tasks} /></div>
        <StatusPie tasks={tasks} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActionables tasks={tasks} title="Division Actionables" limit={8} />
        <RecentVisits visits={visits} />
      </div>
      <DepartmentPerformance tasks={tasks} departments={departments} />
    </Wrap>
  );
}

// ─────────────────────────────────────────────────────────────────
export function ChiefSecretaryDashboard() {
  const { tasks, visits, departments } = useScopedData();
  const c = counts(tasks, visits);
  return (
    <Wrap>
      <DashboardHeader title="State Overview" subtitle="Q4 2024-25 • All 36 Districts" />
      <KpiRow items={[
        { title: "Total Actionables", value: c.total, subtitle: `${c.open} open`, icon: ClipboardList },
        { title: "Overdue", value: c.overdue, subtitle: "Requires attention", icon: Clock, variant: "danger" },
        { title: "Critical Issues", value: c.critical, subtitle: `${c.escalated} escalated`, icon: AlertTriangle, variant: "warning" },
        { title: "Visit Compliance", value: `${c.visitsCompleted}/${visits.length || 36}`, subtitle: `${c.visitsPending} pending`, icon: Calendar, variant: "info" },
      ]} />
      <KpiRow items={[
        { title: "GOI Pending", value: c.goi, subtitle: "Central approvals", icon: Globe, variant: "warning" },
        { title: "Departments", value: departments.length || 16, subtitle: "Active tracking", icon: Users },
        { title: "Districts", value: 36, subtitle: "Maharashtra", icon: MapPin },
        { title: "Escalated", value: c.escalated, subtitle: "Needs CS attention", icon: Shield, variant: "danger" },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><QuarterlyTrends tasks={tasks} /></div>
        <StatusPie tasks={tasks} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActionables tasks={tasks} />
        <DepartmentPerformance tasks={tasks} departments={departments} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalIssuesPanel tasks={tasks} />
        <GoiPendingPanel tasks={tasks} />
      </div>
    </Wrap>
  );
}
