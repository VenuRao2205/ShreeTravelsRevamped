import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { BillModel, PaymentRequestModel } from "@/models";
import { billSchema } from "@/lib/billing";
import { withTotals } from "@/lib/bill-store";

type Ctx = { params: Promise<{ id: string }> };
const bad = () => NextResponse.json({ error: "Invalid request" }, { status: 400 });

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad();
  await connectDB();
  const doc = await BillModel.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad();
  const p = billSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Please check the bill details." }, { status: 400 });
  await connectDB();
  const old = await BillModel.findById(id).select("totals billNo").lean();
  if (!old) return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  const next = withTotals(p.data);
  if (Math.abs((old.totals?.total ?? 0) - next.totals.total) > 0.001 && (await PaymentRequestModel.exists({ "invoices.billId": id })))
    return NextResponse.json({ error: "This bill is attached to a payment link, so its total cannot change. Delete the link first, or make a new bill." }, { status: 409 });
  try {
    await BillModel.replaceOne({ _id: id }, next);
    return NextResponse.json({ id, billNo: next.billNo, total: next.totals.total });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return NextResponse.json({ error: `Invoice number ${p.data.billNo} is already used. Pick another number.` }, { status: 409 });
    console.error("bill update failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not save the bill." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad();
  await connectDB();
  if (await PaymentRequestModel.exists({ "invoices.billId": id }))
    return NextResponse.json({ error: "This bill is attached to a payment link. Delete or detach it there first." }, { status: 409 });
  await BillModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
