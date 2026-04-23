import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Shield, Search, Plus, Mail, MapPin, Pencil, Trash2, LogIn, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useOfficers, useDeleteOfficer } from "@/hooks/use-data";
import { OfficerFormDialog } from "@/components/OfficerFormDialog";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const ROLE_LABEL: Record<string, string> = {
  guardian_secretary: "Guardian Secretary",
  department_secretary: "Department Secretary",
  district_collector: "District Collector",
  divisional_commissioner: "Divisional Commissioner",
  chief_secretary: "Chief Secretary",
  cmo: "CMO",
  system_admin: "CS Office Staff",
};

export default function UserManagementPage() {
  const { data: officers, isLoading } = useOfficers();
  const deleteOfficer = useDeleteOfficer();
  const { user, impersonateOfficer } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const canImpersonate =
    !!user && (user.is_cso_admin || user.role === "system_admin" || user.role === "chief_secretary");

  const list = officers || [];

  const filtered = list.filter((u: any) => {
    const q = searchQuery.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q) && !(u.districts?.name || "").toLowerCase().includes(q)) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const roleCounts = list.reduce((acc: Record<string, number>, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete officer "${name}"? This cannot be undone.`)) return;
    try {
      await deleteOfficer.mutateAsync(id);
      toast.success("Officer removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleImpersonate = async (officerId: string, name: string) => {
    if (!confirm(`Login as "${name}"? You'll see the portal exactly as they do. Use the banner at the top to return to your account.`)) return;
    try {
      await impersonateOfficer(officerId);
      toast.success(`Now viewing as ${name}`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Could not switch user");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Officer Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage portal users and assignable officers</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Officer
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["chief_secretary", "department_secretary", "guardian_secretary", "district_collector"].map((r) => (
          <div key={r} className="gov-card-elevated">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{ROLE_LABEL[r]}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{roleCounts[r] || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent h-7 text-sm focus-visible:ring-0"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[220px] text-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="gov-card-elevated overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="gov-table-header">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">District / Dept</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Parichay UID</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>
              )}
              {!isLoading && filtered.map((u: any, i: number) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground block">{u.name}</span>
                        {u.designation && <span className="text-[10px] text-muted-foreground">{u.designation}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="gov-badge bg-secondary text-foreground">
                      <Shield className="h-2.5 w-2.5" /> {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {u.districts?.name || u.departments?.short_name || u.departments?.name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {u.parichay_uid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary">
                        <KeyRound className="h-2.5 w-2.5" /> {u.parichay_uid}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">— not mapped —</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`gov-badge ${u.is_active ? "bg-gov-success-light text-gov-success" : "bg-muted text-muted-foreground"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                      {u.is_cso_admin && (
                        <span className="gov-badge bg-accent/20 text-accent-foreground text-[9px]">CSO Admin</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {canImpersonate && u.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-primary"
                          title="Login as this officer"
                          onClick={() => handleImpersonate(u.id, u.name)}
                        >
                          <LogIn className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditing(u); setDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(u.id, u.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No officers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          Showing {filtered.length} of {list.length} officers
        </div>
      </div>

      <OfficerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editOfficer={editing} />
    </div>
  );
}
