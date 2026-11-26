import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { MisTemplateModel } from "@/models";
import { carryOver, detectTemplate } from "@/lib/mis-template";

export const runtime = "nodejs";
const MAX = 2 * 1024 * 1024;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await connectDB();
  const rows = await MisTemplateModel.find().select("customerName fileName updatedAt columns").sort({ customerName: 1 }).lean();
  return NextResponse.json({
    rows: rows.map((r) => ({ _id: String(r._id), customerName: r.customerName, fileName: r.fileName, updatedAt: r.updatedAt, columns: (r.columns ?? []).filter((c) => c.source !== "skip").length })),
  });
}

/** Upload a customer's MIS Excel. Sending a new file for the same customer replaces the sheet but keeps the mapping you already set. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const name = String(form?.get("customerName") ?? "").trim().slice(0, 120);
  if (!(file instanceof File) || name.length < 2) return NextResponse.json({ error: "Choose the customer and the Excel file." }, { status: 400 });
  if (!/\.xlsx$/i.test(file.name)) return NextResponse.json({ error: "Please upload an .xlsx file. Save older .xls files as .xlsx in Excel first." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "That file is over 2 MB. Remove extra sheets or images and try again." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const found = await detectTemplate(buf);
    await connectDB();
    const key = name.toLowerCase();
    const old = await MisTemplateModel.findOne({ customerKey: key }).select("columns people").lean();
    const cfg = carryOver(found, old as never);
    const doc = await MisTemplateModel.findOneAndUpdate(
      { customerKey: key },
      { customerName: name, customerKey: key, fileName: file.name.slice(0, 120), file: buf, headerRow: cfg.headerRow, dataStartRow: cfg.dataStartRow, columns: cfg.columns, people: cfg.people },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).select("_id");
    return NextResponse.json({ id: String(doc._id), replaced: !!old });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not read that Excel file." }, { status: 400 });
  }
}
