import { Fade, MaskLine } from "@/components/ui/motion";

export default function PageHeader({ lines, intro }: { lines: string[]; intro?: string }) {
  return (
    <header className="grain relative isolate overflow-hidden border-b border-white/10 bg-ink pb-14 pt-16 sm:pb-20 sm:pt-24">
      <div aria-hidden className="absolute -right-32 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-3xl" />
      <div className="container-page">
        <h1 className="text-[clamp(2.8rem,8vw,6.5rem)] leading-[0.94]">
          {lines.map((l, i) => (
            <MaskLine key={l} delay={i * 0.1} className={i === lines.length - 1 && lines.length > 1 ? "text-outline" : ""}>
              {l}
            </MaskLine>
          ))}
        </h1>
        {intro && (
          <Fade delay={0.3} className="mt-7 max-w-2xl">
            <p className="text-lg text-neutral-300 sm:text-xl">{intro}</p>
          </Fade>
        )}
      </div>
    </header>
  );
}
