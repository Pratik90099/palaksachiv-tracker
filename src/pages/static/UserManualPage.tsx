import { StaticPage } from "./StaticPage";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const MANUAL_LAST_UPDATED = "11 May 2026";

export default function UserManualPage() {
  return (
    <StaticPage title="User Manual" lastUpdated={MANUAL_LAST_UPDATED}>
      <div className="flex flex-wrap gap-2 print:hidden -mt-2 mb-4">
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print / Save as PDF
        </Button>
      </div>
      <p>Quick reference guide for officers using the Guardian Secretary Portal. For administrator documentation, contact the CS Office IT cell.</p>

      <nav aria-label="Table of contents" className="gov-card-elevated print:hidden text-xs">
        <p className="font-semibold mb-2 text-foreground">Contents</p>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4 list-decimal pl-5">
          <li><a href="#signing-in">Signing in</a></li>
          <li><a href="#navigating">Navigating the portal</a></li>
          <li><a href="#home">Home dashboard</a></li>
          <li><a href="#projects">Projects and actionables</a></li>
          <li><a href="#critical">Critical issues and escalations</a></li>
          <li><a href="#visits">Visit management</a></li>
          <li><a href="#minutes">Meeting minutes</a></li>
          <li><a href="#insights">AI Insights</a></li>
          <li><a href="#notifications">Notifications</a></li>
          <li><a href="#report">Reporting a problem</a></li>
          <li><a href="#accessibility">Accessibility</a></li>
        </ol>
      </nav>

      <h2 id="signing-in">1. Signing in</h2>
      <ol>
        <li>Visit <Link to="/login">/login</Link>.</li>
        <li>Choose your role from the dropdown (District Collector, Department Secretary, Palak Sachiv, Chief Secretary, or CS Office).</li>
        <li>Enter your government email address and click "Send code".</li>
        <li>You will receive a 6-digit one-time code by email. Enter it within 10 minutes.</li>
        <li>If you have multiple roles, you will be asked to choose which one to act in for this session.</li>
      </ol>

      <h2>2. Navigating the portal</h2>
      <ul>
        <li>The left sidebar shows menu items relevant to your role.</li>
        <li>The header contains a global search box (search by task ID, project name, or keyword).</li>
        <li>The bell icon shows unread notifications and overdue items.</li>
        <li>Sessions expire after 30 minutes of inactivity.</li>
      </ul>

      <h2>3. Home dashboard</h2>
      <p>Each role sees a tailored home view showing pending actionables, critical issues, deadlines and recent activity. Use the cards to drill into details.</p>

      <h2>4. Projects and actionables</h2>
      <ol>
        <li>Open <strong>Projects</strong> to view all initiatives owned by your department/district.</li>
        <li>Click a project to see its tasks, status, target date and assigned officer.</li>
        <li>Use <strong>Actionables</strong> for the day-to-day to-do list across all projects.</li>
        <li>Tasks can be tagged with one or more districts and departments.</li>
      </ol>

      <h2>5. Critical issues and escalations</h2>
      <p>Mark an issue as <strong>Critical</strong> when it requires immediate intervention from the Chief Secretary. Such issues are visible state-wide and trigger the escalation matrix automatically when deadlines breach.</p>

      <h2>6. Visit management (Guardian Secretaries / Collectors)</h2>
      <ul>
        <li>Schedule district visits under <strong>Visit Management</strong>.</li>
        <li>Submit observations, photographs and ratings after each visit.</li>
        <li>Compliance is tracked quarterly under <strong>Visit Compliance</strong>.</li>
      </ul>

      <h2>7. Meeting minutes</h2>
      <p>Chief Secretary and CS Office staff can record minutes under <strong>Meeting Minutes</strong>. Action items captured here are automatically promoted to tasks for follow-up.</p>

      <h2>8. AI Insights</h2>
      <p>Senior officers can generate an AI-powered governance summary under <strong>AI Insights</strong>. Click "Generate Insights" to produce a fresh analysis based on the latest project and task data.</p>

      <h2>9. Notifications</h2>
      <p>The notifications bell shows unread alerts. Click any notification to navigate directly to the related task or project.</p>

      <h2>10. Reporting a problem</h2>
      <p>If you experience an issue, use the "Report a problem" option (coming soon in the global header) or write to the CS Office IT cell using the <Link to="/contact-us">Contact Us</Link> page.</p>

      <h2>11. Accessibility</h2>
      <p>Use the A-, A, A+ controls in the footer to adjust text size. The portal is keyboard-navigable and includes a "Skip to main content" link. See the <Link to="/accessibility-statement">Accessibility Statement</Link> for details.</p>
    </StaticPage>
  );
}
