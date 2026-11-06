import Image from "next/image";

export function LandingHero() {
  return (
    <section className="landing-hero relative isolate flex min-h-[100dvh] items-end overflow-hidden pb-16 pt-24 sm:items-center sm:pb-0 sm:pt-0">
      <div className="landing-hero-atmosphere pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-hero-sun pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-hero-rays pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <div className="landing-fade-up max-w-2xl">
          <Image
            src="/icheck-energy-logo.png"
            alt="iCheckEnergy"
            width={420}
            height={150}
            priority
            className="mb-8 h-14 w-auto sm:h-16 md:h-[4.5rem]"
          />
          <h1 className="font-heading text-4xl leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Energy tools that move work forward
          </h1>
          <p className="landing-fade-up-delay mt-5 max-w-lg text-lg text-foreground/70 sm:text-xl">
            Solar insight, project workflows, and practical utilities from
            Innovation.Energy — in one place.
          </p>
          <div className="landing-fade-up-delay-2 mt-8">
            <a
              href="#tools"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--landing-leaf)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--landing-leaf-deep)]"
            >
              Explore tools
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
