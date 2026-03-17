import { useState } from "react";
import { Users, Shield, Search, Plus, Mail, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { USER_ROLES } from "@/lib/mock-data";

const MOCK_USERS = [
  { id: 1, name: "Shri. O P Gupta, IAS", role: "Guardian Secretary", district: "Pune", email: "acs.finance@maharashtra.gov.in", status: "active" },
  { id: 2, name: "Shri. Milind Mhaiskar, IAS", role: "Department Secretary", district: "—", email: "acs.pwd@maharashtra.gov.in", status: "active" },
  { id: 3, name: "Shri. Saurabh Rao, IAS", role: "District Collector", district: "Pune", email: "collector.pune@maharashtra.gov.in", status: "active" },
  { id: 4, name: "Dr. Vijay Suryawanshi, IAS", role: "Divisional Commissioner", district: "Konkan", email: "divcom.konkan@maharashtra.gov.in", status: "active" },
  { id: 5, name: "Shri. Rajesh Aggarwal, IAS", role: "Chief Secretary", district: "—", email: "cs@maharashtra.gov.in", status: "active" },
  { id: 6, name: "Smt. Priya Deshmukh, IAS", role: "Guardian Secretary", district: "Nagpur", email: "gs.nagpur@maharashtra.gov.in", status: "active" },
  { id: 7, name: "Shri. K. L. Mehta, IAS", role: "Guardian Secretary", district: "Nashik", email: "gs.nashik@maharashtra.gov.in", status: "active" },
  { id: 8, name: "Shri. Admin User", role: "System Administrator", district: "—", email: "admin@maharashtra.gov.in", status: "active" },
];

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = MOCK_USERS.filter((u) => {
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage portal users and role assignments</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {USER_ROLES.slice(0, 4).map((r) => (
          <div key={r.value} className="gov-card-elevated">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{r.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{r.count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent h-7 text-sm focus-visible:ring-0"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px] text-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Guardian Secretary">Guardian Secretary</SelectItem>
            <SelectItem value="Department Secretary">Department Secretary</SelectItem>
            <SelectItem value="District Collector">District Collector</SelectItem>
            <SelectItem value="Divisional Commissioner">Divisional Commissioner</SelectItem>
            <SelectItem value="Chief Secretary">Chief Secretary</SelectItem>
            <SelectItem value="System Administrator">System Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="gov-card-elevated overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="gov-table-header">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">District/Division</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="gov-badge bg-secondary text-foreground">
                    <Shield className="h-2.5 w-2.5" /> {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {u.district}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="gov-badge bg-gov-success-light text-gov-success">Active</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
