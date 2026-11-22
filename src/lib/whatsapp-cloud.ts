import { phoneDigits } from "@/lib/whatsapp";

/**
 * WhatsApp Business Cloud API (Meta). Sends pre-approved template messages.
 * Everything here is a no-op until WHATSAPP_TOKEN and WHATSAPP_PHONE_ID are set, and it never throws,
 * so a WhatsApp problem can never break an enquiry or a payment.
 *
 * Templates to create in WhatsApp Manager (category Utility, language English). Body text must match exactly:
 *  shree_new_enquiry     New website enquiry from {{1}}, phone {{2}}. Service: {{3}}. Message: {{4}} End of enquiry.
 *  shree_payment_alert   Payment {{1}}: Rs {{2}} from {{3}} for invoice {{4}}. Order reference {{5}}. Shree Travels dashboard.
 *  shree_payment_receipt Hello {{1}}, we have received your payment of Rs {{2}} for invoice {{3}}. Thank you for choosing Shree Travels.
 */
export const TEMPLATES = {
  enquiry: "shree_new_enquiry",
  paymentAlert: "shree_payment_alert",
  receipt: "shree_payment_receipt",
} as const;

const env = () => ({
  token: process.env.WHATSAPP_TOKEN,
  phoneId: process.env.WHATSAPP_PHONE_ID,
  owner: phoneDigits(process.env.WHATSAPP_OWNER_NUMBER),
  version: process.env.WHATSAPP_API_VERSION || "v23.0",
  lang: process.env.WHATSAPP_TEMPLATE_LANG || "en",
});

export const whatsappStatus = () => {
  const e = env();
  return { configured: !!(e.token && e.phoneId), ownerSet: !!e.owner };
};

/** Template variables cannot hold line breaks, tabs or runs of spaces, and long values are rejected. */
const clean = (s: unknown, max = 200) => String(s ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max) || "-";

export async function sendTemplate(to: string, name: string, params: unknown[], lang?: string): Promise<{ ok: boolean; error?: string }> {
  const e = env();
  const phone = phoneDigits(to);
  if (!e.token || !e.phoneId) return { ok: false, error: "WhatsApp is not set up" };
  if (!phone) return { ok: false, error: "No valid WhatsApp number" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(`https://graph.facebook.com/${e.version}/${e.phoneId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${e.token}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name,
          language: { code: lang ?? e.lang },
          components: params.length ? [{ type: "body", parameters: params.map((p) => ({ type: "text", text: clean(p) })) }] : [],
        },
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number } };
      const msg = `${body.error?.message ?? `HTTP ${res.status}`}${body.error?.code ? ` (code ${body.error.code})` : ""}`;
      console.error(`whatsapp failed (${name})`, msg);
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`whatsapp failed (${name})`, msg);
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

const inr = (paise: number) => (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function whatsappNewEnquiry(l: { name: string; phone: string; service?: string; message: string }) {
  const { owner } = env();
  if (!owner) return;
  await sendTemplate(owner, TEMPLATES.enquiry, [l.name, l.phone, l.service || "Not given", l.message]);
}

export async function whatsappPayment(p: { name: string; phone?: string | null; merchantOrderId: string; amount: number; state: string; remarks?: string | null }) {
  const { owner } = env();
  const jobs: Promise<unknown>[] = [];
  if (owner) jobs.push(sendTemplate(owner, TEMPLATES.paymentAlert, [p.state === "COMPLETED" ? "received" : "failed", inr(p.amount), p.name, p.remarks || "not given", p.merchantOrderId]));
  // The customer gave this number on the payment form, and only a successful payment gets a receipt.
  if (p.state === "COMPLETED" && p.phone) jobs.push(sendTemplate(p.phone, TEMPLATES.receipt, [p.name, inr(p.amount), p.remarks || "not given"]));
  await Promise.allSettled(jobs);
}
