import { useMemo } from "react";
import { useProjects, useTasks, useVisits, useDistricts } from "@/hooks/use-data";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DistrictScore {
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

  const scores: DistrictScore[] = useMemo(() => {
    if (!districts) return [];

    return districts.map((district) => {
      // Project Health: % of district projects on track or completed
      const distProjects = (projects || []).filter((p: any) =>
        p.project_districts?.some((pd: any) => pd.districts?.id === district.id)
      );
      const healthyProjects = distProjects.filter((p: any) =>
        ["on_track", "in_progress", "closed", "completed_pending_closure"].includes(p.status)
      );
      const projectHealth = distProjects.length > 0 ? Math.round((healthyProjects.length / distProjects.length) * 100) : 50;

      // Visit Compliance: % of completed visits
      const distVisits = (visits || []).filter((v: any) => v.district_id === district.id);
      const completedVisits = distVisits.filter((v: any) => v.status === "completed");
      const visitCompliance = distVisits.length > 0 ? Math.round((completedVisits.length / distVisits.length) * 100) : 50;

      // Actionable Resolution: % of district tasks completed
      const distTasks = (tasks || []).filter((t: any) =>
        t.task_districts?.some((td: any) => td.districts?.id === district.id)
      );
      const resolvedTasks = distTasks.filter((t: any) =>
        ["closed", "completed_pending_closure"].includes(t.status)
      );
      const actionableResolution = distTasks.length > 0 ? Math.round((resolvedTasks.length / distTasks.length) * 100) : 50;

      // Scheme Pendency (inverse — lower pendency = higher score)
      const pendingTasks = distTasks.filter((t: any) => t.is_goi_pending);
      const schemePendency = distTasks.length > 0 ? Math.round(100 - (pendingTasks.length / distTasks.length) * 100) : 70;

      // Composite: weighted average
      const composite = Math.round(
        projectHealth * 0.3 + visitCompliance * 0.25 + actionableResolution * 0.3 + schemePendency * 0.15
      );

      return {
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
          <p className="text-sm text-muted-foreground mt-1">Composite district ranking: projects, visits, actionables & scheme pendency</p>
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

      {/* District table */}
      <div className="space-y-2">
        {scores.map((district, i) => (
          <motion.div
            key={district.name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="gov-card-elevated p-3"
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
        ))}
      </div>
    </div>
  );
}
