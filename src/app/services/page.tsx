import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import PricingTable from "@/components/ui/PricingTable";
import Fleet from "@/components/home/Fleet";
import CTA from "@/components/home/CTA";
import { Fade, MaskLine } from "@/components/ui/motion";
import { services } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description: "Corporate car rental, employee transportation, airport transfers, executive travel and event cars in Nagpur.",
};

export default function ServicesPage() {
  return (
    <main>
      <PageHeader
        lines={["Cars for", "every trip."]}
        intro="We serve IT, BPO, KPO and other corporate offices across Nagpur with hourly, daily and monthly cars."
      />

      <section className="bg-ink">
        <div className="container-page">
          {services.map((s) => (
            <article
              key={s.slug}
              id={s.slug}
              className="grid scroll-mt-32 gap-8 border-b border-white/15 py-14 last:border-0 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16"
            >
              <div>
                <h2 className="text-[clamp(2rem,4.4vw,3.5rem)]">
                  <MaskLine>{s.title}</MaskLine>
                </h2>
                <Fade delay={0.15}>
                  <p className="mt-4 max-w-md text-lg text-neutral-400">{s.blurb}</p>
                </Fade>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {s.points.map((p, i) => (
                  <Fade key={p} delay={i * 0.07} y={12}>
                    <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-ink-900 p-5">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-black">
                        <Check size={15} strokeWidth={3.5} />
                      </span>
                      <span className="text-neutral-200">{p}</span>
                    </li>
                  </Fade>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <Fleet />
      <section className="bg-ink-900 py-20 sm:py-28">
        <div className="container-page">
          <h2 className="mb-10 text-[clamp(2.2rem,5vw,4rem)]">Our rates</h2>
          <PricingTable />
        </div>
      </section>

      <section className="bg-ink-900 py-16 text-center">
        <div className="container-page">
          <p className="mx-auto max-w-xl text-lg text-neutral-300">
            Not sure which package fits? Tell us your route and numbers and we will suggest one.
          </p>
          <Link href="/contact" className="btn-primary mt-6">Get a quote</Link>
        </div>
      </section>
      <CTA />
    </main>
  );
}
