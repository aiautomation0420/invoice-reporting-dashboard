import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Invoice Reporting Dashboard", template: "%s · Invoice Reporting Dashboard" },
  description: "Live reporting for the AI Invoice Processing & Audit Agent: volumes, flags, amounts and hours saved.",
  icons: { icon: "/icon.svg" }, // in public/: app/icon.svg breaks the build when the folder path has an apostrophe
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions add attributes to <html>/<body> before React loads.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans" suppressHydrationWarning>
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
