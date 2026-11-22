import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import PricingTable from "@/components/ui/PricingTable";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rates",
  description: "Published car rental rates in Nagpur: 8, 10 and 12 hour packages, extra hours, outstation and airport transfers.",
};

export default function PricingPage() {
  return (
    <main>
      <PageHeader lines={["Clear rates,", "no surprises."]} intro="Our published rates for Nagpur. Call us for monthly corporate contracts and other cars." />
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <PricingTable />
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link href="/contact" className="btn-primary">Get a quote</Link>
            <a href={site.phoneHref} className="btn-ghost"><Phone size={18} /> {site.phoneShort}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
