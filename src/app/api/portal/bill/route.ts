import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { currentRequest } from "@/lib/portal";
import { connectDB } from "@/lib/db";
import { BillModel } from "@/models";
import { renderBillPdf } from "@/lib/bill-pdf";
import { pdfName, pdfResponse, toBillInput } from "@/lib/bill-store";

export const runtime = "nodejs";

/** A signed-in customer can download the bill attached to one of their own invoices, and nothing else. */
export async function GET(req: Request) {
  const doc = await currentRequest();
  if (!doc) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const key = new URL(req.url).searchParams.get("key");
  const inv = doc.invoices.find((i) => i.key === key);
  if (!inv?.billId || !mongoose.isValidObjectId(String(inv.billId))) return NextResponse.json({ error: "No bill is attached to this invoice." }, { status: 404 });
  await connectDB();
  const bill = await BillModel.findById(inv.billId).lean();
  const input = bill && toBillInput(bill as unknown as Record<string, unknown>);
  if (!input) return NextResponse.json({ error: "No bill is attached to this invoice." }, { status: 404 });
  return pdfResponse(await renderBillPdf(input), pdfName(input.billNo), new URL(req.url).searchParams.get("download") === "1");
}
