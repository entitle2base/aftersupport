import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "動画編集CHANCE | 会員サイト",
  description: "動画編集スクール卒業生のためのアフターサポートサイト",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${geist.className} min-h-full`}>{children}</body>
    </html>
  );
}
