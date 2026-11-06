import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/tools";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-foreground/10 bg-[var(--landing-deep)] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/icheck-energy-logo.png"
              alt="iCheckEnergy"
              width={200}
              height={72}
              className="h-9 w-auto brightness-0 invert"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Innovation.Energy — practical tools for solar and energy teams.
          </p>
        </div>
        <div className="text-sm text-white/70 sm:text-right">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-white transition hover:text-[var(--landing-sun)]"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-2">© {year} iCheckEnergy</p>
        </div>
      </div>
    </footer>
  );
}
