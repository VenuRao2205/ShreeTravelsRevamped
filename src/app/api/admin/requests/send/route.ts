import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { PaymentRequestModel } from "@/models";
import { normalise, verifyPassword } from "@/lib/portal";
import { sendPortalCredentials } from "@/lib/mail";
import { site } from "@/lib/site";

const body = z.object({ id: z.string(), password: z.string().min(1).max(40) });

/**
 * Emails the customer their login. The password is not stored in readable form, so the dashboard
 * sends it back here from the moment it was created or reset, and we check it matches before emailing.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || !mongoose.isValidObjectId(p.data.id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await connectDB();
  const r = await PaymentRequestModel.findById(p.data.id);
  if (!r) return NextResponse.json({ error: "That payment link no longer exists." }, { status: 404 });
  if (!verifyPassword(p.data.password, r.passwordHash)) return NextResponse.json({ error: "That password is out of date. Use New password, then send again." }, { status: 409 });
  try {
    await sendPortalCredentials({
      to: r.customerEmail, name: r.customerName, loginId: r.loginId, password: normalise(p.data.password),
      expiresAt: r.expiresAt, link: `${site.url.replace(/\/$/, "")}/payment?tab=invoices`,
    });
  } catch (e) {
    console.error("portal credentials email failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The email could not be sent. Check the mail settings, or share the message on WhatsApp instead." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, to: r.customerEmail });
}
