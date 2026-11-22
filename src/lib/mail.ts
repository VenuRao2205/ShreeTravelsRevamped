import nodemailer from "nodemailer";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error("SMTP is not configured");
  const port = Number(SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 8000,
  });
}

async function send(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  await transport().sendMail({
    from: `"Shree Travels" <${process.env.SMTP_USER}>`,
    ...opts,
  });
}

const adminAddress = () => process.env.MAIL_TO ?? process.env.SMTP_USER ?? "";

export async function sendLeadEmails(lead: {
  name: string;
  email?: string;
  phone: string;
  service?: string;
  message: string;
}) {
  await send({
    to: adminAddress(),
    replyTo: lead.email || undefined,
    subject: `New enquiry from ${lead.name}`,
    html: `<h2>New website enquiry</h2>
      <p><b>Name:</b> ${esc(lead.name)}</p>
      <p><b>Phone:</b> ${esc(lead.phone)}</p>
      <p><b>Email:</b> ${esc(lead.email ?? "-")}</p>
      <p><b>Service:</b> ${esc(lead.service ?? "-")}</p>
      <p><b>Message:</b><br>${esc(lead.message).replace(/\n/g, "<br>")}</p>`,
  });
  if (lead.email) {
    await send({
      to: lead.email,
      subject: "We received your enquiry - Shree Travels",
      html: `<p>Hi ${esc(lead.name)},</p>
        <p>Thank you for contacting Shree Travels. Our team will get back to you shortly.
        For anything urgent, call us on +91 98222 36802.</p>
        <p>Regards,<br>Shree Travels, Nagpur</p>`,
    });
  }
}

export async function sendPaymentEmails(p: {
  name: string;
  email: string;
  merchantOrderId: string;
  amount: number;
  state: string;
}) {
  const rupees = (p.amount / 100).toFixed(2);
  const ok = p.state === "COMPLETED";
  await send({
    to: adminAddress(),
    subject: `Payment ${ok ? "received" : "failed"}: Rs ${rupees} from ${p.name}`,
    html: `<p><b>Order:</b> ${esc(p.merchantOrderId)}</p><p><b>Name:</b> ${esc(p.name)}</p>
      <p><b>Amount:</b> Rs ${rupees}</p><p><b>Status:</b> ${esc(p.state)}</p>`,
  });
  if (ok) {
    await send({
      to: p.email,
      subject: "Payment receipt - Shree Travels",
      html: `<p>Hi ${esc(p.name)},</p><p>We received your payment of <b>Rs ${rupees}</b>
        (order ${esc(p.merchantOrderId)}). Thank you!</p><p>Shree Travels, Nagpur</p>`,
    });
  }
}
