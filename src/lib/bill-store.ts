import { billSchema, totalsOf, type BillInput } from "@/lib/billing";

/** Turns a stored bill into the validated shape the PDF and totals use. Returns null if the stored data is unusable. */
export function toBillInput(doc: Record<string, unknown>): BillInput | null {
  const { _id, __v, createdAt, updatedAt, totals, ...rest } = doc as Record<string, unknown>;
  void _id; void __v; void createdAt; void updatedAt; void totals;
  const p = billSchema.safeParse(JSON.parse(JSON.stringify(rest)));
  return p.success ? p.data : null;
}

export const withTotals = (b: BillInput) => ({ ...b, totals: totalsOf(b) });

export const pdfName = (billNo: string) => `Tax-Invoice-${billNo.replace(/[^A-Za-z0-9_-]+/g, "-")}.pdf`;

export function pdfResponse(bytes: Uint8Array, filename: string, download: boolean) {
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
