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
  tokenCache = { token: data.access_token, expiresAt: data.expires_at * 1000 };
  return tokenCache.token;
}

export async function createPayment(args: {
  merchantOrderId: string;
  amountPaise: number;
  redirectUrl: string;
  message?: string;
}): Promise<{ orderId: string; redirectUrl: string; state: string }> {
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
  const token = await getToken();
  const res = await fetch(
    `${PG_BASE()}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
    { headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`PhonePe status failed (${res.status})`);
  return res.json();
}
