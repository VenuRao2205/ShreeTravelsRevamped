"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";
import { MaskLine } from "@/components/ui/motion";
import { fleet, fleetTypes } from "@/lib/site";

export default function Fleet() {
  const [type, setType] = useState<(typeof fleetTypes)[number]["id"]>("muv");
  const active = fleetTypes.find((t) => t.id === type)!;
  const cars = fleet.filter((c) => c.type === type);

  return (
    <section className="bg-ink py-24 sm:py-32">
      <div className="container-page">
        <h2 className="max-w-3xl text-[clamp(2.4rem,5.5vw,4.5rem)]">
          <MaskLine>Hatchback, sedan</MaskLine>
          <MaskLine delay={0.1}>or MUV.</MaskLine>
        </h2>

        <div className="mb-3 mt-10 flex flex-wrap gap-1.5 self-start rounded-full border border-white/10 bg-ink-900 p-1.5 sm:inline-flex" role="tablist" aria-label="Car type">
          {fleetTypes.map((t) => {
            const on = t.id === type;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => setType(t.id)}
                className={`relative rounded-full px-5 py-2.5 font-semibold transition-colors ${on ? "text-black" : "text-neutral-300 hover:text-white"}`}
              >
                {on && <motion.span layoutId="fleet-tab" className="absolute inset-0 rounded-full bg-brand-500" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                <span className="relative">{t.name}</span>
              </button>
            );
          })}
        </div>
        <p className="mb-10 text-lg text-neutral-400">{active.text}</p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {cars.map((c, i) => (
              <motion.article
                key={c.name}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 26 }}
                className="group"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#fff]">
                  <Image
                    src={c.image}
                    alt={`${c.name}, white, from the Shree Travels fleet`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-contain p-3 transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl sm:text-3xl">{c.name}</h3>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm text-neutral-400">
                    <Users size={15} className="text-accent" /> {c.seats}
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
