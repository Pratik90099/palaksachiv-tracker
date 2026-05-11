import { StaticPage } from "./StaticPage";

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" lastUpdated="11 May 2026">
      <p>The Guardian Secretary Portal ("Portal") is operated by the Chief Secretary's Office, Government of Maharashtra. This policy describes how official data is collected, stored, processed and shared on the Portal.</p>

      <h2>Information collected</h2>
      <ul>
        <li>Officer identity: name, government email, designation, department, district, role.</li>
        <li>Operational data: tasks, projects, visit reports, meeting minutes, escalations, remarks.</li>
        <li>System logs: login timestamps, IP addresses, audit trails of changes (retained for 10 years).</li>
        <li>Anonymous visit counts for public reporting.</li>
      </ul>

      <h2>Lawful basis</h2>
      <p>Information is processed in furtherance of official functions of the State Government and in pursuance of duties cast on the Chief Secretary's Office.</p>

      <h2>Sharing</h2>
      <p>Data is shared only with authorised officers in accordance with role-based access controls and is not transferred to any third-party for commercial purposes.</p>

      <h2>Retention</h2>
      <p>Operational records are retained for a minimum of 10 years to satisfy administrative and audit requirements.</p>

      <h2>Security</h2>
      <p>The Portal uses encryption in transit (HTTPS), Row-Level Security on the database, OTP-based authentication, server-side input validation and audit logging.</p>

      <h2>Grievance Officer</h2>
      <p>Chief Secretary's Office, Mantralaya, Mumbai 400 032 — see <a href="/contact-us">Contact Us</a>.</p>
    </StaticPage>
  );
}
