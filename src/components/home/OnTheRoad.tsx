"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Fade, MaskLine } from "@/components/ui/motion";

const clips = [
  { src: "/videos/convoy.mp4", poster: "/videos/convoy.jpg", title: "Moving together", label: "A convoy of our cars on the road" },
];

/** Silent clip that plays while it is on screen and pauses when it is not. Tap to pause or play. */
function Clip({ src, poster, title, label }: (typeof clips)[number]) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const manual = useRef(false); // the visitor chose to pause, so scrolling must not restart it

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !reduce && !manual.current) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { manual.current = false; v.play().catch(() => {}); }
    else { manual.current = true; v.pause(); }
  }

  return (
    <figure className="mx-auto w-full max-w-[19rem]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-white/10 bg-ink-800 shadow-xl">
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={`${playing ? "Pause" : "Play"} video: ${title}`}
          className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-black/60 text-[#fff] backdrop-blur transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
      </div>
      <figcaption className="mt-4 text-center font-display text-xl font-bold">{title}</figcaption>
    </figure>
  );
}

export default function OnTheRoad() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container-page grid items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div className="max-w-md">
          <h2 className="text-[clamp(2.4rem,5.5vw,4.5rem)]">
            <MaskLine>Our cars,</MaskLine>
            <MaskLine delay={0.1}>on the road.</MaskLine>
          </h2>
          <Fade delay={0.2}>
            <p className="mt-5 text-lg text-neutral-400">Clean, well kept cars and drivers who turn up on time. Here is a look at our fleet at work in Nagpur.</p>
          </Fade>
        </div>
        {clips.map((c) => (
          <Fade key={c.src}><Clip {...c} /></Fade>
        ))}
      </div>
    </section>
  );
}
