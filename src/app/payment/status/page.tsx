import type { Metadata } from "next";
import PaymentStatus from "@/components/forms/PaymentStatus";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Payment status", robots: { index: false } };

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  return (
    <main>
      <PageHeader lines={["Payment", "status."]} />
      <section className="py-16 sm:py-24">
        <div className="container-page mx-auto max-w-2xl">
          {orderId ? (
            <PaymentStatus orderId={orderId} />
          ) : (
            <p className="rounded-3xl border border-white/10 bg-ink-900 p-10 text-center text-neutral-300">
              No payment found. Start a new payment from the Pay online page.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
