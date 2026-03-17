import { ReactNode, useState, useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/lib/auth-context";
import { Bell, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useTasks, useProjects } from "@/hooks/use-data";
import { useNotifications } from "@/hooks/use-notifications";

interface SearchResult {
  type: "task" | "project";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results: SearchResult[] = [];
  if (query.length >= 2) {
    const q = query.toLowerCase();
    (tasks || []).forEach((t) => {
      if (t.title?.toLowerCase().includes(q) || t.display_id?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        const districtNames = (t as any).task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
        results.push({
          type: "task",
          id: t.id,
          title: `${t.display_id || "Task"}: ${t.title}`,
          subtitle: districtNames.join(", ") || t.status,
          url: "/actionables",
        });
      }
    });
    (projects || []).forEach((p) => {
      if (p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
        results.push({
          type: "project",
          id: p.id,
          title: p.title,
          subtitle: p.category || p.status,
          url: "/projects",
        });
      }
    });
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search actionables, projects..."
          className="border-0 bg-transparent h-7 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 w-64"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
          <div className="p-2 text-[10px] text-muted-foreground uppercase tracking-wider px-3">
            {results.length} result{results.length > 1 ? "s" : ""}
          </div>
          {results.slice(0, 10).map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              className="w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors flex items-start gap-3 border-t border-border/50"
              onClick={() => { navigate(r.url); setOpen(false); setQuery(""); }}
            >
              <span className={`mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                r.type === "task" ? "bg-gov-info-light text-gov-info" : "bg-primary/10 text-primary"
              }`}>
                {r.type === "task" ? "Task" : "Project"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground line-clamp-1">{r.title}</p>
                <p className="text-[10px] text-muted-foreground">{r.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-card border border-border rounded-lg shadow-lg z-50 p-6 text-center">
          <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { data: tasks } = useTasks();

  // Count "urgent" items for notification badge (unread notifications + overdue/escalated tasks)
  const taskUrgent = (tasks || []).filter(
    (t) => t.status === "overdue" || t.status === "escalated"
  ).length;
  const urgentCount = unreadCount + taskUrgent;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4" style={{ boxShadow: "var(--shadow-nav)" }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/notifications")}
              >
                <Bell className="h-4 w-4" />
                {urgentCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gov-danger text-[10px] font-bold rounded-full flex items-center justify-center text-card">
                    {urgentCount > 9 ? "9+" : urgentCount}
                  </span>
                )}
              </Button>
              {user && (
                <button
                  onClick={() => navigate("/profile")}
                  className="hidden sm:flex items-center gap-2 text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                </button>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
