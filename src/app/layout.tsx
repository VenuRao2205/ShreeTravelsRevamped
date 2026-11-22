import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingCall from "@/components/ui/FloatingCall";
import { ScrollProgress } from "@/components/ui/motion";
import { site } from "@/lib/site";

const display = localFont({
  src: "./fonts/bricolage-grotesque-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "200 800",
  display: "swap",
});
const body = localFont({
  src: "./fonts/instrument-sans-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "400 700",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#FFFFFF" };

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  alternates: { canonical: "./" },
  title: {
    default: "Shree Travels Nagpur | Corporate Car Rental & Employee Transport",
    template: "%s | Shree Travels Nagpur",
  },
  description:
    "Trusted corporate car rental in Nagpur since 1994. Airport transfers, employee transportation, executive travel and event cars.",
  openGraph: { type: "website", siteName: "Shree Travels", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoRental",
  name: site.name,
  url: site.url,
  telephone: site.phone,
  email: site.email,
  foundingDate: String(site.since),
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plot No. 1066, Near Law College Square, Gorepeth",
    addressLocality: "Nagpur",
    addressRegion: "Maharashtra",
    postalCode: "440010",
    addressCountry: "IN",
  },
  areaServed: "Nagpur",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <MotionConfig reducedMotion="user">
          <ScrollProgress />
          <Navbar />
          {children}
          <Footer />
          <FloatingCall />
        </MotionConfig>
      </body>
    </html>
  );
}
