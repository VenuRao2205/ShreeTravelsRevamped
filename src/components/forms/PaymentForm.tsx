"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Lock, QrCode, X } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(20).optional(),
  amountRupees: z.coerce.number({ message: "Enter an amount" }).min(1, "The minimum is Rs 1").max(500000, "The maximum is Rs 5,00,000"),
  remarks: z.string().trim().min(1, "Enter the invoice number").max(200),
});
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;

export type QrState = { orderId: string; qrData: string; amount: number; invoice: string };

export default function PaymentForm() {
  const [error, setError] = useState("");
  const [qr, setQr] = useState<QrState | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({ resolver: zodResolver(schema) });

  async function start(values: Output, mode: "page" | "qr") {
    setError("");
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, mode }),
      });
      const data = await res.json();
      if (mode === "qr") {
        if (!res.ok || !data.qrData) throw new Error(data.error ?? "We could not create the QR code.");
        setQr({ orderId: data.orderId, qrData: data.qrData, amount: values.amountRupees, invoice: values.remarks });
        return;
      }
      if (!res.ok || !data.redirectUrl) throw new Error(data.error ?? "We could not start the payment.");
      window.location.assign(data.redirectUrl); // hand off to PhonePe
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not start the payment. Please try again.");
    }
  }

  const onSubmit = (v: Output) => start(v, "page");

  if (qr) return <QrPanel qr={qr} onBack={() => setQr(null)} />;

  const err = (m?: string) => (m ? <p className="mt-1.5 text-sm text-danger" role="alert">{m}</p> : null);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-9">
      <div>
        <label htmlFor="name" className="field-label">Full name</label>
        <input id="name" className="field" autoComplete="name" {...register("name")} />
        {err(errors.name?.message)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" type="email" className="field" autoComplete="email" {...register("email")} />
          {err(errors.email?.message)}
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Phone (optional)</label>
          <input id="phone" type="tel" className="field" autoComplete="tel" {...register("phone")} />
        </div>
      </div>
      <div>
        <label htmlFor="amount" className="field-label">Amount in rupees</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl font-bold text-brand-500">Rs</span>
          <input id="amount" type="number" step="0.01" min="1" inputMode="decimal" className="field pl-14 font-display text-xl font-bold" {...register("amountRupees")} />
        </div>
        {err(errors.amountRupees?.message)}
      </div>
      <div>
        <label htmlFor="remarks" className="field-label">Invoice number</label>
        <input id="remarks" className="field" placeholder="For example INV-2041" aria-required="true" {...register("remarks")} />
        {err(errors.remarks?.message)}
      </div>

      {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-danger" role="alert">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-lg disabled:opacity-60">
        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
        {isSubmitting ? "Opening PhonePe" : "Pay with PhonePe"}
      </button>
      <button type="button" disabled={isSubmitting} onClick={handleSubmit((v) => start(v, "qr"))} className="btn-ghost w-full text-lg disabled:opacity-60">
        <QrCode size={20} /> Pay by scanning a QR code
      </button>
      <p className="text-center text-sm text-neutral-500">
        PhonePe opens to complete the payment. We never see your card or UPI details.
      </p>
    </form>
  );
}


export function QrPanel({ qr, onBack, onDone }: { qr: QrState; onBack: () => void; onDone?: () => void }) {
  const [img, setImg] = useState("");
  const [state, setState] = useState<"WAIT" | "COMPLETED" | "FAILED" | "EXPIRED">("WAIT");

  useEffect(() => {
    // The QR stays black on white whatever the site theme, so UPI apps can always read it.
    QRCode.toDataURL(qr.qrData, { width: 360, margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then(setImg)
      .catch(() => setState("FAILED"));
  }, [qr.qrData]);

  useEffect(() => {
    let stop = false;
    const started = Date.now();
    async function poll() {
      if (stop) return;
      if (Date.now() - started > 10 * 60_000) return setState("EXPIRED");
      try {
        const res = await fetch(`/api/payment/status?orderId=${encodeURIComponent(qr.orderId)}`, { cache: "no-store" });
        const data = await res.json();
        if (stop) return;
        if (data.state === "COMPLETED" || data.state === "FAILED") return setState(data.state);
      } catch { /* keep trying */ }
      setTimeout(poll, 3000);
    }
    const t = setTimeout(poll, 3000);
    return () => { stop = true; clearTimeout(t); };
  }, [qr.orderId]);

  const done = state === "COMPLETED";
  const bad = state === "FAILED" || state === "EXPIRED";
  return (
    <div className="rounded-3xl border border-white/10 bg-ink-900 p-6 text-center sm:p-9" role="status">
      {done || bad ? (
        <>
          <span className={`mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full ${done ? "bg-brand-500 text-black" : "bg-red-600 text-[#fff]"}`}>
            {done ? <Check size={36} strokeWidth={3} /> : <X size={36} strokeWidth={3} />}
          </span>
          <h2 className="text-3xl">{done ? "Payment received" : state === "EXPIRED" ? "QR code expired" : "Payment failed"}</h2>
          <p className="mx-auto mt-3 max-w-md text-neutral-400">
            {done ? `We received Rs ${qr.amount.toFixed(2)} for invoice ${qr.invoice} and emailed you a receipt.` : "No money was taken. If any was deducted, your bank will refund it."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {bad && <button onClick={onBack} className="btn-primary">Try again</button>}
            {done && onDone ? <button onClick={onDone} className="btn-primary">Back to my invoices</button> : null}
            <Link href="/" className="btn-ghost">Back to home</Link>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-3xl">Scan to pay Rs {qr.amount.toFixed(2)}</h2>
          <p className="mt-2 text-neutral-400">Open PhonePe, Google Pay, Paytm or any UPI app and scan this code. Invoice {qr.invoice}.</p>
          <div className="mx-auto mt-6 grid h-[17rem] w-[17rem] place-items-center rounded-2xl bg-[#fff] p-2 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img ? <img src={img} alt="UPI QR code for this payment" width={256} height={256} /> : <Loader2 className="animate-spin text-black" />}
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-neutral-400"><Loader2 size={15} className="animate-spin" /> Waiting for your payment. Keep this page open.</p>
          {qr.qrData.startsWith("upi:") && <a href={qr.qrData} className="btn-primary mt-5 sm:hidden">Open in my UPI app</a>}
          <div className="mt-6"><button onClick={onBack} className="text-sm text-neutral-400 underline hover:text-white">Cancel and go back</button></div>
        </>
      )}
    </div>
  );
}
