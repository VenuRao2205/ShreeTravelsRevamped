import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { PaymentRequestModel } from "@/models";

export const PORTAL_COOKIE = "st_portal";
const SESSION_MS = 2 * 60 * 60 * 1000; // customer stays signed in for 2 hours at most
export const MAX_FAILS = 5;
export const LOCK_MS = 15 * 60 * 1000;

// No 0/O/1/I so credentials read out over the phone are unambiguous.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export const newLoginId = () => pick(8);
export const newPassword = () => pick(10);
export const pretty = (v: string, group: number) => v.match(new RegExp(`.{1,${group}}`, "g"))!.join("-");
/** Users may type dashes, spaces or lower case. */
export const normalise = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");

export function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(normalise(pw), salt, 32).toString("hex")}`;
}

const DUMMY = hashPassword("DUMMYDUMMY");
export function verifyPassword(pw: string, stored: string | undefined) {
  const [saltHex, hashHex] = (stored ?? DUMMY).split(":");
  const derived = scryptSync(normalise(pw), Buffer.from(saltHex, "hex"), 32);
  const ok = timingSafeEqual(derived, Buffer.from(hashHex, "hex"));
  return ok && !!stored; // an unknown login id still costs the same time
}

const secret = () => {
  const s = process.env.ADMIN_PASSWORD;
  if (!s || s.length < 8) return null;
  return createHmac("sha256", s).update("portal-session").digest("hex");
};
const sign = (v: string, key: string) => createHmac("sha256", key).update(v).digest("hex");

export function makeSession(requestId: string) {
  const key = secret()!;
  const body = `${requestId}.${Date.now() + SESSION_MS}`;
  return `${body}.${sign(body, key)}`;
}

export const sessionCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MS / 1000,
};

/** The customer's request, if they hold a valid login that has not expired or been revoked. */
export async function currentRequest() {
  const key = secret();
  const token = (await cookies()).get(PORTAL_COOKIE)?.value;
  if (!key || !token) return null;
  const [id, exp, sig] = token.split(".");
  if (!id || !exp || !sig || Number(exp) < Date.now()) return null;
  const good = Buffer.from(sign(`${id}.${exp}`, key));
  const given = Buffer.from(sig);
  if (good.length !== given.length || !timingSafeEqual(good, given)) return null;
  await connectDB();
  const doc = await PaymentRequestModel.findById(id).catch(() => null);
  if (!doc || doc.revoked || doc.expiresAt.getTime() < Date.now()) return null;
  return doc;
}
