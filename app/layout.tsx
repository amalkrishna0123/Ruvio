import type { Metadata } from "next";
import "../app/globals.css";

export const metadata: Metadata = {
  title: "WhatsApp",
  description: "A WhatsApp-style messaging application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
