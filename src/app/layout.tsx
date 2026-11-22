import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});
const playfair = localFont({
  src: "./fonts/playfair-display-latin-wght-normal.woff2",
  variable: "--font-playfair",
  weight: "400 900",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://shreetravelsnagpur.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shree Travels Nagpur | Corporate Car Rental & Employee Transport",
    template: "%s | Shree Travels Nagpur",
  },
  description:
    "Nagpur's trusted corporate car rental service for 30+ years. Airport transfers, employee transportation, executive travel and event transport with professional chauffeurs.",
  openGraph: {
    type: "website",
    siteName: "Shree Travels Nagpur",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased text-primary-900 bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
