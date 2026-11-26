import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { BillModel } from "@/models";
import { renderBillPdf } from "@/lib/bill-pdf";
import { pdfName, pdfResponse, toBillInput } from "@/lib/bill-store";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await connectDB();
  const doc = await BillModel.findById(id).lean();
  const bill = doc && toBillInput(doc as unknown as Record<string, unknown>);
  if (!bill) return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  return pdfResponse(await renderBillPdf(bill), pdfName(bill.billNo), new URL(req.url).searchParams.get("download") === "1");
}
