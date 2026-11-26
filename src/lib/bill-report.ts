import ExcelJS from "exceljs";
import { connectDB } from "@/lib/db";
import { BillModel, PaymentRequestModel } from "@/models";
import { toBillInput } from "@/lib/bill-store";
import { fmtBillDate, fmtDateTime, KIND_LABEL, lineAmount, looksLikeCompany, totalsOf, type Kind } from "@/lib/billing";
import { rx } from "@/lib/admin-query";

export type Period = { from: string; to: string; customer?: string };

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const add = (a: object, b: Record<string, number>) => { for (const k in b) (a as Record<string, number>)[k] += b[k] ?? 0; };

export type InvoiceRow = {
  id: string; billNo: string; billDate: string; customer: string; gstin: string; city: string; trips: number; kms: number;
  taxable: number; toll: number; parking: number; cgst: number; sgst: number; igst: number; rcm: boolean; rcmTax: number; total: number;
  gstRate: number; payment: "Paid" | "Unpaid" | "Not on a payment link"; checkRcm: boolean;
};
export type TripRow = {
  date: string; billNo: string; customer: string; passenger: string; taxiNo: string; carType: string; dutySlip: string; from: string;
  kms: number; hours: number; rateLabel: string; rate: number; amount: number; toll: number; parking: number;
};
type Group = { key: string; invoices: number; trips: number; kms: number; taxable: number; toll: number; parking: number; gst: number; rcmTax: number; total: number };

export type Report = {
  period: Period;
  customers: string[]; // everyone billed in this period, for the filter
  totals: { invoices: number; trips: number; kms: number; taxable: number; toll: number; parking: number; cgst: number; sgst: number; igst: number; gst: number; rcmTax: number; total: number };
  byCustomer: Group[]; byCar: { key: string; carType: string; trips: number; kms: number; amount: number }[]; byMonth: Group[];
  invoices: InvoiceRow[]; trips: TripRow[]; rcm: InvoiceRow[]; toCheck: { billNo: string; customer: string }[];
};

const blankGroup = (key: string): Group => ({ key, invoices: 0, trips: 0, kms: 0, taxable: 0, toll: 0, parking: 0, gst: 0, rcmTax: 0, total: 0 });

