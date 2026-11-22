import Link from "next/link";
import { Home, Phone } from "lucide-react";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="grain relative isolate flex min-h-[70vh] items-center overflow-hidden bg-black py-24">
      <div className="container-page">
        <p className="font-display text-[clamp(7rem,26vw,20rem)] font-extrabold leading-[0.8] text-outline">404</p>
        <svg aria-hidden viewBox="0 0 600 24" className="mt-6 h-6 w-full max-w-xl">
          <line x1="0" y1="12" x2="600" y2="12" stroke="#FF6B00" strokeWidth="3" strokeDasharray="10 14" className="animate-dashflow" />
        </svg>
        <h1 className="mt-8 text-4xl sm:text-6xl">This page took a wrong turn.</h1>
        <p className="mt-4 max-w-md text-lg text-neutral-400">The page you were looking for has moved or does not exist.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn-primary"><Home size={19} /> Back to home</Link>
          <a href={site.phoneHref} className="btn-ghost"><Phone size={19} /> Call {site.phoneShort}</a>
        </div>
      </div>
    </main>
  );
}
