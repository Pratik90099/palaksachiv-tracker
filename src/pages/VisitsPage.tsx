import { useState } from "react";
import { MOCK_VISITS } from "@/lib/mock-data";
import { Calendar, Plus, Download, MapPin, Users, FileText, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function VisitsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Visit Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Log and track quarterly district visits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" /> Log New Visit
          </Button>
        </div>
      </div>

      {/* Visit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="gov-card-elevated space-y-4"
        >
          <h3 className="gov-section-title">New Visit Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">District Name</label>
              <div className="px-3 py-2 rounded-md bg-secondary text-sm text-foreground">Pune (Auto-populated)</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date of Visit *</label>
              <input type="date" className="w-full px-3 py-2 rounded-md border border-input text-sm bg-card text-foreground" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quarter & FY</label>
              <div className="px-3 py-2 rounded-md bg-secondary text-sm text-foreground">Q4 2024-25 (Auto-calculated)</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Visit Observations * (min 100 characters)</label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-input text-sm min-h-[100px] bg-card text-foreground"
              placeholder="Enter detailed observations from the visit..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Overall Assessment Rating *</label>
            <select className="w-full px-3 py-2 rounded-md border border-input text-sm bg-card text-foreground">
              <option value="">Select rating...</option>
              <option value="satisfactory">Satisfactory</option>
              <option value="needs_improvement">Needs Improvement</option>
              <option value="critical_attention">Critical Attention</option>
            </select>
          </div>

          {/* Upload sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Visit Photographs *</p>
              <p className="text-[10px] text-muted-foreground">Min 2, Max 20 files • JPEG/PNG • 5 MB each</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs">Upload Photos</Button>
            </div>
            <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Supporting Documents</p>
              <p className="text-[10px] text-muted-foreground">PDF/DOCX/XLSX • Max 10 files • 10 MB each</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs">Upload Documents</Button>
            </div>
          </div>

          {/* Officer Attendance */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Officers Present
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {["District Collector", "CEO, Zilla Parishad", "Superintendent of Police", "CEO, Municipal Council", "PWD Executive Engineer", "District Health Officer"].map((officer) => (
                <div key={officer} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">{officer}</span>
                  <select className="text-xs px-2 py-1 rounded border border-input bg-card text-foreground">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="represented">Represented by...</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-primary text-primary-foreground">Submit Visit Report</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Visits Table */}
      <div className="gov-card-elevated overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="gov-table-header">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Guardian Secretary</th>
              <th className="text-left px-4 py-3">District</th>
              <th className="text-left px-4 py-3">Visit Date</th>
              <th className="text-left px-4 py-3">Quarter</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Issues Logged</th>
              <th className="text-left px-4 py-3">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_VISITS.map((visit, i) => (
              <motion.tr
                key={visit.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{visit.id}</td>
                <td className="px-4 py-3 text-sm text-foreground">{visit.gsName}</td>
                <td className="px-4 py-3 text-sm text-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" /> {visit.district}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{visit.visitDate || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{visit.quarter}</td>
                <td className="px-4 py-3">
                  <span className={`gov-badge ${
                    visit.status === "completed" ? "bg-gov-success-light text-gov-success" :
                    visit.status === "scheduled" ? "bg-gov-info-light text-gov-info" :
                    "bg-gov-danger-light text-gov-danger"
                  }`}>
                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{visit.issuesLogged}</td>
                <td className="px-4 py-3">
                  <span className={`gov-badge ${
                    visit.rating === "satisfactory" ? "bg-gov-success-light text-gov-success" :
                    visit.rating === "needs_improvement" ? "bg-gov-warning-light text-gov-warning" :
                    "bg-gov-danger-light text-gov-danger"
                  }`}>
                    {visit.rating.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
