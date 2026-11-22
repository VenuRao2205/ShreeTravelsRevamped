"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(20).optional(),
  amountRupees: z.coerce.number({ message: "Enter an amount" }).min(1, "The minimum is Rs 1").max(500000, "The maximum is Rs 5,00,000"),
  remarks: z.string().trim().max(200).optional(),
});
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;

export default function PaymentForm() {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Output) {
    setError("");
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) throw new Error(data.error ?? "We could not start the payment.");
      window.location.assign(data.redirectUrl); // hand off to PhonePe
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not start the payment. Please try again.");
    }
  }

  const err = (m?: string) => (m ? <p className="mt-1.5 text-sm text-red-400" role="alert">{m}</p> : null);

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
        <label htmlFor="remarks" className="field-label">Invoice number or note (optional)</label>
        <input id="remarks" className="field" {...register("remarks")} />
      </div>

      {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300" role="alert">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-lg disabled:opacity-60">
        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
        {isSubmitting ? "Opening PhonePe" : "Pay with PhonePe"}
      </button>
      <p className="text-center text-sm text-neutral-500">
        PhonePe opens to complete the payment. We never see your card or UPI details.
      </p>
    </form>
  );
}
