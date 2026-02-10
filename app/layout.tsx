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
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
        style={{
          backgroundColor: "#050505",
          color: "#ededed",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
