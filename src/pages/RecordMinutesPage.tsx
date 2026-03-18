import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Calendar, Users, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/use-data";
import { toast } from "sonner";
import { format } from "date-fns";

function useMeetingMinutes() {
  return useQuery({
    queryKey: ["meeting_minutes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_minutes")
        .select("*, projects(id, title)")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCreateMinutes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      meeting_date: string;
      venue?: string;
      chaired_by?: string;
      attendees?: string[];
      agenda?: string;
      minutes_text: string;
      decisions?: string[];
      action_items?: string[];
      related_project_id?: string;
    }) => {
      const { data, error } = await supabase.from("meeting_minutes").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meeting_minutes"] });
      toast.success("Meeting minutes recorded successfully");
    },
    onError: () => toast.error("Failed to save minutes"),
  });
}

export default function RecordMinutesPage() {
  const { data: minutes, isLoading } = useMeetingMinutes();
  const { data: projects } = useProjects();
  const createMinutes = useCreateMinutes();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    meeting_date: new Date().toISOString().split("T")[0],
    venue: "",
    chaired_by: "Shri. Rajesh Aggarwal, IAS — Chief Secretary",
    attendees: "",
    agenda: "",
    minutes_text: "",
    decisions: "",
    action_items: "",
    related_project_id: "",
  });

  const handleSubmit = () => {
    if (!form.title || !form.minutes_text) {
      toast.error("Title and minutes text are required");
      return;
    }
    createMinutes.mutate({
      title: form.title,
      meeting_date: form.meeting_date,
      venue: form.venue || undefined,
      chaired_by: form.chaired_by || undefined,
      attendees: form.attendees ? form.attendees.split("\n").filter(Boolean) : undefined,
      agenda: form.agenda || undefined,
      minutes_text: form.minutes_text,
      decisions: form.decisions ? form.decisions.split("\n").filter(Boolean) : undefined,
      action_items: form.action_items ? form.action_items.split("\n").filter(Boolean) : undefined,
      related_project_id: form.related_project_id || undefined,
    });
    setForm({
      title: "", meeting_date: new Date().toISOString().split("T")[0], venue: "",
      chaired_by: "Shri. Rajesh Aggarwal, IAS — Chief Secretary",
      attendees: "", agenda: "", minutes_text: "", decisions: "", action_items: "", related_project_id: "",
    });
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Meeting Minutes</h1>
          <p className="text-sm text-muted-foreground mt-1">Record and review minutes from CS-level review meetings</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Record New Minutes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Record Meeting Minutes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meeting Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CS Review — PRAGATI Issues" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Venue</Label>
                  <Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Mantralaya, Mumbai" />
                </div>
                <div>
                  <Label>Chaired By</Label>
                  <Input value={form.chaired_by} onChange={e => setForm(f => ({ ...f, chaired_by: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Related Project (optional)</Label>
                <Select value={form.related_project_id} onValueChange={v => setForm(f => ({ ...f, related_project_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {(projects || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Attendees (one per line)</Label>
                <Textarea value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} rows={3} placeholder={"Shri. O P Gupta, ACS Finance\nShri. Milind Mhaiskar, ACS PWD"} />
              </div>
              <div>
                <Label>Agenda</Label>
                <Textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} rows={2} placeholder="Review of pending PRAGATI items..." />
              </div>
              <div>
                <Label>Minutes / Discussion Summary *</Label>
                <Textarea value={form.minutes_text} onChange={e => setForm(f => ({ ...f, minutes_text: e.target.value }))} rows={5} placeholder="Detailed discussion notes..." />
              </div>
              <div>
                <Label>Key Decisions (one per line)</Label>
                <Textarea value={form.decisions} onChange={e => setForm(f => ({ ...f, decisions: e.target.value }))} rows={3} placeholder={"PWD to expedite NH-30 bypass by 31 March\nRevenue to clear 8 pending NOCs within 2 weeks"} />
              </div>
              <div>
                <Label>Action Items (one per line)</Label>
                <Textarea value={form.action_items} onChange={e => setForm(f => ({ ...f, action_items: e.target.value }))} rows={3} placeholder={"Collector Pune to submit land acquisition report\nACS PWD to hold contractor meeting"} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMinutes.isPending}>
                  {createMinutes.isPending ? "Saving..." : "Save Minutes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="gov-card-elevated p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{minutes?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Minutes Recorded</p>
            </div>
          </div>
        </div>
        <div className="gov-card-elevated p-4 border-l-4 border-l-gov-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-gov-success" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {minutes?.reduce((sum, m: any) => sum + (m.decisions?.length || 0), 0) || 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Decisions</p>
            </div>
          </div>
        </div>
        <div className="gov-card-elevated p-4 border-l-4 border-l-gov-warning">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gov-warning" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {minutes?.reduce((sum, m: any) => sum + (m.action_items?.length || 0), 0) || 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Action Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Minutes list */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading minutes...</p>}
      <div className="space-y-3">
        {(minutes || []).map((m: any, i: number) => {
          const expanded = expandedId === m.id;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="gov-card-elevated overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expanded ? null : m.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(m.meeting_date), "dd MMM yyyy")}
                        </span>
                        {m.venue && <span>{m.venue}</span>}
                        {m.chaired_by && <span>Chaired: {m.chaired_by}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.decisions?.length > 0 && (
                      <span className="text-[10px] bg-gov-success-light text-gov-success px-2 py-0.5 rounded font-medium">
                        {m.decisions.length} decisions
                      </span>
                    )}
                    {m.action_items?.length > 0 && (
                      <span className="text-[10px] bg-gov-warning-light text-gov-warning px-2 py-0.5 rounded font-medium">
                        {m.action_items.length} action items
                      </span>
                    )}
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </div>

              {expanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  className="border-t border-border px-4 pb-4 pt-3 space-y-3"
                >
                  {m.projects && (
                    <div className="text-xs">
                      <span className="font-semibold text-foreground">Related Project: </span>
                      <span className="text-primary">{m.projects.title}</span>
                    </div>
                  )}
                  {m.attendees?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3" /> Attendees
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {m.attendees.map((a: string, j: number) => (
                          <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {m.agenda && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Agenda</p>
                      <p className="text-xs text-muted-foreground">{m.agenda}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Minutes</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{m.minutes_text}</p>
                  </div>
                  {m.decisions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gov-success mb-1">Key Decisions</p>
                      <ul className="space-y-1">
                        {m.decisions.map((d: string, j: number) => (
                          <li key={j} className="text-xs text-foreground flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-gov-success shrink-0 mt-0.5" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.action_items?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gov-warning mb-1">Action Items</p>
                      <ul className="space-y-1">
                        {m.action_items.map((a: string, j: number) => (
                          <li key={j} className="text-xs text-foreground flex items-start gap-1.5">
                            <Clock className="h-3 w-3 text-gov-warning shrink-0 mt-0.5" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
        {!isLoading && (minutes || []).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No meeting minutes recorded yet</p>
            <p className="text-xs mt-1">Click "Record New Minutes" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
