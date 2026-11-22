import Family from "@/components/home/Family";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/ui/Marquee";
import ServiceRows from "@/components/home/ServiceRows";
import Why from "@/components/home/Why";
import Fleet from "@/components/home/Fleet";
import OnTheRoad from "@/components/home/OnTheRoad";
import Steps from "@/components/home/Steps";
import CTA from "@/components/home/CTA";
import { serviceNames } from "@/lib/site";

export default function Home() {
  return (
    <main>
      <Hero />
      <Marquee items={serviceNames} />
      <Family />
      <ServiceRows />
      <Why />
      <Fleet />
      <OnTheRoad />
      <Steps />
      <CTA />
    </main>
  );
}
