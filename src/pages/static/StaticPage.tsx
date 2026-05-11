import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export function StaticPage({ title, lastUpdated, children }: { title: string; lastUpdated?: string; children: ReactNode }) {
  return (
    <article className="max-w-3xl mx-auto p-6 space-y-4">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3 w-3" /> Back to Home
      </Link>
      <header>
        <h1 className="text-3xl font-bold text-foreground font-display">{title}</h1>
        {lastUpdated && <p className="text-xs text-muted-foreground mt-1">Last updated: {lastUpdated}</p>}
      </header>
      <div className="prose prose-sm max-w-none text-foreground space-y-3 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_li]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline">
        {children}
      </div>
    </article>
  );
}
