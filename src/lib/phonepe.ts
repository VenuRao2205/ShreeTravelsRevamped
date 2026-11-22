import { createHash } from "crypto";

// Two PhonePe API generations are supported, chosen by which credentials are set:
//  - v2 Standard Checkout: PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET (OAuth)
//  - v1 (Developer Settings > API Keys: merchant ID + salt key + key index): PHONEPE_MERCHANT_ID / PHONEPE_SALT_KEY
// If PHONEPE_SALT_KEY is set, v1 is used.
const isV1 = () => !!process.env.PHONEPE_SALT_KEY && !!process.env.PHONEPE_MERCHANT_ID;

const V1_BASE = () =>
  process.env.PHONEPE_ENV === "production" ? "https://api.phonepe.com/apis/hermes" : "https://api-preprod.phonepe.com/apis/pg-sandbox";
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const keyIndex = () => process.env.PHONEPE_SALT_INDEX ?? "1";
const xVerify = (data: string) => `${sha256(data + process.env.PHONEPE_SALT_KEY)}###${keyIndex()}`;

// v1 signature check for callbacks (body.response is base64 JSON).
export function verifyV1Callback(base64Response: string, header: string | null) {
  if (!process.env.PHONEPE_SALT_KEY || !header) return false;
  return header === xVerify(base64Response);
}

type PayArgs = { merchantOrderId: string; amountPaise: number; redirectUrl: string; callbackUrl?: string };

