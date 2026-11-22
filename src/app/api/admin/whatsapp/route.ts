import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendTemplate, whatsappStatus } from "@/lib/whatsapp-cloud";
import { phoneDigits } from "@/lib/whatsapp";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(whatsappStatus());
}

/** Sends Meta's built-in hello_world template to the owner's number, to prove the connection works. */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const s = whatsappStatus();
  if (!s.configured) return NextResponse.json({ error: "Add WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in the site settings first." }, { status: 400 });
  const owner = phoneDigits(process.env.WHATSAPP_OWNER_NUMBER);
  if (!owner) return NextResponse.json({ error: "Add WHATSAPP_OWNER_NUMBER (your own WhatsApp number) in the site settings first." }, { status: 400 });
  const r = await sendTemplate(owner, "hello_world", [], "en_US");
  if (!r.ok) return NextResponse.json({ error: r.error ?? "Meta refused the message." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
