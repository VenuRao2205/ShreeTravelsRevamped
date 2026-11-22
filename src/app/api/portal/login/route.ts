import { NextResponse } from "next/server";
import { z } from "zod";
import { adminEnabled } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { PaymentRequestModel } from "@/models";
import { LOCK_MS, MAX_FAILS, PORTAL_COOKIE, makeSession, normalise, sessionCookie, verifyPassword } from "@/lib/portal";

// Extra best-effort throttle per IP (per server instance), on top of the lockout stored with each login.
const fails = new Map<string, { n: number; t: number }>();
const WRONG = "The login ID or password is not correct, or the login has expired.";

const schema = z.object({ loginId: z.string().min(4).max(30), password: z.string().min(4).max(40) });

export async function POST(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ error: "Invoice login is not available yet." }, { status: 503 });
  const ip = req.headers.get("x-nf-client-connection-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rec = fails.get(ip);
  if (rec && Date.now() - rec.t < 600_000 && rec.n >= 10) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: WRONG }, { status: 400 });

  try {
    await connectDB();
    const doc = await PaymentRequestModel.findOne({ loginId: normalise(p.data.loginId) });
    if (doc?.lockedUntil && doc.lockedUntil.getTime() > Date.now()) {
      return NextResponse.json({ error: "Too many wrong attempts. Please try again in 15 minutes, or call us." }, { status: 429 });
    }
    const passwordOk = verifyPassword(p.data.password, doc?.passwordHash);
    const usable = !!doc && !doc.revoked && doc.expiresAt.getTime() > Date.now();

    if (!doc || !passwordOk || !usable) {
      fails.set(ip, { n: (rec && Date.now() - rec.t < 600_000 ? rec.n : 0) + 1, t: Date.now() });
      if (doc && !passwordOk) {
        const n = doc.failedAttempts + 1;
        await PaymentRequestModel.updateOne(
          { _id: doc._id },
          n >= MAX_FAILS ? { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { failedAttempts: n },
        );
      }
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: WRONG }, { status: 401 });
    }

    await PaymentRequestModel.updateOne({ _id: doc._id }, { failedAttempts: 0, lastLoginAt: new Date(), $unset: { lockedUntil: 1 } });
    fails.delete(ip);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(PORTAL_COOKIE, makeSession(String(doc._id)), sessionCookie);
    return res;
  } catch (e) {
    console.error("portal login failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "We could not check your login right now. Please try again shortly." }, { status: 503 });
  }
}
