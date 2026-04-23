import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, Plus, Pencil, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type Status = "planned" | "in_discussion" | "live" | "deprecated";

interface Integration {
  id: string;
  name: string;
  short_code: string | null;
  description: string | null;
  category: string | null;
  status: Status;
  owner: string | null;
  notes: string | null;
  display_order: number;
}

const STATUS_CFG: Record<Status, { label: string; class: string; Icon: typeof CheckCircle2 }> = {
  planned: { label: "Planned", class: "text-muted-foreground bg-muted", Icon: Clock },
  in_discussion: { label: "In Discussion", class: "text-gov-warning bg-gov-warning-light", Icon: AlertTriangle },
  live: { label: "Live", class: "text-gov-success bg-gov-success-light", Icon: CheckCircle2 },
  deprecated: { label: "Deprecated", class: "text-gov-danger bg-gov-danger-light", Icon: AlertTriangle },
};

export default function IntegrationHealthPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "system_admin" || user?.role === "chief_secretary";
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("integrations").select("*").order("display_order");
    setItems((data as Integration[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = items.reduce<Record<Status, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, { planned: 0, in_discussion: 0, live: 0, deprecated: 0 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">External Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catalog of external government systems planned for integration with this portal.
            Status reflects current connector readiness — no live data is being pulled yet.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Integration
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(STATUS_CFG) as Status[]).map((s) => {
          const cfg = STATUS_CFG[s];
          const Icon = cfg.Icon;
          return (
            <div key={s} className="gov-card-elevated p-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${cfg.class}`}><Icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts[s]}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {loading && <div className="gov-card-elevated text-sm text-muted-foreground">Loading...</div>}
        {!loading && items.length === 0 && (
          <div className="gov-card-elevated text-sm text-muted-foreground">No integrations defined yet.</div>
        )}
        {items.map((it, i) => {
          const cfg = STATUS_CFG[it.status];
          const Icon = cfg.Icon;
          return (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="gov-card-elevated p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${cfg.class}`}>
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{it.name}</h3>
                      {it.category && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{it.category}</span>
                      )}
                      <span className={`gov-badge ${cfg.class}`}>
                        <Icon className="h-2.5 w-2.5" /> {cfg.label}
                      </span>
                    </div>
                    {it.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{it.description}</p>
                    )}
                    {it.owner && <p className="text-[10px] text-muted-foreground mt-0.5">Owner: {it.owner}</p>}
                  </div>
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditing(it)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {(editing || creating) && (
        <IntegrationDialog
          integration={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function IntegrationDialog({
  integration,
  onClose,
  onSaved,
}: {
  integration: Integration | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: integration?.name || "",
    short_code: integration?.short_code || "",
    description: integration?.description || "",
    category: integration?.category || "",
    status: (integration?.status as Status) || "planned",
    owner: integration?.owner || "",
    notes: integration?.notes || "",
    display_order: integration?.display_order ?? 100,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      short_code: form.short_code.trim() || null,
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      owner: form.owner.trim() || null,
      notes: form.notes.trim() || null,
    };
    const { error } = integration
      ? await supabase.from("integrations").update(payload).eq("id", integration.id)
      : await supabase.from("integrations").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(integration ? "Integration updated" : "Integration added");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{integration ? "Edit Integration" : "Add Integration"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} maxLength={60} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_discussion">In Discussion</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} rows={2} />
          </div>
          <div>
            <Label className="text-xs">Owner</Label>
            <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} maxLength={120} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : integration ? "Update" : "Add"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
