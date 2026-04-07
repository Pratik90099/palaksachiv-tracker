import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDistricts, useDepartments, useProjects, useCreateTask, useUpdateTask } from "@/hooks/use-data";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/mock-data";
import { toast } from "sonner";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTask?: any;
  defaultProjectId?: string;
}

export function TaskFormDialog({ open, onOpenChange, editTask, defaultProjectId }: TaskFormDialogProps) {
  const { data: districts } = useDistricts();
  const { data: departments } = useDepartments();
  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [form, setForm] = useState({
    project_id: defaultProjectId || "",
    title: "",
    description: "",
    priority: "medium",
    status: "not_started",
    responsible_officer: "",
    agency: "",
    target_date: "",
    is_goi_pending: false,
    is_critical: false,
    district_ids: [] as string[],
    department_ids: [] as string[],
  });

  useEffect(() => {
    if (editTask) {
      setForm({
        project_id: editTask.project_id || "",
        title: editTask.title || "",
        description: editTask.description || "",
        priority: editTask.priority || "medium",
        status: editTask.status || "not_started",
        responsible_officer: editTask.responsible_officer || "",
        agency: editTask.agency || "",
        target_date: editTask.target_date || "",
        is_goi_pending: editTask.is_goi_pending || false,
        is_critical: editTask.is_critical || false,
        district_ids: editTask.task_districts?.map((td: any) => td.district_id) || [],
        department_ids: editTask.task_departments?.map((td: any) => td.department_id) || [],
      });
    } else {
      setForm({
        project_id: defaultProjectId || "", title: "", description: "",
        priority: "medium", status: "not_started", responsible_officer: "",
        agency: "", target_date: "", is_goi_pending: false, is_critical: false,
        district_ids: [], department_ids: [],
      });
    }
  }, [editTask, open, defaultProjectId]);

  const toggleId = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (form.title.length > 255) { toast.error("Title must be under 255 characters"); return; }
    if (form.description.length > 5000) { toast.error("Description must be under 5000 characters"); return; }
    if (form.district_ids.length === 0) { toast.error("Select at least one district"); return; }
    if (form.department_ids.length === 0) { toast.error("Select at least one department"); return; }

    try {
      const payload = {
        ...form,
        project_id: form.project_id || undefined,
      };
      if (editTask) {
        await updateTask.mutateAsync({ id: editTask.id, ...payload });
        toast.success("Task updated");
      } else {
        await createTask.mutateAsync(payload);
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{editTask ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Parent Project</label>
            <Select value={form.project_id || "none"} onValueChange={(v) => setForm({ ...form, project_id: v === "none" ? "" : v })}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project (standalone task)</SelectItem>
                {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" maxLength={255} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-input text-sm min-h-[60px] bg-card text-foreground"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target Date</label>
              <Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Responsible Officer</label>
              <Input value={form.responsible_officer} onChange={(e) => setForm({ ...form, responsible_officer: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Agency</label>
              <Input value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.is_goi_pending} onCheckedChange={(v) => setForm({ ...form, is_goi_pending: !!v })} />
              GOI Pending
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.is_critical} onCheckedChange={(v) => setForm({ ...form, is_critical: !!v })} />
              Critical
            </label>
          </div>

          {/* Districts */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Districts * (task-level assignment)</label>
            <div className="max-h-36 overflow-y-auto border border-input rounded-md p-2 grid grid-cols-2 md:grid-cols-3 gap-1">
              {districts?.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-xs p-1 rounded hover:bg-secondary/50 cursor-pointer">
                  <Checkbox
                    checked={form.district_ids.includes(d.id)}
                    onCheckedChange={() => setForm({ ...form, district_ids: toggleId(form.district_ids, d.id) })}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </div>

          {/* Departments */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Departments * (task-level assignment)</label>
            <div className="max-h-36 overflow-y-auto border border-input rounded-md p-2 grid grid-cols-2 gap-1">
              {departments?.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-xs p-1 rounded hover:bg-secondary/50 cursor-pointer">
                  <Checkbox
                    checked={form.department_ids.includes(d.id)}
                    onCheckedChange={() => setForm({ ...form, department_ids: toggleId(form.department_ids, d.id) })}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={createTask.isPending || updateTask.isPending} className="bg-primary text-primary-foreground">
              {editTask ? "Update Task" : "Create Task"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
