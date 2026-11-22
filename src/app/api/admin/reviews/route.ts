import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { ReviewModel } from "@/models";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await connectDB();
  const reviews = await ReviewModel.find().sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ reviews });
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
