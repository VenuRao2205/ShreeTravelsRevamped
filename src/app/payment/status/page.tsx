import type { Metadata } from "next";
import PaymentStatus from "@/components/forms/PaymentStatus";

export const metadata: Metadata = { title: "Payment Status", robots: { index: false } };

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  return (
    <main className="py-16">
      <div className="container-page mx-auto max-w-xl">
        {orderId ? (
          <PaymentStatus orderId={orderId} />
        ) : (
          <p className="card text-center">No payment found. Please start a new payment.</p>
        )}
      </div>
    </main>
  );
}
