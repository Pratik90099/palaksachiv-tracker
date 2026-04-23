import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface InsightPayload {
  headline: string;
  key_insights: string[];
  risks: string[];
  recommendations: string[];
}

interface InsightRow {
  id: string;
  generated_at: string;
  payload: InsightPayload;
}

export default function InsightsPage() {
  const [latest, setLatest] = useState<InsightRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadLatest = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_insights")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) setLatest(data as any);
    setLoading(false);
  };

  useEffect(() => { loadLatest(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-insights");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Insights generated");
      await loadLatest();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate insights");
    } finally {
      setGenerating(false);
    }
  };

  const p = latest?.payload;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Insights & Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {latest ? `Last generated ${format(new Date(latest.generated_at), "dd MMM yyyy, HH:mm")}` : "No insights generated yet"}
          </p>
        </div>
        <Button onClick={generate} disabled={generating} size="sm" className="bg-primary text-primary-foreground">
          <RefreshCw className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating..." : latest ? "Regenerate" : "Generate Insights"}
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loading && !latest && (
        <div className="gov-card-elevated text-center py-16">
          <Sparkles className="h-10 w-10 text-primary/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Click "Generate Insights" to produce an AI-powered governance summary.</p>
        </div>
      )}

      {p && (
        <>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="gov-card-elevated border-l-4 border-l-primary p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Executive Summary</p>
            <p className="text-lg font-semibold text-foreground font-display">{p.headline}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightCard icon={Lightbulb} title="Key Insights" items={p.key_insights} accent="text-gov-info" border="border-l-gov-info" />
            <InsightCard icon={AlertTriangle} title="Risks" items={p.risks} accent="text-gov-danger" border="border-l-gov-danger" />
            <InsightCard icon={Target} title="Recommendations" items={p.recommendations} accent="text-gov-success" border="border-l-gov-success" />
            <div className="gov-card-elevated border-l-4 border-l-muted">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground font-display">Generated</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(latest!.generated_at), "dd MMMM yyyy 'at' HH:mm")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">Powered by Lovable AI · Gemini 3 Flash</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InsightCard({ icon: Icon, title, items, accent, border }: any) {
  return (
    <div className={`gov-card-elevated border-l-4 ${border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${accent}`} />
        <h3 className="text-sm font-semibold text-foreground font-display">{title}</h3>
      </div>
      <ul className="space-y-2">
        {(items || []).map((it: string, i: number) => (
          <li key={i} className="text-sm text-foreground flex gap-2">
            <span className={`${accent} mt-1`}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
