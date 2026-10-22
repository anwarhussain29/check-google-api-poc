export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return new URL(`https://${production}`);

  const vercel = process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);

  return new URL("http://localhost:3000");
}
