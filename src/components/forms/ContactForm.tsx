"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Send } from "lucide-react";
import { serviceNames } from "@/lib/site";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email address").or(z.literal("")),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, "Enter a valid phone number"),
  service: z.string().optional(),
  message: z.string().trim().min(5, "Tell us a little about what you need"),
  website: z.string().max(0).optional(), // honeypot
});
type Values = z.infer<typeof schema>;

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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "We could not send your enquiry.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not send your enquiry. Please call us instead.");
    }
  }

  const err = (m?: string) => (m ? <p className="mt-1.5 text-sm text-danger" role="alert">{m}</p> : null);

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-brand-500/40 bg-ink-800 p-10 text-center"
          role="status"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
            className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brand-500 text-black"
          >
            <Check size={34} strokeWidth={3} />
          </motion.span>
          <h2 className="text-3xl">Enquiry sent</h2>
          <p className="mt-3 text-neutral-400">We will call or email you shortly with a quote.</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          exit={{ opacity: 0, y: -10 }}
          className="space-y-5 rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-9"
        >
          <div className="hidden" aria-hidden>
            <label>
              Leave this empty
              <input tabIndex={-1} autoComplete="off" {...register("website")} />
            </label>
          </div>

          <div>
            <label htmlFor="name" className="field-label">Name</label>
            <input id="name" className="field" autoComplete="name" {...register("name")} />
            {err(errors.name?.message)}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="field-label">Phone</label>
              <input id="phone" type="tel" className="field" autoComplete="tel" {...register("phone")} />
              {err(errors.phone?.message)}
            </div>
            <div>
              <label htmlFor="email" className="field-label">Email (optional)</label>
              <input id="email" type="email" className="field" autoComplete="email" {...register("email")} />
              {err(errors.email?.message)}
            </div>
          </div>
          <div>
            <label htmlFor="service" className="field-label">Service</label>
            <select id="service" className="field" {...register("service")}>
              <option value="">Choose a service</option>
              {serviceNames.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="message" className="field-label">What do you need?</label>
            <textarea id="message" rows={5} className="field resize-y" placeholder="Dates, pickup points, number of people" {...register("message")} />
            {err(errors.message?.message)}
          </div>

          {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-danger" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-lg disabled:opacity-60">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {isSubmitting ? "Sending" : "Send enquiry"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
