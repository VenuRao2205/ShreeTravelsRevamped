import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/models";
import { createPayment, createQrPayment } from "@/lib/phonepe";

type Args = {
  req: Request;
  name: string;
  email: string;
  phone?: string;
  remarks: string;
  amountPaise: number;
  mode: "page" | "qr";
  requestId?: string;
  invoiceKeys?: string[];
};

type Result = { status: number; body: Record<string, unknown> };

/** Records the payment, then asks PhonePe for the hosted page or a QR. Shared by the quick form and invoice logins. */
export async function startPayment(a: Args): Promise<Result> {
  const merchantOrderId = `ST${randomUUID().replace(/-/g, "")}`; // 34 chars (PhonePe v1 allows 35)
  // Use the address the customer is actually on, so a wrong or stale env value can never send them to a dead page.
  const host = a.req.headers.get("x-forwarded-host") ?? a.req.headers.get("host");
  const siteUrl = host && !host.startsWith("localhost") ? `https://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(a.req.url).origin);

  try {
    await connectDB();
    await PaymentModel.create({
      merchantOrderId,
      amount: a.amountPaise,
      name: a.name,
      email: a.email,
      phone: a.phone,
      remarks: a.remarks,
      requestId: a.requestId,
      invoiceKeys: a.invoiceKeys,
    });
  } catch (e) {
    console.error("payment save failed (database)", e instanceof Error ? e.message : e);
    return { status: 503, body: { error: "We could not reach our database. Please try again shortly or call us.", code: "DB" } };
  }

  try {
    const args = {
      merchantOrderId,
      amountPaise: a.amountPaise,
      callbackUrl: `${siteUrl}/api/payment/webhook`,
      redirectUrl: `${siteUrl}/payment/status?orderId=${merchantOrderId}`,
    };
    if (a.mode === "qr") {
      const qr = await createQrPayment(args);
      await PaymentModel.updateOne({ merchantOrderId }, { state: "PENDING", phonepeOrderId: qr.orderId });
      return { status: 200, body: { orderId: merchantOrderId, qrData: qr.qrData } };
    }
    const res = await createPayment(args);
    await PaymentModel.updateOne({ merchantOrderId }, { state: "PENDING", phonepeOrderId: res.orderId });
    return { status: 200, body: { redirectUrl: res.redirectUrl } };
  } catch (e) {
    console.error("payment create failed (PhonePe)", e instanceof Error ? e.message : e);
    await PaymentModel.updateOne({ merchantOrderId }, { state: "FAILED" }).catch(() => {});
    return {
      status: 502,
      body: {
        error:
          a.mode === "qr"
            ? "A QR code could not be created right now. Use the PhonePe button instead, or call us on +91 98222 36802."
            : "The payment gateway did not accept the request. Please call us on +91 98222 36802.",
        code: a.mode === "qr" ? "QR" : "GATEWAY",
      },
    };
  }
}
