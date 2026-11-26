import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { MisTemplateModel } from "@/models";
import { SOURCE_IDS } from "@/lib/mis-template";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
const bad = () => NextResponse.json({ error: "Invalid request" }, { status: 400 });

const body = z.object({
  headerRow: z.number().int().min(1).max(50),
  dataStartRow: z.number().int().min(2).max(60),
  columns: z.array(z.object({ col: z.number().int().min(1).max(200), header: z.string().max(120), source: z.enum(SOURCE_IDS), text: z.string().max(200), formula: z.string().max(300) })).max(200),
  people: z.array(z.object({ name: z.string().trim().max(80), employeeId: z.string().trim().max(30), email: z.string().trim().max(120), department: z.string().trim().max(60) })).max(300),
});

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad();
  await connectDB();
  const doc = await MisTemplateModel.findById(id).select("-file").lean();
  if (!doc) return NextResponse.json({ error: "Template not found." }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad();
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please check the template settings." }, { status: 400 });
  await connectDB();
  const res = await MisTemplateModel.updateOne({ _id: id }, { ...p.data, people: p.data.people.filter((x) => x.name) });
  if (!res.matchedCount) return NextResponse.json({ error: "Template not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad();
  await connectDB();
  await MisTemplateModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
