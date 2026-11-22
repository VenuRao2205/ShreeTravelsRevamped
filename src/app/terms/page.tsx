import type { Metadata } from "next";
import LegalPage, { LegalBlock } from "@/components/ui/LegalPage";
import { terms } from "@/content/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms & Conditions", description: "Terms and conditions for booking and paying for Shree Travels services." };

export default function TermsPage() {
  return (
    <LegalPage lines={["Terms &", "conditions."]} intro={terms.intro}>
      <ol className="space-y-10">
        {terms.clauses.map((c, i) => (
          <li key={i}>
            <LegalBlock>
              <div className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-display text-4xl font-extrabold text-brand-500">{i + 1}</span>
                <div className="space-y-2">
                  <h2 className="text-2xl text-white">{c.title}</h2>
                  <p>{c.text}</p>
                </div>
              </div>
            </LegalBlock>
          </li>
        ))}
      </ol>
      <LegalBlock title="Important notice"><p>{terms.notice}</p></LegalBlock>
      <LegalBlock title="Questions about these terms?">
        <p>
          Email us at <a className="text-brand-400 underline underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </LegalBlock>
    </LegalPage>
  );
}
