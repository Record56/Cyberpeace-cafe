import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "CyberPeace Cafe | Event Pass System",
  description:
    "Admin dashboard, QR pass emails, staff scanner, and entry reports for CyberPeace Cafe events.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/cyberpeace-cafe-logo.jpg", type: "image/jpeg" },
    ],
    apple: [{ url: "/cyberpeace-cafe-logo.jpg", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${orbitron.variable} ${rajdhani.variable}`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
