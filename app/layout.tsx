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
  title: "FITPEAK - Community",
  description:
    "Join the FITPEAK fitness community. Train harder, achieve more.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
