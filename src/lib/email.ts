import nodemailer from "nodemailer";
import { generateQrDataUrl, buildTicketPayload } from "./qr";

export interface TicketEmailData {
  name: string;
  email: string;
  ticketId: string;
  category: string;
  eventDate: string;
  validFrom?: string;
  validTo?: string;
  venue: string;
  eventName: string;
}

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error(
      "SMTP credentials missing. Set SMTP_USER and SMTP_PASS in .env.local"
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zeptomail.in",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

export async function sendTicketEmail(data: TicketEmailData) {
  const qrPayload = buildTicketPayload(data.ticketId);
  const qrDataUrl = await generateQrDataUrl(qrPayload);
  const base64 = qrDataUrl.split(",")[1];

  const dateLine =
    data.validFrom && data.validTo && data.validFrom !== data.validTo
      ? `${data.validFrom} → ${data.validTo}`
      : data.eventDate;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0B1220;color:#F8FAFC;padding:28px;border-radius:16px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#5EEAD4;">${data.eventName}</h1>
      <p style="margin:0 0 20px;color:#94A3B8;">Your entry pass is ready. Show this QR at the gate.</p>
      <div style="background:#111827;border:1px solid #1F2937;border-radius:12px;padding:20px;">
        <p style="margin:0 0 6px;"><strong>Name:</strong> ${data.name}</p>
        <p style="margin:0 0 6px;"><strong>Ticket ID:</strong> ${data.ticketId}</p>
        <p style="margin:0 0 6px;"><strong>Category:</strong> ${data.category}</p>
        <p style="margin:0 0 6px;"><strong>Event Date:</strong> ${dateLine}</p>
        <p style="margin:0 0 18px;"><strong>Venue:</strong> ${data.venue}</p>
        <div style="text-align:center;">
          <img src="cid:ticket-qr" alt="QR Pass" width="220" height="220" style="border-radius:12px;background:#fff;padding:10px;" />
        </div>
      </div>
      <p style="margin:18px 0 0;font-size:12px;color:#64748B;">This pass is unique to you. Duplicate scans will be blocked at entry.</p>
    </div>
  `;

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "CyberPeace Events <noreply@cyberpeace.org>",
    to: data.email,
    subject: `${data.eventName} — ${data.category} Pass`,
    html,
    attachments: [
      {
        filename: `${data.ticketId}-qr.png`,
        content: Buffer.from(base64, "base64"),
        cid: "ticket-qr",
        contentType: "image/png",
      },
    ],
  });

  return { messageId: info.messageId, qrDataUrl };
}
