import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SunIcon } from "lucide-react";
import { MapsProvider } from "@/components/maps-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solar Leads POC",
  description: "Enrich leads with Google Solar API building insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-muted/40 antialiased">
        <MapsProvider>
          <TooltipProvider>
            <header className="border-b bg-background">
              <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <SunIcon className="size-5 text-amber-500" />
                  Solar Leads POC
                </Link>
              </div>
            </header>
            <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
            <Toaster richColors />
          </TooltipProvider>
        </MapsProvider>
      </body>
    </html>
  );
}
