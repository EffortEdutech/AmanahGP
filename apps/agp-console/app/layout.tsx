import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGP Console",
  description: "Amanah Governance Platform Console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
