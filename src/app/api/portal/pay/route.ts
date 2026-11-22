import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/models";
import { currentRequest } from "@/lib/portal";
import { reconcilePayment } from "@/lib/reconcile";
import { startPayment } from "@/lib/start-payment";

const schema = z.object({ keys: z.array(z.string()).min(1).max(40), mode: z.enum(["page", "qr"]).default("page") });
const MAX_PAISE = 500000 * 100;
const IN_FLIGHT_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Choose at least one invoice." }, { status: 400 });

  const doc = await currentRequest().catch(() => null);
  if (!doc) return NextResponse.json({ error: "Your login has expired. Please sign in again." }, { status: 401 });

  // The amount always comes from our records, never from the browser.
  const chosen = doc.invoices.filter((i) => p.data.keys.includes(i.key));
  if (chosen.length !== new Set(p.data.keys).size) return NextResponse.json({ error: "Some invoices were not found." }, { status: 400 });
  if (chosen.some((i) => i.status === "PAID")) return NextResponse.json({ error: "One of these invoices is already paid. Please refresh the page." }, { status: 409 });
  const total = chosen.reduce((a, i) => a + i.amount, 0);
  if (total > MAX_PAISE) return NextResponse.json({ error: "That total is above Rs 5,00,000. Please pay fewer invoices at a time." }, { status: 400 });

  // Do not allow a second payment for invoices that already have one in progress.
  await connectDB();
  const keys = chosen.map((i) => i.key);
  const open = await PaymentModel.find({
    requestId: doc._id,
    invoiceKeys: { $in: keys },
    state: { $in: ["INITIATED", "PENDING"] },
    createdAt: { $gt: new Date(Date.now() - IN_FLIGHT_MS) },
  }).lean();
  for (const o of open) await reconcilePayment(o.merchantOrderId).catch(() => null); // ask PhonePe what really happened
  const stillOpen = open.length ? await PaymentModel.countDocuments({ _id: { $in: open.map((o) => o._id) }, state: { $in: ["INITIATED", "PENDING"] } }) : 0;
  const fresh = open.length ? await currentRequest().catch(() => null) : doc;
  if (!fresh) return NextResponse.json({ error: "Your login has expired. Please sign in again." }, { status: 401 });
  if (fresh.invoices.some((i) => keys.includes(i.key) && i.status === "PAID")) {
    return NextResponse.json({ error: "Those invoices were just paid. Please refresh the page." }, { status: 409 });
  }
  if (stillOpen > 0) {
    return NextResponse.json({ error: "A payment for these invoices is still in progress. Please wait a few minutes, then try again." }, { status: 409 });
  }

  const r = await startPayment({
    req,
    name: doc.customerName,
    email: doc.customerEmail,
    remarks: chosen.map((i) => i.number).join(", ").slice(0, 200),
    amountPaise: total,
    mode: p.data.mode,
    requestId: String(doc._id),
    invoiceKeys: keys,
  });
  return NextResponse.json(r.body, { status: r.status });
}