/** Loads the bills for a period (by invoice date) and works out the report. */
export async function buildReport(p: Period): Promise<Report> {
  await connectDB();
  const base = { billDate: { $gte: p.from, $lte: p.to } };
  const [docs, names, links] = await Promise.all([
    BillModel.find({ ...base, ...(p.customer && { customerName: rx(`^${p.customer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }) }).sort({ billDate: 1, billNo: 1 }).limit(5000).lean(),
    BillModel.distinct("customerName", base),
    PaymentRequestModel.find({ "invoices.billId": { $exists: true } }).select("invoices").lean(),
  ]);
  return computeReport(p, docs as unknown as Record<string, unknown>[], names, links as unknown as { invoices: { billId?: unknown; status?: string }[] }[]);
}

/** The calculation on its own, so it can be tested without a database. */
export function computeReport(p: Period, docs: Record<string, unknown>[], names: string[], links: { invoices: { billId?: unknown; status?: string }[] }[]): Report {
  const paid = new Map<string, boolean>(); // billId -> paid?
  for (const l of links) for (const i of l.invoices) if (i.billId) paid.set(String(i.billId), i.status === "PAID");

  const invoices: InvoiceRow[] = [], trips: TripRow[] = [];
  const byCustomer = new Map<string, Group>(), byMonth = new Map<string, Group>(), byCar = new Map<string, { key: string; carType: string; trips: number; kms: number; amount: number }>();
  const totals = { invoices: 0, trips: 0, kms: 0, taxable: 0, toll: 0, parking: 0, cgst: 0, sgst: 0, igst: 0, gst: 0, rcmTax: 0, total: 0 };

  for (const d of docs) {
    const b = toBillInput(d);
    if (!b) continue;
    const t = totalsOf(b);
    const row: InvoiceRow = {
      id: String(d._id), billNo: b.billNo, billDate: b.billDate, customer: b.customerName, gstin: b.customerGstin, city: b.customerCity, trips: b.items.length, kms: t.kms,
      taxable: t.subtotal, toll: t.toll, parking: t.parking, cgst: t.cgst, sgst: t.sgst, igst: t.igst, rcm: b.rcm && b.gstMode !== "none", rcmTax: t.rcmTax, total: t.total, gstRate: b.gstRate,
      payment: paid.has(String(d._id)) ? (paid.get(String(d._id)) ? "Paid" : "Unpaid") : "Not on a payment link",
      checkRcm: looksLikeCompany(b.customerName) && b.gstMode !== "none" && !b.rcm,
    };
    invoices.push(row);
    const gst = t.cgst + t.sgst + t.igst;
    const g = byCustomer.get(b.customerName) ?? blankGroup(b.customerName);
    const m = byMonth.get(b.billDate.slice(0, 7)) ?? blankGroup(b.billDate.slice(0, 7));
    for (const x of [g, m]) add(x, { invoices: 1, trips: b.items.length, kms: t.kms, taxable: t.subtotal, toll: t.toll, parking: t.parking, gst, rcmTax: t.rcmTax, total: t.total });
    byCustomer.set(g.key, g); byMonth.set(m.key, m);
    add(totals, { invoices: 1, trips: b.items.length, kms: t.kms, taxable: t.subtotal, toll: t.toll, parking: t.parking, cgst: t.cgst, sgst: t.sgst, igst: t.igst, gst, rcmTax: t.rcmTax, total: t.total });

    for (const it of b.items) {
      const amount = lineAmount(it);
      trips.push({
        date: it.start ? fmtDateTime(it.start) : fmtBillDate(b.billDate), billNo: b.billNo, customer: b.customerName, passenger: it.passenger, taxiNo: it.taxiNo, carType: it.carType,
        dutySlip: it.dutySlip, from: it.from, kms: it.kms, hours: it.hours, rateLabel: it.rateLabel || KIND_LABEL[it.kind as Kind] || "", rate: it.rate, amount, toll: it.toll, parking: it.parking,
      });
      const ck = (it.taxiNo || "(no taxi number)").toUpperCase();
      const c = byCar.get(ck) ?? { key: ck, carType: it.carType, trips: 0, kms: 0, amount: 0 };
      c.trips += 1; c.kms = r2(c.kms + it.kms); c.amount = r2(c.amount + amount); if (!c.carType) c.carType = it.carType;
      byCar.set(ck, c);
    }
  }
  const round = <T extends Record<string, unknown>>(o: T): T => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? r2(v) : v])) as T;
  return {
    period: p, customers: [...names].filter(Boolean).sort((a, z) => a.localeCompare(z)),
    totals: round(totals), byCustomer: [...byCustomer.values()].map(round).sort((a, z) => z.total - a.total), byMonth: [...byMonth.values()].map(round),
    byCar: [...byCar.values()].sort((a, z) => z.amount - a.amount), invoices, trips, rcm: invoices.filter((i) => i.rcm),
    toCheck: invoices.filter((i) => i.checkRcm).map((i) => ({ billNo: i.billNo, customer: i.customer })),
  };
}

/* ------------------------------------------------------------------ Excel */

const ORANGE = "FFE8532A";
const MONEY = "#,##0.00";

function sheet(wb: ExcelJS.Workbook, name: string, title: string, subtitle: string, cols: { header: string; key: string; width: number; money?: boolean; sum?: boolean }[], rows: Record<string, unknown>[]) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 4 }] });
  ws.mergeCells(1, 1, 1, cols.length); ws.getCell(1, 1).value = title; ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.mergeCells(2, 1, 2, cols.length); ws.getCell(2, 1).value = subtitle; ws.getCell(2, 1).font = { color: { argb: "FF666666" } };
  const head = ws.getRow(4);
  cols.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.value = c.header; cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    cell.alignment = { vertical: "middle", horizontal: c.money ? "right" : "left", wrapText: true };
    ws.getColumn(i + 1).width = c.width;
  });
  head.height = 26;
  rows.forEach((r) => {
    const row = ws.addRow(cols.map((c) => r[c.key] ?? ""));
    cols.forEach((c, i) => { if (c.money) { row.getCell(i + 1).numFmt = MONEY; row.getCell(i + 1).alignment = { horizontal: "right" }; } });
  });
  if (rows.length && cols.some((c) => c.sum)) {
    const tr = ws.addRow(cols.map((c, i) => (i === 0 ? "Total" : c.sum ? rows.reduce((a, r) => a + (Number(r[c.key]) || 0), 0) : "")));
    tr.font = { bold: true };
    cols.forEach((c, i) => { const cell = tr.getCell(i + 1); cell.border = { top: { style: "thin" } }; if (c.money) cell.numFmt = MONEY; });
  }
  if (rows.length) ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: cols.length } };
  return ws;
}

export async function reportWorkbook(r: Report): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Shree Travels"; wb.created = new Date();
  const sub = `Invoices dated ${fmtBillDate(r.period.from)} to ${fmtBillDate(r.period.to)}${r.period.customer ? ` · ${r.period.customer}` : " · all customers"}`;

  const t = r.totals;
  const sum = wb.addWorksheet("Summary");
  sum.getColumn(1).width = 38; sum.getColumn(2).width = 20;
  sum.mergeCells("A1:B1"); sum.getCell("A1").value = "Shree Travels: MIS summary"; sum.getCell("A1").font = { bold: true, size: 14 };
  sum.mergeCells("A2:B2"); sum.getCell("A2").value = sub; sum.getCell("A2").font = { color: { argb: "FF666666" } };
  const lines: [string, number, boolean?][] = [
    ["Invoices", t.invoices], ["Trips", t.trips], ["Total KMs", t.kms], ["Trip amounts (taxable value)", t.taxable, true], ["Toll charges", t.toll, true], ["Parking charges", t.parking, true],
    ["CGST charged", t.cgst, true], ["SGST charged", t.sgst, true], ["IGST charged", t.igst, true], ["GST payable by customers (reverse charge, not in totals)", t.rcmTax, true], ["Total billed", t.total, true],
  ];
  lines.forEach(([k, v, m], i) => { const row = sum.getRow(4 + i); row.getCell(1).value = k; row.getCell(2).value = v; if (m) row.getCell(2).numFmt = MONEY; if (k === "Total billed") row.font = { bold: true }; });

  const grp = (key: string) => [
    { header: key, key: "key", width: 34 }, { header: "Invoices", key: "invoices", width: 10, sum: true }, { header: "Trips", key: "trips", width: 8, sum: true }, { header: "KMs", key: "kms", width: 11, money: true, sum: true },
    { header: "Taxable value", key: "taxable", width: 15, money: true, sum: true }, { header: "Toll", key: "toll", width: 11, money: true, sum: true }, { header: "Parking", key: "parking", width: 11, money: true, sum: true },
    { header: "GST charged", key: "gst", width: 14, money: true, sum: true }, { header: "GST under RCM", key: "rcmTax", width: 14, money: true, sum: true }, { header: "Total", key: "total", width: 15, money: true, sum: true },
  ];
  sheet(wb, "By customer", "Customer-wise summary", sub, grp("Customer"), r.byCustomer);
  sheet(wb, "By month", "Month-wise summary", sub, grp("Month"), r.byMonth);
  sheet(wb, "By car", "Car-wise summary", sub, [
    { header: "Taxi number", key: "key", width: 20 }, { header: "Car type", key: "carType", width: 18 }, { header: "Trip lines", key: "trips", width: 11, sum: true },
    { header: "KMs", key: "kms", width: 12, money: true, sum: true }, { header: "Trip amounts", key: "amount", width: 16, money: true, sum: true },
  ], r.byCar);
  sheet(wb, "Trip sheet", "Trip sheet", sub, [
    { header: "Journey", key: "date", width: 20 }, { header: "Invoice no.", key: "billNo", width: 12 }, { header: "Customer", key: "customer", width: 30 }, { header: "Passenger", key: "passenger", width: 22 },
    { header: "Taxi no.", key: "taxiNo", width: 16 }, { header: "Car", key: "carType", width: 12 }, { header: "Duty slip", key: "dutySlip", width: 14 }, { header: "From", key: "from", width: 10 },
    { header: "KMs", key: "kms", width: 9, money: true, sum: true }, { header: "Hours", key: "hours", width: 8 }, { header: "Rate per", key: "rateLabel", width: 20 }, { header: "Rate", key: "rate", width: 11, money: true },
    { header: "Amount", key: "amount", width: 13, money: true, sum: true }, { header: "Toll", key: "toll", width: 10, money: true, sum: true }, { header: "Parking", key: "parking", width: 10, money: true, sum: true },
  ], r.trips);
  const reg = [
    { header: "Invoice no.", key: "billNo", width: 12 }, { header: "Invoice date", key: "billDate", width: 13 }, { header: "Customer", key: "customer", width: 32 }, { header: "Customer GSTIN", key: "gstin", width: 20 },
    { header: "Taxable value", key: "taxable", width: 15, money: true, sum: true }, { header: "Toll", key: "toll", width: 10, money: true, sum: true }, { header: "Parking", key: "parking", width: 10, money: true, sum: true },
    { header: "CGST", key: "cgst", width: 11, money: true, sum: true }, { header: "SGST", key: "sgst", width: 11, money: true, sum: true }, { header: "IGST", key: "igst", width: 11, money: true, sum: true },
    { header: "GST under RCM", key: "rcmTax", width: 14, money: true, sum: true }, { header: "Invoice total", key: "total", width: 15, money: true, sum: true }, { header: "Payment (payment link)", key: "payment", width: 22 },
  ];
  const fmtRows = (rows: InvoiceRow[]) => rows.map((i) => ({ ...i, billDate: fmtBillDate(i.billDate) }));
  sheet(wb, "GST register", "GST sales register", sub, reg, fmtRows(r.invoices));
  sheet(wb, "RCM register", "Reverse charge (RCM) register: GST payable by the customer", sub, [
    { header: "Invoice no.", key: "billNo", width: 12 }, { header: "Invoice date", key: "billDate", width: 13 }, { header: "Customer", key: "customer", width: 32 }, { header: "Customer GSTIN", key: "gstin", width: 20 },
    { header: "Taxable value", key: "taxable", width: 15, money: true, sum: true }, { header: "GST rate %", key: "gstRate", width: 11 }, { header: "Tax payable by customer", key: "rcmTax", width: 20, money: true, sum: true },
    { header: "Invoice total (without GST)", key: "total", width: 22, money: true, sum: true },
  ], fmtRows(r.rcm));
  return Buffer.from(await wb.xlsx.writeBuffer());
}
