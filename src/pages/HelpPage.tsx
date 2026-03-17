import { HelpCircle, Mail, Phone, FileText, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const HELP_ITEMS = [
  { icon: FileText, title: "User Manual", desc: "Download the GS Portal user guide (PDF)", action: "#" },
  { icon: Mail, title: "Email Support", desc: "gsportal.support@maharashtra.gov.in", action: "mailto:gsportal.support@maharashtra.gov.in" },
  { icon: Phone, title: "Helpdesk", desc: "+91-22-2202-XXXX (Mon–Sat, 10 AM – 6 PM)", action: "tel:+912222020000" },
  { icon: ExternalLink, title: "NIC Portal", desc: "National Informatics Centre – Maharashtra", action: "https://maharashtra.nic.in" },
];

export default function HelpPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground font-display">Help & Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Get assistance with the GS Portal</p>
      </motion.div>

      <div className="space-y-3">
        {HELP_ITEMS.map((item) => (
          <a
            key={item.title}
            href={item.action}
            target={item.action.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="gov-card-elevated flex items-center gap-4 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="gov-card-elevated">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">FAQ</h3>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { q: "How do I log an actionable after a district visit?", a: "Go to Actionables → Add Task, select the district & category, and fill in details." },
            { q: "How do I escalate an issue to the Chief Secretary?", a: "Open the actionable, change status to 'Escalated', and add remarks." },
            { q: "Who can see my district data?", a: "Your data is visible to you, the Divisional Commissioner, Chief Secretary, and CMO." },
          ].map((faq) => (
            <details key={faq.q} className="group">
              <summary className="cursor-pointer font-medium text-foreground hover:text-primary transition-colors">
                {faq.q}
              </summary>
              <p className="mt-1.5 text-muted-foreground pl-4 text-xs">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
