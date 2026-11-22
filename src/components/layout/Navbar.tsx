"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { navLinks, site } from "@/lib/site";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden border-b border-white/10 bg-ink text-sm text-neutral-400 lg:block">
        <div className="container-page flex items-center justify-between py-2">
          <div className="flex items-center gap-7">
            <a href={site.phoneHref} className="flex items-center gap-2 hover:text-brand-700">
              <Phone size={14} className="text-brand-500" /> {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-brand-700">
              <Mail size={14} className="text-brand-500" /> {site.email}
            </a>
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-brand-500" /> {site.city}
            </span>
          </div>
          <span className="flex items-center gap-2">
            <Clock size={14} className="text-brand-500" /> {site.hours}
          </span>
        </div>
      </div>

      <nav
        aria-label="Main"
        className={`border-b transition-all duration-300 ${
          scrolled ? "border-white/10 bg-ink/80 backdrop-blur-xl" : "border-transparent bg-ink"
        }`}
      >
        <div className="container-page flex items-center justify-between py-3">
          <Link href="/" aria-label="Shree Travels home" onClick={() => setOpen(false)}>
            <Logo size={46} />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active(l.href) ? "page" : undefined}
                  className={`relative isolate block rounded-full px-4 py-2 font-semibold transition-colors ${
                    active(l.href) ? "text-black" : "text-neutral-300 hover:text-white"
                  }`}
                >
                  {active(l.href) && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-brand-500"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/contact" className="btn-primary hidden !py-2.5 lg:inline-flex">
            Get a quote
          </Link>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-x-0 bottom-0 top-[69px] z-40 overflow-y-auto bg-ink lg:hidden"
            initial={{ clipPath: "circle(0% at 92% 0%)" }}
            animate={{ clipPath: "circle(150% at 92% 0%)" }}
            exit={{ clipPath: "circle(0% at 92% 0%)" }}
            transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
          >
            <div className="container-page flex min-h-full flex-col justify-between py-8">
              <ul className="space-y-1">
                {navLinks.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`block border-b border-white/10 py-4 font-display text-4xl font-extrabold tracking-tight ${
                        active(l.href) ? "text-brand-500" : "text-white"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-10 space-y-4">
                <Link href="/contact" onClick={() => setOpen(false)} className="btn-primary w-full">
                  Get a quote
                </Link>
                <a href={site.phoneHref} className="btn-ghost w-full">
                  <Phone size={18} /> {site.phone}
                </a>
                <p className="flex items-center gap-2 text-sm text-neutral-400">
                  <Clock size={15} className="text-brand-500" /> {site.hours}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
