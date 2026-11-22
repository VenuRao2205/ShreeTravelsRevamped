import Link from "next/link";
import { ArrowRight, Car, CheckCircle, Clock, Users } from "lucide-react";

const services = [
  {
    icon: Car,
    title: "Corporate Car Rental",
    text: "Flexible hourly, daily and monthly packages for businesses, with professional chauffeurs.",
    features: ["Hatchback to SUV options", "Professional chauffeurs", "Flexible packages", "Corporate billing"],
    popular: true,
  },
  {
    icon: Users,
    title: "Employee Transportation",
    text: "Reliable daily commute solutions with customized routes and schedules for your team.",
    features: ["Daily commute service", "Customized routes", "Group transportation", "Cost-effective packages"],
  },
  {
    icon: Clock,
    title: "Airport Transfers",
    text: "Punctual airport pickup and drop for business travelers, any time of day.",
    features: ["24/7 availability", "Flight tracking", "Meet & greet", "Luggage assistance"],
  },
];

export default function ServicesPreview() {
  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-primary-50 py-24">
      <div className="container-page">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 font-semibold uppercase tracking-wider text-primary-600">Our Services</p>
          <h2 className="font-display text-4xl sm:text-5xl">Transportation tailored for you</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {services.map((s) => (
            <article
              key={s.title}
              className={`card relative flex flex-col ${s.popular ? "ring-2 ring-primary-500/50" : ""}`}
            >
              {s.popular && (
                <span className="absolute right-4 top-4 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                <s.icon size={32} />
              </div>
              <h3 className="mb-3 text-2xl font-bold">{s.title}</h3>
              <p className="mb-5 text-gray-600">{s.text}</p>
              <ul className="mb-8 space-y-2">
                {s.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={16} className="text-primary-600" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/services"
                className="btn mt-auto border-2 border-primary-600 text-primary-700 hover:bg-primary-600 hover:text-white"
              >
                Learn More <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
