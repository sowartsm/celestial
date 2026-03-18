import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Genshin Registry",
  description: "Traveler UID Lookup",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative z-10">{children}</body>
    </html>
  );
}
