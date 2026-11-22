import { NextResponse } from "next/server";
import { z } from "zod";
import { startPayment } from "@/lib/start-payment";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(20).optional(),
  remarks: z.string().trim().min(1, "Invoice number is required").max(200), // invoice number
  amountRupees: z.number().min(1).max(500000),
  mode: z.enum(["page", "qr"]).default("page"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the payment details." }, { status: 400 });
  }
  const { amountRupees, ...rest } = parsed.data;
  const r = await startPayment({ req, ...rest, amountPaise: Math.round(amountRupees * 100) }); // amount is computed server-side only
  return NextResponse.json(r.body, { status: r.status });
}
