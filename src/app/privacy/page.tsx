import type { Metadata } from "next";
import LegalPage, { LegalBlock } from "@/components/ui/LegalPage";
import { privacy } from "@/content/legal";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Shree Travels collects, uses and protects your personal information." };

export default function PrivacyPage() {
  return (
    <LegalPage lines={["Privacy", "Policy."]} intro="Your privacy is important to us. This policy explains how we collect, use and protect your personal information.">
      <LegalBlock><p>{privacy.intro}</p></LegalBlock>
      {privacy.sections.map((s) => (
        <LegalBlock key={s.title} title={s.title}>
          {s.text && <p>{s.text}</p>}
          {s.items && (
            <ul className="list-disc space-y-2 pl-6 marker:text-brand-500">
              {s.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          )}
        </LegalBlock>
      ))}
      <LegalBlock><p className="border-l-4 border-brand-500 pl-5 text-neutral-400">{privacy.note}</p></LegalBlock>
    </LegalPage>
  );
}
