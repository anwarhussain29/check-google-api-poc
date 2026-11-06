import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { isExternalHref, TOOLS } from "@/lib/tools";

export function LandingTools() {
  return (
    <section id="tools" className="scroll-mt-20 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <p className="font-heading text-sm font-semibold tracking-wide text-[var(--landing-leaf-deep)] uppercase">
          Tools
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl tracking-tight text-foreground sm:text-4xl">
          Everything in the iCheckEnergy suite
        </h2>
        <p className="mt-4 max-w-xl text-lg text-foreground/70">
          Open a tool to get started. More links will land here as each product
          ships.
        </p>

        <ul className="mt-12 divide-y divide-foreground/10 border-y border-foreground/10">
          {TOOLS.map((tool) => {
            const external = isExternalHref(tool.href);
            const className =
              "group flex flex-col gap-3 py-6 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-8 hover:bg-[var(--landing-mist)]/80 sm:px-3 sm:-mx-3 sm:rounded-lg";

            const content = (
              <>
                <div className="min-w-0">
                  <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-foreground/65">{tool.description}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--landing-leaf-deep)] group-hover:underline">
                  Open
                  {external ? (
                    <ArrowUpRightIcon className="size-4" aria-hidden />
                  ) : null}
                </span>
              </>
            );

            return (
              <li key={tool.id}>
                {external ? (
                  <a
                    href={tool.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <Link href={tool.href} className={className}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
