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
      <p>
        Helpdesk: <a href="tel:+912222025042">022-2202-5042</a> (Mon–Sat, 10 AM – 6 PM)<br />
        Email: <a href="mailto:cs@maharashtra.gov.in?cc=bavipratik@gmail.com,rishishirke65@gmail.com">cs@maharashtra.gov.in</a> (CC: bavipratik@gmail.com, rishishirke65@gmail.com)
      </p>
      <p>For technical support with the Guardian Secretary Portal, please use the contact details above or raise an issue from within the portal.</p>

      <h2>Grievance Officer</h2>
      <p>The grievance officer for this portal is the Joint Secretary (Coordination), Chief Secretary's Office.</p>
    </StaticPage>
  );
}
