import { useState } from "react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { MOCK_ACTIONABLES, ISSUE_CATEGORIES, ActionableStatus, Priority, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/mock-data";
import { Search, Filter, Plus, Download, Shield, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

export default function ActionablesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered = MOCK_ACTIONABLES.filter((item) => {
    if (searchQuery && !item.description.toLowerCase().includes(searchQuery.toLowerCase()) && !item.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    return true;
  });

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
          <Button size="sm" className="bg-primary text-primary-foreground">
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
          <SelectTrigger className="w-[150px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px] text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {ISSUE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} actionable{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Table */}
      <div className="gov-card-elevated overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="gov-table-header">
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">District</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Target Date</th>
                <th className="text-left px-4 py-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{item.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground line-clamp-1 max-w-xs">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.agency}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{item.district}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{item.category}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{item.targetDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {item.isCritical && (
                        <span className="gov-badge bg-gov-danger-light text-gov-danger text-[10px]">
                          <Shield className="h-2.5 w-2.5" /> Critical
                        </span>
                      )}
                      {item.isGOIPending && (
                        <span className="gov-badge bg-gov-warning-light text-gov-warning text-[10px]">
                          <Globe className="h-2.5 w-2.5" /> GOI
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
