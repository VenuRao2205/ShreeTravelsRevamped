import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/models";
import { dateFilter, pageOf, parseList, rx } from "@/lib/admin-query";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const q = parseList(req);
  if (!q) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  await connectDB();
  const base: Record<string, unknown> = { ...dateFilter(q) };
  if (q.q) base.$or = ["name", "email", "remarks", "merchantOrderId"].map((f) => ({ [f]: rx(q.q!) }));
  const filter: Record<string, unknown> = { ...base };
  if (q.status && ["COMPLETED", "FAILED", "PENDING"].includes(q.status)) filter.state = q.status;
  const [rows, total, byState] = await Promise.all([
    PaymentModel.find(filter).sort({ createdAt: -1 }).skip(pageOf(q).skip).limit(q.pageSize).lean(),
    PaymentModel.countDocuments(filter),
    PaymentModel.aggregate([{ $match: base }, { $group: { _id: "$state", n: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
  ]);
  const get = (s: string) => byState.find((x) => x._id === s);
  const counts = { all: byState.reduce((a, x) => a + x.n, 0), COMPLETED: get("COMPLETED")?.n ?? 0, FAILED: get("FAILED")?.n ?? 0, PENDING: get("PENDING")?.n ?? 0 };
  return NextResponse.json({ rows, total, page: q.page, pageSize: q.pageSize, counts, paidTotal: get("COMPLETED")?.amount ?? 0 });
}
