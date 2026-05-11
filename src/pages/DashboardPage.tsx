import { useAuth } from "@/lib/auth-context";
import {
  GuardianSecretaryDashboard,
  CollectorDashboard,
  DepartmentSecretaryDashboard,
  CommissionerDashboard,
  ChiefSecretaryDashboard,
} from "./dashboards/RoleDashboards";

export default function DashboardPage() {
  const { user } = useAuth();
  switch (user?.role) {
    case "guardian_secretary":     return <GuardianSecretaryDashboard />;
    case "district_collector":     return <CollectorDashboard />;
    case "department_secretary":   return <DepartmentSecretaryDashboard />;
    case "divisional_commissioner": return <CommissionerDashboard />;
    case "chief_secretary":
    case "cmo":
    case "system_admin":
    default:
      return <ChiefSecretaryDashboard />;
  }
}
