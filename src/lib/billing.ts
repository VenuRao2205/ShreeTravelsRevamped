import { z } from "zod";

/** Shared by the bill form (browser) and the PDF / API (server), so both always show the same numbers. */

export const COMPANY_DEFAULTS = {
  name: "Shree Travels",
  address: "“YamunaYatan”, 225-B, West High Court Rd., Opp. Sathe Jewellers, Nagpur-440 010.",
  phones: "Ph.: 2536801   Mobile: 98222 36802",
  email: "shreetravelsngp@yahoo.com",
  bankName: "Canara Bank",
  branch: "Law College Sq. - 440010",
  accountNo: "52501010000489",
  ifsc: "CNRB0015250",
  pan: "ABQPG8871J",
  gstin: "27ABQPG8871J1ZX",
  sac: "996601",
};
export type Company = typeof COMPANY_DEFAULTS;

export const RCM_STATEMENT = "GST on this supply is payable by the recipient under reverse charge (Notification No. 13/2017-Central Tax (Rate)). Tax shown below is not added to the total.";

export const DEFAULT_NOTES = [
  "1) Enclosed total duty slip",
  "2) We are not responsible for the loss of signed duty slip, after you receive the bill. Please check.",
].join("\n");

export const KINDS = [
  { id: "fixed", label: "Fixed / package rate", hint: "Amount is the rate" },
  { id: "per_km", label: "Per KM", hint: "KMs × rate" },
  { id: "extra_km", label: "Extra KM", hint: "KMs × rate" },
  { id: "extra_hours", label: "Extra hours", hint: "Hours × rate" },
  { id: "custom", label: "Other (type amount)", hint: "You type the amount" },
] as const;
export type Kind = (typeof KINDS)[number]["id"];
export const KIND_LABEL: Record<Kind, string> = { fixed: "Fixed Rate", per_km: "Per KM", extra_km: "Extra KM", extra_hours: "Extra Hours", custom: "" };

const money = z.number().min(0).max(10_000_000);
const text = (n: number) => z.string().trim().max(n).default("");

export const itemSchema = z.object({
  start: z.string().max(20).default(""), // "YYYY-MM-DDTHH:mm" from a datetime-local input
  end: z.string().max(20).default(""),
  passenger: text(80),
  from: text(60),
  taxiNo: text(30),
  carType: text(40),
  dutySlip: text(40),
  kind: z.enum(["fixed", "per_km", "extra_km", "extra_hours", "custom"]).default("fixed"),
  rateLabel: text(60),
  kms: money.default(0),
  hours: money.default(0),
  rate: money.default(0),
  amount: money.default(0), // only used when kind is "custom"; otherwise worked out
  toll: money.default(0),
  parking: money.default(0),
});
export type Item = z.infer<typeof itemSchema>;

export const billSchema = z.object({
  billNo: z.string().trim().min(1, "Enter the invoice number").max(30),
  billDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the invoice date"),
  customerName: z.string().trim().min(2, "Enter the customer name").max(120),
  customerCity: text(120),
  bookedBy: text(80),
  customerGstin: text(20),
  customerEmail: z.string().trim().max(200).default(""),
  customerPhone: text(20),
  items: z.array(itemSchema).min(1, "Add at least one trip").max(60),
  gstMode: z.enum(["cgst_sgst", "igst", "none"]).default("cgst_sgst"),
  gstRate: z.number().min(0).max(40).default(5), // total %, split in half for CGST + SGST
  rcm: z.boolean().default(false), // reverse charge: the customer pays the GST, so it is shown but not added to the total
  notes: z.string().max(600).default(DEFAULT_NOTES),
  showStamp: z.boolean().default(true),
  company: z
    .object({
      name: text(60), address: text(200), phones: text(80), email: text(100), bankName: text(60), branch: text(80),
      accountNo: text(30), ifsc: text(20), pan: text(20), gstin: text(20), sac: text(20),
    })
    .partial()
    .default({}),
});
export type BillInput = z.infer<typeof billSchema>;

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineAmount(i: Pick<Item, "kind" | "kms" | "hours" | "rate" | "amount">) {
  switch (i.kind) {
    case "fixed": return r2(i.rate);
    case "per_km":
    case "extra_km": return r2(i.kms * i.rate);
    case "extra_hours": return r2(i.hours * i.rate);
    default: return r2(i.amount);
  }
}

