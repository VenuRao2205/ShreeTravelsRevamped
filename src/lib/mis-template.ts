import ExcelJS from "exceljs";
import { baseAmount, type BillInput, type Item } from "@/lib/billing";

/**
 * A customer's own MIS Excel sheet, kept as a template. We remember which template column holds what
 * (Cab No., Total Kms, Gross Amount...), then write the trips from our bills into a copy of the sheet.
 */

export const SOURCES = [
  { id: "skip", label: "Leave empty", group: "Other" },
  { id: "text", label: "Same fixed value on every row", group: "Other" },
  { id: "serial", label: "Serial number", group: "Other" },
  { id: "month", label: "Month of the trip", group: "Trip" },
  { id: "tripDate", label: "Trip date", group: "Trip" },
  { id: "travelType", label: "Local / Outstation", group: "Trip" },
  { id: "bookingId", label: "Booking ID", group: "Trip" },
  { id: "dutySlip", label: "Duty slip no.", group: "Trip" },
  { id: "route", label: "Travel details (route)", group: "Trip" },
  { id: "passenger", label: "Passenger name", group: "People" },
  { id: "orderedBy", label: "Ordered / booked by", group: "People" },
  { id: "employeeId", label: "Employee ID", group: "People" },
  { id: "empEmail", label: "Employee email", group: "People" },
  { id: "department", label: "Department", group: "People" },
  { id: "billNo", label: "Invoice number", group: "Invoice" },
  { id: "billDate", label: "Invoice date", group: "Invoice" },
  { id: "cabNo", label: "Cab / taxi number", group: "Car" },
  { id: "cabType", label: "Cab type", group: "Car" },
  { id: "startTime", label: "Start time", group: "Car" },
  { id: "endTime", label: "End time", group: "Car" },
  { id: "totalHours", label: "Total hours", group: "Car" },
  { id: "startKm", label: "Start KMs", group: "Car" },
  { id: "endKm", label: "End KMs", group: "Car" },
  { id: "totalKm", label: "Total KMs", group: "Car" },
  { id: "slab", label: "Slab / package rate", group: "Charges" },
  { id: "extraKm", label: "Extra KMs", group: "Charges" },
  { id: "extraKmRate", label: "Extra KM rate", group: "Charges" },
  { id: "extraKmAmt", label: "Extra KM amount", group: "Charges" },
  { id: "extraHr", label: "Extra hours", group: "Charges" },
  { id: "extraHrRate", label: "Extra hour rate", group: "Charges" },
  { id: "extraHrAmt", label: "Extra hour amount", group: "Charges" },
  { id: "batta", label: "O/S batta", group: "Charges" },
  { id: "nightBata", label: "Night bata", group: "Charges" },
  { id: "permit", label: "Permit charges", group: "Charges" },
  { id: "tollPark", label: "Toll + parking", group: "Charges" },
  { id: "gross", label: "Gross amount (before GST)", group: "Charges" },
  { id: "tax", label: "GST on the row (blank for RCM)", group: "Charges" },
  { id: "net", label: "Net amount", group: "Charges" },
] as const;
export type SourceId = (typeof SOURCES)[number]["id"];
export const SOURCE_IDS = SOURCES.map((s) => s.id) as [SourceId, ...SourceId[]];

export type MisColumn = { col: number; header: string; source: SourceId; text: string; formula: string };
export type MisPerson = { name: string; employeeId: string; email: string; department: string };
export type MisConfig = { headerRow: number; dataStartRow: number; columns: MisColumn[]; people: MisPerson[] };

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const norm = (h: string) => h.toLowerCase().replace(/ /g, " ").replace(/\(.*?\)/g, "").replace(/[^a-z0-9%]+/g, "");

