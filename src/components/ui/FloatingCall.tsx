import { Phone } from "lucide-react";
import { site } from "@/lib/site";

/** Always-reachable call button with a pulsing ring (shown on all screens, sits above content). */
export default function FloatingCall() {
  return (
    <a
      href={site.phoneHref}
      aria-label={`Call Shree Travels on ${site.phoneShort}`}
      className="group fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full border-2 border-black bg-brand-500 text-black shadow-[0_10px_40px_-6px_rgba(255,107,0,.8)] transition-transform hover:scale-110 sm:bottom-7 sm:right-7"
    >
      <span className="absolute inset-0 rounded-full bg-brand-500 animate-ping2" aria-hidden />
      <Phone size={24} className="relative transition-transform group-hover:rotate-12" />
    </a>
  );
}
