import { NextResponse } from "next/server";
import { COOKIE, adminEnabled, checkPassword, cookieOptions, makeToken } from "@/lib/admin-auth";

// Best-effort throttle (per server instance): 5 failures per 10 minutes per IP.
const fails = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ error: "Admin is not set up yet." }, { status: 503 });

  const ip = req.headers.get("x-nf-client-connection-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rec = fails.get(ip);
  if (rec && Date.now() - rec.t < 600_000 && rec.n >= 5) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const ok = typeof body?.password === "string" && checkPassword(body.password);
  if (!ok) {
    fails.set(ip, { n: (rec && Date.now() - rec.t < 600_000 ? rec.n : 0) + 1, t: Date.now() });
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  fails.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), cookieOptions);
  return res;
}
