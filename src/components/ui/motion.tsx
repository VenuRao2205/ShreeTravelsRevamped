"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/** Headline line that is revealed by rising out of a mask (used for big type). */
export function MaskLine({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // Observe the (unclipped) wrapper: text translated out of an overflow-hidden parent never "intersects".
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  return (
    <span ref={ref} className={`block overflow-hidden pb-[0.08em] ${className}`}>
      <motion.span
        className="block"
        initial={reduce ? false : { y: "110%" }}
        animate={reduce || inView ? { y: 0 } : { y: "110%" }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Content that wipes in from the left with a clip-path (for images and panels). */
export function Wipe({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }}
      whileInView={{ clipPath: "inset(0 0% 0 0)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, delay, ease: [0.65, 0, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered fade for small groups. */
export function Fade({ children, delay = 0, className = "", y = 18 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up to `value` once it scrolls into view. */
export function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { mv.set(value); return; }
    const c = animate(mv, value, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, value, mv, reduce]);
  useEffect(
    () => mv.on("change", (v) => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-IN") + suffix; }),
    [mv, suffix],
  );
  return <span ref={ref} className={className}>{reduce ? value.toLocaleString("en-IN") + suffix : "0" + suffix}</span>;
}

/** Thin orange progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-amber-glow to-brand-500"
      style={{ scaleX }}
    />
  );
}

/** Gentle parallax: element drifts at a different speed than the scroll. */
export function Parallax({ children, distance = 60, className = "" }: { children: ReactNode; distance?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const reduce = useReducedMotion();
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/** Wrapper that feeds the cursor position to .glow-card via CSS variables. */
export function GlowArea({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" | "article" }) {
  return (
    <Tag
      className={`glow-card ${className}`}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </Tag>
  );
}
