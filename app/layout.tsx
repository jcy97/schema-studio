import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NextAuthSessionProvider from "@/components/providers/NextAuthSessionProvder";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Schema Studio",
  description: "Create your Database Schema!",
};

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.variable} antialiased`}>
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
