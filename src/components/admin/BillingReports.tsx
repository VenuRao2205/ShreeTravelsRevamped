"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { fmtBillDate, inr } from "@/lib/billing";
import type { Report } from "@/lib/bill-report";

/* ---------------------------------------------------------------- period */

export type Period = { preset: "month" | "last" | "fy" | "custom"; from: string; to: string; customer: string };

const ymd = (d: Date) => d.toLocaleDateString("en-CA");
export function periodFor(preset: Period["preset"], keep?: Pick<Period, "from" | "to" | "customer">): Period {
  const now = new Date();
  let from = now, to = now;
  if (preset === "month") { from = new Date(now.getFullYear(), now.getMonth(), 1); to = new Date(now.getFullYear(), now.getMonth() + 1, 0); }
  if (preset === "last") { from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0); }
  if (preset === "fy") { const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; from = new Date(y, 3, 1); to = new Date(y + 1, 2, 31); } // Indian financial year
  if (preset === "custom" && keep) return { preset, from: keep.from, to: keep.to, customer: keep.customer };
  return { preset, from: ymd(from), to: ymd(to), customer: keep?.customer ?? "" };
}

export function useReport(p: Pick<Period, "from" | "to" | "customer">, onUnauthorized: () => void) {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const unauth = useRef(onUnauthorized);
  useEffect(() => { unauth.current = onUnauthorized; });
  const key = JSON.stringify([p.from, p.to, p.customer]);
  useEffect(() => {
    const ctrl = new AbortController();
    const [from, to, customer] = JSON.parse(key) as string[];
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ from, to, ...(customer && { customer }) });
        const res = await fetch(`/api/admin/bills/report?${qs}`, { cache: "no-store", signal: ctrl.signal });
        if (res.status === 401) return unauth.current();
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json); setError(""); setLoading(false);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error && e.message ? e.message : "Could not load the report."); setLoading(false);
      }
    }, 0);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [key]);
  return { data, error, loading };
}

const PRESETS: { id: Period["preset"]; label: string }[] = [{ id: "month", label: "This month" }, { id: "last", label: "Last month" }, { id: "fy", label: "This financial year" }, { id: "custom", label: "Pick dates" }];

