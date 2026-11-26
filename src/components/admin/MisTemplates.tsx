"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { periodFor, type Period } from "@/components/admin/BillingReports";
import { SOURCES, type MisColumn, type MisPerson } from "@/lib/mis-template";
import { fmtBillDate } from "@/lib/billing";

type Row = { _id: string; customerName: string; fileName?: string; updatedAt?: string; columns: number };
type Full = { _id: string; customerName: string; headerRow: number; dataStartRow: number; columns: MisColumn[]; people: MisPerson[] };

const letter = (n: number) => { let s = ""; for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s; return s; };
const GROUPS = [...new Set(SOURCES.map((s) => s.group))];
const PRESETS: { id: Period["preset"]; label: string }[] = [{ id: "month", label: "This month" }, { id: "last", label: "Last month" }, { id: "custom", label: "Pick dates" }];

async function api<T>(url: string, init: RequestInit | undefined, unauth: () => void): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (res.status === 401) { unauth(); throw new Error("Please sign in again."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong.");
  return data as T;
}

export default function MisTemplates({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [customers, setCustomers] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([
        api<{ rows: Row[] }>("/api/admin/mis-templates", undefined, onUnauthorized),
        api<{ customers?: { customerName: string }[] }>("/api/admin/bills?meta=1", undefined, onUnauthorized),
      ]);
      setRows(t.rows); setCustomers((m.customers ?? []).map((c) => c.customerName));
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not load the templates."); }
  }, [onUnauthorized]);
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-neutral-400">Upload each corporate customer&apos;s own MIS Excel once. We work out which column is which. After that, pick a month and download their sheet filled with the trips from your bills, in their layout.</p>
      {msg && <p className="text-danger" role="alert">{msg}</p>}
      <UploadForm customers={customers} onDone={(id, replaced) => { setMsg(""); load(); if (!replaced) setEdit(id); }} onError={setMsg} onUnauthorized={onUnauthorized} />
      {!rows && !msg && <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>}
      {rows?.length === 0 && <p className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-neutral-400">No templates yet. Upload a customer&apos;s MIS sheet above.</p>}
      <div className="space-y-3">
        {rows?.map((r) => (
          <TemplateCard key={r._id} r={r} open={edit === r._id} onToggle={() => setEdit(edit === r._id ? null : r._id)} onChanged={load} onUnauthorized={onUnauthorized} />
        ))}
      </div>
    </div>
  );
}

function UploadForm({ customers, onDone, onError, onUnauthorized }: { customers: string[]; onDone: (id: string, replaced: boolean) => void; onError: (m: string) => void; onUnauthorized: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true); onError("");
    try {
      const r = await api<{ id: string; replaced: boolean }>("/api/admin/mis-templates", { method: "POST", body: fd }, onUnauthorized);
      form.reset(); setName(""); onDone(r.id, r.replaced);
    } catch (err) { onError(err instanceof Error ? err.message : "Could not upload."); }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-white/10 bg-ink-900 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block"><span className="field-label">Customer</span>
        <input name="customerName" className="field" list="mis-customers" autoComplete="off" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Exactly as on the bills, e.g. Britannia Industries Ltd" />
        <datalist id="mis-customers">{customers.map((c) => <option key={c} value={c} />)}</datalist></label>
      <label className="block"><span className="field-label">Their MIS Excel (.xlsx)</span>
        <input name="file" type="file" accept=".xlsx" required className="field file:mr-3 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-1.5 file:font-semibold file:text-black" /></label>
      <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />} Upload</button>
      <p className="text-sm text-neutral-500 sm:col-span-3">The name must match the customer name on their bills, so the right trips are picked. Uploading again for the same customer replaces the sheet and keeps your column settings.</p>
    </form>
  );
}

