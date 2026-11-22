import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { site } from "@/lib/site";

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-24 text-center text-white">
      <Image src="/images/wall-dark.webp" alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/85 to-gray-900/75" />
      <div className="container-page relative z-10 mx-auto max-w-4xl">
        <h2 className="font-display text-4xl sm:text-5xl">
          Experience Premium <span className="text-accent-400">Transportation Today</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-200">
          Tell us what you need and we will put together a package that fits your team and budget.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/contact" className="btn-accent px-8 py-4 text-lg">
            Request A Quote <ArrowRight size={20} />
          </Link>
          <a href={site.phoneHref} className="btn-outline px-8 py-4 text-lg">
            <Phone size={20} /> Call Now
          </a>
        </div>
      </div>
    </section>
  );
}
