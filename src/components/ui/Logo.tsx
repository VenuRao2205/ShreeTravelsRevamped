import Image from "next/image";

/**
 * Logo lockup: the Ganesha "Shree" glyph sits in an orbiting ring, next to the
 * script wordmark. The wordmark is rendered as a mask so a light sweep can run
 * through it in the brand orange.
 */
export default function Logo({ size = 44, tagline = false }: { size?: number; tagline?: boolean }) {
  const wmH = Math.round(size * 0.74);
  const wmW = Math.round(wmH * (1533 / 240));
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 animate-orbit" aria-hidden>
          <circle cx="50" cy="50" r="47" fill="none" stroke="#FF6B00" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-[7%] rounded-full bg-ink-800 ring-1 ring-brand-500/50" />
        <Image
          src="/brand/mark-orange.png"
          alt=""
          width={198}
          height={276}
          className="relative"
          style={{ height: size * 0.56, width: "auto" }}
        />
      </span>
      <span className="flex flex-col">
        <span
          role="img"
          aria-label="Shree Travels"
          className="logo-shimmer block"
          style={{
            width: wmW,
            height: wmH,
            WebkitMask: "url(/brand/wordmark-orange.png) left center / contain no-repeat",
            mask: "url(/brand/wordmark-orange.png) left center / contain no-repeat",
          }}
        />
        {tagline && (
          <span className="mt-1 text-xs font-medium tracking-wide text-neutral-400">
            Trusted in Nagpur since 1994
          </span>
        )}
      </span>
    </span>
  );
}
