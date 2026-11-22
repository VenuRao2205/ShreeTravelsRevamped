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
        // Light grey surfaces. Higher number = more raised (page < alt section < card < input).
        ink: { DEFAULT: "#F0F1F3", 900: "#F8F9FA", 800: "#FFFFFF", 700: "#FFFFFF", 600: "#E1E4E8" },
        // `white` is the main text/border colour on the light theme, so text-white and border-white/10
        // read as dark ink. Use text-[#fff] where genuinely white text is needed (on photos, red).
        white: "#16181B",
        neutral: { 50: "#F7F7F8", 100: "#EEEFF1", 200: "#2B2E33", 300: "#3A3E44", 400: "#4F545B", 500: "#656A72", 600: "#8A8F97", 700: "#B0B4BA", 800: "#D0D3D8", 900: "#16181B" },
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
