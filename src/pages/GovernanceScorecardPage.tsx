import { useMemo, useState } from "react";
import { useProjects, useTasks, useVisits, useDistricts } from "@/hooks/use-data";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, MapPin, X, FolderKanban, ClipboardList, Calendar, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

interface DistrictScore {
  districtId: string;
  name: string;
  projectHealth: number;
  visitCompliance: number;
  actionableResolution: number;
  schemePendency: number;
  composite: number;
}

export default function GovernanceScorecardPage() {
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const { data: visits } = useVisits();
  const { data: districts } = useDistricts();
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const scores: DistrictScore[] = useMemo(() => {
    if (!districts) return [];

    return districts.map((district) => {
      const distProjects = (projects || []).filter((p: any) =>
        p.project_districts?.some((pd: any) => pd.districts?.id === district.id)
      );
      const healthyProjects = distProjects.filter((p: any) =>
        ["on_track", "in_progress", "closed", "completed_pending_closure"].includes(p.status)
      );
      const projectHealth = distProjects.length > 0 ? Math.round((healthyProjects.length / distProjects.length) * 100) : 50;

      const distVisits = (visits || []).filter((v: any) => v.district_id === district.id);
      const completedVisits = distVisits.filter((v: any) => v.status === "completed");
      const visitCompliance = distVisits.length > 0 ? Math.round((completedVisits.length / distVisits.length) * 100) : 50;

      const distTasks = (tasks || []).filter((t: any) =>
        t.task_districts?.some((td: any) => td.districts?.id === district.id)
      );
      const resolvedTasks = distTasks.filter((t: any) =>
        ["closed", "completed_pending_closure"].includes(t.status)
      );
      const actionableResolution = distTasks.length > 0 ? Math.round((resolvedTasks.length / distTasks.length) * 100) : 50;

      const pendingTasks = distTasks.filter((t: any) => t.is_goi_pending);
      const schemePendency = distTasks.length > 0 ? Math.round(100 - (pendingTasks.length / distTasks.length) * 100) : 70;

      const composite = Math.round(
        projectHealth * 0.3 + visitCompliance * 0.25 + actionableResolution * 0.3 + schemePendency * 0.15
      );

      return {
        districtId: district.id,
        name: district.name,
        projectHealth,
        visitCompliance,
        actionableResolution,
        schemePendency,
        composite,
      };
    }).sort((a, b) => b.composite - a.composite);
  }, [districts, projects, tasks, visits]);

  const topChart = scores.slice(0, 15).map(s => ({
    name: s.name.length > 10 ? s.name.slice(0, 10) + "…" : s.name,
    Score: s.composite,
  }));

  // Drill-down data for selected district
  const drillDown = useMemo(() => {
    if (!selectedDistrict) return null;
    const district = districts?.find(d => d.id === selectedDistrict);
    if (!district) return null;

    const distProjects = (projects || []).filter((p: any) =>
      p.project_districts?.some((pd: any) => pd.districts?.id === district.id)
    );
    const distTasks = (tasks || []).filter((t: any) =>
      t.task_districts?.some((td: any) => td.districts?.id === district.id)
    );
    const distVisits = (visits || []).filter((v: any) => v.district_id === district.id);

    return { district, projects: distProjects, tasks: distTasks, visits: distVisits };
  }, [selectedDistrict, districts, projects, tasks, visits]);

  const getRankBadge = (rank: number) => {
    if (rank <= 3) return "bg-gov-gold/20 text-gov-gold border border-gov-gold/30";
    if (rank <= 10) return "bg-gov-success-light text-gov-success";
    if (rank >= scores.length - 4) return "bg-gov-danger-light text-gov-danger";
    return "bg-muted text-muted-foreground";
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-gov-success";
    if (score >= 50) return "text-gov-warning";
    return "text-gov-danger";
  };

  const getTrend = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-3 w-3 text-gov-success" />;
    if (score >= 45) return <Minus className="h-3 w-3 text-muted-foreground" />;
    return <TrendingDown className="h-3 w-3 text-gov-danger" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">State Governance Scorecard</h1>
          <p className="text-sm text-muted-foreground mt-1">Composite district ranking — click a district for detailed breakdown</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
          <Trophy className="h-3.5 w-3.5 text-gov-gold" />
          {scores.length} districts ranked
        </div>
      </div>

      {/* Top districts chart */}
      {topChart.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gov-card-elevated p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top 15 Districts by Composite Score</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topChart} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="Score" fill="hsl(220, 70%, 22%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Scoring legend */}
      <div className="gov-card p-3 flex flex-wrap gap-6 text-[11px] text-muted-foreground">
        <span><strong className="text-foreground">Weights:</strong></span>
        <span>🏗 Project Health <strong>30%</strong></span>
        <span>📋 Actionable Resolution <strong>30%</strong></span>
        <span>🗓 Visit Compliance <strong>25%</strong></span>
        <span>📌 Scheme Pendency <strong>15%</strong></span>
      </div>

      {/* Drill-down panel */}
      <AnimatePresence>
        {drillDown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="gov-card-elevated p-5 border-l-4 border-l-primary space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-bold text-foreground font-display">{drillDown.district.name} — Detailed Breakdown</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDistrict(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Projects */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FolderKanban className="h-4 w-4 text-primary" />
                    Projects ({drillDown.projects.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {drillDown.projects.length === 0 && <p className="text-xs text-muted-foreground">No projects tagged</p>}
                    {drillDown.projects.map((p: any) => (
                      <div key={p.id} className="p-2 rounded bg-muted/50 text-xs">
                        <p className="font-medium text-foreground truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={p.status} />
                          <span className="text-muted-foreground">{p.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ClipboardList className="h-4 w-4 text-gov-warning" />
                    Actionables ({drillDown.tasks.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {drillDown.tasks.length === 0 && <p className="text-xs text-muted-foreground">No actionables tagged</p>}
                    {drillDown.tasks.map((t: any) => (
                      <div key={t.id} className="p-2 rounded bg-muted/50 text-xs">
                        <p className="font-medium text-foreground truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={t.status} />
                          {t.is_goi_pending && <span className="text-gov-danger font-medium">GOI</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visits */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Calendar className="h-4 w-4 text-gov-success" />
                    Visits ({drillDown.visits.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {drillDown.visits.length === 0 && <p className="text-xs text-muted-foreground">No visits recorded</p>}
                    {drillDown.visits.map((v: any) => (
                      <div key={v.id} className="p-2 rounded bg-muted/50 text-xs">
                        <p className="font-medium text-foreground">{v.quarter} — {v.visit_date || "Date TBD"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            v.status === "completed" ? "bg-gov-success-light text-gov-success" :
                            v.status === "missed" ? "bg-gov-danger-light text-gov-danger" :
                            "bg-gov-info-light text-gov-info"
                          }`}>{v.status}</span>
                          {v.issues_logged > 0 && <span className="text-muted-foreground">{v.issues_logged} issues</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* District table */}
      <div className="space-y-2">
        {scores.map((district, i) => {
          const cfg = {
            healthy: "text-gov-success",
            warning: "text-gov-warning", 
            danger: "text-gov-danger",
          };
          return (
            <motion.div
              key={district.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`gov-card-elevated p-3 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all ${selectedDistrict === district.districtId ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedDistrict(district.districtId === selectedDistrict ? null : district.districtId)}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center ${getRankBadge(i + 1)}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{district.name}</span>
                    {getTrend(district.composite)}
                    <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${selectedDistrict === district.districtId ? "rotate-90" : ""}`} />
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Projects</p>
                      <p className={`text-xs font-bold ${getScoreColor(district.projectHealth)}`}>{district.projectHealth}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Visits</p>
                      <p className={`text-xs font-bold ${getScoreColor(district.visitCompliance)}`}>{district.visitCompliance}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Actionables</p>
                      <p className={`text-xs font-bold ${getScoreColor(district.actionableResolution)}`}>{district.actionableResolution}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Pendency</p>
                      <p className={`text-xs font-bold ${getScoreColor(district.schemePendency)}`}>{district.schemePendency}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 w-16">
                  <p className={`text-lg font-bold ${getScoreColor(district.composite)}`}>{district.composite}</p>
                  <Progress value={district.composite} className="h-1.5 mt-1" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
