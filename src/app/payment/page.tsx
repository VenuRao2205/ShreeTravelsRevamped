import type { Metadata } from "next";
import PaymentForm from "@/components/forms/PaymentForm";
import PageHeader from "@/components/ui/PageHeader";
import { Fade } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Pay online",
  description: "Pay your Shree Travels invoice securely online with PhonePe (UPI, cards and net banking).",
};

export default function PaymentPage() {
  return (
    <main>
      <PageHeader lines={["Pay your", "invoice."]} intro="Enter the amount from your invoice and pay securely through PhonePe." />
      <section className="py-16 sm:py-24">
        <div className="container-page mx-auto max-w-2xl">
          <Fade><PaymentForm /></Fade>
        </div>
      </section>
    </main>
  );
}
