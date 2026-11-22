import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { reconcilePayment } from "@/lib/reconcile";

// PhonePe sends Authorization = SHA256("username:password") using the
// credentials you set when creating the webhook in the PhonePe dashboard.
function authorized(req: Request) {
  const user = process.env.PHONEPE_WEBHOOK_USER;
  const pass = process.env.PHONEPE_WEBHOOK_PASS;
  if (!user || !pass) return false; // refuse until configured
  const expected = createHash("sha256").update(`${user}:${pass}`).digest("hex");
  const got = (req.headers.get("authorization") ?? "").replace(/^SHA256\(?|\)$/gi, "").trim();
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const orderId: unknown = body?.payload?.merchantOrderId;
  if (typeof orderId !== "string") return NextResponse.json({ ok: true });

  // Never trust the webhook body for state: re-verify with PhonePe's status API.
  try {
    await reconcilePayment(orderId);
  } catch (e) {
    console.error("webhook reconcile failed", e);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
