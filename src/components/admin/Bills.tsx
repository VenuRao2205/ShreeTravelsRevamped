"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, Eye, FileText, Link2, Loader2, Mail, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Pager, SearchBox, rangeLabel, rangeParams, useDebounced, usePaged, type Range } from "@/components/admin/Filters";
import {
  COMPANY_DEFAULTS, DEFAULT_NOTES, KINDS, KIND_LABEL, inWords, inr, lineAmount, totalsOf,
  type BillInput, type Company, type Item, type Kind,
} from "@/lib/billing";

export type BillRow = {
  _id: string; billNo: string; billDate: string; customerName: string; customerCity?: string; customerEmail?: string; customerPhone?: string;
  totals?: { total: number }; createdAt: string;
};

type ItemF = { start: string; end: string; passenger: string; from: string; taxiNo: string; carType: string; dutySlip: string; kind: Kind; rateLabel: string; kms: string; hours: string; rate: string; amount: string; toll: string; parking: string };
type BillF = {
  billNo: string; billDate: string; customerName: string; customerCity: string; bookedBy: string; customerGstin: string; customerEmail: string; customerPhone: string;
  items: ItemF[]; gstMode: "cgst_sgst" | "igst" | "none"; gstRate: string; notes: string; showStamp: boolean; company: Company;
};

const today = () => new Date().toLocaleDateString("en-CA");
const day = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? 0 : Math.max(0, Number(v)));
const str = (n: unknown) => (n === undefined || n === null || n === 0 ? "" : String(n));

const blankItem = (from?: Partial<ItemF>): ItemF => ({
  start: from?.start ?? "", end: from?.end ?? "", passenger: from?.passenger ?? "", from: from?.from ?? "LOCAL", taxiNo: from?.taxiNo ?? "", carType: from?.carType ?? "",
  dutySlip: "", kind: "fixed", rateLabel: KIND_LABEL.fixed, kms: "", hours: "", rate: "", amount: "", toll: "", parking: "",
});
const blankBill = (billNo: string): BillF => ({
  billNo, billDate: today(), customerName: "", customerCity: "", bookedBy: "", customerGstin: "", customerEmail: "", customerPhone: "",
  items: [blankItem()], gstMode: "cgst_sgst", gstRate: "5", notes: DEFAULT_NOTES, showStamp: true, company: { ...COMPANY_DEFAULTS },
});

function toInput(f: BillF): BillInput {
  return {
    billNo: f.billNo.trim(), billDate: f.billDate, customerName: f.customerName.trim(), customerCity: f.customerCity.trim(), bookedBy: f.bookedBy.trim(),
    customerGstin: f.customerGstin.trim().toUpperCase(), customerEmail: f.customerEmail.trim(), customerPhone: f.customerPhone.trim(),
    items: f.items.map((i): Item => ({
      start: i.start, end: i.end, passenger: i.passenger.trim(), from: i.from.trim(), taxiNo: i.taxiNo.trim(), carType: i.carType.trim(), dutySlip: i.dutySlip.trim(),
      kind: i.kind, rateLabel: i.rateLabel.trim(), kms: num(i.kms), hours: num(i.hours), rate: num(i.rate), amount: num(i.amount), toll: num(i.toll), parking: num(i.parking),
    })),
    gstMode: f.gstMode, gstRate: num(f.gstRate), notes: f.notes, showStamp: f.showStamp, company: f.company,
  };
}

