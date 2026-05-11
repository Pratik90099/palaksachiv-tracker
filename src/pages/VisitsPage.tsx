import { useState, useRef, useEffect } from "react";
import {
  useVisits,
  useCreateVisit,
  useDistricts,
  useVisitComments,
  useAddVisitComment,
} from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Plus, Download, MapPin, FileText, Camera, MessageSquare, ShieldCheck, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { toast } from "sonner";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const PHOTO_MAX = 5 * 1024 * 1024;
const DOC_MAX = 10 * 1024 * 1024;

export default function VisitsPage() {
  const { user } = useAuth();
  const { data: visits, isLoading } = useVisits();
  const { data: districts } = useDistricts();
  const { filterVisits, currentOfficerId, role, userDistrict } = useRoleFilter();
  const createVisit = useCreateVisit();

  const [showForm, setShowForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [form, setForm] = useState({
    district_id: "",
    visit_date: "",
    quarter: "Q4 2024-25",
    status: "completed" as string,
    rating: "satisfactory",
    observations: "",
    issues_logged: 0,
  });

  const canLogVisit = role === "guardian_secretary" || role === "system_admin" || role === "chief_secretary";
  const canComment =
    role === "district_collector" ||
    role === "chief_secretary" ||
    role === "cmo" ||
    role === "system_admin" ||
    role === "guardian_secretary";

  const visibleVisits = filterVisits(visits || []);

  const handleSubmit = async () => {
    if (!form.district_id) { toast.error("Select a district"); return; }
    if (!form.visit_date) { toast.error("Enter visit date"); return; }
    try {
      await createVisit.mutateAsync(form);
      toast.success("Visit logged successfully");
      setShowForm(false);
      setForm({ district_id: "", visit_date: "", quarter: "Q4 2024-25", status: "completed", rating: "satisfactory", observations: "", issues_logged: 0 });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Visit Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "district_collector"
              ? `Visit reports filed for ${userDistrict || "your district"} — open a visit to record action taken.`
              : "Log and track quarterly district visits"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          {canLogVisit && (
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" /> Log New Visit
            </Button>
          )}
        </div>
      </div>

      {showForm && canLogVisit && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="gov-card-elevated space-y-4">
          <h3 className="gov-section-title">New Visit Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">District *</label>
              <Select value={form.district_id} onValueChange={(v) => setForm({ ...form, district_id: v })}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent>
                  {districts?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date of Visit *</label>
              <Input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quarter & FY</label>
              <Input value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rating</label>
              <Select value={form.rating} onValueChange={(v) => setForm({ ...form, rating: v })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                  <SelectItem value="critical_attention">Critical Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Issues Logged</label>
            <Input type="number" value={form.issues_logged} onChange={(e) => setForm({ ...form, issues_logged: parseInt(e.target.value) || 0 })} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Visit Observations</label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-input text-sm min-h-[100px] bg-card text-foreground"
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              placeholder="Enter detailed observations from the visit..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Visit Photographs</p>
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

          <div className="flex gap-2 pt-2">
            <Button className="bg-primary text-primary-foreground" onClick={handleSubmit} disabled={createVisit.isPending}>
              Submit Visit Report
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : (
        <div className="gov-card-elevated overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="gov-table-header">
                <th className="text-left px-4 py-3">District</th>
                <th className="text-left px-4 py-3">Visit Date</th>
                <th className="text-left px-4 py-3">Quarter</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Issues</th>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleVisits.map((visit: any, i: number) => (
                <motion.tr
                  key={visit.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedVisit(visit)}
                >
                  <td className="px-4 py-3 text-sm text-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" /> {visit.districts?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{visit.visit_date || "—"}</td>
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
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{visit.issues_logged}</td>
                  <td className="px-4 py-3">
                    <span className={`gov-badge ${
                      visit.rating === "satisfactory" ? "bg-gov-success-light text-gov-success" :
                      visit.rating === "needs_improvement" ? "bg-gov-warning-light text-gov-warning" :
                      "bg-gov-danger-light text-gov-danger"
                    }`}>
                      {(visit.rating || "").split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-primary font-medium">
                    <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> View / Comment</span>
                  </td>
                </motion.tr>
              ))}
              {visibleVisits.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No visits to show.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <VisitDetailSheet
        visit={selectedVisit}
        onClose={() => setSelectedVisit(null)}
        canComment={!!canComment}
        currentOfficerId={currentOfficerId}
        currentRole={user?.role}
        userName={user?.name}
      />
    </div>
  );
}

function VisitDetailSheet({
  visit, onClose, canComment, currentOfficerId, currentRole, userName,
}: {
  visit: any | null;
  onClose: () => void;
  canComment: boolean;
  currentOfficerId: string | undefined;
  currentRole: string | undefined;
  userName: string | undefined;
}) {
  const open = !!visit;
  const { data: comments, isLoading } = useVisitComments(visit?.id ?? null);
  const addComment = useAddVisitComment();
  const [text, setText] = useState("");
  const [actionTaken, setActionTaken] = useState(true);

  const handlePost = async () => {
    if (!visit) return;
    if (!text.trim()) { toast.error("Enter a comment"); return; }
    if (!currentOfficerId) { toast.error("Officer profile not linked — cannot post."); return; }
    try {
      await addComment.mutateAsync({
        visit_id: visit.id,
        author_officer_id: currentOfficerId,
        author_role: currentRole || null,
        comment_text: text.trim(),
        is_action_taken: actionTaken,
        notify_officer_id: visit.gs_id && visit.gs_id !== currentOfficerId ? visit.gs_id : null,
        notify_title: "Response on your visit report",
        notify_message: `${userName || "An officer"} commented on the ${visit.districts?.name || "visit"} report.`,
      });
      setText("");
      setActionTaken(true);
      toast.success("Comment posted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {visit && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 font-display">
                <Calendar className="h-4 w-4" /> {visit.districts?.name} — {visit.visit_date || "—"}
              </SheetTitle>
              <SheetDescription>
                {visit.quarter} • Filed by {visit.guardian_secretaries?.name || "Guardian Secretary"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="gov-card p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">Status</div>
                  <div className="font-semibold text-foreground">{visit.status}</div>
                </div>
                <div className="gov-card p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">Rating</div>
                  <div className="font-semibold text-foreground">{visit.rating}</div>
                </div>
                <div className="gov-card p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">Issues Logged</div>
                  <div className="font-semibold text-foreground">{visit.issues_logged}</div>
                </div>
              </div>
              {visit.observations && (
                <div className="gov-card p-3">
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Observations</div>
                  <p className="whitespace-pre-wrap text-foreground">{visit.observations}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h4 className="gov-section-title flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Action Taken & Comments
              </h4>
              <div className="space-y-2 mt-3">
                {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
                {!isLoading && (comments?.length || 0) === 0 && (
                  <p className="text-xs text-muted-foreground italic">No comments yet.</p>
                )}
                {(comments || []).map((c: any) => (
                  <div key={c.id} className="gov-card p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">
                        {c.officers?.name || "Officer"}
                        <span className="text-muted-foreground font-normal"> · {c.author_role}</span>
                      </span>
                      <span className="text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    {c.is_action_taken && (
                      <span className="gov-badge bg-gov-success-light text-gov-success inline-flex items-center gap-1 text-[10px]">
                        <ShieldCheck className="h-3 w-3" /> Action Taken
                      </span>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap">{c.comment_text}</p>
                  </div>
                ))}
              </div>

              {canComment && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <label className="text-xs font-medium text-muted-foreground">Add a comment</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-md border border-input text-sm min-h-[90px] bg-card text-foreground"
                    placeholder={currentRole === "district_collector"
                      ? "Describe the action taken in response to this visit..."
                      : "Add your remarks..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-xs text-foreground">
                    <Checkbox checked={actionTaken} onCheckedChange={(v) => setActionTaken(!!v)} />
                    Mark as Action Taken
                  </label>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handlePost} disabled={addComment.isPending}>
                      {addComment.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
