"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, MessageSquarePlus, Star } from "lucide-react";

type Review = { name: string; company?: string; rating: number; comment: string; createdAt: string };

export function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "fill-brand-500 text-brand-500" : "text-neutral-700"} />
      ))}
    </span>
  );
}

export function ReviewsWall() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/reviews", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setReviews(d.reviews))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="rounded-2xl border border-white/10 bg-ink-900 p-8 text-neutral-400">Reviews could not be loaded right now. Please try again shortly.</p>;
  if (!reviews)
    return (
      <div className="columns-1 gap-5 md:columns-2">
        {[0, 1, 2].map((i) => <div key={i} className="mb-5 h-44 animate-pulse rounded-3xl bg-ink-800" />)}
      </div>
    );
  if (reviews.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center">
        <p className="font-display text-2xl text-white">No reviews yet</p>
        <p className="mt-2 text-neutral-400">Travelled with us? Be the first to share how it went.</p>
      </div>
    );
  return (
    <div className="columns-1 gap-5 md:columns-2">
      {reviews.map((r, i) => (
        <motion.figure
          key={i}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
          className="mb-5 break-inside-avoid rounded-3xl border border-white/10 bg-ink-900 p-7"
        >
          <Stars value={r.rating} />
          <blockquote className="mt-4 text-lg text-neutral-200">{r.comment}</blockquote>
          <figcaption className="mt-5 text-sm text-neutral-500">
            <span className="font-semibold text-white">{r.name}</span>
            {r.company ? `, ${r.company}` : ""}
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}

type FormValues = { name: string; company: string; comment: string; website: string };

export function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();

  async function onSubmit(v: FormValues) {
    setError("");
    if (!rating) return setError("Choose a star rating.");
    if (v.name.trim().length < 2) return setError("Enter your name.");
    if (v.comment.trim().length < 10) return setError("Write at least a sentence (10 characters).");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: v.name, company: v.company || undefined, comment: v.comment, rating, website: v.website }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("We could not save your review. Please try again.");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-brand-500/40 bg-ink-800 p-10 text-center" role="status">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }} className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brand-500 text-black">
            <Check size={34} strokeWidth={3} />
          </motion.span>
          <h3 className="text-3xl">Thank you</h3>
          <p className="mt-3 text-neutral-400">Your review will appear here once we have approved it.</p>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-8">
          <div className="hidden" aria-hidden>
            <input tabIndex={-1} autoComplete="off" {...register("website")} />
          </div>
          <div>
            <p className="field-label" id="rating-label">Your rating</p>
            <div className="flex gap-1" role="radiogroup" aria-labelledby="rating-label" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  whileHover={{ scale: 1.25, rotate: -8 }}
                  whileTap={{ scale: 0.85 }}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className="rounded-md p-1"
                >
                  <Star size={36} className={`transition-colors ${n <= (hover || rating) ? "fill-brand-500 text-brand-500" : "text-neutral-600"}`} />
                </motion.button>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="r-name" className="field-label">Name</label>
              <input id="r-name" className="field" autoComplete="name" {...register("name")} />
            </div>
            <div>
              <label htmlFor="r-company" className="field-label">Company (optional)</label>
              <input id="r-company" className="field" {...register("company")} />
            </div>
          </div>
          <div>
            <label htmlFor="r-comment" className="field-label">Your review</label>
            <textarea id="r-comment" rows={5} className="field resize-y" placeholder="How was the car, the driver and the timing?" {...register("comment")} />
          </div>
          {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-danger" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <MessageSquarePlus size={20} />}
            {isSubmitting ? "Sending" : "Submit review"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
