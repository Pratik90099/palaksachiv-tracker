import { useState, useRef, useEffect, useCallback } from "react";
import {
  useVisits,
  useCreateVisit,
  useUpdateVisit,
  useDeleteVisit,
  useDeleteVisitAttachment,
  useDistricts,
  useVisitComments,
  useAddVisitComment,
} from "@/hooks/use-data";
import { useRoleFilter } from "@/hooks/use-role-filter";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar, Plus, Download, MapPin, FileText, Camera, MessageSquare, ShieldCheck,
  X, Loader2, Image as ImageIcon, RotateCw, Trash2, Pencil, Replace as ReplaceIcon, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

type QueueItem = {
  id: string;
  file: File;
  kind: "photo" | "document";
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/**
 * Upload one file with XHR progress, by first asking Supabase Storage for a
 * signed upload URL, then PUT-ing to it directly so we can attach onprogress.
 */
async function uploadWithProgress(
  path: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUploadUrl(path);
  if (error || !data) throw error || new Error("Could not create upload URL");

  const url = /^https?:\/\//i.test(data.signedUrl)
    ? data.signedUrl
    : `${SUPABASE_URL}/storage/v1${data.signedUrl.startsWith("/") ? "" : "/"}${data.signedUrl}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export default function VisitsPage() {
  const { user } = useAuth();
  const { data: visits, isLoading } = useVisits();
  const { data: districts } = useDistricts();
  const { filterVisits, currentOfficerId, role, userDistrict } = useRoleFilter();
  const createVisit = useCreateVisit();
  const updateVisit = useUpdateVisit();
  const deleteVisit = useDeleteVisit();

  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const emptyForm = {
    district_id: "",
    visit_date: "",
    quarter: "Q4 2024-25",
    status: "completed" as string,
    rating: "satisfactory",
    observations: "",
    issues_logged: 0,
  };
  const [form, setForm] = useState(emptyForm);

  const canLogVisit = role === "guardian_secretary" || role === "system_admin" || role === "chief_secretary";
  const canComment =
    role === "district_collector" ||
    role === "chief_secretary" ||
    role === "cmo" ||
    role === "system_admin" ||
    role === "guardian_secretary";

  const visibleVisits = filterVisits(visits || []);

  const canEditVisit = useCallback(
    (v: any) =>
      role === "system_admin" ||
      role === "chief_secretary" ||
      role === "cmo" ||
      (role === "guardian_secretary" && v?.gs_id && v.gs_id === currentOfficerId),
    [role, currentOfficerId]
  );

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const accepted: QueueItem[] = [];
    Array.from(files).forEach((f) => {
      if (!PHOTO_TYPES.includes(f.type)) { toast.error(`${f.name}: only JPEG/PNG`); return; }
      if (f.size > PHOTO_MAX) { toast.error(`${f.name}: exceeds 5 MB`); return; }
      accepted.push({ id: crypto.randomUUID(), file: f, kind: "photo", progress: 0, status: "queued" });
    });
    setQueue((q) => [...q, ...accepted].slice(0, 30));
  };
  const addDocs = (files: FileList | null) => {
    if (!files) return;
    const accepted: QueueItem[] = [];
    Array.from(files).forEach((f) => {
      if (!DOC_TYPES.includes(f.type)) { toast.error(`${f.name}: only PDF/DOCX/XLSX`); return; }
      if (f.size > DOC_MAX) { toast.error(`${f.name}: exceeds 10 MB`); return; }
      accepted.push({ id: crypto.randomUUID(), file: f, kind: "document", progress: 0, status: "queued" });
    });
    setQueue((q) => [...q, ...accepted].slice(0, 30));
  };

  const updateItem = (id: string, patch: Partial<QueueItem>) =>
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const uploadOne = async (visitId: string, item: QueueItem) => {
    updateItem(item.id, { status: "uploading", progress: 0, error: undefined });
    try {
      const safe = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `visits/${visitId}/${item.kind === "photo" ? "photos" : "docs"}/${crypto.randomUUID()}-${safe}`;
      await uploadWithProgress(path, item.file, (pct) => updateItem(item.id, { progress: pct }));
      const { error: dbErr } = await supabase.from("visit_attachments").insert({
        visit_id: visitId,
        kind: item.kind,
        storage_path: path,
        file_name: item.file.name,
        file_size: item.file.size,
        mime_type: item.file.type,
        uploaded_by: currentOfficerId || null,
      });
      if (dbErr) throw dbErr;
      updateItem(item.id, { status: "done", progress: 100 });
    } catch (err: any) {
      updateItem(item.id, { status: "error", error: err?.message || "Upload failed" });
    }
  };

  const handleSubmit = async () => {
    if (!form.district_id) { toast.error("Select a district"); return; }
    if (!form.visit_date) { toast.error("Enter visit date"); return; }
    setSubmitting(true);
    try {
      let visitId: string | null = null;
      if (editingVisit) {
        await updateVisit.mutateAsync({ id: editingVisit.id, ...form });
        visitId = editingVisit.id;
      } else {
        const created = await createVisit.mutateAsync({ ...form, gs_id: currentOfficerId || undefined } as any);
        visitId = created.id;
      }
      // Upload only queued/error items
      const pending = queue.filter((q) => q.status === "queued" || q.status === "error");
      for (const it of pending) await uploadOne(visitId!, it);
      const failed = queue.some((q) => q.status === "error");
      if (failed) {
        toast.warning("Visit saved. Some files failed — use Retry to upload them again.");
      } else {
        toast.success(editingVisit ? "Visit updated" : "Visit logged successfully");
        setShowForm(false);
        setEditingVisit(null);
        setQueue([]);
        setForm(emptyForm);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save visit");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (v: any) => {
    setEditingVisit(v);
    setForm({
      district_id: v.district_id || "",
      visit_date: v.visit_date || "",
      quarter: v.quarter || "Q4 2024-25",
      status: v.status || "completed",
      rating: v.rating || "satisfactory",
      observations: v.observations || "",
      issues_logged: v.issues_logged || 0,
    });
    setQueue([]);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingVisit(null);
    setQueue([]);
    setForm(emptyForm);
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
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => { if (showForm) cancelForm(); else setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> {showForm ? "Close" : "Log New Visit"}
            </Button>
          )}
        </div>
      </div>

      {showForm && canLogVisit && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="gov-card-elevated space-y-4">
          <h3 className="gov-section-title">{editingVisit ? "Edit Visit Report" : "New Visit Report"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">District *</label>
              <Select value={form.district_id} onValueChange={(v) => setForm({ ...form, district_id: v })} disabled={!!editingVisit}>
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
              <p className="text-[10px] text-muted-foreground">JPEG/PNG • 5 MB each</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }}
              />
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => photoInputRef.current?.click()}>
                Add Photos
              </Button>
            </div>
            <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Supporting Documents</p>
              <p className="text-[10px] text-muted-foreground">PDF/DOCX/XLSX • 10 MB each</p>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                multiple
                className="hidden"
                onChange={(e) => { addDocs(e.target.files); e.target.value = ""; }}
              />
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => docInputRef.current?.click()}>
                Add Documents
              </Button>
            </div>
          </div>

          {queue.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Upload queue ({queue.length})</div>
              {queue.map((it) => (
                <div key={it.id} className="gov-card p-2 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate">
                      {it.kind === "photo" ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      <span className="truncate text-foreground">{it.file.name}</span>
                      <span className="text-muted-foreground">({(it.file.size / 1024).toFixed(0)} KB)</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {it.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-gov-success" />}
                      {it.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                      {it.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                      {it.status === "error" && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => editingVisit ? uploadOne(editingVisit.id, it) : updateItem(it.id, { status: "queued", error: undefined })}>
                          <RotateCw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      )}
                      {it.status !== "uploading" && (
                        <button onClick={() => setQueue((q) => q.filter((x) => x.id !== it.id))} className="text-destructive hover:opacity-80">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  </div>
                  {(it.status === "uploading" || it.status === "done") && (
                    <Progress value={it.progress} className="h-1" />
                  )}
                  {it.error && <p className="text-destructive text-[11px]">{it.error}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button className="bg-primary text-primary-foreground" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : (editingVisit ? "Save Changes" : "Submit Visit Report")}
            </Button>
            <Button variant="outline" onClick={cancelForm} disabled={submitting}>Cancel</Button>
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
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleVisits.map((visit: any, i: number) => (
                <motion.tr
                  key={visit.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-foreground cursor-pointer" onClick={() => setSelectedVisit(visit)}>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {visit.districts?.name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground cursor-pointer" onClick={() => setSelectedVisit(visit)}>{visit.visit_date || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground cursor-pointer" onClick={() => setSelectedVisit(visit)}>{visit.quarter}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedVisit(visit)}>
                    <span className={`gov-badge ${
                      visit.status === "completed" ? "bg-gov-success-light text-gov-success" :
                      visit.status === "scheduled" ? "bg-gov-info-light text-gov-info" :
                      "bg-gov-danger-light text-gov-danger"
                    }`}>
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground cursor-pointer" onClick={() => setSelectedVisit(visit)}>{visit.issues_logged}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedVisit(visit)}>
                    <span className={`gov-badge ${
                      visit.rating === "satisfactory" ? "bg-gov-success-light text-gov-success" :
                      visit.rating === "needs_improvement" ? "bg-gov-warning-light text-gov-warning" :
                      "bg-gov-danger-light text-gov-danger"
                    }`}>
                      {(visit.rating || "").split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setSelectedVisit(visit)}>
                        <MessageSquare className="h-3 w-3 mr-1" /> Open
                      </Button>
                      {canEditVisit(visit) && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(visit)} title="Edit visit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setConfirmDelete(visit)} title="Delete visit">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
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
        canManageVisit={selectedVisit ? canEditVisit(selectedVisit) : false}
        onEdit={(v) => { setSelectedVisit(null); startEdit(v); }}
        onDelete={(v) => { setSelectedVisit(null); setConfirmDelete(v); }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this visit report?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the visit, its comments and all attached photos and documents. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteVisit.mutateAsync(confirmDelete.id);
                  toast.success("Visit deleted");
                } catch (e: any) {
                  toast.error(e.message || "Could not delete visit");
                } finally {
                  setConfirmDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VisitDetailSheet({
  visit, onClose, canComment, currentOfficerId, currentRole, userName,
  canManageVisit, onEdit, onDelete,
}: {
  visit: any | null;
  onClose: () => void;
  canComment: boolean;
  currentOfficerId: string | undefined;
  currentRole: string | undefined;
  userName: string | undefined;
  canManageVisit: boolean;
  onEdit: (v: any) => void;
  onDelete: (v: any) => void;
}) {
  const open = !!visit;
  const { data: comments, isLoading } = useVisitComments(visit?.id ?? null);
  const addComment = useAddVisitComment();
  const deleteAttachment = useDeleteVisitAttachment();
  const [text, setText] = useState("");
  const [actionTaken, setActionTaken] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [confirmAtt, setConfirmAtt] = useState<any>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<any>(null);

  const loadAttachments = useCallback(async () => {
    if (!visit?.id) { setAttachments([]); setSignedUrls({}); return; }
    const { data } = await supabase
      .from("visit_attachments")
      .select("*")
      .eq("visit_id", visit.id)
      .order("created_at", { ascending: true });
    const list = data || [];
    setAttachments(list);
    const urls: Record<string, string> = {};
    for (const a of list) {
      const { data: s } = await supabase.storage.from("documents").createSignedUrl(a.storage_path, 600);
      if (s?.signedUrl) urls[a.id] = s.signedUrl;
    }
    setSignedUrls(urls);
  }, [visit?.id]);

  useEffect(() => { loadAttachments(); }, [loadAttachments]);

  const canManageAttachment = (a: any) =>
    canManageVisit || (currentOfficerId && a.uploaded_by === currentOfficerId);

  const handleReplace = async (a: any, file: File) => {
    const allowed = a.kind === "photo" ? PHOTO_TYPES : DOC_TYPES;
    const max = a.kind === "photo" ? PHOTO_MAX : DOC_MAX;
    if (!allowed.includes(file.type)) { toast.error("Wrong file type"); return; }
    if (file.size > max) { toast.error("File too large"); return; }
    setReplacingId(a.id);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `visits/${a.visit_id}/${a.kind === "photo" ? "photos" : "docs"}/${crypto.randomUUID()}-${safe}`;
      await uploadWithProgress(path, file, () => {});
      const { error: insErr } = await supabase.from("visit_attachments").insert({
        visit_id: a.visit_id, kind: a.kind, storage_path: path,
        file_name: file.name, file_size: file.size, mime_type: file.type,
        uploaded_by: currentOfficerId || null,
      });
      if (insErr) throw insErr;
      await supabase.storage.from("documents").remove([a.storage_path]);
      await supabase.from("visit_attachments").delete().eq("id", a.id);
      toast.success("Attachment replaced");
      await loadAttachments();
    } catch (e: any) {
      toast.error(e.message || "Replace failed");
    } finally {
      setReplacingId(null);
      setReplaceTarget(null);
    }
  };

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
              {canManageVisit && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(visit)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => onDelete(visit)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              )}
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

            {attachments.length > 0 && (
              <div className="mt-6">
                <h4 className="gov-section-title flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Photographs & Documents ({attachments.length})
                </h4>
                <div className="grid grid-cols-1 gap-2 mt-3">
                  {attachments.map((a) => (
                    <div key={a.id} className="gov-card p-2 text-xs">
                      <div className="flex items-center gap-2">
                        {a.kind === "photo" ? (
                          signedUrls[a.id] ? (
                            <img src={signedUrls[a.id]} alt={a.file_name} className="w-14 h-14 object-cover rounded border border-border" />
                          ) : <div className="w-14 h-14 bg-muted rounded animate-pulse" />
                        ) : (
                          <div className="w-14 h-14 grid place-items-center bg-muted rounded border border-border">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <a href={signedUrls[a.id]} target="_blank" rel="noreferrer" className="block truncate text-foreground hover:underline">
                            {a.file_name}
                          </a>
                          <div className="text-muted-foreground">{(a.file_size / 1024).toFixed(0)} KB</div>
                        </div>
                        {canManageAttachment(a) && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={replacingId === a.id}
                              onClick={() => { setReplaceTarget(a); replaceInputRef.current?.click(); }} title="Replace">
                              {replacingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ReplaceIcon className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                              onClick={() => setConfirmAtt(a)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <input
                  ref={replaceInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && replaceTarget) handleReplace(replaceTarget, f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}

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

        <AlertDialog open={!!confirmAtt} onOpenChange={(o) => !o && setConfirmAtt(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this attachment?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAtt?.file_name} will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (!confirmAtt) return;
                  try {
                    await deleteAttachment.mutateAsync({ id: confirmAtt.id, visit_id: confirmAtt.visit_id, storage_path: confirmAtt.storage_path });
                    toast.success("Attachment removed");
                    await loadAttachments();
                  } catch (e: any) {
                    toast.error(e.message || "Delete failed");
                  } finally {
                    setConfirmAtt(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
