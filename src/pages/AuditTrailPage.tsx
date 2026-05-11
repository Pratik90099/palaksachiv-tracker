import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Row {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor_email: string | null;
  actor_role: string | null;
  district_id: string | null;
  created_at: string;
}

export default function AuditTrailPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [entity, setEntity] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("audit_logs").select("id,entity_type,entity_id,action,actor_email,actor_role,district_id,created_at").order("created_at", { ascending: false }).limit(500);
    if (entity !== "all") q = q.eq("entity_type", entity);
    if (action !== "all") q = q.eq("action", action);
    const { data } = await q;
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [entity, action]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const s = search.toLowerCase();
    return rows.filter((r) => (r.actor_email || "").toLowerCase().includes(s) || (r.entity_id || "").toLowerCase().includes(s));
  }, [rows, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Every view, create, edit and delete on Tasks & Meeting Minutes (10-year retention).</p>
        </div>
        <Button onClick={load} size="sm" variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="meeting_minutes">Meeting Minutes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="view">View</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Filter by email or entity id…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <div className="gov-card-elevated overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="text-left border-b border-border">
              <th className="py-2 pr-3">Time</th>
              <th className="py-2 pr-3">Entity</th>
              <th className="py-2 pr-3">Action</th>
              <th className="py-2 pr-3">Actor</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border/40">
                <td className="py-1.5 pr-3 text-muted-foreground">{format(new Date(r.created_at), "MMM dd HH:mm:ss")}</td>
                <td className="py-1.5 pr-3">{r.entity_type}</td>
                <td className={`py-1.5 pr-3 font-medium ${r.action === "delete" ? "text-gov-danger" : r.action === "view" ? "text-muted-foreground" : "text-foreground"}`}>{r.action}</td>
                <td className="py-1.5 pr-3 truncate max-w-[200px]">{r.actor_email || "—"}</td>
                <td className="py-1.5 pr-3">{r.actor_role || "—"}</td>
                <td className="py-1.5 pr-3 truncate max-w-[180px] font-mono text-[10px]">{r.entity_id || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No audit entries match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
