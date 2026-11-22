import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { legalLinks, navLinks, serviceNames, site } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[4vw] left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[22vw] font-extrabold leading-none text-outline opacity-[0.07]"
      >
        Shree Travels
      </div>

      <div className="container-page relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <Logo size={56} tagline />
          <p className="mt-6 max-w-sm text-neutral-400">
            Trusted by Nagpur&rsquo;s businesses since {site.since}.
          </p>
          <ul className="mt-6 space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <MapPin size={19} className="mt-1 shrink-0 text-brand-500" /> {site.address}
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-brand-500" />
              <a href={site.phoneHref} className="hover:text-brand-400">{site.phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-brand-500" />
              <a href={`mailto:${site.email}`} className="break-all hover:text-brand-400">{site.email}</a>
            </li>
            <li className="flex items-center gap-3">
              <Clock size={18} className="text-brand-500" /> {site.hours}
            </li>
          </ul>
        </div>

        <nav aria-label="Pages">
          <h2 className="mb-5 font-display text-xl">Pages</h2>
          <ul className="space-y-3">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-neutral-400 transition-colors hover:text-brand-400">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-5 font-display text-xl">Services</h2>
          <ul className="space-y-3 text-neutral-400">
            {serviceNames.map((s) => (
              <li key={s}><Link href="/services" className="transition-colors hover:text-brand-400">{s}</Link></li>
            ))}
          </ul>
        </div>

        <nav aria-label="Legal">
          <h2 className="mb-5 font-display text-xl">Policies</h2>
          <ul className="space-y-3">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-neutral-400 transition-colors hover:text-brand-400">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-sm text-neutral-500 sm:flex-row">
          <p>&copy; {year} Shree Travels. All rights reserved.</p>
          <p>Serving Nagpur since {site.since}</p>
        </div>
      </div>
    </footer>
  );
}
