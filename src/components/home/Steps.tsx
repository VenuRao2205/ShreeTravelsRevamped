"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { MaskLine } from "@/components/ui/motion";

const steps = [
  { title: "Tell us what you need", text: "Call us or send an enquiry with your dates, pickup points and number of people." },
  { title: "We confirm the car and the rate", text: "You get a clear quote and a confirmed vehicle before anything is booked." },
  { title: "Your driver arrives on time", text: "A professional chauffeur is at the pickup point at the agreed time." },
  { title: "Pay on the invoice", text: "We email the bill after the trip. Pay it online through PhonePe from the payment page." },
];

export default function Steps() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section className="bg-ink-900 py-24 sm:py-32">
      <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.2fr]">
        <h2 className="text-[clamp(2.4rem,5.5vw,4.5rem)] lg:sticky lg:top-32 lg:self-start">
          <MaskLine>How a booking</MaskLine>
          <MaskLine delay={0.1}>works.</MaskLine>
        </h2>

        <ol ref={ref} className="relative space-y-12 pl-12 sm:pl-16">
          <span aria-hidden className="absolute bottom-2 left-[19px] top-2 w-px bg-white/15 sm:left-[27px]" />
          <motion.span
            aria-hidden
            style={{ scaleY }}
            className="absolute bottom-2 left-[18px] top-2 w-[3px] origin-top rounded bg-gradient-to-b from-amber-glow to-brand-500 sm:left-[26px]"
          />
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <motion.span
                className="absolute -left-12 top-0 grid h-10 w-10 place-items-center rounded-full border-2 border-brand-500 bg-black font-display text-lg font-extrabold text-brand-500 sm:-left-16 sm:h-14 sm:w-14 sm:text-2xl"
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-30% 0px" }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                {i + 1}
              </motion.span>
              <h3 className="text-2xl sm:text-3xl">{s.title}</h3>
              <p className="mt-2 max-w-lg text-neutral-400">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
