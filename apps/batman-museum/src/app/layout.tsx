import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const rajdhani = Rajdhani({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani"
});

const SITE_URL = "https://museum.batpepe.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Batman Museum",
    template: "%s | Batman Museum"
  },
  description: "An interactive 3D museum of Batman history, 1939 to today",
  openGraph: {
    title: "Batman Museum",
    description:
      "Walk a 3D Batcave archive: 7 eras, 49 real exhibits sourced from Wikipedia, from 1939 to today.",
    url: SITE_URL,
    siteName: "Batman Museum",
    type: "website",
    images: ["/og.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Batman Museum",
    description: "Walk a 3D Batcave archive: 7 eras, 49 real exhibits, 1939 to today.",
    images: ["/og.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${rajdhani.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
