import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import {
  COMPANY_DEFAULTS, DEFAULT_NOTES, KIND_LABEL, RCM_STATEMENT, fmt2, fmtBillDate, fmtDateTime, inWords, lineAmount, totalsOf,
  type BillInput, type Company, type Kind,
} from "@/lib/billing";
import { MARK_PNG, STAMP_PNG, WORDMARK_PNG } from "@/lib/bill-assets";

const A4 = { w: 595.28, h: 841.89 };
const M = 28; // page margin
const ORANGE = rgb(0.91, 0.33, 0.16);
const INK = rgb(0.08, 0.08, 0.08);
const GREY = rgb(0.45, 0.45, 0.45);

/** The built-in PDF fonts only cover Western characters, so anything else becomes "?" instead of breaking the file. */
const clean = (s: string) =>
  (s ?? "")
    .replace(/₹/g, "Rs ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, "?");

type Fonts = { reg: PDFFont; bold: PDFFont; mono: PDFFont; monoBold: PDFFont };

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of clean(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const trial = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) <= maxW) { line = trial; continue; }
      if (line) out.push(line);
      // a single very long word: break it by characters
      let w = word;
      while (font.widthOfTextAtSize(w, size) > maxW && w.length > 1) {
        let n = w.length - 1;
        while (n > 1 && font.widthOfTextAtSize(w.slice(0, n), size) > maxW) n--;
        out.push(w.slice(0, n)); w = w.slice(n);
      }
      line = w;
    }
    out.push(line);
  }
  return out;
}

type Run = { t: string; bold?: boolean };
function runsWidth(runs: Run[], f: Fonts, size: number) {
  return runs.reduce((a, r) => a + (r.bold ? f.bold : f.reg).widthOfTextAtSize(clean(r.t), size), 0);
}
function drawRuns(page: PDFPage, runs: Run[], f: Fonts, size: number, centerX: number, y: number, color = INK) {
  let x = centerX - runsWidth(runs, f, size) / 2;
  for (const r of runs) {
    const font = r.bold ? f.bold : f.reg;
    const t = clean(r.t);
    page.drawText(t, { x, y, size, font, color });
    x += font.widthOfTextAtSize(t, size);
  }
}

