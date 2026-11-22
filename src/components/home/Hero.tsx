"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { MaskLine, CountUp, Fade } from "@/components/ui/motion";
import { site, stats } from "@/lib/site";

const ROUTE =
  "M 40 500 C 130 500, 150 400, 230 390 S 330 330, 370 280 S 470 230, 510 170 S 560 90, 570 50";

// Stops sit on the route's segment joints; `at` is roughly how far along the line they are.
const stops = [
  { x: 40, y: 500, name: "Gorepeth", sub: "our office", lx: 40, ly: 538, anchor: "start", at: 0 },
  { x: 230, y: 390, name: "Sitabuldi", lx: 244, ly: 430, anchor: "start", at: 0.25 },
  { x: 370, y: 280, name: "Zero Mile", lx: 386, ly: 320, anchor: "start", at: 0.5 },
  { x: 510, y: 170, name: "MIHAN", lx: 490, ly: 160, anchor: "end", at: 0.78 },
  { x: 570, y: 50, name: "Airport", lx: 546, ly: 56, anchor: "end", at: 1 },
] as const;

const DRAW = 2.6; // seconds for the road to draw
const START = 0.5;

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      className="grain relative isolate overflow-hidden bg-black"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {/* cursor spotlight */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(600px circle at var(--mx, 70%) var(--my, 30%), rgba(255,107,0,.16), transparent 65%)" }}
      />

      {/* route map */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-0 hidden w-[52%] items-center lg:flex">
        <svg viewBox="0 0 600 580" className="h-[86%] w-full -translate-y-4 translate-x-6 overflow-visible">
          <defs>
            <linearGradient id="beam" x1="0" x2="1">
              <stop offset="0" stopColor="#FFB020" stopOpacity=".95" />
              <stop offset="1" stopColor="#FF6B00" stopOpacity="0" />
            </linearGradient>
            <filter id="blur"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>

          <motion.path
            id="route"
            d={ROUTE}
            fill="none"
            stroke="#161616"
            strokeWidth={22}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: DRAW, delay: START, ease: "easeInOut" }}
          />
          <motion.path
            d={ROUTE}
            fill="none"
            stroke="#FF6B00"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="10 14"
            className="animate-dashflow"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: START + DRAW, duration: 0.6 }}
          />

          {stops.map((s) => (
            <motion.g
              key={s.name}
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              transition={{ delay: START + s.at * DRAW, type: "spring", stiffness: 260, damping: 16 }}
            >
              <circle cx={s.x} cy={s.y} r={9} fill="#FF6B00" className="animate-ping2" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
              <circle cx={s.x} cy={s.y} r={8} fill="#000" stroke="#FF6B00" strokeWidth={3} />
              <text x={s.lx} y={s.ly} textAnchor={s.anchor} className="fill-white font-display" fontSize={19} fontWeight={800}>
                {s.name}
              </text>
              {"sub" in s && (
                <text x={s.lx} y={s.ly + 18} textAnchor={s.anchor} className="fill-neutral-500" fontSize={13}>
                  {s.sub}
                </text>
              )}
            </motion.g>
          ))}

          {!reduce && (
            <g opacity="0">
              <animate attributeName="opacity" from="0" to="1" begin={`${START + DRAW}s`} dur="0.3s" fill="freeze" />
              <animateMotion dur="10s" begin={`${START + DRAW}s`} repeatCount="indefinite" rotate="auto" calcMode="linear">
                <mpath href="#route" />
              </animateMotion>
              <circle r="14" fill="#FF6B00" opacity=".55" filter="url(#blur)" />
              <path d="M10 -3 L 62 -20 L 62 20 L 10 3 Z" fill="url(#beam)" opacity=".7" />
              <rect x="-11" y="-6" width="22" height="12" rx="4" fill="#FF6B00" />
              <rect x="-2" y="-4.5" width="8" height="9" rx="2" fill="#000" opacity=".75" />
            </g>
          )}
        </svg>
      </div>

      <div className="container-page relative z-10 flex min-h-[calc(100svh-69px)] flex-col justify-center py-16 lg:min-h-[calc(100svh-109px)]">
        <h1 className="text-[clamp(2.9rem,7.4vw,6.4rem)] leading-[0.92]">
          <MaskLine delay={0.1}>Nagpur&rsquo;s trusted</MaskLine>
          <MaskLine delay={0.22} className="text-outline">car partner</MaskLine>
          <MaskLine delay={0.34}>since {site.since}.</MaskLine>
        </h1>

        <Fade delay={0.7} className="mt-8 max-w-xl">
          <p className="text-lg text-neutral-300 sm:text-xl">
            Trusted by Nagpur&rsquo;s businesses for three decades. Airport transfers, staff transport and
            executive cars, with chauffeurs you can rely on.
          </p>
        </Fade>

        <Fade delay={0.85} className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/contact" className="btn-primary text-lg">
            Get a quote <ArrowRight size={20} />
          </Link>
          <a href={site.phoneHref} className="btn-ghost text-lg">
            <Phone size={19} /> Call {site.phoneShort}
          </a>
        </Fade>

        <dl className="mt-16 grid max-w-[34rem] grid-cols-3 gap-4 border-t border-white/15 pt-8">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="font-display text-3xl font-extrabold text-fire sm:text-[2.6rem]">
                <CountUp value={s.value} suffix={s.suffix} />
              </dd>
              <dt className="mt-1 text-sm text-neutral-400">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
