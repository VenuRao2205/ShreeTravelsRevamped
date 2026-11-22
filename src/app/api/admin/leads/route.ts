import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { LeadModel } from "@/models";
import { dateFilter, pageOf, parseList, rx } from "@/lib/admin-query";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const q = parseList(req);
  if (!q) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  await connectDB();
  const filter: Record<string, unknown> = { ...dateFilter(q) };
  if (q.status && ["new", "contacted", "converted", "closed"].includes(q.status)) filter.status = q.status;
  if (q.q) filter.$or = ["name", "phone", "email", "message", "service"].map((f) => ({ [f]: rx(q.q!) }));
  const [rows, total] = await Promise.all([
    LeadModel.find(filter).sort({ createdAt: -1 }).skip(pageOf(q).skip).limit(q.pageSize).lean(),
    LeadModel.countDocuments(filter),
  ]);
  return NextResponse.json({ rows, total, page: q.page, pageSize: q.pageSize });
}

const patch = z.object({ id: z.string(), status: z.enum(["new", "contacted", "converted", "closed"]) });

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = patch.safeParse(await req.json().catch(() => null));
  if (!p.success || !mongoose.isValidObjectId(p.data.id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await connectDB();
  await LeadModel.updateOne({ _id: p.data.id }, { status: p.data.status });
  return NextResponse.json({ ok: true });
}
