import { NextRequest } from "next/server";
import { Readable } from "stream";
import ExcelJS from "exceljs";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Attendee } from "@/models/Attendee";
import { EventSettings } from "@/models/EventSettings";
import { generateTicketId } from "@/lib/ticket-id";
import { buildTicketPayload } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { isValidCategory, jsonError } from "@/lib/validation";

interface BulkRow {
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  eventDate?: string;
  validFrom?: string;
  validTo?: string;
  venue?: string;
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[\s_-]+/g, "");
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    if ("result" in value && value.result != null) {
      return cellToString(value.result as ExcelJS.CellValue);
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim();
    }
    if ("hyperlink" in value && "text" in value) {
      return String((value as ExcelJS.CellHyperlinkValue).text ?? "").trim();
    }
  }
  return String(value).trim();
}

function mapRow(raw: Record<string, unknown>): BulkRow {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null || value === "") continue;
    mapped[normalizeKey(key)] = String(value).trim();
  }
  return {
    name: mapped.name || mapped.fullname || mapped.attendeename,
    email: mapped.email || mapped.mail,
    phone: mapped.phone || mapped.mobile,
    category: mapped.category || mapped.passtype || mapped.ticketcategory,
    eventDate: mapped.eventdate || mapped.date,
    validFrom: mapped.validfrom || mapped.from,
    validTo: mapped.validto || mapped.to,
    venue: mapped.venue,
  };
}

async function parseSpreadsheet(file: File): Promise<Record<string, unknown>[]> {
  const data = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    await workbook.csv.read(Readable.from(Buffer.from(data)));
  } else {
    await workbook.xlsx.load(data);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = cellToString(cell.value);
  });

  const rows: Record<string, unknown>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, unknown> = {};
    let hasValue = false;
    headers.forEach((header, colNumber) => {
      if (!header) return;
      const value = cellToString(row.getCell(colNumber).value);
      if (value) {
        obj[header] = value;
        hasValue = true;
      }
    });
    if (hasValue) rows.push(obj);
  });

  return rows;
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();

    const form = await req.formData();
    const file = form.get("file");
    const sendEmail = form.get("sendEmail") !== "false";

    if (!(file instanceof File)) {
      return jsonError("CSV/Excel file is required");
    }

    const rows = await parseSpreadsheet(file);

    if (!rows.length) return jsonError("File has no rows");

    const settings = await EventSettings.findOne().lean();
    const defaultEventName = settings?.eventName || process.env.EVENT_NAME || "CyberPeace Cafe";
    const defaultVenue = settings?.venue || process.env.EVENT_VENUE || "Main Venue";

    const created = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = mapRow(rows[i]);
      const name = row.name?.trim();
      const email = row.email?.toLowerCase().trim();
      const category = row.category?.trim();
      const eventDate = row.eventDate?.trim();

      if (!name || !email || !category || !eventDate) {
        errors.push({ row: i + 2, error: "Missing name/email/category/eventDate" });
        continue;
      }
      if (!isValidCategory(category)) {
        errors.push({ row: i + 2, error: `Invalid category: ${category}` });
        continue;
      }

      const validFrom = row.validFrom || eventDate;
      const validTo = row.validTo || eventDate;
      const venue = row.venue || defaultVenue;
      const ticketId = generateTicketId();

      try {
        const attendee = await Attendee.create({
          name,
          email,
          phone: row.phone,
          ticketId,
          category,
          eventDate,
          validFrom,
          validTo,
          venue,
          eventName: defaultEventName,
          qrPayload: buildTicketPayload(ticketId),
          emailStatus: sendEmail ? "pending" : "not_sent",
          status: "registered",
        });

        if (sendEmail) {
          try {
            await sendTicketEmail({
              name,
              email,
              ticketId,
              category,
              eventDate,
              validFrom,
              validTo,
              venue,
              eventName: defaultEventName,
            });
            attendee.emailStatus = "sent";
            attendee.emailSentAt = new Date();
            await attendee.save();
          } catch (emailError) {
            attendee.emailStatus = "failed";
            attendee.emailError =
              emailError instanceof Error ? emailError.message : "Email failed";
            await attendee.save();
          }
        }

        created.push({
          id: attendee._id,
          ticketId: attendee.ticketId,
          email: attendee.email,
          emailStatus: attendee.emailStatus,
        });
      } catch (createError) {
        errors.push({
          row: i + 2,
          error: createError instanceof Error ? createError.message : "Create failed",
        });
      }
    }

    return Response.json({
      createdCount: created.length,
      errorCount: errors.length,
      created,
      errors,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Bulk upload failed", 500);
  }
}
