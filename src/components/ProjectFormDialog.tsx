import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDistricts, useDepartments, useCreateProject, useUpdateProject } from "@/hooks/use-data";
import { ISSUE_CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/mock-data";
import { toast } from "sonner";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProject?: any;
}

export function ProjectFormDialog({ open, onOpenChange, editProject }: ProjectFormDialogProps) {
  const { data: districts } = useDistricts();
  const { data: departments } = useDepartments();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Other",
    priority: "medium",
    status: "not_started",
    is_goi_pending: false,
    is_critical: false,
    target_date: "",
    district_ids: [] as string[],
    department_ids: [] as string[],
  });

  useEffect(() => {
    if (editProject) {
      setForm({
        title: editProject.title || "",
        description: editProject.description || "",
        category: editProject.category || "Other",
        priority: editProject.priority || "medium",
        status: editProject.status || "not_started",
        is_goi_pending: editProject.is_goi_pending || false,
        is_critical: editProject.is_critical || false,
        target_date: editProject.target_date || "",
        district_ids: editProject.project_districts?.map((pd: any) => pd.district_id) || [],
        department_ids: editProject.project_departments?.map((pd: any) => pd.department_id) || [],
      });
    } else {
      setForm({
        title: "", description: "", category: "Other", priority: "medium",
        status: "not_started", is_goi_pending: false, is_critical: false,
        target_date: "", district_ids: [], department_ids: [],
      });
    }
  }, [editProject, open]);

  const toggleId = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (form.district_ids.length === 0) {
      toast.error("Select at least one district");
      return;
    }

    try {
      if (editProject) {
        await updateProject.mutateAsync({ id: editProject.id, ...form });
        toast.success("Project updated");
      } else {
        await createProject.mutateAsync(form);
        toast.success("Project created");
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
          <DialogTitle className="font-display">{editProject ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project title" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-input text-sm min-h-[80px] bg-card text-foreground"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Project description..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISSUE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.is_goi_pending} onCheckedChange={(v) => setForm({ ...form, is_goi_pending: !!v })} />
              GOI Pending
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.is_critical} onCheckedChange={(v) => setForm({ ...form, is_critical: !!v })} />
              Critical Issue
            </label>
          </div>

          {/* Districts multi-select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Districts * (select multiple for multi-district projects)</label>
            <div className="max-h-40 overflow-y-auto border border-input rounded-md p-2 grid grid-cols-2 md:grid-cols-3 gap-1">
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
            {form.district_ids.length > 0 && (
              <p className="text-[10px] text-muted-foreground">{form.district_ids.length} district(s) selected</p>
            )}
          </div>

          {/* Departments multi-select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Departments (select multiple)</label>
            <div className="max-h-40 overflow-y-auto border border-input rounded-md p-2 grid grid-cols-2 gap-1">
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
            <Button onClick={handleSubmit} disabled={createProject.isPending || updateProject.isPending} className="bg-primary text-primary-foreground">
              {editProject ? "Update Project" : "Create Project"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
