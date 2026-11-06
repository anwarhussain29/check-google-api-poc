export function LandingAbout() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-foreground/5 bg-[var(--landing-mist)]">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <p className="font-heading text-sm font-semibold tracking-wide text-[var(--landing-leaf-deep)] uppercase">
          About
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl tracking-tight text-foreground sm:text-4xl">
          Built for solar and energy teams
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/70">
          iCheckEnergy is the tool hub from Innovation.Energy. We build focused
          applications that help teams evaluate solar potential, estimate
          production, and keep project work organized — so you spend less time
          stitching tools together and more time delivering energy projects.
        </p>
      </div>
    </section>
  );
}
