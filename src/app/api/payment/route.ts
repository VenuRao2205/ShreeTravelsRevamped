import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/models";
import { createPayment } from "@/lib/phonepe";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(20).optional(),
  remarks: z.string().trim().max(200).optional(),
  amountRupees: z.number().min(1).max(500000),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the payment details." }, { status: 400 });
  }
  const { amountRupees, ...rest } = parsed.data;
  const amountPaise = Math.round(amountRupees * 100); // amount is computed server-side only
  const merchantOrderId = `ST${randomUUID().replace(/-/g, "")}`; // 34 chars (PhonePe v1 allows 35)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  try {
    await connectDB();
    await PaymentModel.create({ merchantOrderId, amount: amountPaise, ...rest });
    const res = await createPayment({
      merchantOrderId,
      amountPaise,
      callbackUrl: `${siteUrl}/api/payment/webhook`,
      redirectUrl: `${siteUrl}/payment/status?orderId=${merchantOrderId}`,
    });
    await PaymentModel.updateOne(
      { merchantOrderId },
      { state: "PENDING", phonepeOrderId: res.orderId },
    );
    return NextResponse.json({ redirectUrl: res.redirectUrl });
  } catch (e) {
    console.error("payment create failed", e);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 502 });
  }
}
