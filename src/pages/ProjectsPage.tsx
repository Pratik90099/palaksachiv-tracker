import { useState } from "react";
import { useProjects, useDeleteProject } from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { ProjectFormDialog } from "@/components/ProjectFormDialog";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Plus, Download, Search, Edit2, Trash2, ClipboardPlus, MapPin, Building2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { ActionableStatus, Priority } from "@/lib/mock-data";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { filterProjects } = useRoleFilter();
  const deleteProject = useDeleteProject();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [taskProjectId, setTaskProjectId] = useState<string>("");

  const filtered = filterProjects(projects || []).filter((p: any) => {
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project and all its tasks?")) {
      try {
        await deleteProject.mutateAsync(id);
        toast.success("Project deleted");
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage projects across districts and departments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => { setEditProject(null); setShowProjectForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New Project
          </Button>
        </div>
      </div>

      <div className="gov-card flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading projects...</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((project, i) => {
            const districtNames = project.project_districts?.map((pd: any) => pd.districts?.name).filter(Boolean) || [];
            const deptNames = project.project_departments?.map((pd: any) => pd.departments?.short_name || pd.departments?.name).filter(Boolean) || [];
            const tagNames = (project as any).project_tag_assignments?.map((pt: any) => pt.project_tags?.name).filter(Boolean) || [];

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="gov-card-elevated"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <PriorityBadge priority={project.priority as Priority} />
                      <StatusBadge status={project.status as ActionableStatus} />
                      {project.is_critical && <span className="gov-badge bg-gov-danger-light text-gov-danger text-[10px]">Critical</span>}
                      {project.is_goi_pending && <span className="gov-badge bg-gov-warning-light text-gov-warning text-[10px]">GOI</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{project.title}</h3>
                    {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {tagNames.length > 0 && tagNames.map((t: string) => (
                        <span key={t} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          <Tag className="h-2.5 w-2.5" /> {t}
                        </span>
                      ))}
                      {districtNames.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {districtNames.join(", ")}
                        </span>
                      )}
                      {deptNames.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Building2 className="h-3 w-3" /> {deptNames.join(", ")}
                        </span>
                      )}
                      {project.target_date && (
                        <span className="text-[10px] text-muted-foreground">🎯 {project.target_date}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">📂 {project.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-4">
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { setTaskProjectId(project.id); setShowTaskForm(true); }}>
                      <ClipboardPlus className="h-3 w-3 mr-1" /> Add Task
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditProject(project); setShowProjectForm(true); }}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">No projects found</div>
          )}
        </div>
      )}

      <ProjectFormDialog open={showProjectForm} onOpenChange={setShowProjectForm} editProject={editProject} />
      <TaskFormDialog open={showTaskForm} onOpenChange={setShowTaskForm} defaultProjectId={taskProjectId} />
    </div>
  );
}
