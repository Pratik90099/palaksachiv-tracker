import {
  Home, MapPin, ClipboardList, AlertTriangle, Users, FileText,
  Settings, LogOut, Shield, Bell, BarChart3, Globe, Calendar, Building2,
  FolderKanban, User, HelpCircle, Tag, Trophy, BookOpen, FileUp, Sparkles, LineChart
} from "lucide-react";
import emblem from "@/assets/maharashtra-emblem.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/mock-data";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
  roles: UserRole[];
  csoOnly?: boolean;
}


const NAV_ITEMS: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: Home, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo", "system_admin"] },
  { title: "Projects", url: "/projects", icon: FolderKanban, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo", "system_admin"] },
  { title: "Category Dashboard", url: "/category-dashboard", icon: Tag, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo", "system_admin"] },
  { title: "District Heat Map", url: "/heat-map", icon: MapPin, roles: ["chief_secretary", "cmo", "divisional_commissioner", "guardian_secretary"] },
  { title: "Task Management", url: "/actionables", icon: ClipboardList, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo", "system_admin"] },
  { title: "Visit Management", url: "/visits", icon: Calendar, roles: ["guardian_secretary", "district_collector", "chief_secretary", "cmo", "system_admin"] },
  { title: "Visit Compliance", url: "/compliance", icon: BarChart3, roles: ["chief_secretary", "cmo", "divisional_commissioner"] },
  { title: "Critical Issues", url: "/critical-issues", icon: AlertTriangle, roles: ["chief_secretary", "cmo", "guardian_secretary"] },
  { title: "GOI Pending", url: "/goi-pending", icon: Globe, roles: ["chief_secretary", "cmo", "guardian_secretary", "department_secretary"] },
  { title: "Escalations", url: "/escalations", icon: Shield, roles: ["chief_secretary", "cmo", "divisional_commissioner"] },
  { title: "Alerts", url: "/alerts", icon: Bell, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo"] },
  { title: "MIS Reports", url: "/reports", icon: FileText, roles: ["chief_secretary", "cmo", "divisional_commissioner", "guardian_secretary"] },
  { title: "Departments", url: "/departments", icon: Building2, roles: ["chief_secretary", "cmo", "department_secretary"] },
  { title: "Governance Scorecard", url: "/governance-scorecard", icon: Trophy, roles: ["chief_secretary", "cmo", "divisional_commissioner", "guardian_secretary", "system_admin"] },
  
  { title: "AI Insights", url: "/insights", icon: Sparkles, roles: ["chief_secretary", "cmo", "system_admin", "divisional_commissioner"] },
  { title: "AI Telemetry", url: "/admin/ai-telemetry", icon: LineChart, roles: ["system_admin"] },
  { title: "Audit Trail", url: "/admin/audit-trail", icon: Shield, roles: ["system_admin", "chief_secretary"] },
  { title: "Meeting Minutes", url: "/meeting-minutes", icon: BookOpen, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo", "system_admin"] },
  { title: "Document AI", url: "/document-ai", icon: FileUp, roles: ["system_admin"] },
  { title: "User Management", url: "/users", icon: Users, roles: ["system_admin", "chief_secretary", "department_secretary", "district_collector", "divisional_commissioner", "guardian_secretary", "cmo"], csoOnly: true },
  { title: "My Profile", url: "/profile", icon: User, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo", "system_admin"] },
  { title: "Notifications", url: "/notifications", icon: Bell, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo", "system_admin"] },
  { title: "Help & Support", url: "/help", icon: HelpCircle, roles: ["guardian_secretary", "department_secretary", "district_collector", "divisional_commissioner", "chief_secretary", "cmo", "system_admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["system_admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();

  const isCsoStaff = !!user && (user.is_cso_admin || user.role === "system_admin" || user.role === "chief_secretary");
  const filteredItems = NAV_ITEMS.filter(item => {
    if (!user) return true;
    if (item.csoOnly && !isCsoStaff) return false;
    return item.roles.includes(user.role);
  });



  const roleLabel = user?.role === "guardian_secretary" ? "Guardian Secretary" :
    user?.role === "department_secretary" ? "Dept. Secretary" :
    user?.role === "district_collector" ? "District Collector" :
    user?.role === "divisional_commissioner" ? "Div. Commissioner" :
    user?.role === "chief_secretary" ? "Chief Secretary" :
    user?.role === "cmo" ? "CMO" : "CS Office";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={emblem} alt="Government of Maharashtra emblem" className="w-10 h-10 object-contain shrink-0" width={40} height={40} />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-sidebar-foreground font-display leading-tight">Guardian Secretary Portal</h2>
              <p className="text-[10px] text-sidebar-foreground/60">Government of Maharashtra</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <img src={emblem} alt="Government of Maharashtra emblem" className="w-8 h-8 object-contain" width={32} height={32} />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && user && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-sidebar-foreground/60 mt-0.5">{roleLabel}</p>
            {user.district && <p className="text-[10px] text-sidebar-primary mt-0.5">{user.district} District</p>}
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="gov-nav-item text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="gov-nav-item text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
