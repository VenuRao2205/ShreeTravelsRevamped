import type { Metadata } from "next";
import LegalPage, { LegalBlock } from "@/components/ui/LegalPage";
import { cancellation } from "@/content/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Cancellation & Refund", description: "Cancellation and refund policy for Shree Travels bookings." };

export default function CancellationPage() {
  return (
    <LegalPage lines={["Cancellation", "& refunds."]} intro={cancellation.intro}>
      <ol className="space-y-10">
        {cancellation.points.map((p, i) => (
          <li key={i}>
            <LegalBlock>
              <div className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-display text-4xl font-extrabold text-brand-500">{i + 1}</span>
                <div className="space-y-2">
                  {p.title && <h2 className="text-2xl text-white">{p.title}</h2>}
                  <p>{p.text}</p>
                </div>
              </div>
            </LegalBlock>
          </li>
        ))}
      </ol>
      <LegalBlock title="Refund policy">
        <p>{cancellation.refund}</p>
        <p>
          In case of any issues, write to us at{" "}
          <a className="text-brand-400 underline underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a> or call us at{" "}
          <a className="text-brand-400 underline underline-offset-4" href={site.phoneHref}>{site.phone}</a>.
        </p>
      </LegalBlock>
      <LegalBlock title="Need to cancel a booking?">
        <p>Contact us with your booking ID and we will process the cancellation.</p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <a href={`mailto:${site.email}`} className="btn-primary">Email us</a>
          <a href={site.phoneHref} className="btn-ghost">Call {site.phoneShort}</a>
        </div>
      </LegalBlock>
    </LegalPage>
  );
}
