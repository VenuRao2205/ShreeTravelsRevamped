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
  try {
    await transport().sendMail({
      from: `"Shree Travels" <${process.env.SMTP_USER}>`,
      ...opts,
    });
  } catch (e) {
    // Include addresses so the log shows exactly which one the mail server refused.
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`${msg} [from=${process.env.SMTP_USER} to=${opts.to} replyTo=${opts.replyTo ?? "-"}]`);
  }
}

async function sendAll(jobs: { label: string; run: () => Promise<void> }[]) {
  const results = await Promise.allSettled(jobs.map((j) => j.run()));
  let failures = 0;
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failures++;
      console.error(`email failed (${jobs[i].label})`, r.reason instanceof Error ? r.reason.message : r.reason);
    }
  });
  if (failures === jobs.length) throw new Error("all emails failed");
}

const adminAddress = () => process.env.MAIL_TO ?? process.env.SMTP_USER ?? "";

export async function sendLeadEmails(lead: {
  name: string;
  email?: string;
  phone: string;
  service?: string;
  message: string;
}) {
  const jobs: { label: string; run: () => Promise<void> }[] = [
    {
      label: "owner alert",
      run: () =>
        send({
          to: adminAddress(),
          replyTo: lead.email || undefined,
          subject: `New enquiry from ${lead.name}`,
          html: `<h2>New website enquiry</h2>
      <p><b>Name:</b> ${esc(lead.name)}</p>
      <p><b>Phone:</b> ${esc(lead.phone)}</p>
      <p><b>Email:</b> ${esc(lead.email ?? "-")}</p>
      <p><b>Service:</b> ${esc(lead.service ?? "-")}</p>
      <p><b>Message:</b><br>${esc(lead.message).replace(/\n/g, "<br>")}</p>`,
        }),
    },
  ];
  if (lead.email) {
    jobs.push({
      label: "customer confirmation",
      run: () =>
        send({
          to: lead.email!,
          subject: "We received your enquiry - Shree Travels",
          html: `<p>Hi ${esc(lead.name)},</p>
        <p>Thank you for contacting Shree Travels. Our team will get back to you shortly.
        For anything urgent, call us on +91 98222 36802.</p>
        <p>Regards,<br>Shree Travels, Nagpur</p>`,
        }),
    });
  }
  await sendAll(jobs);
}

export async function sendPaymentEmails(p: {
  name: string;
  email: string;
  merchantOrderId: string;
  amount: number;
  state: string;
  remarks?: string;
}) {
  const rupees = (p.amount / 100).toFixed(2);
  const ok = p.state === "COMPLETED";
  const jobs: { label: string; run: () => Promise<void> }[] = [
    {
      label: "owner payment alert",
      run: () =>
        send({
          to: adminAddress(),
          subject: `Payment ${ok ? "received" : "failed"}: Rs ${rupees} from ${p.name}`,
          html: `<p><b>Order:</b> ${esc(p.merchantOrderId)}</p><p><b>Name:</b> ${esc(p.name)}</p>
      <p><b>Invoice:</b> ${esc(p.remarks ?? "-")}</p><p><b>Amount:</b> Rs ${rupees}</p><p><b>Status:</b> ${esc(p.state)}</p>`,
        }),
    },
  ];
  if (ok) {
    jobs.push({
      label: "customer receipt",
      run: () =>
        send({
          to: p.email,
          subject: "Payment receipt - Shree Travels",
          html: `<p>Hi ${esc(p.name)},</p><p>We received your payment of <b>Rs ${rupees}</b>
        for invoice <b>${esc(p.remarks ?? "-")}</b> (order ${esc(p.merchantOrderId)}). Thank you!</p><p>Shree Travels, Nagpur</p>`,
        }),
    });
  }
  await sendAll(jobs);
}

/** Emails a customer the login for their invoice page. Throws if the mail server refuses it. */
export async function sendPortalCredentials(o: { to: string; name: string; loginId: string; password: string; expiresAt: Date; link: string }) {
  const until = o.expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  await send({
    to: o.to,
    subject: "Your invoices and payment login - Shree Travels",
    html: `<p>Hi ${esc(o.name)},</p>
      <p>You can see and pay your invoices together on our website:</p>
      <p><a href="${esc(o.link)}">${esc(o.link)}</a></p>
      <p><b>Login ID:</b> ${esc(o.loginId)}<br><b>Password:</b> ${esc(o.password)}</p>
      <p>This login works until ${until}. Payments are secure through PhonePe.</p>
      <p>Shree Travels, Nagpur</p>`,
  });
}
