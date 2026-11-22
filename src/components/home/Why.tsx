import { Phone } from "lucide-react";
import { CountUp, Fade, GlowArea, MaskLine } from "@/components/ui/motion";
import { site } from "@/lib/site";

export default function Why() {
  return (
    <section className="relative overflow-hidden bg-ink-900 py-24 sm:py-32">
      <div aria-hidden className="absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-brand-500/10 blur-3xl" />
      <div className="container-page relative">
        <h2 className="mb-14 max-w-3xl text-[clamp(2.4rem,5.5vw,4.5rem)]">
          <MaskLine>Why companies</MaskLine>
          <MaskLine delay={0.1}>trust us.</MaskLine>
        </h2>

        <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto_auto]">
          <Fade className="md:col-span-2 md:row-span-2">
            <GlowArea className="flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-black p-8 sm:p-10">
              <div className="font-display text-[clamp(6rem,14vw,11rem)] font-extrabold leading-[0.8] text-fire">
                <CountUp value={30} suffix="+" />
              </div>
              <div>
                <h3 className="text-3xl">Three decades on the road</h3>
                <p className="mt-3 max-w-md text-neutral-400">
                  Corporate transport in Nagpur since {site.since}, built one trip at a time by the Garde family.
                </p>
              </div>
            </GlowArea>
          </Fade>

          <Fade delay={0.08} className="md:col-span-2">
            <GlowArea className="h-full rounded-3xl border border-white/10 bg-black p-8">
              <h3 className="text-2xl">Professional drivers</h3>
              <p className="mt-3 text-neutral-400">
                Experienced, courteous chauffeurs who know Nagpur&rsquo;s roads and put safety first.
              </p>
            </GlowArea>
          </Fade>

          <Fade delay={0.14} className="md:col-span-1">
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-brand-500 p-7 text-black">
              <span aria-hidden className="absolute -right-6 -top-6 h-28 w-28 rounded-full border-[14px] border-black/10" />
              <h3 className="text-2xl text-black">Always dispatching</h3>
              <a href={site.phoneHref} className="relative mt-6 inline-flex items-center gap-2 font-bold hover:underline">
                <Phone size={18} /> {site.phoneShort}
              </a>
            </div>
          </Fade>

          <Fade delay={0.2} className="md:col-span-1">
            <GlowArea className="h-full rounded-3xl border border-white/10 bg-black p-7">
              <h3 className="text-2xl">Serviced, clean cars</h3>
              <p className="mt-3 text-neutral-400">Hatchbacks, sedans and SUVs, kept in order.</p>
            </GlowArea>
          </Fade>

          <Fade delay={0.1} className="md:col-span-4">
            <GlowArea className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black p-8 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-2xl sm:text-3xl">Billed to your company, with clear rates.</h3>
              <p className="max-w-md text-neutral-400">
                Monthly corporate billing and published pricing, so your accounts team knows what to expect.
              </p>
            </GlowArea>
          </Fade>
        </div>
      </div>
    </section>
  );
}
