import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { billSchema } from "@/lib/billing";
import { renderBillPdf } from "@/lib/bill-pdf";
import { pdfResponse } from "@/lib/bill-store";

export const runtime = "nodejs";

/** Draws the PDF from what is on screen, without saving anything. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = billSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Please check the bill details." }, { status: 400 });
  return pdfResponse(await renderBillPdf(p.data), "preview.pdf", false);
}