/** Header text to what it most likely holds. "Rate" and "Amt" depend on whether extra KMs or extra hours came just before. */
const HEADERS: [RegExp, SourceId][] = [
  [/^(sno|srno|slno|serialno|sr)$/, "serial"],
  [/^month$/, "month"], [/^(traveltype|triptype)$/, "travelType"], [/^(department|dept)$/, "department"],
  [/^(billdate|invoicedate)$/, "billDate"], [/^(billno|billnumber|invoiceno|invoicenumber|invno)$/, "billNo"],
  [/^(tripdate|dateoftravel|journeydate|traveldate|date)$/, "tripDate"], [/^(bookingid|bookingno|bookingnumber|tripid|requestid)$/, "bookingId"],
  [/^(cabno|vehicleno|vehiclenumber|carno|carnumber|taxino|cabnumber|vehicle)$/, "cabNo"], [/^(cabtype|cartype|vehicletype|categoryofcar)$/, "cabType"],
  [/^(starttime|reportingtime|timeout|opentime)$/, "startTime"], [/^(endtime|closingtime|timein|closetime)$/, "endTime"], [/^(totalhours|totalhrs|hours|hrs)$/, "totalHours"],
  [/^(startkms?|openingkms?|startingkms?|kmsstart)$/, "startKm"], [/^(endkms?|closingkms?|kmsend)$/, "endKm"], [/^(totalkms?|kmsrun|totalkmrun|kms|km|runningkms?)$/, "totalKm"],
  [/^(dutytype|dutyname)$/, "travelType"], [/^(slabrate|packagerate|packageamount|basicamount|baseamount|fixedrate|slab)$/, "slab"],
  [/^(extrakms?|extrakilometers?)$/, "extraKm"], [/^(extrahours?|extrahrs)$/, "extraHr"],
  [/^(osbatta|osbata|outstationbatta|outstationbata|batta|bata|driverbatta)$/, "batta"], [/^(nightbata|nightbatta|nighthalt|nightcharges)$/, "nightBata"], [/^(permitcharges?|permit|statepermit)$/, "permit"],
  [/^(tollpark|tollparking|tollandparking|tollparkingcharges|toll)$/, "tollPark"], [/^(grossamount|gross|subtotal|taxableamount|taxablevalue)$/, "gross"],
  [/^(igst|cgst|sgst|gst)[0-9%]*$/, "tax"], [/^(netamount|netamt|totalamount|invoiceamount|finalamount|net)$/, "net"],
  [/^(orderedby|bookedby|requestedby|bookingby|requestor)$/, "orderedBy"], [/^(passengername|passenger|employeename|guestname|travellername|name|username)$/, "passenger"],
  [/^(traveldetails|route|routedetails|journeydetails|travelplan|routetravelled|itinerary)$/, "route"], [/^(empmailid|emailid|email|empemail|employeemail|mailid)$/, "empEmail"],
  [/^(employeeid|empid|employeecode|empcode|empno)$/, "employeeId"], [/^(vendorcode|costcentre|costcenter|vendorid|sapcode|ponumber|pono|gl|glcode)$/, "text"],
];

export function guessSource(header: string, ctx: "km" | "hr" | ""): SourceId {
  const n = norm(header);
  if (ctx && /^(rate|ratekm|ratehr)$/.test(n)) return ctx === "km" ? "extraKmRate" : "extraHrRate";
  if (ctx && /^(amt|amount)$/.test(n)) return ctx === "km" ? "extraKmAmt" : "extraHrAmt";
  for (const [re, id] of HEADERS) if (re.test(n)) return id;
  return "skip";
}

const cellText = (c: ExcelJS.Cell): string => {
  const v = c.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return String(v.result ?? "");
    if ("text" in v) return String(v.text ?? "");
    if (v instanceof Date) return v.toISOString();
  }
  return String(v);
};

const patternOf = (formula: string, row: number) => formula.replace(/(\$?[A-Z]{1,3}\$?)(\d+)/g, (m, a: string, n: string) => (Number(n) === row ? `${a}{r}` : m));

/** Reads a template workbook and works out where the header is and what each column holds. */
export async function detectTemplate(buf: Buffer | Uint8Array): Promise<MisConfig> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("This Excel file has no sheets.");
  let headerRow = 0;
  for (let r = 1; r <= Math.min(ws.rowCount, 20); r++) {
    let filled = 0;
    ws.getRow(r).eachCell((c) => { if (typeof c.value === "string" || (typeof c.value === "object" && c.value && "richText" in c.value)) filled++; });
    if (filled >= 5) { headerRow = r; break; }
  }
  if (!headerRow) throw new Error("Could not find the header row. The first sheet needs a row of column names (Cab No., Total Kms and so on).");
  const dataStartRow = headerRow + 1;

  // data rows = the rows after the header that hold anything in at least 3 cells
  const dataRows: number[] = [];
  for (let r = dataStartRow; r <= ws.rowCount; r++) { let n = 0; ws.getRow(r).eachCell(() => n++); if (n >= 3) dataRows.push(r); }

  const columns: MisColumn[] = [];
  let ctx: "km" | "hr" | "" = "";
  const last = ws.getRow(headerRow).cellCount;
  for (let c = 1; c <= last; c++) {
    const header = cellText(ws.getCell(headerRow, c)).replace(/ /g, " ").trim();
    if (!header) continue;
    const source = guessSource(header, ctx);
    if (source === "extraKm") ctx = "km"; else if (source === "extraHr") ctx = "hr"; else if (!/^(extrakmrate|extrakmamt|extrahrrate|extrahramt)$/i.test(source)) ctx = "";

    // the most common fixed value (Vendor Code, Cost Centre, Ordered By...) and any formula shared by most rows
    const counts = new Map<string, number>(), forms = new Map<string, number>();
    let filled = 0, formulas = 0;
    for (const r of dataRows) {
      const cell = ws.getCell(r, c);
      if (cell.value === null || cell.value === undefined || cell.value === "") continue;
      filled++;
      if (cell.type === ExcelJS.ValueType.Formula) { formulas++; const p = patternOf(String(cell.formula ?? ""), r); forms.set(p, (forms.get(p) ?? 0) + 1); }
      else if (typeof cell.value === "string" || typeof cell.value === "number") counts.set(String(cell.value), (counts.get(String(cell.value)) ?? 0) + 1);
    }
    const top = [...forms.entries()].sort((a, z) => z[1] - a[1])[0];
    const formula = top && formulas >= filled * 0.5 && top[1] >= formulas * 0.6 ? top[0] : "";
    const common = [...counts.entries()].sort((a, z) => z[1] - a[1])[0];
    const text = common && dataRows.length > 1 && common[1] === filled ? common[0] : ""; // same on every row
    columns.push({ col: c, header, source: source === "text" || (source === "skip" && text) ? "text" : source, text: source === "text" || source === "skip" ? text : "", formula });
  }
  return { headerRow, dataStartRow, columns, people: [] };
}

