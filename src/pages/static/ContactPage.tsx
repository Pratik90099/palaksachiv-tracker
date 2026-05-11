import { StaticPage } from "./StaticPage";

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us" lastUpdated="11 May 2026">
      <h2>Chief Secretary's Office</h2>
      <p>
        Mantralaya, Madame Cama Road,<br />
        Hutatma Rajguru Chowk,<br />
        Nariman Point, Mumbai 400 032,<br />
        Maharashtra, India.
      </p>

      <h2>Helpline</h2>
      <p>For technical support with the Guardian Secretary Portal, please raise an issue from within the portal using the "Report a problem" option, or write to the CSO IT cell.</p>

      <h2>Grievance Officer</h2>
      <p>The grievance officer for this portal is the Joint Secretary (Coordination), Chief Secretary's Office.</p>
    </StaticPage>
  );
}