export async function renderBillPdf(bill: BillInput): Promise<Uint8Array> {
  const co: Company = { ...COMPANY_DEFAULTS, ...Object.fromEntries(Object.entries(bill.company ?? {}).filter(([, v]) => v)) } as Company;
  const t = totalsOf(bill);
  const doc = await PDFDocument.create();
  doc.setTitle(`Tax Invoice ${bill.billNo}`);
  doc.setAuthor(co.name);
  const f: Fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
    monoBold: await doc.embedFont(StandardFonts.CourierBold),
  };
  const wordmark = await doc.embedPng(Buffer.from(WORDMARK_PNG, "base64"));
  const mark = await doc.embedPng(Buffer.from(MARK_PNG, "base64"));
  const stamp: PDFImage | null = bill.showStamp ? await doc.embedPng(Buffer.from(STAMP_PNG, "base64")) : null;

  // table columns: [title lines, width]
  const cols = [
    { h: ["SR.", "NO."], w: 24 }, { h: ["JOURNEY", "DATE"], w: 100 }, { h: ["FROM"], w: 48 }, { h: ["Taxi No"], w: 72 },
    { h: ["Duty Slip", "No."], w: 86 }, { h: ["TOTAL", "KMS."], w: 44 }, { h: ["Rate", "Per"], w: 62 }, { h: ["RATE"], w: 48 }, { h: ["AMOUNT"], w: 55 },
  ];
  const tableW = cols.reduce((a, c) => a + c.w, 0); // 539
  const xs = cols.reduce<number[]>((acc, c, i) => (acc.push(i ? acc[i - 1] + cols[i - 1].w : M), acc), []);
  const SIZE = 7.5;
  const LH = 10;

  const pages: PDFPage[] = [];
  const watermark = (p: PDFPage) => {
    const h = 330, w = (h * mark.width) / mark.height;
    p.drawImage(mark, { x: (A4.w - w) / 2, y: 330, width: w, height: h, opacity: 0.07 });
  };
  const newPage = () => { const p = doc.addPage([A4.w, A4.h]); pages.push(p); watermark(p); return p; };

  /** Letterhead (first page) */
  function letterhead(p: PDFPage) {
    let y = A4.h - 30;
    const title = "TAX INVOICE";
    p.drawText(title, { x: (A4.w - f.bold.widthOfTextAtSize(title, 11)) / 2, y, size: 11, font: f.bold, color: INK });
    y -= 8;
    p.drawRectangle({ x: M, y: y - 46, width: A4.w - 2 * M, height: 46, color: ORANGE });
    const wh = 34, ww = (wh * wordmark.width) / wordmark.height;
    p.drawImage(wordmark, { x: (A4.w - ww) / 2, y: y - 46 + 6, width: ww, height: wh });
    y -= 46 + 14;
    drawRuns(p, [{ t: co.address }], f, 9, A4.w / 2, y); y -= 12;
    drawRuns(p, [{ t: `${co.phones}   E-mail : ${co.email}` }], f, 9, A4.w / 2, y); y -= 14;
    drawRuns(p, [
      { t: "Our Bank Details : ", bold: true }, { t: "Bank : " , bold: true }, { t: `${co.bankName} | ` },
      { t: "Branch : ", bold: true }, { t: `${co.branch} | ` }, { t: "A/c No. : ", bold: true }, { t: `${co.accountNo} | ` },
      { t: "IFSC Code : ", bold: true }, { t: co.ifsc },
    ], f, 7.4, A4.w / 2, y); y -= 13;
    drawRuns(p, [{ t: `PAN : ${co.pan} | GSTIN : ${co.gstin} | HSN/SAC Code : ${co.sac}`, bold: true }], f, 9.5, A4.w / 2, y); y -= 9;
    p.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.8, color: ORANGE });
    return y - 14;
  }

  function customerBlock(p: PDFPage, y: number) {
    const left: { t: string; font: PDFFont; size: number }[] = [
      { t: "To,", font: f.reg, size: 9 },
      { t: bill.customerName, font: f.bold, size: 11 },
      ...(bill.customerCity ? [{ t: bill.customerCity, font: f.bold, size: 10 }] : []),
      ...(bill.bookedBy ? [{ t: `Booked By : ${bill.bookedBy}`, font: f.bold, size: 9.5 }] : []),
      ...(bill.customerGstin ? [{ t: `GST No. :- ${bill.customerGstin}`, font: f.bold, size: 9.5 }] : []),
    ];
    let ly = y;
    for (const l of left) {
      for (const line of wrap(l.t, l.font, l.size, 330)) { p.drawText(line, { x: M + 6, y: ly, size: l.size, font: l.font, color: INK }); ly -= l.size + 3.5; }
    }
    const rx = A4.w - M - 190;
    p.drawText(`Invoice No : ${clean(bill.billNo)}`, { x: rx, y: y - 4, size: 9, font: f.monoBold, color: INK });
    p.drawText(`Invoice Dt : ${fmtBillDate(bill.billDate)}`, { x: rx, y: y - 20, size: 9, font: f.monoBold, color: INK });
    return Math.min(ly, y - 40) - 8;
  }

  function tableHeader(p: PDFPage, y: number) {
    const h = 26;
    p.drawRectangle({ x: M, y: y - h, width: tableW, height: h, borderColor: INK, borderWidth: 0.7, color: rgb(0.97, 0.97, 0.97), opacity: 0.0 });
    cols.forEach((c, i) => {
      c.h.forEach((line, k) => {
        const w = f.mono.widthOfTextAtSize(line, SIZE);
        p.drawText(line, { x: xs[i] + (c.w - w) / 2, y: y - 10 - k * 9, size: SIZE, font: f.mono, color: INK });
      });
      if (i) p.drawLine({ start: { x: xs[i], y }, end: { x: xs[i], y: y - h }, thickness: 0.7, color: INK });
    });
    return y - h;
  }

  // ---- page 1
  let page = newPage();
  let y = letterhead(page);
  y = customerBlock(page, y);
  y = tableHeader(page, y);

  const FOOTER_NEED = 205; // space the totals, notes and signature need below the last row
  const rowsBottom = 48;

  bill.items.forEach((it, idx) => {
    // work out the row's lines per column
    const cell: { text: string; font: PDFFont; size?: number; align?: "l" | "c" | "r" }[][] = cols.map(() => []);
    cell[0].push({ text: String(idx + 1), font: f.mono, align: "c" });
    const s = fmtDateTime(it.start), e = fmtDateTime(it.end);
    if (s) cell[1].push({ text: s, font: f.mono });
    if (e) cell[1].push({ text: e, font: f.mono });
    if (it.passenger) wrap(it.passenger.toUpperCase(), f.bold, 7.5, cols[1].w - 6).forEach((l) => cell[1].push({ text: l, font: f.bold }));
    if (it.from) wrap(it.from.toUpperCase(), f.mono, SIZE, cols[2].w - 6).forEach((l) => cell[2].push({ text: l, font: f.mono, align: "c" }));
    if (it.taxiNo) wrap(it.taxiNo.toUpperCase(), f.mono, SIZE, cols[3].w - 6).forEach((l) => cell[3].push({ text: l, font: f.mono }));
    if (it.carType) { cell[3].push({ text: "", font: f.mono }); wrap(it.carType.toUpperCase(), f.mono, SIZE, cols[3].w - 6).forEach((l) => cell[3].push({ text: l, font: f.mono, align: "c" })); }
    if (it.dutySlip) wrap(it.dutySlip.toUpperCase(), f.mono, SIZE, cols[4].w - 6).forEach((l) => cell[4].push({ text: l, font: f.mono, align: "c" }));
    if (it.toll > 0) cell[4].push({ text: `Toll Charges : ${fmt2(it.toll)}`, font: f.bold, size: 7.2 });
    if (it.parking > 0) cell[4].push({ text: `Parking : ${fmt2(it.parking)}`, font: f.bold, size: 7.2 });
    cell[5].push({ text: fmt2(it.kms), font: f.mono, align: "r" });
    const label = it.rateLabel || KIND_LABEL[it.kind as Kind] || "";
    if (label) wrap(label.toUpperCase(), f.mono, SIZE, cols[6].w - 6).forEach((l) => cell[6].push({ text: l, font: f.mono, align: "c" }));
    if (it.kind === "extra_hours" && it.hours) cell[6].push({ text: `(${it.hours} hrs)`, font: f.mono, align: "c" });
    cell[7].push({ text: fmt2(it.rate), font: f.mono, align: "r" });
    cell[8].push({ text: fmt2(lineAmount(it)), font: f.mono, align: "r" });

    const lines = Math.max(...cell.map((c) => c.length), 3);
    const rowH = lines * LH + 10;
    if (y - rowH < rowsBottom) {
      page = newPage();
      page.drawText(`TAX INVOICE ${clean(bill.billNo)} - continued`, { x: M, y: A4.h - 36, size: 9, font: f.bold, color: GREY });
      y = tableHeader(page, A4.h - 50);
    }
    cell.forEach((lines, i) => {
      lines.forEach((l, k) => {
        const size = l.size ?? SIZE;
        const w = l.font.widthOfTextAtSize(clean(l.text), size);
        const x = l.align === "r" ? xs[i] + cols[i].w - 4 - w : l.align === "c" ? xs[i] + (cols[i].w - w) / 2 : xs[i] + 3;
        page.drawText(clean(l.text), { x, y: y - 13 - k * LH, size, font: l.font, color: INK });
      });
    });
    // grid
    page.drawLine({ start: { x: M, y: y - rowH }, end: { x: M + tableW, y: y - rowH }, thickness: 0.5, color: INK });
    cols.forEach((_, i) => { if (i) page.drawLine({ start: { x: xs[i], y }, end: { x: xs[i], y: y - rowH }, thickness: 0.5, color: INK }); });
    page.drawLine({ start: { x: M, y }, end: { x: M, y: y - rowH }, thickness: 0.5, color: INK });
    page.drawLine({ start: { x: M + tableW, y }, end: { x: M + tableW, y: y - rowH }, thickness: 0.5, color: INK });
    y -= rowH;
  });

  // totals row
  const totRowH = 20;
  if (y - totRowH - FOOTER_NEED < 0) { page = newPage(); y = A4.h - 50; }
  page.drawRectangle({ x: M, y: y - totRowH, width: tableW, height: totRowH, borderColor: INK, borderWidth: 0.7 });
  const kmTxt = fmt2(t.kms);
  page.drawText(kmTxt, { x: xs[5] + cols[5].w - 4 - f.monoBold.widthOfTextAtSize(kmTxt, 8.5), y: y - 14, size: 8.5, font: f.monoBold, color: INK });
  const amTxt = fmt2(t.subtotal);
  page.drawText(amTxt, { x: xs[8] + cols[8].w - 4 - f.monoBold.widthOfTextAtSize(amTxt, 8.5), y: y - 14, size: 8.5, font: f.monoBold, color: INK });
  [5, 8].forEach((i) => page.drawLine({ start: { x: xs[i], y }, end: { x: xs[i], y: y - totRowH }, thickness: 0.5, color: INK }));
  y -= totRowH + 14;

  // left: GST no + notes
  const leftW = 290;
  let ly = y;
  page.drawText(`GST No. :- ${clean(co.gstin)}`, { x: M + 2, y: ly, size: 8, font: f.mono, color: INK }); ly -= 12;
  const notes = (bill.notes ?? DEFAULT_NOTES).trim();
  if (notes) {
    wrap(`NOTE :\n${notes}`, f.mono, 7.8, leftW).forEach((l) => { page.drawText(l, { x: M + 2, y: ly, size: 7.8, font: f.mono, color: INK }); ly -= 10.5; });
  }

  // right: charges and tax
  const rx = A4.w - M - 205, rr = A4.w - M - 2;
  let ry = y;
  const charge = (label: string, rate: string | null, amt: number) => {
    page.drawText(label, { x: rx, y: ry, size: 7.8, font: f.mono, color: INK });
    if (rate) page.drawText(`@  ${rate}`, { x: rx + 100, y: ry, size: 7.8, font: f.mono, color: INK });
    const a = fmt2(amt);
    page.drawText(a, { x: rr - f.mono.widthOfTextAtSize(a, 8.5), y: ry, size: 8.5, font: f.mono, color: INK });
    ry -= 13;
  };
  if (t.toll > 0) charge("Toll_Charges", null, t.toll);
  if (t.parking > 0) charge("Parking_Charges", null, t.parking);
  if (bill.gstMode === "cgst_sgst" && !bill.rcm) { charge("CGST", fmt2(bill.gstRate / 2), t.cgst); charge("SGST", fmt2(bill.gstRate / 2), t.sgst); }
  if (bill.gstMode === "igst" && !bill.rcm) charge("IGST", fmt2(bill.gstRate), t.igst);
  if (bill.rcm && t.rcmTax > 0) {
    // Reverse charge: shown for the customer, but kept out of the total
    ry -= 4;
    wrap(RCM_STATEMENT, f.reg, 6.8, 205).forEach((l) => { page.drawText(l, { x: rx, y: ry, size: 6.8, font: f.reg, color: GREY }); ry -= 8.5; });
    ry -= 3;
    const gstLine = (label: string, rate: string, amt: number) => {
      page.drawText(label, { x: rx, y: ry, size: 7.8, font: f.mono, color: GREY });
      page.drawText(`@  ${rate}`, { x: rx + 100, y: ry, size: 7.8, font: f.mono, color: GREY });
      const a = fmt2(amt);
      page.drawText(a, { x: rr - f.mono.widthOfTextAtSize(a, 8.5), y: ry, size: 8.5, font: f.mono, color: GREY });
      ry -= 13;
    };
    if (bill.gstMode === "cgst_sgst") { gstLine("CGST (RCM)", fmt2(bill.gstRate / 2), t.rcmCgst); gstLine("SGST (RCM)", fmt2(bill.gstRate / 2), t.rcmSgst); }
    if (bill.gstMode === "igst") gstLine("IGST (RCM)", fmt2(bill.gstRate), t.rcmIgst);
  }

  // final total
  let fy = Math.min(ly, ry) - 20;
  fy = Math.min(fy, y - 70);
  page.drawLine({ start: { x: M, y: fy + 22 }, end: { x: M + leftW, y: fy + 22 }, thickness: 0.6, color: INK });
  page.drawLine({ start: { x: rx - 10, y: fy + 22 }, end: { x: A4.w - M, y: fy + 22 }, thickness: 0.8, color: INK });
  const words = `Rs. ${inWords(t.total)} only.`;
  wrap(words, f.mono, 8.5, leftW).forEach((l, k) => page.drawText(l, { x: M + 2, y: fy + 6 - k * 11, size: 8.5, font: f.mono, color: INK }));
  page.drawText("Final Total :", { x: rx - 5, y: fy + 4, size: 10, font: f.bold, color: INK });
  const ft = fmt2(t.total);
  page.drawText(ft, { x: rr - f.bold.widthOfTextAtSize(ft, 13), y: fy + 3, size: 13, font: f.bold, color: INK });
  page.drawLine({ start: { x: rx + 60, y: fy - 5 }, end: { x: A4.w - M, y: fy - 5 }, thickness: 0.6, color: INK });

  // signature block
  const sy = fy - 24;
  const forTxt = `For ${co.name.toUpperCase()}`;
  page.drawText(forTxt, { x: A4.w - M - 14 - f.bold.widthOfTextAtSize(forTxt, 10.5), y: sy, size: 10.5, font: f.bold, color: INK });
  if (stamp) {
    const sh = 82, sw = (sh * stamp.width) / stamp.height;
    page.drawImage(stamp, { x: A4.w - M - 30 - sw, y: sy - sh - 4, width: sw, height: sh });
  }
  const auth = "Authorised Signatory";
  const ay = sy - 96;
  page.drawLine({ start: { x: rx + 15, y: ay + 14 }, end: { x: A4.w - M - 6, y: ay + 14 }, thickness: 0.6, color: INK });
  page.drawText(auth, { x: A4.w - M - 14 - f.reg.widthOfTextAtSize(auth, 9.5), y: ay, size: 9.5, font: f.reg, color: INK });

  if (pages.length > 1) pages.forEach((p, i) => p.drawText(`Page ${i + 1} of ${pages.length}`, { x: A4.w - M - 52, y: 18, size: 7.5, font: f.reg, color: GREY }));
  return doc.save();
}
