"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

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
        if (!res.ok) return setError(data.error ?? "Could not check the payment status.");
        setResult(data);
        // PhonePe can take a few seconds to settle; keep checking while pending.
        if (data.state !== "COMPLETED" && data.state !== "FAILED" && ++tries < 10) {
          setTimeout(check, 3000);
        }
      } catch {
        if (!cancelled) setError("Could not check the payment status.");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (error) return <Box icon={<XCircle size={56} className="text-red-600" />} title="Something went wrong" text={error} />;
  if (!result || (result.state !== "COMPLETED" && result.state !== "FAILED")) {
    return (
      <Box
        icon={<Loader2 size={56} className="animate-spin text-primary-600" />}
        title="Confirming your payment"
        text="Please wait while we confirm with PhonePe. Do not close this page."
      />
    );
  }
  const ok = result.state === "COMPLETED";
  return (
    <Box
      icon={ok ? <CheckCircle size={56} className="text-green-600" /> : <XCircle size={56} className="text-red-600" />}
      title={ok ? "Payment successful" : "Payment failed"}
      text={
        ok
          ? `Thank you, ${result.name}. We have received Rs ${result.amount.toFixed(2)}. A receipt has been emailed to you.`
          : "The payment did not go through. If money was deducted, it will be refunded by your bank. You can try again."
      }
      details={`Order: ${result.merchantOrderId}`}
      retry={!ok}
    />
  );
}

function Box(props: { icon: React.ReactNode; title: string; text: string; details?: string; retry?: boolean }) {
  return (
    <div className="card text-center" role="status">
      <div className="mb-4 flex justify-center">{props.icon}</div>
      <h2 className="text-2xl font-bold">{props.title}</h2>
      <p className="mt-2 text-gray-600">{props.text}</p>
      {props.details && <p className="mt-4 break-all text-sm text-gray-500">{props.details}</p>}
      <div className="mt-6 flex justify-center gap-3">
        {props.retry && <Link href="/payment" className="btn-primary">Try again</Link>}
        <Link href="/" className="btn border border-gray-300 text-gray-700 hover:bg-gray-50">Back to home</Link>
      </div>
    </div>
  );
}
