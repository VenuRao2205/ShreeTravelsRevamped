"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, FileText, KeyRound, Loader2, Mail, MessageCircle, Paperclip, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useRecentBills, type BillRow } from "@/components/admin/Bills";
import { waLink } from "@/lib/whatsapp";
import { Chips, Pager, SearchBox, rangeLabel, rangeParams, useDebounced, usePaged, type Range } from "@/components/admin/Filters";

export type PayRequest = {
  _id: string; customerName: string; customerEmail: string; customerPhone?: string; loginId: string; expiresAt: string; revoked: boolean; lockedUntil?: string;
  invoices: { key: string; number: string; date: string; amount: number; status: "UNPAID" | "PAID"; billId?: string }[];
};
type Row = { number: string; date: string; amount: string; billId?: string };
type Cred = { id: string; name: string; email: string; phone?: string; loginId: string; password: string; expiresAt: string };

const inr = (n: number) => `Rs ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toLocaleDateString("en-CA");
const blank = (): Row => ({ number: "", date: today(), amount: "" });
// No 0/O/1/I, so a password read out over the phone is not misheard.
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generate = (n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => ALPHA[x % ALPHA.length]).join("");

export default function PaymentLinks({ range, onUnauthorized, draft, onDraftUsed }: { range: Range; onUnauthorized: () => void; draft?: BillRow | null; onDraftUsed?: () => void }) {
  const [open, setOpen] = useState(!!draft);
  const [created, setCreated] = useState<Cred | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paid" | "expired" | "stopped">("all");
  const dq = useDebounced(q.trim());
  const list = usePaged<{ rows: PayRequest[]; total: number }>("/api/admin/requests", { ...rangeParams(range), ...(dq && { q: dq }), ...(status !== "all" && { status }) }, onUnauthorized);
  const rows = list.data?.rows ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-neutral-400">Add a customer and their invoices, and choose their login or let us generate one. Share it by email or WhatsApp, and they pay everything from the Payments page. Dates here are when the link was created.</p>
        {!open && <button onClick={() => { setOpen(true); setCreated(null); }} className="btn-primary"><Plus size={18} /> New payment link</button>}
      </div>

      <AnimatePresence>
        {open && !created && <Create key={draft?._id ?? "form"} draft={draft ?? null} onCancel={() => { setOpen(false); onDraftUsed?.(); }} onCreated={(c) => { setCreated(c); setOpen(false); onDraftUsed?.(); list.reload(); }} />}
        {created && <Credentials key="creds" c={created} onClose={() => setCreated(null)} />}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search customer, email, invoice or login ID" />
        <Chips value={status} onChange={setStatus} options={[{ id: "all", label: "All" }, { id: "active", label: "Awaiting payment" }, { id: "paid", label: "Fully paid" }, { id: "expired", label: "Expired" }, { id: "stopped", label: "Stopped" }]} />
      </div>

      {list.error && <p className="text-danger" role="alert">{list.error}</p>}
      {!list.data && !list.error && <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>}
      {list.data?.total === 0 && <p className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-neutral-400">No payment links for {rangeLabel(range)}. Change the filters, pick a wider date range, or create a new link.</p>}
      <div className={`space-y-4 transition-opacity ${list.loading ? "opacity-50" : ""}`}>{rows?.map((r) => <Card key={r._id} r={r} reload={list.reload} />)}</div>
      {list.data && <Pager total={list.data.total} page={list.page} pageSize={list.pageSize} onPage={list.setPage} onPageSize={list.setPageSize} />}
    </div>
  );
}

function Create({ draft, onCancel, onCreated }: { draft: BillRow | null; onCancel: () => void; onCreated: (c: Cred) => void }) {
  const [name, setName] = useState(draft?.customerName ?? "");
  const [email, setEmail] = useState(draft?.customerEmail ?? "");
  const [phone, setPhone] = useState(draft?.customerPhone ?? "");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState("7");
  const [rows, setRows] = useState<Row[]>([draft ? { number: draft.billNo, date: draft.billDate, amount: String(draft.totals?.total ?? ""), billId: draft._id } : blank()]);
  const bills = useRecentBills(true);
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
        body: JSON.stringify({
          customerName: name, customerEmail: email, customerPhone: phone || undefined,
          loginId: loginId.trim() || undefined, password: password || undefined,
          expiryDays: Number(days) || 7, invoices: rows.map((r) => ({ number: r.number, date: r.date, amountRupees: Number(r.amount), ...(r.billId && { billId: r.billId }) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the link.");
      onCreated({ id: data.id, name, email, phone: phone || undefined, loginId: data.loginId, password: data.password, expiresAt: data.expiresAt });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the link.");
    }
    setBusy(false);
  }

  return (
    <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5 rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><label className="field-label" htmlFor="cn">Customer name</label><input id="cn" className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></div>
        <div><label className="field-label" htmlFor="ce">Customer email</label><input id="ce" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label className="field-label" htmlFor="cp">WhatsApp number</label><input id="cp" type="tel" inputMode="tel" placeholder="Optional" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><label className="field-label" htmlFor="cd">Valid for (days)</label><input id="cd" type="number" min={1} max={90} className="field" value={days} onChange={(e) => setDays(e.target.value)} /></div>
      </div>

      <div className="rounded-2xl border border-white/10 p-4">
        <p className="field-label">Customer login</p>
        <p className="mb-3 text-sm text-neutral-500">Type your own, or leave both empty and we generate them. Use letters and numbers only. Capital or small letters both work when the customer signs in.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <input aria-label="Login ID" placeholder="Login ID, 4 to 20 characters" autoComplete="off" spellCheck={false} className="field font-mono" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
            <button type="button" onClick={() => setLoginId(generate(8))} className="btn-ghost !px-3" aria-label="Generate a login ID" title="Generate"><RefreshCw size={16} /></button>
          </div>
          <div className="flex gap-2">
            <input aria-label="Password" placeholder="Password, 6 to 30 characters" autoComplete="off" spellCheck={false} className="field font-mono" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setPassword(generate(10))} className="btn-ghost !px-3" aria-label="Generate a password" title="Generate"><RefreshCw size={16} /></button>
          </div>
        </div>
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
              <div className="col-span-2 sm:col-span-4">
                <select aria-label={`Attach a saved bill to invoice ${i + 1}`} className="field !py-2 text-sm" value={r.billId ?? ""}
                  onChange={(e) => {
                    const b = bills?.find((x) => x._id === e.target.value);
                    setRows((x) => x.map((row, j) => (j !== i ? row : b ? { number: b.billNo, date: b.billDate, amount: String(b.totals?.total ?? ""), billId: b._id } : { ...row, billId: undefined })));
                    if (b && !name) setName(b.customerName);
                    if (b?.customerEmail && !email) setEmail(b.customerEmail);
                    if (b?.customerPhone && !phone) setPhone(b.customerPhone);
                  }}>
                  <option value="">{bills ? "No bill attached. Pick a saved bill to attach (optional)" : "Loading saved bills"}</option>
                  {r.billId && !bills?.some((b) => b._id === r.billId) && <option value={r.billId}>Attached bill {r.number}</option>}
                  {bills?.map((b) => <option key={b._id} value={b._id}>Bill {b.billNo} · {b.customerName} · {inr(b.totals?.total ?? 0)}</option>)}
                </select>
              </div>
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

function Credentials({ c, onClose, title = "Share this login with the customer" }: { c: Cred; onClose: () => void; title?: string }) {
  const [copied, setCopied] = useState(false);
  const [mail, setMail] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [mailNote, setMailNote] = useState("");
  const site = typeof window !== "undefined" ? window.location.origin : "";
  const msg = [
    `Hello ${c.name},`,
    `You can see and pay your invoices here: ${site}/payment?tab=invoices`,
    `Login ID: ${c.loginId}`,
    `Password: ${c.password}`,
    `Valid until ${day(c.expiresAt)}.`,
    "- Shree Travels",
  ].join("\n");
  async function copy() { try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the text above can be selected by hand */ } }
  async function email() {
    setMail("sending"); setMailNote("");
    try {
      const res = await fetch("/api/admin/requests/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, password: c.password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "The email could not be sent.");
      setMail("sent"); setMailNote(`Sent to ${data.to}`);
    } catch (e) {
      setMail("error"); setMailNote(e instanceof Error ? e.message : "The email could not be sent.");
    }
  }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-3xl border border-brand-500/50 bg-brand-500/10 p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl">{title}</h3>
        <button onClick={onClose} aria-label="Close" className="btn-ghost !p-2"><X size={16} /></button>
      </div>
      <p className="mt-2 text-sm text-neutral-300">The password is shown only now. We store a scrambled copy, so it cannot be looked up later. You can set a new one any time.</p>
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-ink-900 p-5 font-mono text-sm text-white">{msg}</pre>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={copy} className="btn-primary">{copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copied" : "Copy message"}</button>
        <button onClick={email} disabled={mail === "sending"} className="btn-ghost disabled:opacity-60">
          {mail === "sending" ? <Loader2 className="animate-spin" size={18} /> : mail === "sent" ? <Check size={18} /> : <Mail size={18} />} {mail === "sent" ? "Email sent" : "Send email"}
        </button>
        <a href={waLink(c.phone, msg)} target="_blank" rel="noopener noreferrer" className="btn-ghost"><MessageCircle size={18} /> Send on WhatsApp</a>
      </div>
      <p className="mt-3 text-sm text-neutral-400" aria-live="polite">
        {mailNote ? <span className={mail === "error" ? "text-danger" : ""}>{mailNote}</span> : `Email goes to ${c.email}. ${c.phone ? "WhatsApp opens a chat with the number you entered." : "No WhatsApp number was added, so WhatsApp lets you pick the contact."}`}
      </p>
    </motion.div>
  );
}

function Card({ r, reload }: { r: PayRequest; reload: () => void }) {
  const [busy, setBusy] = useState("");
  const [cred, setCred] = useState<Cred | null>(null);
  const [resetting, setResetting] = useState(false);
  const [custom, setCustom] = useState("");
  const [err, setErr] = useState("");
  const paid = r.invoices.filter((i) => i.status === "PAID");
  const total = r.invoices.reduce((a, i) => a + i.amount, 0) / 100;
  const got = paid.reduce((a, i) => a + i.amount, 0) / 100;
  const expired = new Date(r.expiresAt) < new Date();
  const done = paid.length === r.invoices.length;
  const state = r.revoked ? "Stopped" : done ? "Fully paid" : expired ? "Expired" : "Active";

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action); setErr("");
    try {
      const res = await fetch("/api/admin/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r._id, action, ...extra }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "That did not work.");
      if (action === "reset-password" && data.password) {
        setCred({ id: r._id, name: r.customerName, email: r.customerEmail, phone: r.customerPhone, loginId: r.loginId, password: data.password, expiresAt: r.expiresAt });
        setResetting(false); setCustom("");
      }
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That did not work.");
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
          <p className="text-sm text-neutral-500">{r.customerEmail}{r.customerPhone ? ` · ${r.customerPhone}` : ""} · Login {r.loginId}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${state === "Active" ? "bg-brand-500 text-black" : state === "Fully paid" ? "bg-brand-500/20 text-accent" : "bg-red-500/20 text-danger"}`}>{state}</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-brand-500" initial={{ width: 0 }} animate={{ width: `${total ? (got / total) * 100 : 0}%` }} transition={{ duration: 0.8 }} /></div>
      <p className="mt-2 text-sm text-neutral-400">{inr(got)} paid of {inr(total)} · {paid.length}/{r.invoices.length} invoices · valid until {day(r.expiresAt)}</p>

      <ul className="mt-4 divide-y divide-white/10 text-sm">
        {r.invoices.map((i) => (
          <li key={i.key} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0 text-neutral-300">{i.number} <span className="text-neutral-500">· {day(i.date)}</span>
              <AttachBill requestId={r._id} invoice={i} reload={reload} />
            </span>
            <span className={`shrink-0 ${i.status === "PAID" ? "text-accent" : "text-white"}`}>{inr(i.amount / 100)} {i.status === "PAID" && <Check size={14} className="inline" />}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => act("extend", { days: 7 })} disabled={!!busy} className="btn-ghost !py-2 text-sm">Extend 7 days</button>
        <button onClick={() => setResetting((v) => !v)} disabled={!!busy} className="btn-ghost !py-2 text-sm"><KeyRound size={14} /> New password</button>
        {r.revoked ? <button onClick={() => act("restore")} disabled={!!busy} className="btn-ghost !py-2 text-sm">Restore</button> : <button onClick={() => act("revoke")} disabled={!!busy} className="btn-ghost !py-2 text-sm">Stop access</button>}
        <button onClick={remove} disabled={!!busy} className="btn-ghost !py-2 text-sm text-danger"><Trash2 size={14} /> Delete</button>
      </div>

      <AnimatePresence>
        {resetting && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={(e) => { e.preventDefault(); act("reset-password", { password: custom || undefined }); }} className="mt-4 flex flex-wrap items-center gap-2 overflow-hidden">
            <input aria-label="New password" placeholder="Type a password, or leave empty to generate" autoComplete="off" spellCheck={false} className="field !w-auto min-w-[16rem] flex-1 font-mono" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <button className="btn-primary !py-2.5 text-sm" disabled={!!busy}>{busy === "reset-password" && <Loader2 className="animate-spin" size={14} />} Set password</button>
            <button type="button" onClick={() => { setResetting(false); setCustom(""); }} className="btn-ghost !py-2.5 text-sm">Cancel</button>
          </motion.form>
        )}
      </AnimatePresence>
      {err && <p className="mt-3 text-danger" role="alert">{err}</p>}
      <AnimatePresence>{cred && <div className="mt-4"><Credentials c={cred} title="New password" onClose={() => setCred(null)} /></div>}</AnimatePresence>
    </motion.div>
  );
}

