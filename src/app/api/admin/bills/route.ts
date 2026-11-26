import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { BillModel } from "@/models";
import { dateFilter, pageOf, parseList, rx } from "@/lib/admin-query";
import { billSchema, nextBillNo } from "@/lib/billing";
import { withTotals } from "@/lib/bill-store";

const LIST_FIELDS = "billNo billDate customerName customerCity customerEmail customerPhone totals createdAt";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await connectDB();
  const url = new URL(req.url);

  // Small helpers for the form: the next invoice number, and recent bills to attach to a payment link.
  if (url.searchParams.get("meta")) {
    const [last, recent, customers] = await Promise.all([
      BillModel.findOne().sort({ createdAt: -1 }).select("billNo").lean(),
      BillModel.find().sort({ createdAt: -1 }).limit(60).select(LIST_FIELDS).lean(),
      // the latest bill of each customer, so the form can fill in their details
      BillModel.aggregate([
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$customerName", customerCity: { $first: "$customerCity" }, bookedBy: { $first: "$bookedBy" }, customerGstin: { $first: "$customerGstin" }, customerEmail: { $first: "$customerEmail" }, customerPhone: { $first: "$customerPhone" }, gstMode: { $first: "$gstMode" }, gstRate: { $first: "$gstRate" }, rcm: { $first: "$rcm" } } },
        { $sort: { _id: 1 } },
        { $limit: 300 },
      ]),
    ]);
    return NextResponse.json({ next: nextBillNo(last?.billNo), recent, customers: customers.map(({ _id, ...c }) => ({ customerName: _id, ...c })) });
  }

  const q = parseList(req);
  if (!q) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  const filter: Record<string, unknown> = { ...dateFilter(q) };
  if (q.q) filter.$or = ["billNo", "customerName", "customerCity", "bookedBy", "items.passenger", "items.dutySlip", "items.taxiNo"].map((f) => ({ [f]: rx(q.q!) }));
  const [rows, total] = await Promise.all([
    BillModel.find(filter).sort({ createdAt: -1 }).skip(pageOf(q).skip).limit(q.pageSize).select(LIST_FIELDS).lean(),
    BillModel.countDocuments(filter),
  ]);
  return NextResponse.json({ rows, total, page: q.page, pageSize: q.pageSize });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = billSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Please check the bill details." }, { status: 400 });
  await connectDB();
  try {
    const doc = await BillModel.create(withTotals(p.data));
    return NextResponse.json({ id: String(doc._id), billNo: doc.billNo, total: doc.totals?.total });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return NextResponse.json({ error: `Invoice number ${p.data.billNo} is already used. Pick another number.` }, { status: 409 });
    console.error("bill create failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not save the bill." }, { status: 500 });
  }
}
