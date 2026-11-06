import type { Metadata } from "next";
import { Figtree, Geist_Mono, Syne } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Innovation.Energy — solar and energy tools from iCheckEnergy.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: "iCheckEnergy",
  title: {
    default: "iCheckEnergy",
    template: "%s · iCheckEnergy",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "iCheckEnergy",
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${figtree.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <TooltipProvider>
          {children}
          <Toaster richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
