import { StaticPage } from "./StaticPage";

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Use" lastUpdated="11 May 2026">
      <p>By accessing the Guardian Secretary Portal you agree to use it solely for official Government of Maharashtra business in accordance with applicable law and departmental rules.</p>

      <h2>Permitted use</h2>
      <ul>
        <li>Access is restricted to authorised officers of the Government of Maharashtra.</li>
        <li>Officers must not share login credentials or one-time codes.</li>
        <li>All actions are audited and attributable to the signed-in officer.</li>
      </ul>

      <h2>Prohibited use</h2>
      <ul>
        <li>Attempting to circumvent access controls, scraping data, or introducing malicious code.</li>
        <li>Disclosing classified or sensitive information to unauthorised parties.</li>
      </ul>

      <h2>Disclaimer</h2>
      <p>While every effort is made to ensure accuracy, the Government of Maharashtra is not liable for any loss arising from reliance on data within the Portal. Officers should verify critical decisions through official records.</p>

      <h2>Changes</h2>
      <p>These terms may be updated periodically. The current version is always shown here with the "Last updated" date.</p>
    </StaticPage>
  );
}
