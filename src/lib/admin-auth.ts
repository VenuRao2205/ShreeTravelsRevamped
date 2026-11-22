import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const COOKIE = "st_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

const secret = () => {
  const s = process.env.ADMIN_PASSWORD;
  if (!s || s.length < 8) return null; // admin stays disabled until a real password is set
  return s;
};

const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("hex");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminEnabled() {
  return secret() !== null;
}

export function checkPassword(input: string) {
  const s = secret();
  if (!s) return false;
  // compare HMACs so length differences don't leak
  return safeEqual(sign(input, "pw"), sign(s, "pw"));
}

export function makeToken() {
  const s = secret()!;
  const exp = String(Date.now() + MAX_AGE * 1000);
  return `${exp}.${sign(exp, s)}`;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

export async function isAdmin() {
  const s = secret();
  if (!s) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp, s));
}

export async function requireAdmin() {
  return (await isAdmin()) ? null : NextResponse.json({ error: "Not signed in" }, { status: 401 });
}