function fromDoc(d: Record<string, unknown>, billNo?: string): BillF {
  const items = (d.items as Record<string, unknown>[] | undefined) ?? [];
  return {
    billNo: billNo ?? String(d.billNo ?? ""), billDate: billNo ? today() : String(d.billDate ?? today()),
    customerName: String(d.customerName ?? ""), customerCity: String(d.customerCity ?? ""), bookedBy: String(d.bookedBy ?? ""), customerGstin: String(d.customerGstin ?? ""),
    customerEmail: String(d.customerEmail ?? ""), customerPhone: String(d.customerPhone ?? ""),
    items: items.length
      ? items.map((i) => ({
          start: String(i.start ?? ""), end: String(i.end ?? ""), passenger: String(i.passenger ?? ""), from: String(i.from ?? ""), taxiNo: String(i.taxiNo ?? ""), carType: String(i.carType ?? ""),
          dutySlip: billNo ? "" : String(i.dutySlip ?? ""), kind: (i.kind as Kind) ?? "fixed", rateLabel: String(i.rateLabel ?? ""),
          kms: str(i.kms), hours: str(i.hours), rate: str(i.rate), amount: str(i.amount), toll: str(i.toll), parking: str(i.parking),
        }))
      : [blankItem()],
    gstMode: (d.gstMode as BillF["gstMode"]) ?? "cgst_sgst", gstRate: String(d.gstRate ?? 5), notes: String(d.notes ?? DEFAULT_NOTES), showStamp: d.showStamp !== false,
    company: { ...COMPANY_DEFAULTS, ...((d.company as Partial<Company>) ?? {}) },
  };
}

/** Opens a tab straight away (so pop-up blockers allow it), then points it at the PDF once it is ready. */
function openPdfTab(load: () => Promise<string>, fail: (m: string) => void) {
  const w = window.open("", "_blank");
  load().then((url) => { if (w) w.location.href = url; else window.location.href = url; }).catch((e) => { w?.close(); fail(e instanceof Error ? e.message : "Could not make the PDF."); });
}

