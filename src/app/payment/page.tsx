import type { Metadata } from "next";
import PaymentForm from "@/components/forms/PaymentForm";

export const metadata: Metadata = {
  title: "Quick Payment",
  description: "Pay Shree Travels securely online with PhonePe (UPI, cards, net banking).",
};

export default function PaymentPage() {
  return (
    <main className="py-16">
      <div className="container-page mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <h1 className="font-display text-4xl">Quick Payment</h1>
          <p className="mt-3 text-gray-600">Pay your Shree Travels invoice securely online.</p>
        </header>
        <PaymentForm />
      </div>
    </main>
  );
}
