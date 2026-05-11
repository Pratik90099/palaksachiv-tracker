import { StaticPage } from "./StaticPage";

export default function AccessibilityPage() {
  return (
    <StaticPage title="Accessibility Statement" lastUpdated="11 May 2026">
      <p>The Guardian Secretary Portal is committed to ensuring digital accessibility for all users, including persons with disabilities, in line with the Guidelines for Indian Government Websites (GIGW 3.0) and WCAG 2.1 Level AA.</p>

      <h2>Conformance status</h2>
      <p>This portal endeavours to conform to WCAG 2.1 Level AA. The application has been tested with screen readers, keyboard-only navigation, and high-contrast modes.</p>

      <h2>Features provided</h2>
      <ul>
        <li>"Skip to main content" link on every page (press Tab on load).</li>
        <li>Adjustable text size controls (A-, A, A+) in the footer.</li>
        <li>Semantic landmarks: header, navigation, main, contentinfo.</li>
        <li>Alt text on informational images; decorative images marked appropriately.</li>
        <li>Keyboard-navigable menus, dialogs, and forms.</li>
        <li>Sufficient colour contrast on text and interactive controls.</li>
        <li>English primary interface with Marathi on field-officer screens.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>Some embedded data visualisations (heat maps, charts) provide tabular fallback views accessible from the same page. We are progressively enhancing screen-reader support for these widgets.</p>

      <h2>Report an accessibility issue</h2>
      <p>If you encounter an accessibility barrier, please contact the Chief Secretary's Office through the <a href="/contact-us">Contact Us</a> page so we can investigate and address it.</p>
    </StaticPage>
  );
}
