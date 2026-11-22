import type { Metadata } from "next";
import PaymentTabs from "@/components/forms/PaymentTabs";
import PageHeader from "@/components/ui/PageHeader";
import { Fade } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Pay online",
  description: "Pay your Shree Travels invoice securely online with PhonePe (UPI, cards and net banking).",
};

export default function PaymentPage() {
  return (
    <main>
      <PageHeader lines={["Pay your", "invoice."]} intro="Pay one invoice with its amount, or sign in with the login we sent you to pay several invoices together. Payments are secure through PhonePe." />
      <section className="py-16 sm:py-24">
        <div className="container-page mx-auto max-w-2xl">
          <Fade><PaymentTabs /></Fade>
        </div>
      </section>
    </main>
  );
}
