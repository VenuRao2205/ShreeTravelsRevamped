"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, KeyRound, Loader2, Plus, Trash2, X } from "lucide-react";

export type PayRequest = {
  _id: string; customerName: string; customerEmail: string; loginId: string; expiresAt: string; revoked: boolean; lockedUntil?: string;
  invoices: { key: string; number: string; date: string; amount: number; status: "UNPAID" | "PAID" }[];
};
type L = { rows: PayRequest[] | null; error: string; reload: () => void };
type Row = { number: string; date: string; amount: string };
type Created = { name: string; loginId: string; password: string; expiresAt: string; total: number };

const inr = (n: number) => `Rs ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toLocaleDateString("en-CA");
const blank = (): Row => ({ number: "", date: today(), amount: "" });
const dash = (v: string, g: number) => v.match(new RegExp(`.{1,${g}}`, "g"))?.join("-") ?? v;

export default function PaymentLinks({ rows, error, reload }: L) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-neutral-400">Add a customer and their invoices. We create a login for them. Share it, and they pay everything from the Payments page.</p>
        {!open && <button onClick={() => { setOpen(true); setCreated(null); }} className="btn-primary"><Plus size={18} /> New payment link</button>}
      </div>

      <AnimatePresence>
        {open && !created && <Create key="form" onCancel={() => setOpen(false)} onCreated={(c) => { setCreated(c); setOpen(false); reload(); }} />}
        {created && <Credentials key="creds" c={created} onClose={() => setCreated(null)} />}
      </AnimatePresence>

      {error && <p className="text-danger">{error}</p>}
      {rows === null && !error && <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>}
      {rows?.length === 0 && <p className="rounded-2xl border border-white/10 bg-ink-900 p-8 text-center text-neutral-400">No payment links yet. Create one to get started.</p>}
      <div className="space-y-4">{rows?.map((r) => <Card key={r._id} r={r} reload={reload} />)}</div>
    </div>
  );
}

function Create({ onCancel, onCreated }: { onCancel: () => void; onCreated: (c: Created) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("7");
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const total = rows.reduce((a, r) => a + (Number(r.amount) || 0), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: name, customerEmail: email, expiryDays: Number(days) || 7, invoices: rows.map((r) => ({ number: r.number, date: r.date, amountRupees: Number(r.amount) })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the link.");
      onCreated({ name, loginId: data.loginId, password: data.password, expiresAt: data.expiresAt, total });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the link.");
    }
    setBusy(false);
  }

  return (
    <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5 rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className="field-label" htmlFor="cn">Customer name</label><input id="cn" className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></div>
        <div><label className="field-label" htmlFor="ce">Customer email</label><input id="ce" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label className="field-label" htmlFor="cd">Valid for (days)</label><input id="cd" type="number" min={1} max={90} className="field" value={days} onChange={(e) => setDays(e.target.value)} /></div>
      </div>

      <div>
        <p className="field-label">Invoices</p>
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] items-end gap-3 sm:grid-cols-[1fr_11rem_10rem_auto]">
              <input aria-label={`Invoice ${i + 1} number`} placeholder="Invoice number" className="field col-span-2 sm:col-span-1" value={r.number} onChange={(e) => set(i, "number", e.target.value)} required />
              <input aria-label={`Invoice ${i + 1} date`} type="date" className="field" value={r.date} onChange={(e) => set(i, "date", e.target.value)} required />
              <input aria-label={`Invoice ${i + 1} amount in rupees`} type="number" min={1} step="0.01" placeholder="Amount (Rs)" className="field" value={r.amount} onChange={(e) => set(i, "amount", e.target.value)} required />
              <button type="button" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} disabled={rows.length === 1} aria-label={`Remove invoice ${i + 1}`} className="btn-ghost !p-3 disabled:opacity-30"><X size={16} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows((r) => [...r, blank()])} className="mt-3 text-sm font-semibold text-accent hover:underline"><Plus size={14} className="mr-1 inline" />Add another invoice</button>
      </div>

      <div className="flex items-baseline justify-between rounded-2xl bg-ink-800 p-4"><span className="text-neutral-400">Total</span><span className="font-display text-2xl font-bold text-white">{inr(total)}</span></div>
      {err && <p className="text-danger" role="alert">{err}</p>}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="animate-spin" size={18} />} Create link and login</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </motion.form>
  );
}

function Credentials({ c, onClose, title = "Share this login with the customer" }: { c: { name: string; loginId?: string; password: string; expiresAt?: string; total?: number }; onClose: () => void; title?: string }) {
  const [copied, setCopied] = useState(false);
  const site = typeof window !== "undefined" ? window.location.origin : "";
  const msg = [
    `Hello ${c.name},`,
    `You can see and pay your invoices here: ${site}/payment?tab=invoices`,
    c.loginId ? `Login ID: ${c.loginId}` : "",
    `Password: ${c.password}`,
    c.expiresAt ? `Valid until ${day(c.expiresAt)}.` : "",
    "- Shree Travels",
  ].filter(Boolean).join("\n");
  async function copy() { try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* user can select the text */ } }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-3xl border border-brand-500/50 bg-brand-500/10 p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl">{title}</h3>
        <button onClick={onClose} aria-label="Close" className="btn-ghost !p-2"><X size={16} /></button>
      </div>
      <p className="mt-2 text-sm text-neutral-300">The password is shown only now. We store a scrambled copy, so it cannot be looked up later. You can reset it any time.</p>
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-ink-900 p-5 font-mono text-sm text-white">{msg}</pre>
      <button onClick={copy} className="btn-primary mt-4">{copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copied" : "Copy message"}</button>
    </motion.div>
  );
}

function Card({ r, reload }: { r: PayRequest; reload: () => void }) {
  const [busy, setBusy] = useState("");
  const [pw, setPw] = useState<string | null>(null);
  const paid = r.invoices.filter((i) => i.status === "PAID");
  const total = r.invoices.reduce((a, i) => a + i.amount, 0) / 100;
  const got = paid.reduce((a, i) => a + i.amount, 0) / 100;
  const expired = new Date(r.expiresAt) < new Date();
  const done = paid.length === r.invoices.length;
  const state = r.revoked ? "Stopped" : done ? "Fully paid" : expired ? "Expired" : "Active";

  async function act(action: string, days?: number) {
    setBusy(action);
    try {
      const res = await fetch("/api/admin/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r._id, action, days }) });
      const data = await res.json().catch(() => ({}));
      if (action === "reset-password" && data.password) setPw(data.password);
      reload();
    } finally { setBusy(""); }
  }
  async function remove() {
    if (!confirm(`Delete the link for ${r.customerName}? This cannot be undone.`)) return;
    setBusy("delete");
    await fetch(`/api/admin/requests?id=${r._id}`, { method: "DELETE" });
    reload();
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-ink-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl">{r.customerName}</h3>
          <p className="text-sm text-neutral-500">{r.customerEmail} · Login {dash(r.loginId, 4)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${state === "Active" ? "bg-brand-500 text-black" : state === "Fully paid" ? "bg-brand-500/20 text-accent" : "bg-red-500/20 text-danger"}`}>{state}</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-brand-500" initial={{ width: 0 }} animate={{ width: `${total ? (got / total) * 100 : 0}%` }} transition={{ duration: 0.8 }} /></div>
      <p className="mt-2 text-sm text-neutral-400">{inr(got)} paid of {inr(total)} · {paid.length}/{r.invoices.length} invoices · valid until {day(r.expiresAt)}</p>

      <ul className="mt-4 divide-y divide-white/10 text-sm">
        {r.invoices.map((i) => (
          <li key={i.key} className="flex items-center justify-between gap-3 py-2">
            <span className="text-neutral-300">{i.number} <span className="text-neutral-500">· {day(i.date)}</span></span>
            <span className={i.status === "PAID" ? "text-accent" : "text-white"}>{inr(i.amount / 100)} {i.status === "PAID" && <Check size={14} className="inline" />}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => act("extend", 7)} disabled={!!busy} className="btn-ghost !py-2 text-sm">Extend 7 days</button>
        <button onClick={() => act("reset-password")} disabled={!!busy} className="btn-ghost !py-2 text-sm"><KeyRound size={14} /> New password</button>
        {r.revoked ? <button onClick={() => act("restore")} disabled={!!busy} className="btn-ghost !py-2 text-sm">Restore</button> : <button onClick={() => act("revoke")} disabled={!!busy} className="btn-ghost !py-2 text-sm">Stop access</button>}
        <button onClick={remove} disabled={!!busy} className="btn-ghost !py-2 text-sm text-danger"><Trash2 size={14} /> Delete</button>
      </div>
      <AnimatePresence>{pw && <div className="mt-4"><Credentials c={{ name: r.customerName, loginId: dash(r.loginId, 4), password: pw, expiresAt: r.expiresAt }} title="New password" onClose={() => setPw(null)} /></div>}</AnimatePresence>
    </motion.div>
  );
}
