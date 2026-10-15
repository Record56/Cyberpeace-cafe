import { readFileSync } from "fs";
import path from "path";
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getBrandLogoBuffer() {
  return readFileSync(
    path.join(process.cwd(), "public", "cyberpeace-cafe-logo.jpg")
  );
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

function buildPassHtml(data: TicketEmailData, dateLine: string) {
  const name = escapeHtml(data.name);
  const ticketId = escapeHtml(data.ticketId);
  const category = escapeHtml(data.category);
  const venue = escapeHtml(data.venue);
  const eventName = escapeHtml(data.eventName);
  const dateSafe = escapeHtml(dateLine);
  const accessLevel = escapeHtml(
    data.category.toUpperCase().replace(/\s+PASS$/i, "").trim() || data.category
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${eventName} — Virtual Entry Pass</title>
</head>
<body style="margin:0;padding:0;background:#05050a;color:#F8FAFC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#05050a;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#07070f;border:2px solid #5b21b6;border-radius:18px;overflow:hidden;box-shadow:0 0 0 1px #0891b2,0 0 28px rgba(91,33,182,0.45);">
          <!-- Brand logo -->
          <tr>
            <td align="center" style="padding:22px 24px 6px;background:linear-gradient(180deg,#12122a 0%,#07070f 100%);">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background:#ffffff;border-radius:16px;border:2px solid #22d3ee;box-shadow:0 0 18px rgba(34,211,238,0.35);">
                <tr>
                  <td style="padding:10px;">
                    <img src="cid:brand-logo" alt="CyberPeace Café" width="120" height="120" style="display:block;border:0;outline:none;width:120px;height:120px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:14px 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #7c3aed;border-radius:8px;background:#0a0a16;">
                <tr>
                  <td style="padding:10px 22px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:3px;font-weight:700;color:#ffffff;text-transform:uppercase;">
                    VIRTUAL ENTRY PASS
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Event title -->
          <tr>
            <td align="center" style="padding:16px 28px 8px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.35;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#f5d76e;">
              ${eventName}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 28px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;">
              ${venue}
            </td>
          </tr>

          <!-- Center badge / status -->
          <tr>
            <td align="center" style="padding:8px 20px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="28%" align="left" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1px;color:#67e8f9;text-transform:uppercase;line-height:1.6;">
                    EVENT PASS<br />
                    <span style="color:#94A3B8;">CYBERNETIC DIGITAL</span>
                  </td>
                  <td width="44%" align="center" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;color:#67e8f9;text-transform:uppercase;font-weight:700;">
                    CYBERPEACE<br />
                    <span style="color:#f5d76e;">CAFÉ</span>
                  </td>
                  <td width="28%" align="right" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1px;color:#c4b5fd;text-transform:uppercase;line-height:1.6;">
                    ONLINE / REGISTERED<br />
                    <span style="color:#39ff14;font-weight:700;">ACCESS GRANTED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Player info -->
          <tr>
            <td style="padding:0 20px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #0891b2;border-radius:10px;background:#0a1220;">
                <tr>
                  <td width="50%" style="padding:14px 16px;border-right:1px solid #1e3a5f;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;color:#cbd5e1;text-transform:uppercase;">
                    PLAYER<br />
                    <span style="display:inline-block;margin-top:6px;font-size:14px;letter-spacing:0.5px;color:#f5d76e;font-weight:700;text-transform:none;">${name}</span>
                  </td>
                  <td width="50%" style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;color:#cbd5e1;text-transform:uppercase;">
                    ACCESS LEVEL<br />
                    <span style="display:inline-block;margin-top:6px;font-size:14px;letter-spacing:0.5px;color:#f5d76e;font-weight:700;">${accessLevel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR -->
          <tr>
            <td align="center" style="padding:6px 20px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;color:#e2e8f0;text-transform:uppercase;font-weight:700;">
              SCAN TO ENTER
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 20px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;border:2px solid #22d3ee;border-radius:14px;background:#ffffff;box-shadow:0 0 20px rgba(34,211,238,0.4);">
                <tr>
                  <td style="padding:14px;">
                    <img src="cid:ticket-qr" alt="QR Pass" width="220" height="220" style="display:block;border:0;outline:none;width:220px;height:220px;" />
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#64748B;line-height:1.5;">
                Show this QR at the gate. Duplicate scans will be blocked.
              </p>
            </td>
          </tr>

          <!-- Footer meta -->
          <tr>
            <td style="padding:0 20px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #1e293b;">
                <tr>
                  <td width="55%" style="padding-top:16px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#e2e8f0;letter-spacing:0.5px;">
                    TICKET ID:<br />
                    <span style="color:#67e8f9;font-weight:700;">${ticketId}</span>
                  </td>
                  <td width="45%" align="right" style="padding-top:16px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#e2e8f0;letter-spacing:0.5px;">
                    DATE:<br />
                    <span style="color:#f5d76e;font-weight:700;">${dateSafe}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Category chip -->
          <tr>
            <td align="center" style="padding:0 20px 24px;">
              <span style="display:inline-block;padding:8px 16px;border-radius:999px;border:1px solid #7c3aed;background:#12081f;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;color:#c4b5fd;text-transform:uppercase;">
                ${category}
              </span>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#475569;text-align:center;">
          CyberPeace Café · This pass is unique to you
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendTicketEmail(data: TicketEmailData) {
  const qrPayload = buildTicketPayload(data.ticketId);
  const qrDataUrl = await generateQrDataUrl(qrPayload);
  const base64 = qrDataUrl.split(",")[1];
  const brandLogo = getBrandLogoBuffer();

  const dateLine =
    data.validFrom && data.validTo && data.validFrom !== data.validTo
      ? `${data.validFrom} → ${data.validTo}`
      : data.eventDate;

  const html = buildPassHtml(data, dateLine);

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "CyberPeace Events <noreply@cyberpeace.org>",
    to: data.email,
    subject: `${data.eventName} — Virtual Entry Pass (${data.category})`,
    html,
    attachments: [
      {
        filename: "cyberpeace-cafe-logo.jpg",
        content: brandLogo,
        cid: "brand-logo",
        contentType: "image/jpeg",
      },
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
