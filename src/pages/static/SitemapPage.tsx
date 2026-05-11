import { StaticPage } from "./StaticPage";
import { Link } from "react-router-dom";

const SECTIONS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Operations",
    links: [
      { to: "/dashboard", label: "Home" },
      { to: "/projects", label: "Projects" },
      { to: "/actionables", label: "Actionables" },
      { to: "/visits", label: "Visit Management" },
      { to: "/critical-issues", label: "Critical Issues" },
      { to: "/goi-pending", label: "GOI Pending" },
      { to: "/escalations", label: "Escalations" },
      { to: "/alerts", label: "Alerts" },
    ],
  },
  {
    title: "Analytics",
    links: [
      { to: "/heat-map", label: "District Heat Map" },
      { to: "/compliance", label: "Visit Compliance" },
      { to: "/governance-scorecard", label: "Governance Scorecard" },
      { to: "/category-dashboard", label: "Category Dashboard" },
      { to: "/integration-health", label: "Integration Health" },
      { to: "/insights", label: "AI Insights" },
      { to: "/reports", label: "MIS Reports" },
    ],
  },
  {
    title: "Administration",
    links: [
      { to: "/users", label: "User Management" },
      { to: "/departments", label: "Departments" },
      { to: "/meeting-minutes", label: "Meeting Minutes" },
      { to: "/document-ai", label: "Document AI" },
      { to: "/admin/ai-telemetry", label: "AI Telemetry" },
      { to: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Information",
    links: [
      { to: "/help", label: "Help & Support" },
      { to: "/help/user-manual", label: "User Manual" },
      { to: "/accessibility-statement", label: "Accessibility Statement" },
      { to: "/privacy-policy", label: "Privacy Policy" },
      { to: "/terms-of-use", label: "Terms of Use" },
      { to: "/copyright-policy", label: "Copyright Policy" },
      { to: "/hyperlinking-policy", label: "Hyperlinking Policy" },
      { to: "/contact-us", label: "Contact Us" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <StaticPage title="Sitemap" lastUpdated="11 May 2026">
      <p>All pages of the Guardian Secretary Portal at a glance.</p>
      <div className="grid sm:grid-cols-2 gap-6 mt-4">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <ul>
              {s.links.map((l) => (
                <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </StaticPage>
  );
}
