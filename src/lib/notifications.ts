import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`[email] SMTP not configured — skipping send to ${to}: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@trlnow.com",
    to,
    subject,
    html,
  });
}

export function shipmentStatusEmail(
  trackingNumber: string,
  status: string,
  description?: string | null,
  location?: string | null
) {
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    subject: `TrlNow — Shipment ${trackingNumber} status: ${label}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">TrlNow Shipment Update</h2>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p><strong>Status:</strong> ${label}</p>
        ${location ? `<p><strong>Location:</strong> ${location}</p>` : ""}
        ${description ? `<p><strong>Details:</strong> ${description}</p>` : ""}
        <hr/>
        <p style="color:#666;font-size:12px">© TrlNow. This is an automated message.</p>
      </div>
    `,
  };
}
