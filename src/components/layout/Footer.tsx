import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone, Star } from "lucide-react";
import { legalLinks, navLinks, serviceNames, site } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="mb-6 inline-block rounded-lg bg-white px-3 py-2">
            <Image
              src="/images/shree.webp"
              alt="Shree Travels"
              width={1814}
              height={312}
              className="h-10 w-auto"
            />
          </div>
          <div className="mb-4 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-current text-accent-400" />
            ))}
            <span className="ml-2 text-sm text-gray-400">30+ Years of Excellence</span>
          </div>
          <p className="mb-8 max-w-xl leading-relaxed text-gray-300">
            Your trusted partner in corporate transportation with over 30 years of
            experience. Reliable, efficient and comfortable cab services for
            corporate clients across Nagpur.
          </p>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <MapPin size={20} className="mt-0.5 shrink-0 text-accent-500" />
              {site.address}
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-accent-500" />
              <a href={site.phoneHref} className="hover:text-accent-400">
                {site.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-accent-500" />
              <a href={`mailto:${site.email}`} className="hover:text-accent-400">
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Clock size={18} className="text-accent-500" />
              {site.hours}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-lg font-semibold">Quick Links</h4>
          <ul className="space-y-3 text-gray-300">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-accent-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h5 className="mb-3 mt-8 font-semibold">Our Services</h5>
          <ul className="space-y-2 text-sm text-gray-400">
            {serviceNames.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-lg font-semibold">Legal &amp; Support</h4>
          <ul className="space-y-3 text-gray-300">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-accent-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 p-6">
            <h5 className="mb-1 font-semibold">Need Immediate Assistance?</h5>
            <p className="mb-4 text-sm text-primary-100">Our team is ready to help.</p>
            <a href={site.phoneHref} className="btn bg-white text-primary-900 hover:bg-primary-50 w-full">
              <Phone size={16} /> Call Now
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-sm text-gray-400 md:flex-row">
          <p>
            &copy; {year} Shree Travels. All rights reserved. Trusted since {site.since}.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-accent-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
