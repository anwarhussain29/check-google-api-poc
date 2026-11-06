import Image from "next/image";
import Link from "next/link";

export function LandingNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/icheck-energy-logo.png"
            alt="iCheckEnergy"
            width={250}
            height={90}
            priority
            className="h-9 w-auto sm:h-10"
          />
          <span className="hidden border-l border-foreground/15 pl-3 text-sm font-medium tracking-wide text-foreground/70 sm:inline">
            Innovation.Energy
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-foreground/75">
          <a href="#about" className="transition-colors hover:text-foreground">
            About
          </a>
          <a href="#tools" className="transition-colors hover:text-foreground">
            Tools
          </a>
        </nav>
      </div>
    </header>
  );
}
