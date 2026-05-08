import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { UserRole } from "@/lib/mock-data";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ActionablesPage from "./pages/ActionablesPage";
import ProjectsPage from "./pages/ProjectsPage";
import HeatMapPage from "./pages/HeatMapPage";
import VisitsPage from "./pages/VisitsPage";
import CompliancePage from "./pages/CompliancePage";
import CriticalIssuesPage from "./pages/CriticalIssuesPage";
import GOIPendingPage from "./pages/GOIPendingPage";
import AlertsPage from "./pages/AlertsPage";
import ReportsPage from "./pages/ReportsPage";
import EscalationsPage from "./pages/EscalationsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import HelpPage from "./pages/HelpPage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import CategoryTagDashboard from "./pages/CategoryTagDashboard";
import IntegrationHealthPage from "./pages/IntegrationHealthPage";
import GovernanceScorecardPage from "./pages/GovernanceScorecardPage";
import RecordMinutesPage from "./pages/RecordMinutesPage";
import DocumentAIPage from "./pages/DocumentAIPage";
import InsightsPage from "./pages/InsightsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function RoleProtectedRoute({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route path="/actionables" element={<ProtectedRoute><ActionablesPage /></ProtectedRoute>} />
      <Route path="/heat-map" element={<ProtectedRoute><HeatMapPage /></ProtectedRoute>} />
      <Route path="/visits" element={<ProtectedRoute><VisitsPage /></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
      <Route path="/critical-issues" element={<ProtectedRoute><CriticalIssuesPage /></ProtectedRoute>} />
      <Route path="/goi-pending" element={<ProtectedRoute><GOIPendingPage /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/escalations" element={<ProtectedRoute><EscalationsPage /></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
      <Route path="/category-dashboard" element={<ProtectedRoute><CategoryTagDashboard /></ProtectedRoute>} />
      <Route path="/integration-health" element={<ProtectedRoute><IntegrationHealthPage /></ProtectedRoute>} />
      <Route path="/governance-scorecard" element={<ProtectedRoute><GovernanceScorecardPage /></ProtectedRoute>} />

      {/* Role-restricted routes */}
      <Route
        path="/document-ai"
        element={<RoleProtectedRoute roles={["system_admin"]}><DocumentAIPage /></RoleProtectedRoute>}
      />
      <Route
        path="/meeting-minutes"
        element={
          <RoleProtectedRoute roles={["system_admin", "chief_secretary"]}>
            <RecordMinutesPage />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <RoleProtectedRoute roles={["system_admin", "chief_secretary"]}>
            <UserManagementPage />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={<RoleProtectedRoute roles={["system_admin"]}><SettingsPage /></RoleProtectedRoute>}
      />
      <Route
        path="/insights"
        element={
          <RoleProtectedRoute roles={["chief_secretary", "cmo", "system_admin", "divisional_commissioner"]}>
            <InsightsPage />
          </RoleProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
