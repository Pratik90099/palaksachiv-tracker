import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileUp, Brain, FileText, FolderKanban, ClipboardList, CheckCircle2, Loader2, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateProject, useCreateTask } from "@/hooks/use-data";
import { toast } from "sonner";
import { format } from "date-fns";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "text/plain",
  "text/csv",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".txt", ".csv", ".pdf", ".docx"];

type ProcessingMode = "summarize" | "extract-projects" | "extract-tasks" | "extract-action-items";

const MODE_OPTIONS: { value: ProcessingMode; label: string; icon: typeof Brain; description: string }[] = [
  { value: "summarize", label: "Summarize", icon: FileText, description: "Get a concise summary with key points" },
  { value: "extract-projects", label: "Extract Projects", icon: FolderKanban, description: "Identify projects/schemes from document" },
  { value: "extract-tasks", label: "Extract Tasks", icon: ClipboardList, description: "Extract actionable tasks with owners" },
  { value: "extract-action-items", label: "Action Items", icon: CheckCircle2, description: "Pull out action items and follow-ups" },
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function useDocumentUploads() {
  return useQuery({
    queryKey: ["document_uploads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_uploads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export default function DocumentAIPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ProcessingMode>("summarize");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [importedItems, setImportedItems] = useState<Set<number>>(new Set());

  const { data: uploads } = useDocumentUploads();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const qc = useQueryClient();

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  }, []);

  const validateAndSetFile = (f: File) => {
    setError("");
    setResult(null);
    setImportedItems(new Set());

    if (f.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum 5MB allowed.");
      return;
    }

    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }

    setFile(f);
  };

  const readFileAsText = async (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(f);
    });
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    setResult(null);
    setImportedItems(new Set());

    try {
      const content = await readFileAsText(file);

      if (!content.trim()) {
        setError("File appears to be empty or could not be read as text.");
        setProcessing(false);
        return;
      }

      // Truncate content for safety
      const truncated = content.substring(0, 500_000);

      const { data, error: fnError } = await supabase.functions.invoke("process-document", {
        body: { content: truncated, mode, fileName: file.name },
      });

      if (fnError) {
        setError(fnError.message || "Processing failed");
        setProcessing(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setProcessing(false);
        return;
      }

      setResult(data);

      // Save upload record
      await supabase.from("document_uploads").insert({
        file_name: file.name,
        file_type: file.type || "text/plain",
        file_size: file.size,
        processing_mode: mode,
        ai_result: data?.result || null,
        uploaded_by: "CS Office",
      });
      qc.invalidateQueries({ queryKey: ["document_uploads"] });

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleImportProject = async (project: any, index: number) => {
    if (importedItems.has(index)) return;
    try {
      await createProject.mutateAsync({
        title: (project.title || "").substring(0, 255),
        description: (project.description || "").substring(0, 5000),
        category: project.category || "Other",
        priority: project.priority || "medium",
        status: project.status || "not_started",
        is_goi_pending: project.is_goi_pending || false,
        is_critical: project.is_critical || false,
        target_date: project.target_date || undefined,
        district_ids: [],
        department_ids: [],
      });
      setImportedItems(prev => new Set(prev).add(index));
      toast.success(`Project "${escapeHtml(project.title)}" imported`);
    } catch {
      toast.error("Failed to import project");
    }
  };

  const handleImportTask = async (task: any, index: number) => {
    if (importedItems.has(1000 + index)) return;
    try {
      await createTask.mutateAsync({
        title: (task.title || "").substring(0, 255),
        description: (task.description || "").substring(0, 5000),
        priority: task.priority || "medium",
        status: "not_started",
        responsible_officer: (task.responsible_officer || task.responsible || "").substring(0, 255),
        agency: (task.agency || "").substring(0, 255),
        target_date: task.target_date || undefined,
        is_goi_pending: false,
        is_critical: false,
        district_ids: [],
        department_ids: [],
      });
      setImportedItems(prev => new Set(prev).add(1000 + index));
      toast.success(`Task "${escapeHtml(task.title)}" imported`);
    } catch {
      toast.error("Failed to import task");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Document AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload documents to extract projects, tasks, and summaries using AI — all processed securely with no external data exposure
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* File Upload */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="gov-card-elevated p-6 border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer text-center"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">
              {file ? file.name : "Drop file here or click to browse"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB • ${file.type || "unknown"}`
                : "PDF, DOCX, CSV, TXT — Max 5MB"}
            </p>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) validateAndSetFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {/* Mode Selector */}
          <div className="gov-card-elevated p-4 space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Processing Mode</label>
            <Select value={mode} onValueChange={(v) => setMode(v as ProcessingMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center gap-2">
                      <m.icon className="h-3.5 w-3.5" />
                      {m.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {MODE_OPTIONS.find((m) => m.value === mode)?.description}
            </p>
            <Button
              className="w-full"
              onClick={handleProcess}
              disabled={!file || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Process Document
                </>
              )}
            </Button>
          </div>

          {/* Upload History */}
          <div className="gov-card-elevated p-4 space-y-2">
            <h3 className="text-xs font-semibold text-foreground">Recent Uploads</h3>
            {(uploads || []).slice(0, 5).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <p className="text-xs font-medium text-foreground truncate max-w-[180px]">{u.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {u.processing_mode} • {format(new Date(u.created_at), "dd MMM, HH:mm")}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground">{(u.file_size / 1024).toFixed(0)}KB</span>
              </div>
            ))}
            {(!uploads || uploads.length === 0) && (
              <p className="text-[10px] text-muted-foreground">No uploads yet</p>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="gov-card-elevated p-4 border-l-4 border-l-destructive mb-4"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </motion.div>
          )}

          {processing && (
            <div className="gov-card-elevated p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-sm font-medium text-foreground">Processing document with AI...</p>
              <p className="text-[10px] text-muted-foreground mt-1">This may take a few seconds</p>
            </div>
          )}

          {!processing && !result && !error && (
            <div className="gov-card-elevated p-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">Upload a document and select a processing mode to get started</p>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="gov-card-elevated p-4 border-l-4 border-l-primary">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    AI Results — {MODE_OPTIONS.find((m) => m.value === result.mode)?.label}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">{result.fileName}</span>
                </div>
              </div>

              {/* Summary mode */}
              {result.mode === "summarize" && result.result && (
                <div className="gov-card-elevated p-4 space-y-3">
                  {result.result.summary && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-1">Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.result.summary}</p>
                    </div>
                  )}
                  {result.result.key_points?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-1">Key Points</h4>
                      <ul className="space-y-1">
                        {result.result.key_points.map((p: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.result.deadlines?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-1">Deadlines</h4>
                      <ul className="space-y-1">
                        {result.result.deadlines.map((d: string, i: number) => (
                          <li key={i} className="text-sm text-gov-warning flex items-start gap-2">
                            <span>⏰</span> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Projects mode */}
              {result.mode === "extract-projects" && result.result?.projects?.length > 0 && (
                <div className="space-y-2">
                  {result.result.projects.map((p: any, i: number) => (
                    <div key={i} className="gov-card-elevated p-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">{p.category}</span>
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded">{p.priority}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={importedItems.has(i) ? "ghost" : "default"}
                        disabled={importedItems.has(i)}
                        onClick={() => handleImportProject(p, i)}
                      >
                        {importedItems.has(i) ? (
                          <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Imported</>
                        ) : (
                          <><Download className="h-3.5 w-3.5 mr-1" /> Import</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks mode */}
              {result.mode === "extract-tasks" && result.result?.tasks?.length > 0 && (
                <div className="space-y-2">
                  {result.result.tasks.map((t: any, i: number) => (
                    <div key={i} className="gov-card-elevated p-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground">{t.title}</h4>
                        {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {t.responsible_officer && (
                            <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                              {t.responsible_officer}
                            </span>
                          )}
                          {t.target_date && (
                            <span className="text-[10px] bg-gov-warning-light text-gov-warning px-2 py-0.5 rounded">
                              Due: {t.target_date}
                            </span>
                          )}
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded">{t.priority}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={importedItems.has(1000 + i) ? "ghost" : "default"}
                        disabled={importedItems.has(1000 + i)}
                        onClick={() => handleImportTask(t, i)}
                      >
                        {importedItems.has(1000 + i) ? (
                          <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Imported</>
                        ) : (
                          <><Download className="h-3.5 w-3.5 mr-1" /> Import</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action items mode */}
              {result.mode === "extract-action-items" && result.result?.action_items?.length > 0 && (
                <div className="space-y-2">
                  {result.result.action_items.map((a: any, i: number) => (
                    <div key={i} className="gov-card-elevated p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{a.action}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {a.responsible && (
                              <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                                {a.responsible}
                              </span>
                            )}
                            {a.deadline && (
                              <span className="text-[10px] bg-gov-warning-light text-gov-warning px-2 py-0.5 rounded">
                                {a.deadline}
                              </span>
                            )}
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded">{a.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback for empty results */}
              {result.result?.parse_warning && (
                <div className="gov-card-elevated p-4">
                  <p className="text-xs text-gov-warning mb-2">⚠ {result.result.parse_warning}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.result.summary}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
