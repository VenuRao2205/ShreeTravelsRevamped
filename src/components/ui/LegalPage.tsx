import type { ReactNode } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Fade } from "@/components/ui/motion";

export default function LegalPage({ lines, intro, children }: { lines: string[]; intro: string; children: ReactNode }) {
  return (
    <main>
      <PageHeader lines={lines} intro={intro} />
      <section className="py-16 sm:py-24">
        <div className="container-page mx-auto max-w-3xl space-y-14">{children}</div>
      </section>
    </main>
  );
}

export function LegalBlock({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Fade>
      <div className="space-y-4 leading-relaxed text-neutral-300">
        {title && <h2 className="text-3xl text-white">{title}</h2>}
        {children}
      </div>
    </Fade>
  );
}
