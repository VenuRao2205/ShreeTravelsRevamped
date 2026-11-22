import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { ReviewModel } from "@/models";
import { dateFilter, pageOf, parseList, rx } from "@/lib/admin-query";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const q = parseList(req);
  if (!q) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  await connectDB();
  // Counts ignore the status filter so the filter chips can show how many each holds.
  const base: Record<string, unknown> = { ...dateFilter(q) };
  if (q.q) base.$or = ["name", "company", "comment"].map((f) => ({ [f]: rx(q.q!) }));
  const filter: Record<string, unknown> = { ...base };
  if (q.status === "pending") filter.approved = false;
  if (q.status === "published") filter.approved = true;
  const [rows, total, published, all] = await Promise.all([
    ReviewModel.find(filter).sort({ createdAt: -1 }).skip(pageOf(q).skip).limit(q.pageSize).lean(),
    ReviewModel.countDocuments(filter),
    ReviewModel.countDocuments({ ...base, approved: true }),
    ReviewModel.countDocuments(base),
  ]);
  return NextResponse.json({ rows, total, page: q.page, pageSize: q.pageSize, counts: { all, published, pending: all - published } });
}

const patch = z.object({ id: z.string(), approved: z.boolean() });

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = patch.safeParse(await req.json().catch(() => null));
  if (!p.success || !mongoose.isValidObjectId(p.data.id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await connectDB();
  await ReviewModel.updateOne({ _id: p.data.id }, { approved: p.data.approved });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await connectDB();
  await ReviewModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
