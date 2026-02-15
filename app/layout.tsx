import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./fallback.css";
import Providers from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "FITPEAK | 日本最大級の合トレ募集・筋トレ記録共有アプリ",
    template: "%s | FITPEAK",
  },
  description:
    "トレーニーのための筋トレコミュニティ【合トレ募集・筋トレ仲間探し、筋トレ情報交換】",
  metadataBase: new URL("https://fitpeak.jp"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
        style={{
          backgroundColor: "#ffffff",
          color: "#171717",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
