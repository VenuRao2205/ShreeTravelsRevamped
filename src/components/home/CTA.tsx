import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Fade, MaskLine, Parallax } from "@/components/ui/motion";
import { site } from "@/lib/site";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-brand-500 py-24 text-black sm:py-32">
      <Parallax distance={90} className="pointer-events-none absolute -right-24 -top-24" >
        <div aria-hidden className="h-[30rem] w-[30rem] rounded-full border-[48px] border-black/10" />
      </Parallax>
      <Parallax distance={-60} className="pointer-events-none absolute -bottom-40 left-[8%]">
        <div aria-hidden className="h-[22rem] w-[22rem] rounded-full border-[28px] border-black/10" />
      </Parallax>

      <div className="container-page relative">
        <h2 className="text-[clamp(2.8rem,8vw,7rem)] leading-[0.92] text-black">
          <MaskLine>Need a car in</MaskLine>
          <MaskLine delay={0.1}>Nagpur today?</MaskLine>
        </h2>
        <Fade delay={0.3}>
          <a
            href={site.phoneHref}
            className="mt-8 inline-block font-display text-[clamp(2rem,6vw,4.5rem)] font-extrabold tracking-tight underline decoration-black/30 decoration-4 underline-offset-8 transition-all hover:decoration-black"
          >
            {site.phone}
          </a>
        </Fade>
        <Fade delay={0.4} className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/contact" className="btn-dark text-lg">
            Send an enquiry <ArrowRight size={20} />
          </Link>
          <Link href="/payment" className="btn border-2 border-black text-lg text-black hover:bg-black hover:text-brand-500">
            Pay an invoice
          </Link>
        </Fade>
      </div>
    </section>
  );
}