async function postV1(args: PayArgs, instrument: Record<string, unknown>) {
  const merchantId = process.env.PHONEPE_MERCHANT_ID!;
  const payload = Buffer.from(
    JSON.stringify({
      merchantId,
      merchantTransactionId: args.merchantOrderId,
      merchantUserId: `MUID${Date.now()}`, // unique per payment, like the old site (a shared id can make PhonePe hide the QR)
      amount: args.amountPaise,
      redirectUrl: args.redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: args.callbackUrl ?? args.redirectUrl,
      paymentInstrument: instrument,
    }),
  ).toString("base64");
  const res = await fetch(`${V1_BASE()}/pg/v1/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-VERIFY": xVerify(payload + "/pg/v1/pay"), accept: "application/json" },
    body: JSON.stringify({ request: payload }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) throw new Error(`PhonePe v1 pay failed (${res.status} ${data?.code ?? "no code"})`);
  return data.data?.instrumentResponse as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
}

async function createPaymentV1(args: PayArgs) {
  const ir = await postV1(args, { type: "PAY_PAGE" });
  const url = ir?.redirectInfo?.url;
  if (!url) throw new Error("PhonePe v1 pay failed (no redirect url)");
  return { orderId: args.merchantOrderId, redirectUrl: url as string, state: "PENDING" };
}

async function createQrV1(args: PayArgs) {
  const ir = await postV1(args, { type: "UPI_QR" });
  const qrData = ir?.qrData ?? ir?.intentUrl;
  if (!qrData) throw new Error("PhonePe v1 UPI_QR failed (no qr data)");
  return { orderId: args.merchantOrderId, qrData: qrData as string, intentUrl: (ir?.intentUrl ?? null) as string | null };
}

/** Generates a UPI QR (Custom Checkout). Returns the string to encode as a QR image. */
export async function createQrPayment(args: PayArgs): Promise<{ orderId: string; qrData: string; intentUrl: string | null }> {
  if (isV1()) return createQrV1(args);
  const token = await getToken();
  const res = await fetch(`${PG_BASE()}/payments/v2/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}` },
    body: JSON.stringify({
      merchantOrderId: args.merchantOrderId,
      amount: args.amountPaise,
      expireAfter: 600,
      paymentFlow: { type: "PG", merchantUrls: { redirectUrl: args.redirectUrl }, paymentMode: { type: "UPI_QR" } },
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  const qrData = data?.qrData ?? data?.intentUrl;
  if (!res.ok || !qrData) throw new Error(`PhonePe v2 UPI_QR failed (${res.status} ${data?.code ?? data?.errorCode ?? "no code"})`);
  return { orderId: data.orderId ?? args.merchantOrderId, qrData, intentUrl: data.intentUrl ?? null };
}

async function getStatusV1(merchantOrderId: string): Promise<{ state: PhonePeState; orderId?: string }> {
  const merchantId = process.env.PHONEPE_MERCHANT_ID!;
  const path = `/pg/v1/status/${merchantId}/${encodeURIComponent(merchantOrderId)}`;
  const res = await fetch(`${V1_BASE()}${path}`, {
    headers: { "Content-Type": "application/json", "X-VERIFY": xVerify(path), "X-MERCHANT-ID": merchantId, accept: "application/json" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  const code: string | undefined = data?.code;
  console.log(`phonepe v1 status ${merchantOrderId}: http ${res.status} code ${code} responseCode ${data?.data?.responseCode} state ${data?.data?.state} msg ${data?.message}`);
  if (code === "PAYMENT_SUCCESS") return { state: "COMPLETED", orderId: data?.data?.transactionId };
  if (code === "PAYMENT_PENDING" || code === "TRANSACTION_NOT_FOUND") return { state: "PENDING" };
  if (code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED" || code === "TIMED_OUT" || code === "PAYMENT_CANCELLED") {
    return { state: "FAILED", orderId: data?.data?.transactionId };
  }
  throw new Error(`PhonePe v1 status failed (${res.status} ${code ?? "no code"})`);
}

// PhonePe Standard Checkout v2, called over REST (no SDK dependency).
// Docs: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-integration-website

const isProd = () => process.env.PHONEPE_ENV === "production";

const AUTH_URL = () =>
  isProd()
    ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

const PG_BASE = () =>
  isProd()
    ? "https://api.phonepe.com/apis/pg"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  // expires_at is epoch seconds; refresh a minute early
  if (tokenCache && tokenCache.expiresAt - 60_000 > Date.now()) return tokenCache.token;

  const { PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION } = process.env;
  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) throw new Error("PhonePe credentials missing");

  const res = await fetch(AUTH_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: PHONEPE_CLIENT_ID,
      client_version: PHONEPE_CLIENT_VERSION ?? "1",
      client_secret: PHONEPE_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PhonePe auth failed (${res.status})`);
  const data = await res.json();
  // PhonePe's docs call expires_at both an epoch timestamp and a number of seconds; handle either.
  const exp = Number(data.expires_at);
  const expiresAt = exp > 1e9 ? exp * 1000 : Date.now() + exp * 1000;
  tokenCache = { token: data.access_token, expiresAt };
  return tokenCache.token;
}

export async function createPayment(args: {
  merchantOrderId: string;
  amountPaise: number;
  redirectUrl: string;
  message?: string;
  callbackUrl?: string;
}): Promise<{ orderId: string; redirectUrl: string; state: string }> {
  if (isV1()) return createPaymentV1(args);
  const token = await getToken();
  const res = await fetch(`${PG_BASE()}/checkout/v2/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}` },
    body: JSON.stringify({
      merchantOrderId: args.merchantOrderId,
      amount: args.amountPaise,
      expireAfter: 1200,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: args.message ?? "Payment to Shree Travels",
        merchantUrls: { redirectUrl: args.redirectUrl },
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PhonePe pay failed (${res.status})`);
  return res.json();
}

export type PhonePeState = "PENDING" | "COMPLETED" | "FAILED";

export async function getOrderStatus(merchantOrderId: string): Promise<{ state: PhonePeState; orderId?: string }> {
  if (isV1()) return getStatusV1(merchantOrderId);
  const token = await getToken();
  const res = await fetch(
    `${PG_BASE()}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
    { headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`PhonePe status failed (${res.status})`);
  return res.json();
}
