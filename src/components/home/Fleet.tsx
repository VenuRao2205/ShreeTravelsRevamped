import Image from "next/image";
import { Users } from "lucide-react";
import { Fade, MaskLine, Wipe } from "@/components/ui/motion";
import { vehicles } from "@/lib/site";

export default function Fleet() {
  return (
    <section className="bg-ink py-24 sm:py-32">
      <div className="container-page">
        <h2 className="mb-14 max-w-3xl text-[clamp(2.4rem,5.5vw,4.5rem)]">
          <MaskLine>Hatchback, sedan</MaskLine>
          <MaskLine delay={0.1}>or SUV.</MaskLine>
        </h2>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {vehicles.map((v, i) => (
            <Fade key={v.name} delay={i * 0.1} className={i === 1 ? "md:mt-16" : i === 2 ? "md:mt-32" : ""}>
              <article className="group">
                <Wipe delay={i * 0.12}>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink-800">
                    <Image
                      src={v.image}
                      alt={`${v.name} from the Shree Travels fleet`}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                </Wipe>
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="text-3xl">{v.name}</h3>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                    <Users size={15} className="text-brand-500" /> {v.seats}
                  </span>
                </div>
                <p className="mt-2 text-neutral-400">{v.text}</p>
              </article>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
