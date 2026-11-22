"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(20).optional(),
  amountRupees: z.coerce.number({ message: "Enter an amount" }).min(1, "Minimum is Rs 1").max(500000, "Maximum is Rs 5,00,000"),
  remarks: z.string().trim().max(200).optional(),
});
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;

const field =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200";

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
      if (!res.ok || !data.redirectUrl) throw new Error(data.error ?? "Could not start the payment");
      window.location.assign(data.redirectUrl); // hand off to PhonePe
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the payment. Please try again.");
    }
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-red-600" role="alert">{m}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="mb-1 block font-medium">Full name *</label>
        <input id="name" className={field} autoComplete="name" {...register("name")} />
        {err(errors.name?.message)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block font-medium">Email *</label>
          <input id="email" type="email" className={field} autoComplete="email" {...register("email")} />
          {err(errors.email?.message)}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block font-medium">Phone</label>
          <input id="phone" type="tel" className={field} autoComplete="tel" {...register("phone")} />
        </div>
      </div>
      <div>
        <label htmlFor="amount" className="mb-1 block font-medium">Amount (Rs) *</label>
        <input id="amount" type="number" step="0.01" min="1" inputMode="decimal" className={field} {...register("amountRupees")} />
        {err(errors.amountRupees?.message)}
      </div>
      <div>
        <label htmlFor="remarks" className="mb-1 block font-medium">Remarks / invoice no.</label>
        <input id="remarks" className={field} {...register("remarks")} />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
        {isSubmitting ? "Redirecting to PhonePe..." : "Pay securely with PhonePe"}
      </button>
      <p className="text-center text-sm text-gray-500">
        You will be taken to PhonePe to complete the payment. We never see your card or UPI details.
      </p>
    </form>
  );
}
