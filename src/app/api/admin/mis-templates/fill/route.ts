import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { BillModel, MisTemplateModel } from "@/models";
import { toBillInput } from "@/lib/bill-store";
import { fillTemplate, type MisColumn, type SourceId } from "@/lib/mis-template";

export const runtime = "nodejs";
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const q = z.object({ id: z.string(), from: day, to: day, bill: z.string().trim().max(30).optional() });

/** The customer's MIS sheet, filled from their bills dated in the period (or just one invoice). */
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!p.success || !mongoose.isValidObjectId(p.data.id) || p.data.from > p.data.to) return NextResponse.json({ error: "Pick a valid period." }, { status: 400 });
  await connectDB();
  const t = await MisTemplateModel.findById(p.data.id);
  if (!t) return NextResponse.json({ error: "Template not found." }, { status: 404 });
  const docs = await BillModel.find({
    customerName: { $regex: `^${t.customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    ...(p.data.bill ? { billNo: p.data.bill } : { billDate: { $gte: p.data.from, $lte: p.data.to } }),
  }).sort({ billDate: 1, billNo: 1 }).limit(500).lean();
  const bills = docs.map((d) => toBillInput(d as unknown as Record<string, unknown>)).filter((b) => !!b);
  if (!bills.length) return NextResponse.json({ error: `No bills for ${t.customerName} in that period.` }, { status: 404 });
  try {
    const file = await fillTemplate(t.file, {
      headerRow: t.headerRow ?? 1, dataStartRow: t.dataStartRow ?? 2,
      columns: (t.columns ?? []).map((c) => ({ col: c.col ?? 0, header: c.header ?? "", source: (c.source ?? "skip") as SourceId, text: c.text ?? "", formula: c.formula ?? "" }) as MisColumn),
      people: (t.people ?? []).map((x) => ({ name: x.name ?? "", employeeId: x.employeeId ?? "", email: x.email ?? "", department: x.department ?? "" })),
    }, bills);
    const name = `${t.customerName.replace(/[^A-Za-z0-9]+/g, "-")}-MIS-${p.data.bill ? `invoice-${p.data.bill}` : `${p.data.from}-to-${p.data.to}`}.xlsx`;
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    console.error("mis fill failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not fill the template. Check the column settings." }, { status: 500 });
  }
}
