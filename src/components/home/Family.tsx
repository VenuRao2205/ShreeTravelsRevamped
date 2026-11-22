import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Fade, MaskLine, Wipe } from "@/components/ui/motion";
import { site } from "@/lib/site";

const trust = [
  { title: `Since ${site.since}`, text: "Over thirty years of corporate travel in Nagpur." },
  { title: "One family, one name", text: "The Garde family runs Shree Travels and answers for every trip." },
  { title: "Clear dealings", text: "Published rates, proper invoices and written policies." },
];

export default function Family({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  return (
    <section className="relative overflow-hidden bg-black py-24 sm:py-32">
      <div aria-hidden className="absolute -left-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-brand-500/10 blur-3xl" />
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Wipe>
          <figure className="relative mx-auto max-w-md lg:max-w-none">
            <span aria-hidden className="absolute -bottom-4 -right-4 h-full w-full rounded-[2rem] bg-brand-500" />
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-black">
              <Image
                src="/images/family.webp"
                alt="The Garde family of Shree Travels, Nagpur"
                width={1100}
                height={1462}
                sizes="(min-width:1024px) 40vw, 90vw"
                className="h-auto w-full"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-16 font-display text-xl font-bold text-white">
                The Garde family
              </figcaption>
            </div>
          </figure>
        </Wipe>

        <div>
          <H className="text-[clamp(2.4rem,5.5vw,4.5rem)]">
            <MaskLine>Trusted by Nagpur,</MaskLine>
            <MaskLine delay={0.1} className="text-outline">run by a family.</MaskLine>
          </H>
          <Fade delay={0.2}>
            <p className="mt-7 max-w-xl text-lg text-neutral-300">
              Shree Travels started in Nagpur in {site.since} and is still run by the Garde family. When you call
              or book, you deal with the people who own the business, and we look after your staff and guests as we
              would our own.
            </p>
          </Fade>
          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            {trust.map((t, i) => (
              <Fade key={t.title} delay={0.25 + i * 0.1}>
                <div className="border-t-2 border-brand-500 pt-4">
                  <dt className="font-display text-xl font-bold text-white">{t.title}</dt>
                  <dd className="mt-2 text-neutral-400">{t.text}</dd>
                </div>
              </Fade>
            ))}
          </dl>
          <Fade delay={0.6} className="mt-10">
            <Link href="/contact" className="btn-primary">
              Talk to us <ArrowRight size={19} />
            </Link>
          </Fade>
        </div>
      </div>
    </section>
  );
}
