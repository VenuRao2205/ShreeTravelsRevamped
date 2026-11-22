"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { navLinks, site } from "@/lib/site";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header>
      <div className="hidden bg-gray-900 py-2 text-sm text-white lg:block">
        <div className="container-page flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2">
              <Phone size={14} className="text-accent-400" /> {site.phone}
            </span>
            <span className="flex items-center gap-2">
              <Mail size={14} className="text-accent-400" /> {site.email}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-accent-400" /> {site.city}
            </span>
          </div>
          <span className="flex items-center gap-2">
            <Clock size={14} className="text-accent-400" /> {site.hours}
          </span>
        </div>
      </div>

      <nav
        aria-label="Main"
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-gray-200 bg-white/95 shadow-lg backdrop-blur-xl"
            : "border-transparent bg-white shadow-sm"
        }`}
      >
        <div className="container-page flex items-center justify-between py-3">
          <Link href="/" aria-label="Shree Travels home">
            <Image
              src="/images/shree.webp"
              alt="Shree Travels"
              width={1814}
              height={312}
              priority
              className="h-12 w-auto"
            />
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`font-medium transition-colors hover:text-primary-600 ${
                    active(l.href) ? "text-primary-600" : "text-gray-700"
                  }`}
                  aria-current={active(l.href) ? "page" : undefined}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/contact" className="btn-primary hidden lg:inline-flex">
            Request A Ride
          </Link>

          <button
            type="button"
            className="rounded-xl p-3 hover:bg-gray-100 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-gray-200 bg-white shadow-xl lg:hidden">
            <div className="container-page flex flex-col gap-2 py-5">
              <div className="mb-3 space-y-2 border-b border-gray-200 pb-4 text-sm text-gray-600">
                <p className="flex items-center gap-3">
                  <Phone size={16} className="text-primary-500" /> {site.phone}
                </p>
                <p className="flex items-center gap-3">
                  <Clock size={16} className="text-primary-500" /> {site.hours}
                </p>
              </div>
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-lg font-medium hover:bg-primary-50 ${
                    active(l.href) ? "bg-primary-50 text-primary-600" : "text-gray-700"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <Link href="/contact" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">
                Request A Ride
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
