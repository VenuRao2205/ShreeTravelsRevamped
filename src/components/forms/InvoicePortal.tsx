"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, LockKeyhole, LogOut, QrCode } from "lucide-react";
import { QrPanel, type QrState } from "@/components/forms/PaymentForm";

type Invoice = { key: string; number: string; date: string; amount: number; status: "UNPAID" | "PAID" };
type Me = { name: string; expiresAt: string; invoices: Invoice[] };

const inr = (n: number) => `Rs ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function InvoicePortal() {
  const [me, setMe] = useState<Me | null>(null);
  const [checking, setChecking] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/me", { cache: "no-store" });
      setMe(res.ok ? await res.json() : null);
    } catch {
      setMe(null);
    }
    setChecking(false);
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (checking) return <p className="rounded-3xl border border-white/10 bg-ink-900 p-9 text-center text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>;
  if (!me) return <Login onDone={load} />;
  return <Invoices me={me} reload={load} onSignOut={() => setMe(null)} />;
}

function Login({ onDone }: { onDone: () => void }) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/portal/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loginId, password }) });
      if (res.ok) return onDone();
      setErr((await res.json().catch(() => ({}))).error ?? "We could not sign you in.");
    } catch {
      setErr("We could not sign you in. Please check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-9">
      <p className="text-neutral-400">Enter the login ID and password we sent you to see and pay your invoices together.</p>
      <div>
        <label htmlFor="lid" className="field-label">Login ID</label>
        <input id="lid" className="field font-mono uppercase tracking-widest" autoComplete="username" autoCapitalize="characters" spellCheck={false} value={loginId} onChange={(e) => setLoginId(e.target.value)} />
      </div>
      <div>
        <label htmlFor="lpw" className="field-label">Password</label>
        <input id="lpw" type="password" className="field font-mono uppercase tracking-widest" autoComplete="current-password" spellCheck={false} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {err && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-danger" role="alert">{err}</p>}
      <button className="btn-primary w-full text-lg disabled:opacity-60" disabled={busy || !loginId || !password}>
        {busy ? <Loader2 className="animate-spin" size={20} /> : <LockKeyhole size={20} />} Show my invoices
      </button>
      <p className="text-center text-sm text-neutral-500">No login yet? Ask us on +91 98222 36802 and we will send one.</p>
    </form>
  );
}

function Invoices({ me, reload, onSignOut }: { me: Me; reload: () => void; onSignOut: () => void }) {
  const unpaid = useMemo(() => me.invoices.filter((i) => i.status === "UNPAID"), [me]);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(unpaid.map((i) => i.key)));
  const [busy, setBusy] = useState<"" | "page" | "qr">("");
  const [error, setError] = useState("");
  const [qr, setQr] = useState<QrState | null>(null);

  const total = unpaid.filter((i) => picked.has(i.key)).reduce((a, i) => a + i.amount, 0);
  const toggle = (k: string) => setPicked((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const allOn = unpaid.length > 0 && unpaid.every((i) => picked.has(i.key));

  async function pay(mode: "page" | "qr") {
    setBusy(mode); setError("");
    try {
      const res = await fetch("/api/portal/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keys: [...picked], mode }) });
      const data = await res.json();
      if (res.status === 401) return onSignOut();
      if (!res.ok) throw new Error(data.error ?? "We could not start the payment.");
      if (mode === "qr") {
        if (!data.qrData) throw new Error("We could not create the QR code.");
        const nums = unpaid.filter((i) => picked.has(i.key)).map((i) => i.number).join(", ");
        return setQr({ orderId: data.orderId, qrData: data.qrData, amount: total, invoice: nums });
      }
      window.location.assign(data.redirectUrl);
      return; // leave the button busy while the browser moves to PhonePe
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not start the payment. Please try again.");
    }
    setBusy("");
  }

  async function signOut() { await fetch("/api/portal/logout", { method: "POST" }); onSignOut(); }

  if (qr) return <QrPanel qr={qr} onBack={() => setQr(null)} onDone={() => { setQr(null); reload(); }} />;

  return (
    <div className="rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl">Hello, {me.name}</h2>
          <p className="mt-1 text-sm text-neutral-500">This login works until {day(me.expiresAt)}.</p>
        </div>
        <button onClick={signOut} className="btn-ghost !py-2"><LogOut size={16} /> Sign out</button>
      </div>

      {unpaid.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-brand-500/40 bg-brand-500/10 p-6 text-center text-lg">All your invoices are paid. Thank you!</p>
      ) : (
        <div className="mt-7 flex items-center justify-between border-b border-white/10 pb-3 text-sm">
          <label className="flex cursor-pointer items-center gap-3 text-neutral-300">
            <input type="checkbox" className="h-5 w-5 accent-[#FF6B00]" checked={allOn} onChange={() => setPicked(allOn ? new Set() : new Set(unpaid.map((i) => i.key)))} />
            Select all
          </label>
          <span className="text-neutral-500">{unpaid.length} to pay</span>
        </div>
      )}

      <ul className="divide-y divide-white/10">
        {me.invoices.map((i, k) => {
          const paid = i.status === "PAID";
          return (
            <motion.li key={i.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.04 }}>
              <label className={`flex items-center gap-4 py-4 ${paid ? "opacity-60" : "cursor-pointer"}`}>
                {paid
                  ? <span className="grid h-5 w-5 place-items-center rounded bg-brand-500 text-black"><Check size={14} strokeWidth={3} /></span>
                  : <input type="checkbox" className="h-5 w-5 accent-[#FF6B00]" checked={picked.has(i.key)} onChange={() => toggle(i.key)} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-white">Invoice {i.number}</span>
                  <span className="block text-sm text-neutral-500">{day(i.date)}</span>
                </span>
                {paid ? <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-black">Paid</span> : <span className="font-display text-lg font-bold text-white">{inr(i.amount)}</span>}
              </label>
            </motion.li>
          );
        })}
      </ul>

      {unpaid.length > 0 && (
        <>
          <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-ink-800 p-5">
            <span className="text-neutral-400">Total to pay</span>
            <AnimatePresence mode="popLayout"><motion.span key={total} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-3xl font-bold text-white">{inr(total)}</motion.span></AnimatePresence>
          </div>
          {error && <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-danger" role="alert">{error}</p>}
          <div className="mt-5 space-y-3">
            <button onClick={() => pay("page")} disabled={!total || !!busy} className="btn-primary w-full text-lg disabled:opacity-60">
              {busy === "page" ? <Loader2 className="animate-spin" size={20} /> : <LockKeyhole size={20} />} {busy === "page" ? "Opening PhonePe" : `Pay ${inr(total)} with PhonePe`}
            </button>
            <button onClick={() => pay("qr")} disabled={!total || !!busy} className="btn-ghost w-full text-lg disabled:opacity-60">
              {busy === "qr" ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />} Pay by scanning a QR code
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-neutral-500">We never see your card or UPI details.</p>
        </>
      )}
    </div>
  );
}
