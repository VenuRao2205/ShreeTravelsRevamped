"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";

type Result = { state: string; merchantOrderId: string; amount: number; name: string };

export default function PaymentStatus({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    async function check() {
      try {
        const res = await fetch(`/api/payment/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) return setError(data.error ?? "We could not check the payment status.");
        setResult(data);
        // PhonePe can take a few seconds to settle; keep checking while pending.
        if (data.state !== "COMPLETED" && data.state !== "FAILED" && ++tries < 10) setTimeout(check, 3000);
      } catch {
        if (!cancelled) setError("We could not check the payment status.");
      }
    }
    check();
    return () => { cancelled = true; };
  }, [orderId]);

  if (error) return <Panel tone="bad" title="We could not check this payment" text={error} />;
  if (!result || (result.state !== "COMPLETED" && result.state !== "FAILED")) {
    return <Panel tone="wait" title="Confirming your payment" text="We are checking with PhonePe. Keep this page open." />;
  }
  const ok = result.state === "COMPLETED";
  return (
    <Panel
      tone={ok ? "good" : "bad"}
      title={ok ? "Payment received" : "Payment failed"}
      text={
        ok
          ? `Thank you, ${result.name}. We received Rs ${result.amount.toFixed(2)} and emailed you a receipt.`
          : "The payment did not go through. If money was deducted, your bank will refund it. You can try again."
      }
      details={`Order ${result.merchantOrderId}`}
      retry={!ok}
    />
  );
}

function Panel(props: { tone: "good" | "bad" | "wait"; title: string; text: string; details?: string; retry?: boolean }) {
  const icon =
    props.tone === "wait" ? <Loader2 size={34} className="animate-spin" /> :
    props.tone === "good" ? <Check size={36} strokeWidth={3} /> : <X size={36} strokeWidth={3} />;
  const color = props.tone === "bad" ? "bg-red-500 text-white" : "bg-brand-500 text-black";
  return (
    <div className="rounded-3xl border border-white/10 bg-ink-900 p-10 text-center" role="status">
      <motion.span
        key={props.tone}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
        className={`mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full ${color}`}
      >
        {icon}
      </motion.span>
      <h2 className="text-3xl">{props.title}</h2>
      <p className="mx-auto mt-3 max-w-md text-neutral-400">{props.text}</p>
      {props.details && <p className="mt-5 break-all text-sm text-neutral-500">{props.details}</p>}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {props.retry && <Link href="/payment" className="btn-primary">Try again</Link>}
        <Link href="/" className="btn-ghost">Back to home</Link>
      </div>
    </div>
  );
}
