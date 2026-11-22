import { NextResponse } from "next/server";
import { reconcilePayment } from "@/lib/reconcile";

export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!orderId || !/^ST(-[0-9a-f-]{36}|[0-9a-f]{32})$/.test(orderId)) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
  try {
    const payment = await reconcilePayment(orderId);
    if (!payment) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({
      state: payment.state,
      merchantOrderId: payment.merchantOrderId,
      amount: payment.amount / 100,
      name: payment.name,
    });
  } catch (e) {
    console.error("payment status failed", e);
    return NextResponse.json({ error: "Could not check status" }, { status: 502 });
  }
}
