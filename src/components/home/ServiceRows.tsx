import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MaskLine, Fade } from "@/components/ui/motion";
import { services } from "@/lib/site";

export default function ServiceRows() {
  return (
    <section className="bg-black py-24 sm:py-32">
      <div className="container-page">
        <div className="mb-14 max-w-3xl">
          <h2 className="text-[clamp(2.4rem,5.5vw,4.5rem)]">
            <MaskLine>Every kind of</MaskLine>
            <MaskLine delay={0.1}>business trip.</MaskLine>
          </h2>
          <Fade delay={0.3}>
            <p className="mt-6 max-w-xl text-lg text-neutral-400">
              From one executive to a whole shift, we plan the cars, the drivers and the timing.
            </p>
          </Fade>
        </div>

        <ul className="border-b border-white/15">
          {services.map((s, i) => (
            <li key={s.slug}>
              <Fade delay={i * 0.04} y={10}>
                <Link
                  href={`/services#${s.slug}`}
                  className="group relative block overflow-hidden border-t border-white/15 py-7 sm:py-9"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-bottom scale-y-0 bg-brand-500 transition-transform duration-500 ease-[cubic-bezier(.65,0,.35,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
                  />
                  <span className="relative grid items-center gap-3 px-1 transition-all duration-500 group-hover:px-6 sm:grid-cols-[1.2fr_1fr_auto] sm:gap-10">
                    <span className="font-display text-3xl font-extrabold tracking-tight text-white transition-colors duration-300 group-hover:text-black sm:text-5xl">
                      {s.title}
                    </span>
                    <span className="max-w-md text-neutral-400 transition-colors duration-300 group-hover:text-black/80">
                      {s.blurb}
                    </span>
                    <span className="hidden h-14 w-14 place-items-center rounded-full border border-white/25 text-white transition-all duration-500 group-hover:rotate-45 group-hover:border-black group-hover:bg-black group-hover:text-brand-500 sm:grid">
                      <ArrowUpRight size={26} />
                    </span>
                  </span>
                </Link>
              </Fade>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