function TemplateCard({ r, open, onToggle, onChanged, onUnauthorized }: { r: Row; open: boolean; onToggle: () => void; onChanged: () => void; onUnauthorized: () => void }) {
  const [p, setP] = useState<Period>(() => periodFor("month"));
  const [bill, setBill] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function download() {
    setBusy(true); setErr("");
    try {
      const qs = new URLSearchParams({ id: r._id, from: p.from, to: p.to, ...(bill.trim() && { bill: bill.trim() }) });
      const res = await fetch(`/api/admin/mis-templates/fill?${qs}`, { cache: "no-store" });
      if (res.status === 401) { onUnauthorized(); return; }
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not make the sheet.");
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "MIS.xlsx";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a"); a.href = url; a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not make the sheet."); }
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm(`Delete the MIS template for ${r.customerName}? Your bills are not affected.`)) return;
    try { await api(`/api/admin/mis-templates/${r._id}`, { method: "DELETE" }, onUnauthorized); onChanged(); } catch (e) { setErr(e instanceof Error ? e.message : "Could not delete."); }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-white"><FileSpreadsheet className="mr-2 inline text-brand-500" size={18} />{r.customerName}</p>
          <p className="text-sm text-neutral-400">{r.fileName} · {r.columns} columns filled</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onToggle} className="btn-ghost !py-1.5 text-sm" aria-expanded={open}>{open ? <X size={14} /> : <Pencil size={14} />} {open ? "Close settings" : "Column settings"}</button>
          <button onClick={remove} className="btn-ghost !py-1.5 text-sm" aria-label={`Delete template for ${r.customerName}`}><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((x) => (
            <button key={x.id} type="button" aria-pressed={p.preset === x.id && !bill} onClick={() => { setBill(""); setP(periodFor(x.id, p)); }}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${p.preset === x.id && !bill ? "border-brand-500 bg-brand-500 text-black" : "border-white/20 text-neutral-300 hover:border-brand-500"}`}>{x.label}</button>
          ))}
        </div>
        {p.preset === "custom" && (
          <>
            <label className="block"><span className="field-label">From</span><input type="date" className="field !w-auto" value={p.from} max={p.to} onChange={(e) => e.target.value && setP({ ...p, from: e.target.value })} /></label>
            <label className="block"><span className="field-label">To</span><input type="date" className="field !w-auto" value={p.to} min={p.from} onChange={(e) => e.target.value && setP({ ...p, to: e.target.value })} /></label>
          </>
        )}
        <label className="block"><span className="field-label">Or one invoice no.</span><input className="field !w-32 font-mono" value={bill} onChange={(e) => setBill(e.target.value)} placeholder="optional" /></label>
        <button onClick={download} disabled={busy} className="btn-primary !py-3">{busy ? <Loader2 className="animate-spin" size={17} /> : <Download size={17} />} Download filled sheet</button>
      </div>
      <p className="mt-2 text-sm text-neutral-500">{bill ? `Only invoice ${bill}.` : `Invoices dated ${fmtBillDate(p.from)} to ${fmtBillDate(p.to)}.`}</p>
      {err && <p className="mt-2 text-danger" role="alert">{err}</p>}
      {open && <Settings id={r._id} onSaved={onChanged} onUnauthorized={onUnauthorized} />}
    </div>
  );
}

function Settings({ id, onSaved, onUnauthorized }: { id: string; onSaved: () => void; onUnauthorized: () => void }) {
  const [f, setF] = useState<Full | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Full>(`/api/admin/mis-templates/${id}`, undefined, onUnauthorized).then(setF).catch((e) => setMsg(e.message)); }, [id, onUnauthorized]);
  if (!f) return <p className="mt-4 text-neutral-400">{msg || "Loading"}</p>;

  const setCol = (i: number, patch: Partial<MisColumn>) => setF({ ...f, columns: f.columns.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const setPerson = (i: number, patch: Partial<MisPerson>) => setF({ ...f, people: f.people.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  async function save() {
    if (!f) return;
    setBusy(true); setMsg("");
    try {
      await api(`/api/admin/mis-templates/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ headerRow: f.headerRow, dataStartRow: f.dataStartRow, columns: f.columns, people: f.people }) }, onUnauthorized);
      setMsg("Saved."); onSaved();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not save."); }
    setBusy(false);
  }

  return (
    <div className="mt-5 space-y-6 border-t border-white/10 pt-5">
      <div>
        <h3 className="text-lg font-bold text-white">Which column holds what</h3>
        <p className="mt-1 text-sm text-neutral-400">We guessed from the column names. Fix anything that is wrong. A column marked “keeps their formula” has a formula in the customer&apos;s sheet, which is copied down each row.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="field-label">Header is on row</span><input type="number" min={1} className="field" value={f.headerRow} onChange={(e) => setF({ ...f, headerRow: Number(e.target.value) || 1 })} /></label>
          <label className="block"><span className="field-label">Trips start on row</span><input type="number" min={2} className="field" value={f.dataStartRow} onChange={(e) => setF({ ...f, dataStartRow: Number(e.target.value) || 2 })} /></label>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-ink-800 text-neutral-400"><tr><th className="px-3 py-2">Col</th><th className="px-3 py-2">Their heading</th><th className="px-3 py-2">We fill it with</th><th className="px-3 py-2">Fixed value</th></tr></thead>
            <tbody>
              {f.columns.map((c, i) => (
                <tr key={c.col} className="border-t border-white/5">
                  <td className="px-3 py-1.5 font-mono text-neutral-500">{letter(c.col)}</td>
                  <td className="px-3 py-1.5 text-neutral-200">{c.header}{c.formula && c.source !== "totalHours" && <span className="ml-2 text-xs text-accent">keeps their formula</span>}</td>
                  <td className="px-3 py-1.5">
                    <select className="field !py-1.5" aria-label={`What goes in ${c.header}`} value={c.source} onChange={(e) => setCol(i, { source: e.target.value as MisColumn["source"] })}>
                      {GROUPS.map((g) => <optgroup key={g} label={g}>{SOURCES.filter((s) => s.group === g).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</optgroup>)}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    {(c.source === "text" || c.source === "department" || c.source === "orderedBy" || c.source === "employeeId" || c.source === "empEmail") &&
                      <input className="field !py-1.5" aria-label={`Fixed value for ${c.header}`} value={c.text} onChange={(e) => setCol(i, { text: e.target.value })} placeholder={c.source === "text" ? "Same on every row" : "Used when the trip has none"} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white">People at this customer</h3>
        <p className="mt-1 text-sm text-neutral-400">When a trip&apos;s passenger name matches, their employee ID, email and department are filled in automatically.</p>
        <div className="mt-3 space-y-2">
          {f.people.map((p, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1.6fr_1fr_auto]">
              <input className="field" aria-label="Passenger name" placeholder="Passenger name" value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} />
              <input className="field" aria-label="Employee ID" placeholder="Employee ID" value={p.employeeId} onChange={(e) => setPerson(i, { employeeId: e.target.value })} />
              <input className="field" aria-label="Email" placeholder="Email" value={p.email} onChange={(e) => setPerson(i, { email: e.target.value })} />
              <input className="field" aria-label="Department" placeholder="Department" value={p.department} onChange={(e) => setPerson(i, { department: e.target.value })} />
              <button type="button" className="btn-ghost !p-2" aria-label="Remove person" onClick={() => setF({ ...f, people: f.people.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" className="btn-ghost text-sm" onClick={() => setF({ ...f, people: [...f.people, { name: "", employeeId: "", email: "", department: "" }] })}><Plus size={14} /> Add a person</button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary">{busy ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} Save settings</button>
        {msg && <p className={msg === "Saved." ? "text-accent" : "text-danger"} role="status">{msg}</p>}
      </div>
    </div>
  );
}
