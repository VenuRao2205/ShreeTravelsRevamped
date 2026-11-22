import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { PaymentRequestModel } from "@/models";
import { hashPassword, newLoginId, newPassword, pretty } from "@/lib/portal";

const DAY = 86_400_000;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await connectDB();
  const requests = await PaymentRequestModel.find().select("-passwordHash").sort({ createdAt: -1 }).limit(300).lean();
  return NextResponse.json({ requests });
}

const create = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(200),
  expiryDays: z.number().int().min(1).max(90).default(7),
  invoices: z
    .array(
      z.object({
        number: z.string().trim().min(1).max(60),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        amountRupees: z.number().min(1).max(500000),
      }),
    )
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = create.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please check the customer and invoice details." }, { status: 400 });
  const d = p.data;
  const numbers = d.invoices.map((i) => i.number.toLowerCase());
  if (new Set(numbers).size !== numbers.length) return NextResponse.json({ error: "Two invoices have the same number." }, { status: 400 });

  await connectDB();
  const password = newPassword();
  let loginId = newLoginId();
  for (let i = 0; i < 5 && (await PaymentRequestModel.exists({ loginId })); i++) loginId = newLoginId();
  const doc = await PaymentRequestModel.create({
    customerName: d.customerName,
    customerEmail: d.customerEmail,
    loginId,
    passwordHash: hashPassword(password),
    expiresAt: new Date(Date.now() + d.expiryDays * DAY),
    invoices: d.invoices.map((i) => ({
      key: randomBytes(5).toString("hex"),
      number: i.number,
      date: new Date(i.date),
      amount: Math.round(i.amountRupees * 100),
    })),
  });
  // The password is returned this once. Only its hash is stored.
  return NextResponse.json({ id: String(doc._id), loginId: pretty(loginId, 4), password: pretty(password, 5), expiresAt: doc.expiresAt });
}

const patch = z.object({
  id: z.string(),
  action: z.enum(["revoke", "restore", "extend", "reset-password"]),
  days: z.number().int().min(1).max(90).optional(),
});

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = patch.safeParse(await req.json().catch(() => null));
  if (!p.success || !mongoose.isValidObjectId(p.data.id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await connectDB();
  const { id, action, days } = p.data;
  if (action === "revoke") await PaymentRequestModel.updateOne({ _id: id }, { revoked: true });
  if (action === "restore") await PaymentRequestModel.updateOne({ _id: id }, { revoked: false, failedAttempts: 0, $unset: { lockedUntil: 1 } });
  if (action === "extend") await PaymentRequestModel.updateOne({ _id: id }, { expiresAt: new Date(Date.now() + (days ?? 7) * DAY), revoked: false });
  if (action === "reset-password") {
    const password = newPassword();
    await PaymentRequestModel.updateOne({ _id: id }, { passwordHash: hashPassword(password), failedAttempts: 0, $unset: { lockedUntil: 1 } });
    return NextResponse.json({ ok: true, password: pretty(password, 5) });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await connectDB();
  await PaymentRequestModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