export function PeriodBar({ period, onChange, customers, xlsx }: { period: Period; onChange: (p: Period) => void; customers: string[]; xlsx?: boolean }) {
  const qs = new URLSearchParams({ from: period.from, to: period.to, ...(period.customer && { customer: period.customer }) });
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-ink-900 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((x) => (
          <button key={x.id} type="button" aria-pressed={period.preset === x.id} onClick={() => onChange(periodFor(x.id, period))}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${period.preset === x.id ? "border-brand-500 bg-brand-500 text-black" : "border-white/20 text-neutral-300 hover:border-brand-500"}`}>{x.label}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {period.preset === "custom" && (
          <>
            <label className="block"><span className="field-label">From</span><input type="date" className="field !w-auto" value={period.from} max={period.to} onChange={(e) => e.target.value && onChange({ ...period, from: e.target.value })} /></label>
            <label className="block"><span className="field-label">To</span><input type="date" className="field !w-auto" value={period.to} min={period.from} onChange={(e) => e.target.value && onChange({ ...period, to: e.target.value })} /></label>
          </>
        )}
        <label className="block min-w-[14rem] flex-1"><span className="field-label">Customer</span>
          <select className="field" value={period.customer} onChange={(e) => onChange({ ...period, customer: e.target.value })}>
            <option value="">All customers</option>
            {period.customer && !customers.includes(period.customer) && <option value={period.customer}>{period.customer}</option>}
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        {xlsx && <a href={`/api/admin/bills/report/xlsx?${qs}`} className="btn-primary !py-3"><Download size={17} /> Download Excel</a>}
      </div>
      <p className="text-sm text-neutral-500">By invoice date, {fmtBillDate(period.from)} to {fmtBillDate(period.to)}. This screen uses its own period, not the date filter at the top of the page.</p>
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

const n2 = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900 p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

type Col<T> = { head: string; cell: (r: T) => React.ReactNode; right?: boolean; total?: (rows: T[]) => React.ReactNode };
function Table<T>({ title, rows, cols, empty }: { title: string; rows: T[]; cols: Col<T>[]; empty: string }) {
  return (
    <section>
      <h3 className="mb-3 text-lg font-bold text-white">{title}</h3>
      {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-neutral-400">{empty}</p> : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-ink-900">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead><tr className="border-b border-white/10 text-neutral-400">{cols.map((c) => <th key={c.head} scope="col" className={`px-4 py-3 font-semibold ${c.right ? "text-right" : ""}`}>{c.head}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-white/5 last:border-0">{cols.map((c) => <td key={c.head} className={`px-4 py-3 text-neutral-200 ${c.right ? "text-right tabular-nums" : ""}`}>{c.cell(r)}</td>)}</tr>)}</tbody>
            {cols.some((c) => c.total) && <tfoot><tr className="border-t border-white/20 font-bold text-white">{cols.map((c, i) => <td key={c.head} className={`px-4 py-3 ${c.right ? "text-right tabular-nums" : ""}`}>{c.total ? c.total(rows) : i === 0 ? "Total" : ""}</td>)}</tr></tfoot>}
          </table>
        </div>
      )}
    </section>
  );
}
const sum = <T,>(f: (r: T) => number) => (rows: T[]) => n2(rows.reduce((a, r) => a + f(r), 0));
const count = <T,>(f: (r: T) => number) => (rows: T[]) => rows.reduce((a, r) => a + f(r), 0);

function Status({ r }: { r: { data: Report | null; error: string; loading: boolean } }) {
  if (r.error) return <p className="text-danger" role="alert">{r.error}</p>;
  if (!r.data) return <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>;
  return null;
}

/* ---------------------------------------------------------------- MIS */

export function MisReport({ period, setPeriod, onUnauthorized, customers }: { period: Period; setPeriod: (p: Period) => void; onUnauthorized: () => void; customers: string[] }) {
  const rep = useReport(period, onUnauthorized);
  const d = rep.data, t = d?.totals;
  return (
    <div className="space-y-6">
      <PeriodBar period={period} onChange={setPeriod} customers={d?.customers ?? customers} xlsx />
      <Status r={rep} />
      {d && t && (
        <div className={`space-y-8 transition-opacity ${rep.loading ? "opacity-50" : ""}`}>
          {t.invoices === 0 && <p className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-neutral-400">No bills with an invoice date in this period. Pick another period or customer.</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Invoices" value={String(t.invoices)} hint={`${t.trips} trip lines`} />
            <Tile label="Total KMs" value={n2(t.kms)} />
            <Tile label="Trip amounts" value={inr(t.taxable)} hint="Before tax, toll and parking" />
            <Tile label="Total billed" value={inr(t.total)} hint="Includes GST charged, toll and parking" />
            <Tile label="GST charged" value={inr(t.gst)} hint={`CGST ${n2(t.cgst)} · SGST ${n2(t.sgst)} · IGST ${n2(t.igst)}`} />
            <Tile label="GST paid by customers (RCM)" value={inr(t.rcmTax)} hint="Shown on the bill, not in the total" />
            <Tile label="Toll and parking" value={inr(t.toll + t.parking)} hint={`Toll ${n2(t.toll)} · Parking ${n2(t.parking)}`} />
            <Tile label="Paid through payment links" value={String(d.invoices.filter((i) => i.payment === "Paid").length)} hint={`${d.invoices.filter((i) => i.payment === "Unpaid").length} unpaid on links`} />
          </div>

          <Table title="Customer-wise" rows={d.byCustomer} empty="Nothing to show." cols={[
            { head: "Customer", cell: (r) => r.key, total: () => "Total" },
            { head: "Invoices", right: true, cell: (r) => r.invoices, total: count((r) => r.invoices) },
            { head: "KMs", right: true, cell: (r) => n2(r.kms), total: sum((r) => r.kms) },
            { head: "Trip amounts", right: true, cell: (r) => n2(r.taxable), total: sum((r) => r.taxable) },
            { head: "GST charged", right: true, cell: (r) => n2(r.gst), total: sum((r) => r.gst) },
            { head: "GST under RCM", right: true, cell: (r) => n2(r.rcmTax), total: sum((r) => r.rcmTax) },
            { head: "Total", right: true, cell: (r) => n2(r.total), total: sum((r) => r.total) },
          ]} />
          <Table title="Car-wise" rows={d.byCar} empty="Nothing to show." cols={[
            { head: "Taxi number", cell: (r) => r.key, total: () => "Total" }, { head: "Car", cell: (r) => r.carType || "" },
            { head: "Trip lines", right: true, cell: (r) => r.trips, total: count((r) => r.trips) }, { head: "KMs", right: true, cell: (r) => n2(r.kms), total: sum((r) => r.kms) },
            { head: "Trip amounts", right: true, cell: (r) => n2(r.amount), total: sum((r) => r.amount) },
          ]} />
          {d.byMonth.length > 1 && <Table title="Month-wise" rows={d.byMonth} empty="" cols={[
            { head: "Month", cell: (r) => new Date(r.key + "-01T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" }), total: () => "Total" },
            { head: "Invoices", right: true, cell: (r) => r.invoices, total: count((r) => r.invoices) }, { head: "Trip amounts", right: true, cell: (r) => n2(r.taxable), total: sum((r) => r.taxable) },
            { head: "GST charged", right: true, cell: (r) => n2(r.gst), total: sum((r) => r.gst) }, { head: "Total", right: true, cell: (r) => n2(r.total), total: sum((r) => r.total) },
          ]} />}
          <Table title="Invoice register" rows={d.invoices} empty="Nothing to show." cols={[
            { head: "Invoice", cell: (r) => r.billNo, total: () => "Total" }, { head: "Date", cell: (r) => fmtBillDate(r.billDate) }, { head: "Customer", cell: (r) => r.customer },
            { head: "Taxable", right: true, cell: (r) => n2(r.taxable), total: sum((r) => r.taxable) }, { head: "GST charged", right: true, cell: (r) => n2(r.cgst + r.sgst + r.igst), total: sum((r) => r.cgst + r.sgst + r.igst) },
            { head: "RCM", right: true, cell: (r) => (r.rcm ? n2(r.rcmTax) : "-"), total: sum((r) => r.rcmTax) }, { head: "Total", right: true, cell: (r) => n2(r.total), total: sum((r) => r.total) },
            { head: "Payment link", cell: (r) => r.payment },
          ]} />
          <p className="text-sm text-neutral-500">The Excel file also has the full trip sheet, a GST sales register and the RCM register, each on its own sheet.</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- RCM */

export function RcmRegister({ period, setPeriod, onUnauthorized, customers }: { period: Period; setPeriod: (p: Period) => void; onUnauthorized: () => void; customers: string[] }) {
  const rep = useReport(period, onUnauthorized);
  const d = rep.data;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-ink-900 p-5 text-sm leading-relaxed text-neutral-300">
        <p className="font-semibold text-white">What reverse charge (RCM) means for car rental</p>
        <p className="mt-2">When a proprietor or partnership (not a company) rents a passenger car with fuel to a company (a body corporate) at 5% without input credit, the company pays that GST directly to the government. Your bill then shows the tax but does not add it to the total. If you charge the higher rate with input credit, normal forward charge applies and reverse charge does not.</p>
        <p className="mt-2 text-neutral-400">This register lists bills marked as reverse charge, so you can show your CA and your customers what they have to pay. Rules and rates change, so confirm each customer with your CA.</p>
      </div>
      <PeriodBar period={period} onChange={setPeriod} customers={d?.customers ?? customers} xlsx />
      <Status r={rep} />
      {d && (
        <div className={`space-y-6 transition-opacity ${rep.loading ? "opacity-50" : ""}`}>
          {d.toCheck.length > 0 && (
            <div className="flex gap-3 rounded-2xl border border-brand-500/50 bg-brand-500/10 p-5 text-sm text-neutral-200" role="status">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-accent" />
              <p><span className="font-semibold text-white">{d.toCheck.length} bill{d.toCheck.length > 1 ? "s" : ""} to check with your CA.</span> These customers look like companies, and GST was added to the bill instead of reverse charge: {d.toCheck.slice(0, 8).map((x) => `${x.billNo} (${x.customer})`).join(", ")}{d.toCheck.length > 8 ? " and more" : ""}. If reverse charge applies, edit the bill and tick it.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Tile label="Reverse charge bills" value={String(d.rcm.length)} />
            <Tile label="Taxable value" value={inr(d.rcm.reduce((a, r) => a + r.taxable, 0))} />
            <Tile label="GST payable by customers" value={inr(d.rcm.reduce((a, r) => a + r.rcmTax, 0))} />
          </div>
          <Table title="RCM register" rows={d.rcm} empty="No reverse charge bills in this period." cols={[
            { head: "Invoice", cell: (r) => r.billNo, total: () => "Total" }, { head: "Date", cell: (r) => fmtBillDate(r.billDate) }, { head: "Customer", cell: (r) => r.customer }, { head: "GSTIN", cell: (r) => r.gstin || "-" },
            { head: "Taxable value", right: true, cell: (r) => n2(r.taxable), total: sum((r) => r.taxable) }, { head: "Rate %", right: true, cell: (r) => r.gstRate },
            { head: "GST payable by customer", right: true, cell: (r) => n2(r.rcmTax), total: sum((r) => r.rcmTax) }, { head: "Invoice total", right: true, cell: (r) => n2(r.total), total: sum((r) => r.total) },
          ]} />
        </div>
      )}
    </div>
  );
}
