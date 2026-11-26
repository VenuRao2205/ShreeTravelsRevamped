import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Fade, MaskLine } from "@/components/ui/motion";
import { site } from "@/lib/site";

const trust = [
  {
    title: `Since ${site.since}`,
    text: "Over thirty years of corporate travel in Nagpur.",
  },
  {
    title: "Owners on the line",
    text: "Call us and you speak to the people who run the business. Every trip is our responsibility.",
  },
  {
    title: "Honest pricing",
    text: "Rates are published up front, every payment gets a proper invoice, and our policies are in writing.",
  },
];

const eras = [
  {
    label: "Then",
    fleet: {
      src: "/images/history-fleet-then.webp",
      alt: "Shree Travels' early fleet of white cars lined up under trees",
      caption: "Our early fleet",
    },
    person: {
      src: "/images/history-milind-then.webp",
      alt: "Milind Garde speaking, in an early photo",
      caption: "Milind Garde",
      w: 720,
      h: 909,
    },
  },
  {
    label: "Today",
    fleet: {
      src: "/images/history-fleet-now.webp",
      alt: "Shree Travels' fleet of white cars today",
      caption: "The fleet today",
    },
    person: {
      src: "/images/family.webp",
      alt: "Milind Garde and his son Arjun Garde",
      caption: "Milind Garde and his son Arjun Garde",
      w: 1100,
      h: 1462,
    },
  },
];

export default function Family({
  headingLevel = "h2",
}: {
  headingLevel?: "h1" | "h2";
}) {
  const H = headingLevel;
  return (
    <section className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div
        aria-hidden
        className="absolute -left-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-brand-500/10 blur-3xl"
      />
      <div className="container-page relative">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-20">
          <H className="text-[clamp(2.4rem,5.5vw,4.5rem)]">
            <MaskLine>Built on trust,</MaskLine>
            <MaskLine delay={0.1} className="text-outline">
              since {site.since}.
            </MaskLine>
          </H>
          <Fade delay={0.2}>
            <p className="max-w-xl text-lg text-neutral-300">
              Shree Travels started in Nagpur in {site.since}. Our promise is
              simple: we quote clearly, send professional chauffeurs and stand
              behind every trip. When you call, you reach the people who run the
              business.
            </p>
          </Fade>
        </div>

        <ol className="relative mt-16 grid gap-16 border-l-2 border-brand-500/60 pl-6 sm:pl-10 lg:mt-20 lg:grid-cols-2 lg:gap-14 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-10">
          {eras.map((e, i) => (
            <li key={e.label} className="relative">
              <span
                aria-hidden
                className="absolute -left-[2.1rem] top-1.5 h-4 w-4 rounded-full border-2 border-black bg-brand-500 sm:-left-[3.1rem] lg:-top-[3.05rem] lg:left-0"
              />
              <Fade delay={i * 0.1}>
                <p className="font-display text-3xl font-bold text-white sm:text-4xl">
                  {e.label}
                </p>
                <div className="relative mt-6 pb-14 sm:pb-16">
                  <figure>
                    <div className="relative">
                      <span
                        aria-hidden
                        className="absolute -bottom-3 -right-3 h-full w-full rounded-[1.5rem] bg-brand-500"
                      />
                      <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-black">
                        <Image
                          src={e.fleet.src}
                          alt={e.fleet.alt}
                          width={1200}
                          height={800}
                          sizes="(min-width:1024px) 45vw, 90vw"
                          className="aspect-[3/2] h-auto w-full object-cover"
                        />
                      </div>
                    </div>
                    <figcaption className="mt-6 max-w-[50%] font-display text-lg font-bold text-white">
                      {e.fleet.caption}
                    </figcaption>
                  </figure>
                  <figure className="absolute -bottom-0 right-3 w-[36%] sm:right-6 sm:w-[32%]">
                    <div className="overflow-hidden rounded-2xl border-2 border-black shadow-xl">
                      <Image
                        src={e.person.src}
                        alt={e.person.alt}
                        width={e.person.w}
                        height={e.person.h}
                        sizes="(min-width:1024px) 15vw, 35vw"
                        className="aspect-[3/4] w-full object-cover object-top"
                      />
                    </div>
                    <figcaption className="mt-2 text-sm font-semibold leading-snug text-white">
                      {e.person.caption}
                    </figcaption>
                  </figure>
                </div>
              </Fade>
            </li>
          ))}
        </ol>

        <dl className="mt-16 grid gap-6 sm:grid-cols-3">
          {trust.map((t, i) => (
            <Fade key={t.title} delay={0.1 + i * 0.1}>
              <div className="border-t-2 border-brand-500 pt-4">
                <dt className="font-display text-xl font-bold text-white">
                  {t.title}
                </dt>
                <dd className="mt-2 text-neutral-400">{t.text}</dd>
              </div>
            </Fade>
          ))}
        </dl>
        <Fade delay={0.2} className="mt-10">
          <Link href="/contact" className="btn-primary">
            Talk to us <ArrowRight size={19} />
          </Link>
        </Fade>
      </div>
    </section>
  );
}
