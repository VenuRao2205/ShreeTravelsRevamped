import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ReviewModel } from "@/models";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  company: z.string().trim().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1000),
  website: z.string().max(0).optional(), // honeypot
});

export async function GET() {
  await connectDB();
  const reviews = await ReviewModel.find({ approved: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("name company rating comment createdAt -_id")
    .lean();
  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your review." }, { status: 400 });
  }
  const { website: _honeypot, ...data } = parsed.data;
  void _honeypot;
  await connectDB();
  await ReviewModel.create({ ...data, approved: false }); // moderated before it shows publicly
  return NextResponse.json({ ok: true });
}
