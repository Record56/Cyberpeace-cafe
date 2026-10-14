import QRCode from "qrcode";

export async function generateQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: {
      dark: "#0B1220",
      light: "#FFFFFF",
    },
  });
}

export function buildTicketPayload(ticketId: string) {
  return JSON.stringify({
    v: 1,
    ticketId,
    app: "cyberpeace-cafe",
  });
}
