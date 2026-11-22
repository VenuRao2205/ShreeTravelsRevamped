import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { LeadModel } from "@/models";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await connectDB();
  const leads = await LeadModel.find().sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ leads });
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
