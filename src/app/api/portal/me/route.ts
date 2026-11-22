import { NextResponse } from "next/server";
import { currentRequest } from "@/lib/portal";

export async function GET() {
  try {
    const doc = await currentRequest();
    if (!doc) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({
      name: doc.customerName,
      expiresAt: doc.expiresAt,
      invoices: doc.invoices.map((i) => ({ key: i.key, number: i.number, date: i.date, amount: i.amount / 100, status: i.status })),
    });
  } catch (e) {
    console.error("portal me failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not load your invoices." }, { status: 503 });
  }
}
