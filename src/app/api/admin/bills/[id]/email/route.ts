import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { BillModel } from "@/models";
import { renderBillPdf } from "@/lib/bill-pdf";
import { pdfName, toBillInput } from "@/lib/bill-store";
import { inr, totalsOf } from "@/lib/billing";
import { sendBillEmail } from "@/lib/mail";

export const runtime = "nodejs";
const body = z.object({ to: z.string().trim().email().max(200) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || !mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  await connectDB();
  const doc = await BillModel.findById(id).lean();
  const bill = doc && toBillInput(doc as unknown as Record<string, unknown>);
  if (!bill) return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  try {
    const pdf = Buffer.from(await renderBillPdf(bill));
    await sendBillEmail({ to: p.data.to, name: bill.customerName, billNo: bill.billNo, total: inr(totalsOf(bill).total), pdf, filename: pdfName(bill.billNo) });
  } catch (e) {
    console.error("bill email failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The email could not be sent. Check the mail settings, or download the PDF and send it yourself." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, to: p.data.to });
}
