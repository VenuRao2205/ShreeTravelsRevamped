import type { Config } from "tailwindcss";

// Palette: pure black base, the logo's orange as the single hot colour,
// amber only as the top of orange gradients (matches the logo's own gradient).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF4EB",
          100: "#FFE3CC",
          200: "#FFC799",
          300: "#FFA25C",
          400: "#FF8426",
          500: "#FF6B00",
          600: "#E55A00",
          700: "#B84500",
          800: "#8A3400",
          900: "#5C2300",
        },
        amber: { glow: "#FFB020" },
        // Theme colours live in CSS variables (see globals.css: light by default, .dark for black).
        // Higher ink number = more raised (page < alt section < card < input).
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
        },
        // `white` is the main text/border colour (dark ink on light, white on black).
        // Use text-[#fff] where genuinely white text is needed (on photos, red).
        white: "rgb(var(--fg) / <alpha-value>)",
        neutral: {
          50: "#F7F7F8", 100: "#EEEFF1",
          200: "rgb(var(--n200) / <alpha-value>)", 300: "rgb(var(--n300) / <alpha-value>)",
          400: "rgb(var(--n400) / <alpha-value>)", 500: "rgb(var(--n500) / <alpha-value>)",
          600: "rgb(var(--n600) / <alpha-value>)", 700: "rgb(var(--n700) / <alpha-value>)",
          800: "rgb(var(--n800) / <alpha-value>)", 900: "rgb(var(--n900) / <alpha-value>)",
        },
        accent: "rgb(var(--accent) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        tint: "rgb(var(--tint) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: { to: { transform: "translateX(-50%)" } },
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        ping2: { "0%": { transform: "scale(1)", opacity: ".7" }, "100%": { transform: "scale(2.6)", opacity: "0" } },
        orbit: { to: { transform: "rotate(360deg)" } },
        dashflow: { to: { strokeDashoffset: "-48" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        shimmer: "shimmer 5s linear infinite",
        ping2: "ping2 2.4s cubic-bezier(0,0,.2,1) infinite",
        orbit: "orbit 14s linear infinite",
        dashflow: "dashflow 2.4s linear infinite",
        floaty: "floaty 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
