import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { LeadModel } from "@/models";
import { sendLeadEmails } from "@/lib/mail";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, "Invalid phone number"),
  service: z.string().trim().max(100).optional(),
  message: z.string().trim().min(5).max(2000),
  website: z.string().max(0).optional(), // honeypot: bots fill this in
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form fields." }, { status: 400 });
  }
  const { website: _honeypot, ...data } = parsed.data;
  void _honeypot;

  try {
    await connectDB();
    await LeadModel.create({ ...data, email: data.email || undefined });
  } catch (e) {
    console.error("lead save failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not save your enquiry. Please call us." }, { status: 500 });
  }

  // The lead is safely stored; an email failure must not fail the request.
  try {
    await sendLeadEmails({ ...data, email: data.email || undefined });
  } catch (e) {
    console.error("lead email failed", e instanceof Error ? e.message : e);
  }
  return NextResponse.json({ ok: true });
}
