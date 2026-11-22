"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { serviceNames } from "@/lib/site";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, "Enter a valid phone number"),
  service: z.string().optional(),
  message: z.string().trim().min(5, "Tell us a little about your requirement"),
  website: z.string().max(0).optional(), // honeypot
});
type Values = z.infer<typeof schema>;

const field =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200";

export default function ContactForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please call us.");
    }
  }

  if (done) {
    return (
      <div className="card text-center" role="status">
        <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
        <h3 className="text-2xl font-bold">Thank you!</h3>
        <p className="mt-2 text-gray-600">
          We have received your enquiry and will get back to you shortly.
        </p>
      </div>
    );
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-red-600" role="alert">{m}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5" noValidate>
      <div className="hidden" aria-hidden>
        <label>
          Leave empty
          <input tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block font-medium">Name *</label>
        <input id="name" className={field} autoComplete="name" {...register("name")} />
        {err(errors.name?.message)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block font-medium">Phone *</label>
          <input id="phone" type="tel" className={field} autoComplete="tel" {...register("phone")} />
          {err(errors.phone?.message)}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block font-medium">Email</label>
          <input id="email" type="email" className={field} autoComplete="email" {...register("email")} />
          {err(errors.email?.message)}
        </div>
      </div>
      <div>
        <label htmlFor="service" className="mb-1 block font-medium">Service</label>
        <select id="service" className={field} {...register("service")}>
          <option value="">Select a service (optional)</option>
          {serviceNames.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block font-medium">Your requirement *</label>
        <textarea id="message" rows={5} className={field} {...register("message")} />
        {err(errors.message?.message)}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        {isSubmitting ? "Sending..." : "Send Enquiry"}
      </button>
    </form>
  );
}