export type Totals = {
  subtotal: number; kms: number; toll: number; parking: number;
  cgst: number; sgst: number; igst: number; // GST added to the bill
  rcmCgst: number; rcmSgst: number; rcmIgst: number; rcmTax: number; // GST the customer pays under reverse charge (not in the total)
  total: number;
};

/** GST is charged on the trip amounts; tolls and parking are added after tax (as on the existing bills). Tax rounds to the nearest rupee. */
export function totalsOf(b: Pick<BillInput, "items" | "gstMode" | "gstRate"> & { rcm?: boolean }): Totals {
  const subtotal = r2(b.items.reduce((a, i) => a + lineAmount(i), 0));
  const kms = r2(b.items.reduce((a, i) => a + i.kms, 0));
  const toll = r2(b.items.reduce((a, i) => a + i.toll, 0));
  const parking = r2(b.items.reduce((a, i) => a + i.parking, 0));
  let cgst = 0, sgst = 0, igst = 0;
  if (b.gstMode === "cgst_sgst") { cgst = sgst = Math.round((subtotal * b.gstRate) / 200); }
  if (b.gstMode === "igst") igst = Math.round((subtotal * b.gstRate) / 100);
  const rcm = !!b.rcm && b.gstMode !== "none";
  const out = rcm ? { cgst: 0, sgst: 0, igst: 0, rcmCgst: cgst, rcmSgst: sgst, rcmIgst: igst } : { cgst, sgst, igst, rcmCgst: 0, rcmSgst: 0, rcmIgst: 0 };
  const rcmTax = out.rcmCgst + out.rcmSgst + out.rcmIgst;
  return { subtotal, kms, toll, parking, ...out, rcmTax, total: r2(subtotal + toll + parking + out.cgst + out.sgst + out.igst) };
}

/** True for names that read like a company, LLP or similar (a "body corporate" under GST). Only a prompt to check, never a decision. */
export const looksLikeCompany = (name: string) => /\b(pvt|private|ltd|limited|llp|inc|corporation|corp)\b/i.test(name ?? "");

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const below100 = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`);
const below1000 = (n: number) => `${n >= 100 ? ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " : "") : ""}${below100(n % 100)}`;

/** Indian numbering: crore, lakh, thousand. */
export function inWords(amount: number) {
  const rupees = Math.floor(amount + 1e-9);
  const paise = Math.round((amount - rupees) * 100);
  if (rupees === 0 && paise === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(rupees / 10_000_000), lakh = Math.floor((rupees % 10_000_000) / 100_000), thou = Math.floor((rupees % 100_000) / 1000), rest = rupees % 1000;
  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thou) parts.push(`${below100(thou)} Thousand`);
  if (rest) parts.push(below1000(rest));
  let out = parts.join(" ");
  if (paise) out += `${out ? " and " : ""}${below100(paise)} Paise`;
  return out;
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-09-16T07:30" -> "Sep 16 2026  7:30AM" (the layout on the existing bill). */
export function fmtDateTime(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v ?? "");
  if (!m) return "";
  const date = `${MON[Number(m[2]) - 1]} ${m[3]} ${m[1]}`;
  if (m[4] === undefined) return date;
  const h = Number(m[4]);
  return `${date} ${h % 12 || 12}:${m[5]}${h < 12 ? "AM" : "PM"}`;
}
/** "2026-09-21" -> "21/09/2026" */
export const fmtBillDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split("-").reverse().join("/") : v);
export const fmt2 = (n: number) => n.toFixed(2);
export const inr = (n: number) => `Rs ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Next invoice number: the highest number made so far plus one, keeping the same width (01048 -> 01049). */
export function nextBillNo(last?: string) {
  const m = /^(.*?)(\d+)$/.exec(last ?? "");
  if (!m) return "00001";
  return `${m[1]}${String(Number(m[2]) + 1).padStart(m[2].length, "0")}`;
}
