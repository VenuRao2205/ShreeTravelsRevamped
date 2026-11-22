import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Clock, Phone, Shield, Star, Users } from "lucide-react";
import { site } from "@/lib/site";

const badges = [
  { icon: Shield, text: "30+ Years Trusted" },
  { icon: Clock, text: "24/7 Available" },
  { icon: Users, text: "Professional Drivers" },
];

export const stats = [
  { number: "30+", label: "Years Experience", icon: Award },
  { number: "10K+", label: "Happy Customers", icon: Users },
  { number: "24/7", label: "Support Available", icon: Clock },
  { number: "100%", label: "Satisfaction Rate", icon: Shield },
];

export default function Hero() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden text-white">
      <Image
        src="/images/hero-night.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/85 to-primary-900/75" />

      <div className="container-page relative z-10 py-20 text-center">
        <div className="mx-auto mb-10 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-md">
          <span className="flex gap-1" aria-hidden>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={15} className="fill-current text-accent-400" />
            ))}
          </span>
          <span className="font-semibold">Premium Transportation Since {site.since}</span>
        </div>

        <h1 className="font-display text-5xl leading-tight sm:text-6xl lg:text-7xl">
          Your Journey,
          <br />
          <span className="bg-gradient-to-r from-accent-400 via-accent-300 to-primary-400 bg-clip-text text-transparent">
            Our Excellence
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-xl font-light leading-relaxed text-gray-200">
          Premium corporate transportation backed by three decades of service in Nagpur.
          <span className="mt-2 block font-medium text-accent-300">
            Professional drivers &bull; Well-kept vehicles &bull; Absolute reliability
          </span>
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/contact" className="btn-primary px-8 py-4 text-lg">
            Book Your Ride <ArrowRight size={22} />
          </Link>
          <a href={site.phoneHref} className="btn-accent px-8 py-4 text-lg">
            <Phone size={20} /> Call Now
          </a>
        </div>

        <ul className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4">
          {badges.map((b) => (
            <li key={b.text} className="flex items-center gap-3 text-lg font-semibold text-gray-100">
              <span className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
                <b.icon size={24} className="text-accent-400" />
              </span>
              {b.text}
            </li>
          ))}
        </ul>

        <dl className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <s.icon size={28} className="mx-auto mb-3 text-accent-400" />
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-4xl font-bold text-accent-300">{s.number}</dd>
              <p className="mt-1 text-gray-300">{s.label}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
