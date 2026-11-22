import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import PageHeader from "@/components/ui/PageHeader";
import { Fade, Wipe } from "@/components/ui/motion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request a quote or book a corporate car in Nagpur. Call, email or send an enquiry to Shree Travels.",
};

export default function ContactPage() {
  const items = [
    { icon: Phone, label: "Phone", value: site.phone, href: site.phoneHref },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: "Office", value: site.address },
    { icon: Clock, label: "Hours", value: site.hours },
  ];
  return (
    <main>
      <PageHeader lines={["Tell us", "where to be."]} intro="Send your requirement and we will reply with a quote. For anything urgent, call." />
      <section className="py-16 sm:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <Fade><ContactForm /></Fade>
          <div className="space-y-8">
            <ul className="space-y-6">
              {items.map((i) => (
                <li key={i.label} className="flex items-start gap-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-500 text-black">
                    <i.icon size={21} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold text-white">{i.label}</p>
                    {i.href ? (
                      <a href={i.href} className="break-all text-neutral-300 hover:text-accent">{i.value}</a>
                    ) : (
                      <p className="text-neutral-300">{i.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Wipe>
              <Link href="/pricing" className="group block rounded-2xl border border-white/10 bg-ink-900 p-6 transition-colors hover:border-brand-500">
                <p className="font-display text-2xl font-bold text-white">See our rates</p>
                <p className="mt-2 text-neutral-400">Packages, extra hours, outstation and airport transfers.</p>
                <span className="mt-4 inline-flex items-center gap-2 font-semibold text-accent group-hover:gap-3 transition-all">View rates <ArrowRight size={18} /></span>
              </Link>
            </Wipe>
          </div>
        </div>
      </section>
    </main>
  );
}
