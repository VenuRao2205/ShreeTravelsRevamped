import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/models";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await connectDB();
  const payments = await PaymentModel.find().sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ payments });
}
