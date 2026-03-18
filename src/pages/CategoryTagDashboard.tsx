import { useState } from "react";
import { useProjects, useProjectCategories, useProjectTags } from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, FolderKanban, BarChart3, MapPin, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ActionableStatus, Priority } from "@/lib/mock-data";

export default function CategoryTagDashboard() {
  const { data: projects, isLoading } = useProjects();
  const { data: categories } = useProjectCategories();
  const { data: tags } = useProjectTags();
  const { filterProjects } = useRoleFilter();
  const [viewMode, setViewMode] = useState<"category" | "tag">("category");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");

  const filtered = filterProjects(projects || []);

  // Group by category
  const byCategory: Record<string, any[]> = {};
  filtered.forEach((p: any) => {
    const cat = p.category || "Other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  });

  // Group by tag
  const byTag: Record<string, any[]> = {};
  filtered.forEach((p: any) => {
    const assignedTags = p.project_tag_assignments || [];
    if (assignedTags.length === 0) {
      if (!byTag["Untagged"]) byTag["Untagged"] = [];
      byTag["Untagged"].push(p);
    } else {
      assignedTags.forEach((ta: any) => {
        const tagName = ta.project_tags?.name || "Unknown";
        if (!byTag[tagName]) byTag[tagName] = [];
        byTag[tagName].push(p);
      });
    }
  });

  const getStatusCounts = (items: any[]) => {
    const counts = { completed: 0, in_progress: 0, overdue: 0, total: items.length };
    items.forEach((p: any) => {
      if (p.status === "closed" || p.status === "completed_pending_closure") counts.completed++;
      else if (p.status === "in_progress" || p.status === "on_track") counts.in_progress++;
      else if (p.status === "overdue" || p.status === "at_risk") counts.overdue++;
    });
    return counts;
  };

  const grouped = viewMode === "category" ? byCategory : byTag;
  const filterKey = viewMode === "category" ? selectedCategory : selectedTag;

  const displayGroups = filterKey === "all"
    ? Object.entries(grouped)
    : Object.entries(grouped).filter(([k]) => k === filterKey);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Category & Tag Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">View projects grouped by category or tag</p>
        </div>
      </div>

      {/* Controls */}
      <div className="gov-card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">View by:</label>
          <Select value={viewMode} onValueChange={(v) => { setViewMode(v as any); }}>
            <SelectTrigger className="w-[140px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category"><span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Category</span></SelectItem>
              <SelectItem value="tag"><span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Tag</span></SelectItem>
            </SelectContent>
          </Select>
        </div>

        {viewMode === "category" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Filter:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {viewMode === "tag" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Filter:</label>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-[160px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags?.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} total projects
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Object.entries(grouped).map(([name, items]) => {
          const counts = getStatusCounts(items);
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="gov-card-elevated p-3 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
              onClick={() => viewMode === "category" ? setSelectedCategory(name) : setSelectedTag(name)}
            >
              <div className="flex items-center gap-1.5 mb-2">
                {viewMode === "category" ? <FolderKanban className="h-3.5 w-3.5 text-primary" /> : <Tag className="h-3.5 w-3.5 text-primary" />}
                <span className="text-xs font-semibold text-foreground truncate">{name}</span>
              </div>
              <div className="text-xl font-bold text-foreground">{counts.total}</div>
              <div className="flex gap-2 mt-1">
                {counts.in_progress > 0 && <span className="text-[10px] text-blue-600">▶ {counts.in_progress}</span>}
                {counts.completed > 0 && <span className="text-[10px] text-green-600">✓ {counts.completed}</span>}
                {counts.overdue > 0 && <span className="text-[10px] text-red-600">! {counts.overdue}</span>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Project list */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          {displayGroups.map(([groupName, items]) => (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-3">
                {viewMode === "category" ? <FolderKanban className="h-4 w-4 text-primary" /> : <Tag className="h-4 w-4 text-primary" />}
                <h2 className="text-sm font-bold text-foreground">{groupName}</h2>
                <span className="text-xs text-muted-foreground">({items.length} projects)</span>
              </div>
              <div className="space-y-2">
                {items.map((project: any, i: number) => {
                  const districtNames = project.project_districts?.map((pd: any) => pd.districts?.name).filter(Boolean) || [];
                  const deptNames = project.project_departments?.map((pd: any) => pd.departments?.short_name || pd.departments?.name).filter(Boolean) || [];
                  const tagNames = project.project_tag_assignments?.map((pt: any) => pt.project_tags?.name).filter(Boolean) || [];

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="gov-card p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <PriorityBadge priority={project.priority as Priority} />
                            <StatusBadge status={project.status as ActionableStatus} />
                            {project.is_critical && <span className="gov-badge bg-destructive/10 text-destructive text-[10px]">Critical</span>}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">{project.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {tagNames.map((t: string) => (
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
                            <span className="text-[10px] text-muted-foreground">📂 {project.category}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          {displayGroups.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">No projects found</div>
          )}
        </div>
      )}
    </div>
  );
}
