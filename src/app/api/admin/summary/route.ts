import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { LeadModel, PaymentModel, ReviewModel } from "@/models";
import { dateFilter } from "@/lib/admin-query";

const schema = z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional(), chartFrom: z.string().datetime(), tz: z.string().max(40).optional() });

function zone(tz?: string) {
  try {
    if (tz) new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = schema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!p.success) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  const q = p.data;
  const df = dateFilter(q);
  const timezone = zone(q.tz);
  const day = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone } };
  await connectDB();

  const [leadsInRange, payStates, ratings, pendingReviews, newLeads, leadDays, payDays, fl, fr, fp] = await Promise.all([
    LeadModel.countDocuments(df),
    PaymentModel.aggregate([{ $match: df }, { $group: { _id: "$state", n: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
    ReviewModel.aggregate([{ $group: { _id: { rating: "$rating", approved: "$approved" }, n: { $sum: 1 } } }]),
    ReviewModel.countDocuments({ approved: false }),
    LeadModel.countDocuments({ status: "new" }),
    LeadModel.aggregate([{ $match: { createdAt: { $gte: new Date(q.chartFrom) } } }, { $group: { _id: day, n: { $sum: 1 } } }]),
    PaymentModel.aggregate([{ $match: { state: "COMPLETED", createdAt: { $gte: new Date(q.chartFrom) } } }, { $group: { _id: day, amount: { $sum: "$amount" } } }]),
    LeadModel.find(df).sort({ createdAt: -1 }).limit(8).select("name service message createdAt").lean(),
    ReviewModel.find(df).sort({ createdAt: -1 }).limit(8).select("name rating comment createdAt").lean(),
    PaymentModel.find(df).sort({ createdAt: -1 }).limit(8).select("name amount state remarks createdAt").lean(),
  ]);

  const st = (s: string) => payStates.find((x) => x._id === s);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: ratings.filter((r) => r._id.rating === n).reduce((a, r) => a + r.n, 0) }));
  const pub = ratings.filter((r) => r._id.approved);
  const pubCount = pub.reduce((a, r) => a + r.n, 0);
  const avg = pubCount ? pub.reduce((a, r) => a + r._id.rating * r.n, 0) / pubCount : 0;

  const feed = [
    ...fl.map((l) => ({ id: String(l._id), at: l.createdAt, kind: "lead", title: `${l.name} sent an enquiry`, sub: l.service || l.message.slice(0, 70) })),
    ...fr.map((r) => ({ id: String(r._id), at: r.createdAt, kind: "review", title: `${r.name} left ${r.rating}-star review`, sub: r.comment.slice(0, 70) })),
    ...fp.map((x) => ({ id: String(x._id), at: x.createdAt, kind: "payment", title: `${x.name}: Rs ${(x.amount / 100).toFixed(0)} ${x.state.toLowerCase()}`, sub: x.remarks ? `Invoice ${x.remarks}` : "" })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 8);

  return NextResponse.json({
    leadsInRange,
    paid: { count: st("COMPLETED")?.n ?? 0, amount: st("COMPLETED")?.amount ?? 0, failed: st("FAILED")?.n ?? 0 },
    avg, publishedCount: pubCount, dist,
    badges: { newLeads, pendingReviews },
    days: {
      leads: Object.fromEntries(leadDays.map((d) => [d._id, d.n])),
      payments: Object.fromEntries(payDays.map((d) => [d._id, d.amount])),
    },
    feed,
  });
}
