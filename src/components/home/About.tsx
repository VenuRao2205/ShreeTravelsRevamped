import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { stats } from "./Hero";

const highlights = [
  "30+ years of trusted corporate transportation",
  "Professional, experienced chauffeurs",
  "Well-maintained, comfortable fleet",
  "Customizable hourly, daily and monthly packages",
  "24/7 customer support",
  "Transparent pricing with corporate billing",
];

export default function About() {
  return (
    <section className="py-24">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="mb-3 font-semibold uppercase tracking-wider text-primary-600">About Us</p>
          <h2 className="font-display text-4xl sm:text-5xl">Nagpur&rsquo;s trusted travel partner</h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            Shree Travels began in 1994 with a simple idea: transport should be punctual,
            safe and fairly priced. Today we serve companies across Nagpur with the same
            personal attention we started with.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-gray-700">
                <CheckCircle size={22} className="mt-0.5 shrink-0 text-primary-600" />
                {h}
              </li>
            ))}
          </ul>
          <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-primary-50 p-4 text-center">
                <dd className="text-2xl font-bold text-primary-700">{s.number}</dd>
                <dt className="text-sm text-gray-600">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl shadow-card">
          <Image
            src="/images/gif.jpeg"
            alt="Shree Travels chauffeur-driven cars"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
