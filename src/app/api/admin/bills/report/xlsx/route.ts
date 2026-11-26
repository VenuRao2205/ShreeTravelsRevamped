import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { buildReport, reportWorkbook } from "@/lib/bill-report";

export const runtime = "nodejs";
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const q = z.object({ from: day, to: day, customer: z.string().trim().max(120).optional() });

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!p.success || p.data.from > p.data.to) return NextResponse.json({ error: "Pick a valid period." }, { status: 400 });
  try {
    const report = await buildReport({ ...p.data, customer: p.data.customer || undefined });
    const file = await reportWorkbook(report);
    const name = `Shree-Travels-MIS-${p.data.from}-to-${p.data.to}.xlsx`;
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("report xlsx failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not build the Excel file." }, { status: 503 });
  }
}
