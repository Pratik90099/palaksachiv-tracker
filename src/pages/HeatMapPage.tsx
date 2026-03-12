import { useState } from "react";
import { MOCK_HEAT_DATA, DistrictHeatData } from "@/lib/mock-data";
import { MapPin, Filter, Download, ChevronRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const LEVEL_CONFIG = {
  high_performing: { label: "High Performing", color: "bg-emerald-600", textColor: "text-emerald-600", lightBg: "bg-emerald-50" },
  performing: { label: "Performing", color: "bg-emerald-400", textColor: "text-emerald-500", lightBg: "bg-emerald-50" },
  moderate: { label: "Moderate", color: "bg-yellow-400", textColor: "text-yellow-600", lightBg: "bg-yellow-50" },
  needs_attention: { label: "Needs Attention", color: "bg-orange-500", textColor: "text-orange-600", lightBg: "bg-orange-50" },
  critical: { label: "Critical", color: "bg-red-500", textColor: "text-red-600", lightBg: "bg-red-50" },
  emergency: { label: "Emergency", color: "bg-red-800", textColor: "text-red-800", lightBg: "bg-red-100" },
};

export default function HeatMapPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictHeatData | null>(null);
  const [sortBy, setSortBy] = useState("score");

  const sorted = [...MOCK_HEAT_DATA].sort((a, b) => {
    if (sortBy === "score") return a.score - b.score;
    if (sortBy === "overdue") return b.overdueItems - a.overdueItems;
    return b.criticalIssues - a.criticalIssues;
  });

  const levelCounts = MOCK_HEAT_DATA.reduce((acc, d) => {
    acc[d.level] = (acc[d.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">District Heat Map</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance overview across all 36 districts of Maharashtra</p>
        </div>
        <Button variant="outline" size="sm" className="text-muted-foreground">
          <Download className="h-4 w-4 mr-1" /> Export PDF
        </Button>
      </div>

      {/* Legend */}
      <div className="gov-card flex flex-wrap items-center gap-4">
        {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${cfg.color}`} />
            <span className="text-xs text-muted-foreground">{cfg.label} ({levelCounts[key] || 0})</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Sort by Score (Low → High)</SelectItem>
            <SelectItem value="overdue">Sort by Overdue Items</SelectItem>
            <SelectItem value="critical">Sort by Critical Issues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sorted.map((district, i) => {
            const cfg = LEVEL_CONFIG[district.level];
            return (
              <motion.button
                key={district.district}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedDistrict(district)}
                className={`p-3 rounded-lg border border-border ${cfg.lightBg} hover:shadow-md transition-all text-left ${
                  selectedDistrict?.district === district.district ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
                  <span className={`text-lg font-bold ${cfg.textColor}`}>{district.score}</span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate">{district.district}</p>
                <div className="flex items-center gap-2 mt-1">
                  {district.overdueItems > 0 && (
                    <span className="text-[10px] text-gov-danger font-medium">{district.overdueItems} overdue</span>
                  )}
                  {!district.visitCompleted && (
                    <span className="text-[10px] text-gov-warning font-medium">No visit</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* District Detail Panel */}
        <div className="gov-card-elevated">
          {selectedDistrict ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${LEVEL_CONFIG[selectedDistrict.level].color} flex items-center justify-center`}>
                  <MapPin className="h-5 w-5 text-card" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground font-display">{selectedDistrict.district}</h3>
                  <p className={`text-xs font-semibold ${LEVEL_CONFIG[selectedDistrict.level].textColor}`}>
                    {LEVEL_CONFIG[selectedDistrict.level].label} — Score: {selectedDistrict.score}/100
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Open Actionables</p>
                  <p className="text-xl font-bold text-foreground">{selectedDistrict.openActionables}</p>
                </div>
                <div className="p-3 rounded-lg bg-gov-danger-light">
                  <p className="text-xs text-muted-foreground">Overdue Items</p>
                  <p className="text-xl font-bold text-gov-danger">{selectedDistrict.overdueItems}</p>
                </div>
                <div className="p-3 rounded-lg bg-gov-warning-light">
                  <p className="text-xs text-muted-foreground">Critical Issues</p>
                  <p className="text-xl font-bold text-gov-warning">{selectedDistrict.criticalIssues}</p>
                </div>
                <div className={`p-3 rounded-lg ${selectedDistrict.visitCompleted ? "bg-gov-success-light" : "bg-gov-danger-light"}`}>
                  <p className="text-xs text-muted-foreground">Visit Status</p>
                  <div className="flex items-center gap-1 mt-1">
                    {selectedDistrict.visitCompleted ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-gov-success" />
                        <span className="text-sm font-semibold text-gov-success">Completed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-gov-danger" />
                        <span className="text-sm font-semibold text-gov-danger">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full text-sm">
                View Full District Report <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <MapPin className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Select a district to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
