import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Family from "@/components/home/Family";
import CTA from "@/components/home/CTA";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: `Shree Travels is a corporate car rental in Nagpur, trusted by businesses since ${site.since}.`,
};

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        lines={["Built on trust,", `since ${site.since}.`]}
        intro="Three decades of getting Nagpur's people to meetings, airports and events on time."
      />
      <Family headingLevel="h2" />
      <CTA />
    </main>
  );
}
