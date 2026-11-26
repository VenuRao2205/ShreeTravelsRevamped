import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { buildReport } from "@/lib/bill-report";

export const runtime = "nodejs";
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const periodQuery = z.object({ from: day, to: day, customer: z.string().trim().max(120).optional() });

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = periodQuery.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!p.success || p.data.from > p.data.to) return NextResponse.json({ error: "Pick a valid period." }, { status: 400 });
  try {
    return NextResponse.json(await buildReport({ ...p.data, customer: p.data.customer || undefined }));
  } catch (e) {
    console.error("report failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not build the report." }, { status: 503 });
  }
}
