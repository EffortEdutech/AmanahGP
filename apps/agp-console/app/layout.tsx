import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGP Console",
  description: "Platform control plane for Amanah Governance Platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
