import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Request a quote or book a corporate car in Nagpur. Call, email or send an enquiry to Shree Travels.",
};

export default function ContactPage() {
  const items = [
    { icon: Phone, label: "Phone", value: site.phone, href: site.phoneHref },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: "Address", value: site.address },
    { icon: Clock, label: "Hours", value: site.hours },
  ];
  return (
    <main className="py-16">
      <div className="container-page">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="font-display text-4xl sm:text-5xl">Get in touch</h1>
          <p className="mt-4 text-lg text-gray-600">
            Tell us what you need and we will get back to you with a quote.
          </p>
        </header>
        <div className="grid gap-10 lg:grid-cols-2">
          <ContactForm />
          <div className="space-y-6">
            <ul className="card space-y-5">
              {items.map((i) => (
                <li key={i.label} className="flex items-start gap-4">
                  <span className="rounded-xl bg-primary-100 p-3 text-primary-600">
                    <i.icon size={22} />
                  </span>
                  <div>
                    <p className="font-semibold">{i.label}</p>
                    {i.href ? (
                      <a href={i.href} className="text-gray-600 hover:text-primary-600">{i.value}</a>
                    ) : (
                      <p className="text-gray-600">{i.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Image
              src="/images/pricing.webp"
              alt="Shree Travels pricing"
              width={1248}
              height={712}
              className="w-full rounded-2xl shadow-card"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
