import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberPeace Cafe | Event Pass System",
  description:
    "Admin dashboard, QR pass emails, staff scanner, and entry reports for CyberPeace Cafe events.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
