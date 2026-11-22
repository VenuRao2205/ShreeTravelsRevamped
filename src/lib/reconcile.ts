import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/models";
import { getOrderStatus } from "@/lib/phonepe";
import { sendPaymentEmails } from "@/lib/mail";

/**
 * Source of truth is PhonePe's order-status API, never the browser or the
 * webhook body. Updates our record and sends emails exactly once.
 */
export async function reconcilePayment(merchantOrderId: string) {
  await connectDB();
  const payment = await PaymentModel.findOne({ merchantOrderId });
  if (!payment) return null;

  const remote = await getOrderStatus(merchantOrderId);
  payment.state = remote.state;
  if (remote.orderId) payment.phonepeOrderId = remote.orderId;

  const final = remote.state === "COMPLETED" || remote.state === "FAILED";
  if (final && !payment.notified) {
    // Claim the notification atomically so webhook + redirect can't both send.
    const claimed = await PaymentModel.findOneAndUpdate(
      { _id: payment._id, notified: false },
      { notified: true },
    );
    if (claimed) {
      sendPaymentEmails({
        name: payment.name,
        email: payment.email,
        merchantOrderId,
        amount: payment.amount,
        state: remote.state,
      }).catch((e) => console.error("payment email failed", e));
    }
    payment.notified = true;
  }
  await payment.save();
  return payment;
}
