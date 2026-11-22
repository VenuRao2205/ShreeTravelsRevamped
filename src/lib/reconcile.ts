import { connectDB } from "@/lib/db";
import { PaymentModel, PaymentRequestModel } from "@/models";
import { getOrderStatus } from "@/lib/phonepe";
import { sendPaymentEmails } from "@/lib/mail";
import { whatsappPayment } from "@/lib/whatsapp-cloud";

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
      // Awaited, so the serverless function is not frozen before the messages leave.
      const [mail] = await Promise.allSettled([
        sendPaymentEmails({
          name: payment.name,
          email: payment.email,
          merchantOrderId,
          amount: payment.amount,
          remarks: payment.remarks ?? undefined,
          state: remote.state,
        }),
        whatsappPayment({ name: payment.name, phone: payment.phone, merchantOrderId, amount: payment.amount, remarks: payment.remarks, state: remote.state }),
      ]);
      if (mail.status === "rejected") console.error("payment email failed", mail.reason);
    }
    payment.notified = true;
  }
  await payment.save();

  // A payment made from a customer's invoice login settles exactly the invoices it covered.
  if (remote.state === "COMPLETED" && payment.requestId && payment.invoiceKeys?.length) {
    await PaymentRequestModel.updateOne(
      { _id: payment.requestId },
      { $set: { "invoices.$[i].status": "PAID", "invoices.$[i].paidOrderId": merchantOrderId, "invoices.$[i].paidAt": new Date() } },
      { arrayFilters: [{ "i.key": { $in: payment.invoiceKeys }, "i.status": "UNPAID" }] },
    );
  }
  return payment;
}
