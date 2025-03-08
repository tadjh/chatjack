import { pressStart } from "@/lib/fonts";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatJack",
  description: "Chat Plays Blackjack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`dark ${pressStart.variable}`}>{children}</body>
    </html>
  );
}
