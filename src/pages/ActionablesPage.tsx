import { useState } from "react";
import { useTasks, useDeleteTask } from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { ISSUE_CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/mock-data";
import { Search, Plus, Download, Shield, Globe, Edit2, Trash2, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { ActionableStatus, Priority } from "@/lib/mock-data";

export default function ActionablesPage() {
  const { data: tasks, isLoading } = useTasks();
  const { filterTasks } = useRoleFilter();
  const deleteTask = useDeleteTask();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);

  const roleFiltered = filterTasks(tasks || []);

  const filtered = roleFiltered.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !(item.title?.toLowerCase().includes(q)) &&
        !(item.description?.toLowerCase().includes(q)) &&
        !(item.display_id?.toLowerCase().includes(q))
      ) return false;
    }
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && item.projects?.category !== categoryFilter) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Delete this task?")) {
      try {
        await deleteTask.mutateAsync(id);
        toast.success("Task deleted");
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Actionables</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage all actionable items across districts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => { setEditTask(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New Actionable
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="gov-card flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px] text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {ISSUE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} actionable{filtered.length !== 1 ? "s" : ""} found</p>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : (
        <div className="gov-card-elevated overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="gov-table-header">
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Districts</th>
                  <th className="text-left px-4 py-3">Departments</th>
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Target Date</th>
                  <th className="text-left px-4 py-3">Flags</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item, i) => {
                  const districtNames = item.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
                  const deptNames = item.task_departments?.map((td: any) => td.departments?.short_name || td.departments?.name).filter(Boolean) || [];
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{item.display_id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground line-clamp-1 max-w-xs">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.agency}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-foreground">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="line-clamp-1">{districtNames.join(", ") || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{deptNames.join(", ") || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={item.priority as Priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={item.status as ActionableStatus} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.target_date || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {item.is_critical && (
                            <span className="gov-badge bg-gov-danger-light text-gov-danger text-[10px]">
                              <Shield className="h-2.5 w-2.5" /> Critical
                            </span>
                          )}
                          {item.is_goi_pending && (
                            <span className="gov-badge bg-gov-warning-light text-gov-warning text-[10px]">
                              <Globe className="h-2.5 w-2.5" /> GOI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditTask(item); setShowForm(true); }}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TaskFormDialog open={showForm} onOpenChange={setShowForm} editTask={editTask} />
    </div>
  );
}