export default function Bills({ range, onUnauthorized, onMakeLink }: { range: Range; onUnauthorized: () => void; onMakeLink: (b: BillRow) => void }) {
  const [form, setForm] = useState<{ id?: string; initial: BillF } | null>(null);
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const list = usePaged<{ rows: BillRow[]; total: number }>("/api/admin/bills", { ...rangeParams(range), ...(dq && { q: dq }) }, onUnauthorized);
  const [msg, setMsg] = useState("");

  async function startNew() {
    setMsg("");
    try {
      const res = await fetch("/api/admin/bills?meta=1", { cache: "no-store" });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json();
      setForm({ initial: blankBill(data.next ?? "00001") });
    } catch { setMsg("Could not start a new bill. Please try again."); }
  }
  async function open(id: string, mode: "edit" | "copy") {
    setMsg("");
    try {
      const res = await fetch(`/api/admin/bills/${id}`, { cache: "no-store" });
      if (res.status === 401) return onUnauthorized();
      const doc = await res.json();
      if (!res.ok) throw new Error(doc.error);
      if (mode === "edit") return setForm({ id, initial: fromDoc(doc) });
      const meta = await (await fetch("/api/admin/bills?meta=1", { cache: "no-store" })).json();
      setForm({ initial: fromDoc(doc, meta.next ?? "") });
    } catch (e) { setMsg(e instanceof Error && e.message ? e.message : "Could not open that bill."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-neutral-400">Fill in the trips and charges, and we make the tax invoice as a PDF. Attach a saved bill to a payment link, and your customer can download it from their invoice page. Dates here are when the bill was created.</p>
        {!form && <button onClick={startNew} className="btn-primary"><Plus size={18} /> New bill</button>}
      </div>
      {msg && <p className="text-danger" role="alert">{msg}</p>}

      <AnimatePresence>
        {form && <BillForm key={form.id ?? "new"} id={form.id} initial={form.initial} onCancel={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} onUnauthorized={onUnauthorized} />}
      </AnimatePresence>

      {!form && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search invoice no., customer or passenger" />
          </div>
          {list.error && <p className="text-danger" role="alert">{list.error}</p>}
          {!list.data && !list.error && <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>}
          {list.data?.total === 0 && <p className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-neutral-400">No bills for {rangeLabel(range)}. Pick a wider date range, or make a new bill.</p>}
          <div className={`space-y-3 transition-opacity ${list.loading ? "opacity-50" : ""}`}>
            {list.data?.rows.map((b) => <BillCard key={b._id} b={b} onEdit={() => open(b._id, "edit")} onCopy={() => open(b._id, "copy")} onLink={() => onMakeLink(b)} reload={list.reload} setMsg={setMsg} />)}
          </div>
          {list.data && <Pager total={list.data.total} page={list.page} pageSize={list.pageSize} onPage={list.setPage} onPageSize={list.setPageSize} />}
        </>
      )}
    </div>
  );
}

function BillCard({ b, onEdit, onCopy, onLink, reload, setMsg }: { b: BillRow; onEdit: () => void; onCopy: () => void; onLink: () => void; reload: () => void; setMsg: (m: string) => void }) {
  const [mail, setMail] = useState(false);
  const [to, setTo] = useState(b.customerEmail ?? "");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [note, setNote] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending"); setNote("");
    try {
      const res = await fetch(`/api/admin/bills/${b._id}/email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "The email could not be sent.");
      setState("sent"); setNote(`Sent to ${data.to}`);
    } catch (err) { setState("error"); setNote(err instanceof Error ? err.message : "The email could not be sent."); }
  }
  async function remove() {
    if (!confirm(`Delete bill ${b.billNo} for ${b.customerName}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/bills/${b._id}`, { method: "DELETE" });
    if (!res.ok) return setMsg((await res.json().catch(() => ({}))).error ?? "Could not delete the bill.");
    setMsg(""); reload();
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-ink-900 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-xl"><FileText size={18} className="text-accent" /> Invoice {b.billNo}</h3>
          <p className="mt-1 text-neutral-300">{b.customerName}{b.customerCity ? `, ${b.customerCity}` : ""}</p>
          <p className="text-sm text-neutral-500">Invoice date {day(b.billDate)}</p>
        </div>
        <p className="font-display text-2xl font-bold text-white">{inr(b.totals?.total ?? 0)}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`/api/admin/bills/${b._id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn-primary !py-2 text-sm"><Eye size={15} /> Open PDF</a>
        <a href={`/api/admin/bills/${b._id}/pdf?download=1`} className="btn-ghost !py-2 text-sm"><Download size={15} /> Download</a>
        <button onClick={() => setMail((v) => !v)} className="btn-ghost !py-2 text-sm"><Mail size={15} /> Email PDF</button>
        <button onClick={onLink} className="btn-ghost !py-2 text-sm"><Link2 size={15} /> Add to payment link</button>
        <button onClick={onEdit} className="btn-ghost !py-2 text-sm"><Pencil size={15} /> Edit</button>
        <button onClick={onCopy} className="btn-ghost !py-2 text-sm"><Copy size={15} /> Copy as new</button>
        <button onClick={remove} className="btn-ghost !py-2 text-sm text-danger"><Trash2 size={15} /> Delete</button>
      </div>
      <AnimatePresence>
        {mail && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={send} className="mt-4 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2">
              <input type="email" required aria-label="Send the bill to this email" placeholder="Customer email" className="field !w-auto min-w-[16rem] flex-1" value={to} onChange={(e) => setTo(e.target.value)} />
              <button className="btn-primary !py-2.5 text-sm" disabled={state === "sending"}>{state === "sending" && <Loader2 className="animate-spin" size={14} />} Send PDF</button>
            </div>
            <p className={`mt-2 text-sm ${state === "error" ? "text-danger" : "text-neutral-400"}`} aria-live="polite">{note || "The PDF goes as an attachment."}</p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ form */

function BillForm({ id, initial, onCancel, onSaved, onUnauthorized }: { id?: string; initial: BillF; onCancel: () => void; onSaved: () => void; onUnauthorized: () => void }) {
  const [f, setF] = useState<BillF>(initial);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "open" | "preview">("");
  const set = <K extends keyof BillF>(k: K, v: BillF[K]) => setF((x) => ({ ...x, [k]: v }));
  const setItem = (i: number, patch: Partial<ItemF>) => setF((x) => ({ ...x, items: x.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));

  const input = toInput(f);
  const t = totalsOf(input);
  const gstState = /^\d{2}/.exec(f.customerGstin.trim())?.[0];
  const ownState = COMPANY_DEFAULTS.gstin.slice(0, 2);
  const hint = gstState && gstState !== ownState && f.gstMode === "cgst_sgst"
    ? `This customer's GSTIN starts with ${gstState}, a different state from yours (${ownState}). IGST is usually charged for other states.`
    : gstState && gstState === ownState && f.gstMode === "igst" ? `This customer's GSTIN is from your own state (${ownState}). CGST + SGST is usually charged within the state.` : "";

  function addTrip(copy?: ItemF) {
    setF((x) => {
      const last = x.items[x.items.length - 1];
      return { ...x, items: [...x.items, copy ? { ...copy } : blankItem(last)] };
    });
  }
  function changeKind(i: number, kind: Kind) {
    const cur = f.items[i];
    const wasDefault = !cur.rateLabel || Object.values(KIND_LABEL).includes(cur.rateLabel);
    setItem(i, { kind, ...(wasDefault ? { rateLabel: KIND_LABEL[kind] } : {}) });
  }

  async function post(url: string, method: string) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (res.status === 401) { onUnauthorized(); throw new Error("Please sign in again."); }
    return res;
  }
  async function save(then: "close" | "open") {
    setBusy(then === "open" ? "open" : "save"); setErr("");
    const w = then === "open" ? window.open("", "_blank") : null;
    try {
      const res = await post(id ? `/api/admin/bills/${id}` : "/api/admin/bills", id ? "PUT" : "POST");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save the bill.");
      if (w) w.location.href = `/api/admin/bills/${data.id}/pdf`;
      onSaved();
    } catch (e) {
      w?.close();
      setErr(e instanceof Error ? e.message : "Could not save the bill.");
      setBusy("");
    }
  }
  function preview() {
    setBusy("preview"); setErr("");
    openPdfTab(async () => {
      const res = await post("/api/admin/bills/preview", "POST");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not make the preview.");
      return URL.createObjectURL(await res.blob());
    }, (m) => setErr(m));
    setTimeout(() => setBusy(""), 600);
  }

  return (
    <motion.form
      onSubmit={(e) => { e.preventDefault(); save("close"); }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="space-y-6 rounded-3xl border border-white/10 bg-ink-900 p-5 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl">{id ? `Edit invoice ${initial.billNo}` : "New tax invoice"}</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="btn-ghost !p-2"><X size={16} /></button>
      </div>

      <Section title="Invoice">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <L label="Invoice number"><input className="field font-mono" value={f.billNo} onChange={(e) => set("billNo", e.target.value)} required /></L>
          <L label="Invoice date"><input type="date" className="field" value={f.billDate} onChange={(e) => set("billDate", e.target.value)} required /></L>
          <L label="Tax">
            <select className="field" value={f.gstMode} onChange={(e) => set("gstMode", e.target.value as BillF["gstMode"])}>
              <option value="cgst_sgst">CGST + SGST (same state)</option>
              <option value="igst">IGST (other state)</option>
              <option value="none">No GST</option>
            </select>
          </L>
          {f.gstMode !== "none" && <L label="GST rate, total %"><input type="number" min={0} max={40} step="0.01" className="field" value={f.gstRate} onChange={(e) => set("gstRate", e.target.value)} /></L>}
        </div>
        {f.gstMode === "cgst_sgst" && <p className="mt-2 text-sm text-neutral-500">{num(f.gstRate)}% is split as {num(f.gstRate) / 2}% CGST + {num(f.gstRate) / 2}% SGST. Tax is worked out on the trip amounts. Toll and parking are added after tax.</p>}
        {hint && <p className="mt-2 text-sm text-accent" role="status">{hint}</p>}
      </Section>

      <Section title="Customer">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <L label="Customer name"><input className="field" value={f.customerName} onChange={(e) => set("customerName", e.target.value)} required minLength={2} /></L>
          <L label="City"><input className="field" value={f.customerCity} onChange={(e) => set("customerCity", e.target.value)} placeholder="e.g. MUMBAI" /></L>
          <L label="Booked by"><input className="field" value={f.bookedBy} onChange={(e) => set("bookedBy", e.target.value)} placeholder="e.g. MR.KISHORE" /></L>
          <L label="Customer GST number"><input className="field font-mono" value={f.customerGstin} onChange={(e) => set("customerGstin", e.target.value)} /></L>
          <L label="Customer email (for sending)"><input type="email" className="field" value={f.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} placeholder="Optional" /></L>
          <L label="WhatsApp number"><input type="tel" inputMode="tel" className="field" value={f.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} placeholder="Optional" /></L>
        </div>
      </Section>

      <Section title="Trips">
        <div className="space-y-4">
          {f.items.map((it, i) => {
            const amount = lineAmount(toInput({ ...f, items: [it] }).items[0]);
            return (
              <div key={i} className="rounded-2xl border border-white/10 bg-ink-800/60 p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg font-bold text-white">Trip {i + 1} <span className="ml-2 text-base font-normal text-accent">{inr(amount)}</span></p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addTrip({ ...it, dutySlip: it.dutySlip, toll: "", parking: "" })} className="btn-ghost !py-1.5 text-sm"><Copy size={14} /> Duplicate</button>
                    <button type="button" onClick={() => setF((x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }))} disabled={f.items.length === 1} className="btn-ghost !py-1.5 text-sm disabled:opacity-30" aria-label={`Remove trip ${i + 1}`}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <L label="Journey start"><input type="datetime-local" className="field" value={it.start} onChange={(e) => setItem(i, { start: e.target.value })} /></L>
                  <L label="Journey end"><input type="datetime-local" className="field" value={it.end} onChange={(e) => setItem(i, { end: e.target.value })} /></L>
                  <L label="Passenger"><input className="field" value={it.passenger} onChange={(e) => setItem(i, { passenger: e.target.value })} placeholder="e.g. MR.RAHUL KISHORE" /></L>
                  <L label="From"><input className="field" value={it.from} onChange={(e) => setItem(i, { from: e.target.value })} placeholder="LOCAL" /></L>
                  <L label="Taxi number"><input className="field font-mono" value={it.taxiNo} onChange={(e) => setItem(i, { taxiNo: e.target.value })} placeholder="MH 31 FC 9419" /></L>
                  <L label="Car type"><input className="field" value={it.carType} onChange={(e) => setItem(i, { carType: e.target.value })} placeholder="e.g. CRYSTA" /></L>
                  <L label="Duty slip number"><input className="field font-mono" value={it.dutySlip} onChange={(e) => setItem(i, { dutySlip: e.target.value })} placeholder="NGP /16515" /></L>
                  <L label="Charge type">
                    <select className="field" value={it.kind} onChange={(e) => changeKind(i, e.target.value as Kind)}>
                      {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                    </select>
                  </L>
                  <L label="Shown under “Rate per”"><input className="field" value={it.rateLabel} onChange={(e) => setItem(i, { rateLabel: e.target.value })} placeholder="e.g. 10 HRS TO 100 KM" /></L>
                  <L label="Total KMs"><input type="number" min={0} step="0.01" className="field" value={it.kms} onChange={(e) => setItem(i, { kms: e.target.value })} /></L>
                  {it.kind === "extra_hours" && <L label="Extra hours"><input type="number" min={0} step="0.25" className="field" value={it.hours} onChange={(e) => setItem(i, { hours: e.target.value })} /></L>}
                  {it.kind !== "custom"
                    ? <L label={it.kind === "fixed" ? "Rate (the amount)" : it.kind === "extra_hours" ? "Rate per hour" : "Rate per KM"}><input type="number" min={0} step="0.01" className="field" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} /></L>
                    : <L label="Amount"><input type="number" min={0} step="0.01" className="field" value={it.amount} onChange={(e) => setItem(i, { amount: e.target.value })} /></L>}
                  <L label="Toll charges"><input type="number" min={0} step="0.01" className="field" value={it.toll} onChange={(e) => setItem(i, { toll: e.target.value })} /></L>
                  <L label="Parking charges"><input type="number" min={0} step="0.01" className="field" value={it.parking} onChange={(e) => setItem(i, { parking: e.target.value })} /></L>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => addTrip()} className="mt-3 text-sm font-semibold text-accent hover:underline"><Plus size={14} className="mr-1 inline" />Add another trip</button>
        <p className="mt-2 text-sm text-neutral-500">When one duty slip has two lines (a package and extra KM, say), enter its toll and parking on one line only, so they are not counted twice.</p>
      </Section>

      <Section title="Notes and signature">
        <L label="Notes printed on the bill"><textarea rows={3} className="field" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></L>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-neutral-300">
          <input type="checkbox" className="h-5 w-5 accent-[#FF6B00]" checked={f.showStamp} onChange={(e) => set("showStamp", e.target.checked)} /> Add the signature and stamp
        </label>
        <details className="mt-4 rounded-2xl border border-white/10 p-4">
          <summary className="cursor-pointer font-semibold text-neutral-200">Company details on the bill (address, bank, GST)</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([
              ["name", "Company name"], ["email", "Email"], ["address", "Address"], ["phones", "Phone numbers"], ["bankName", "Bank"], ["branch", "Branch"],
              ["accountNo", "Account number"], ["ifsc", "IFSC code"], ["pan", "PAN"], ["gstin", "GSTIN"], ["sac", "HSN/SAC code"],
            ] as [keyof Company, string][]).map(([k, label]) => (
              <L key={k} label={label}><input className="field" value={f.company[k]} onChange={(e) => set("company", { ...f.company, [k]: e.target.value })} /></L>
            ))}
          </div>
        </details>
      </Section>

      <div className="space-y-2 rounded-2xl bg-ink-800 p-5">
        <Line label="Trips total" value={t.subtotal} />
        {t.toll > 0 && <Line label="Toll charges" value={t.toll} />}
        {t.parking > 0 && <Line label="Parking charges" value={t.parking} />}
        {f.gstMode === "cgst_sgst" && <><Line label={`CGST @ ${num(f.gstRate) / 2}%`} value={t.cgst} /><Line label={`SGST @ ${num(f.gstRate) / 2}%`} value={t.sgst} /></>}
        {f.gstMode === "igst" && <Line label={`IGST @ ${num(f.gstRate)}%`} value={t.igst} />}
        <div className="flex items-baseline justify-between border-t border-white/10 pt-3"><span className="text-lg text-white">Final total</span><span className="font-display text-3xl font-bold text-white">{inr(t.total)}</span></div>
        <p className="text-sm text-neutral-400">Rs. {inWords(t.total)} only. Total KMs: {t.kms.toFixed(2)}</p>
      </div>

      {err && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-danger" role="alert">{err}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={!!busy}>{busy === "save" ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {id ? "Save changes" : "Save bill"}</button>
        <button type="button" onClick={() => save("open")} disabled={!!busy} className="btn-ghost">{busy === "open" ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />} Save and open PDF</button>
        <button type="button" onClick={preview} disabled={!!busy} className="btn-ghost">{busy === "preview" ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />} Preview without saving</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </motion.form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="mb-3 text-lg font-bold text-white">{title}</h3>{children}</section>;
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="field-label">{label}</span>{children}</label>;
}
function Line({ label, value }: { label: string; value: number }) {
  return <div className="flex items-baseline justify-between text-neutral-300"><span>{label}</span><span>{inr(value)}</span></div>;
}

/** Recent bills for the payment-link form to attach. */
export function useRecentBills(enabled: boolean) {
  const [bills, setBills] = useState<BillRow[] | null>(null);
  useEffect(() => {
    if (!enabled || bills) return;
    let live = true;
    fetch("/api/admin/bills?meta=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (live && d) setBills(d.recent); }).catch(() => {});
    return () => { live = false; };
  }, [enabled, bills]);
  return bills;
}
