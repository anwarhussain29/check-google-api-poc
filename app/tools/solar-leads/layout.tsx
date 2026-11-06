import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapsProvider } from "@/components/maps-provider";

export const metadata: Metadata = {
  title: "Solar Leads",
  description: "Import leads and review Google Solar building insights.",
};

export default function SolarLeadsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MapsProvider>
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/icheck-energy-logo.png"
                alt="iCheckEnergy"
                width={250}
                height={90}
                priority
                className="h-10 w-auto"
              />
              <span className="hidden border-l pl-3 text-sm font-medium tracking-wide text-muted-foreground sm:inline">
                Solar Leads
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </MapsProvider>
  );
}