/** Shows the bill attached to an invoice, or lets the owner attach one. */
function AttachBill({ requestId, invoice, reload }: { requestId: string; invoice: PayRequest["invoices"][number]; reload: () => void }) {
  const [picking, setPicking] = useState(false);
  const [err, setErr] = useState("");
  const bills = useRecentBills(picking);
  async function patch(action: "attach-bill" | "detach-bill", billId?: string) {
    setErr("");
    const res = await fetch("/api/admin/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: requestId, action, key: invoice.key, billId }) });
    if (!res.ok) return setErr((await res.json().catch(() => ({}))).error ?? "That did not work.");
    setPicking(false); reload();
  }
  function choose(id: string) {
    const b = bills?.find((x) => x._id === id);
    if (!b) return;
    if (Math.abs((b.totals?.total ?? 0) - invoice.amount / 100) > 0.005 && !confirm(`Bill ${b.billNo} totals ${inr(b.totals?.total ?? 0)}, but this invoice is ${inr(invoice.amount / 100)}. Attach it anyway?`)) return;
    patch("attach-bill", id);
  }
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {invoice.billId ? (
        <>
          <a href={`/api/admin/bills/${invoice.billId}/pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"><FileText size={12} /> Bill attached</a>
          <button type="button" onClick={() => patch("detach-bill")} className="text-neutral-500 hover:text-danger">Remove</button>
        </>
      ) : picking ? (
        <>
          <select aria-label={`Attach a saved bill to invoice ${invoice.number}`} className="field !w-auto !py-1.5 text-xs" defaultValue="" onChange={(e) => choose(e.target.value)}>
            <option value="">{bills ? "Pick a saved bill" : "Loading"}</option>
            {bills?.map((b) => <option key={b._id} value={b._id}>Bill {b.billNo} · {b.customerName} · {inr(b.totals?.total ?? 0)}</option>)}
          </select>
          <button type="button" onClick={() => setPicking(false)} className="text-neutral-500 hover:text-white">Cancel</button>
        </>
      ) : (
        <button type="button" onClick={() => setPicking(true)} className="inline-flex items-center gap-1 text-neutral-500 hover:text-accent"><Paperclip size={12} /> Attach a bill</button>
      )}
      {err && <span className="text-danger" role="alert">{err}</span>}
    </span>
  );
}