/** When a customer sends a new version of their sheet, keep what we already set for columns with the same name. */
export function carryOver(fresh: MisConfig, old?: { columns: MisColumn[]; people: MisPerson[] } | null): MisConfig {
  if (!old) return fresh;
  const byHeader = new Map(old.columns.map((c) => [norm(c.header), c]));
  return { ...fresh, people: old.people, columns: fresh.columns.map((c) => { const o = byHeader.get(norm(c.header)); return o ? { ...c, source: o.source, text: o.text } : c; }) };
}

/* ------------------------------------------------------------------ fill */

export type MisRow = Record<string, string | number | Date | null>;
const utcDay = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const parseDT = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s ?? ""); return m ? { y: +m[1], mo: +m[2], d: +m[3], h: m[4] ? +m[4] : null, mi: m[5] ? +m[5] : 0 } : null; };
const personKey = (n: string) => n.toLowerCase().replace(/\b(mr|mrs|ms|miss|dr|shri|smt)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** One MIS row per duty slip: consecutive trips of a bill that share a duty slip number (base + extra km + extra hours) become one row. */
export function misRows(bills: BillInput[], cfg: Pick<MisConfig, "columns" | "people">): MisRow[] {
  const people = new Map(cfg.people.map((p) => [personKey(p.name), p]));
  const textOf = (src: SourceId) => cfg.columns.find((c) => c.source === src)?.text ?? "";
  const rows: MisRow[] = [];
  for (const b of bills) {
    const groups: Item[][] = [];
    for (const it of b.items) {
      const g = groups[groups.length - 1];
      if (g && it.dutySlip && g[0].dutySlip === it.dutySlip) g.push(it); else groups.push([it]);
    }
    const taxRate = b.rcm || b.gstMode === "none" ? 0 : b.gstRate;
    for (const g of groups) {
      const first = g[0];
      const sum = (f: (i: Item) => number) => r2(g.reduce((a, i) => a + f(i), 0));
      const isExtraKm = (i: Item) => i.kind === "extra_km", isExtraHr = (i: Item) => i.kind === "extra_hours";
      const slab = sum((i) => (isExtraKm(i) || isExtraHr(i) ? 0 : baseAmount(i)));
      const ek = g.filter(isExtraKm), eh = g.filter(isExtraHr);
      const extraKmAmt = r2(ek.reduce((a, i) => a + baseAmount(i), 0)), extraHrAmt = r2(eh.reduce((a, i) => a + baseAmount(i), 0));
      const batta = sum((i) => i.batta), nightBata = sum((i) => i.nightBata), permit = sum((i) => i.permit);
      const tollPark = sum((i) => i.toll + i.parking);
      const taxable = r2(slab + extraKmAmt + extraHrAmt + batta + nightBata + permit);
      const gross = r2(taxable + tollPark);
      const tax = r2((taxable * taxRate) / 100);
      const s = parseDT(first.start), e = parseDT(g[g.length - 1].end || first.end);
      const tripDay = s ?? parseDT(b.billDate)!;
      const bd = parseDT(b.billDate)!;
      const dtMin = (x: NonNullable<ReturnType<typeof parseDT>>) => Date.UTC(x.y, x.mo - 1, x.d, x.h ?? 0, x.mi) / 60000;
      const hours = s && e && s.h !== null && e.h !== null ? Math.max(0, (dtMin(e) - dtMin(s)) / 1440) : null;
      const person = people.get(personKey(first.passenger));
      const baseItems = g.filter((i) => !isExtraKm(i) && !isExtraHr(i));
      const kms = r2((baseItems.length ? baseItems : g).reduce((a, i) => a + i.kms, 0)); // extra KMs are part of the run, not on top of it
      const startKm = g.find((i) => i.startKm > 0)?.startKm ?? 0, endKm = [...g].reverse().find((i) => i.endKm > 0)?.endKm ?? 0;
      rows.push({
        month: utcDay(tripDay.y, tripDay.mo, 1),
        tripDate: first.tripDate || utcDay(tripDay.y, tripDay.mo, tripDay.d),
        travelType: (first.from || "").toUpperCase(),
        bookingId: first.bookingId || null, dutySlip: first.dutySlip || null, route: first.route || null,
        passenger: first.passenger ? first.passenger.toUpperCase() : null,
        orderedBy: b.bookedBy || textOf("orderedBy") || null,
        employeeId: first.employeeId || person?.employeeId || textOf("employeeId") || null,
        empEmail: first.empEmail || person?.email || textOf("empEmail") || null,
        department: person?.department || textOf("department") || null,
        billNo: /^[1-9]\d*$/.test(b.billNo) ? Number(b.billNo) : b.billNo,
        billDate: utcDay(bd.y, bd.mo, bd.d),
        cabNo: first.taxiNo ? first.taxiNo.toUpperCase() : null, cabType: first.carType ? first.carType.toUpperCase() : null,
        startTime: s && s.h !== null ? (s.h * 60 + s.mi) / 1440 : null, endTime: e && e.h !== null ? (e.h * 60 + e.mi) / 1440 : null,
        totalHours: hours, startKm: startKm || null, endKm: endKm || null, totalKm: kms,
        slab, extraKm: sum((i) => (isExtraKm(i) ? i.kms : 0)), extraKmRate: ek[0]?.rate ?? 0, extraKmAmt,
        extraHr: sum((i) => (isExtraHr(i) ? i.hours : 0)), extraHrRate: eh[0]?.rate ?? 0, extraHrAmt,
        batta, nightBata, permit, tollPark, gross, tax, net: r2(gross + tax),
      });
    }
  }
  return rows;
}

const MONEY_SOURCES = new Set<SourceId>(["slab", "extraKmAmt", "extraHrAmt", "batta", "nightBata", "permit", "tollPark", "gross", "net", "extraKmRate", "extraHrRate", "extraKm", "extraHr", "tax", "totalKm"]);

/** Writes the rows into a copy of the customer's template, keeping its look, column widths and formulas. */
export async function fillTemplate(template: Buffer | Uint8Array, cfg: MisConfig, bills: BillInput[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(template as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  const rows = misRows(bills, cfg);
  const start = cfg.dataStartRow;
  const styles = new Map<number, Partial<ExcelJS.Style>>();
  for (const c of cfg.columns) styles.set(c.col, JSON.parse(JSON.stringify(ws.getCell(start, c.col).style ?? {})));
  const oldLast = Math.max(ws.rowCount, start);
  for (let r = start; r <= oldLast; r++) ws.getRow(r).eachCell({ includeEmpty: true }, (cell) => { cell.value = null; cell.style = {}; });

  rows.forEach((row, i) => {
    const r = start + i;
    for (const col of cfg.columns) {
      const cell = ws.getCell(r, col.col);
      cell.style = JSON.parse(JSON.stringify(styles.get(col.col) ?? {}));
      if (col.source === "skip") continue;
      if (col.source === "text") { if (col.text) cell.value = col.text; continue; }
      if (col.source === "serial") { cell.value = i + 1; continue; }
      let v: string | number | Date | null = row[col.source] ?? null;
      if (col.source === "totalHours") {
        if (typeof v === "number" && v >= 1) cell.numFmt = "[h]:mm"; else if (typeof v === "number") cell.numFmt = "h:mm";
      }
      const useFormula = col.formula && col.source !== "totalHours" && !(col.source === "totalKm" && !(row.startKm && row.endKm));
      if (useFormula) { cell.value = { formula: col.formula.replace(/\{r\}/g, String(r)), result: typeof v === "number" ? v : undefined } as ExcelJS.CellFormulaValue; continue; }
      if (v === null && MONEY_SOURCES.has(col.source)) v = 0;
      if (v !== null) cell.value = v;
    }
  });
  if (ws.views?.[0]?.state === "frozen") ws.views = [{ state: "frozen", ySplit: cfg.headerRow }]; // a freeze lower than the header makes the sheet hard to scroll
  wb.calcProperties = { fullCalcOnLoad: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
}
