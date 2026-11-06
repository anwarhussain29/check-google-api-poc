import { LandingAbout } from "@/components/landing/about";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/nav";
import { LandingTools } from "@/components/landing/tools";

export default function HomePage() {
  return (
    <div className="landing-page bg-background text-foreground">
      <LandingNav />
      <LandingHero />
      <LandingAbout />
      <LandingTools />
      <LandingFooter />
    </div>
  );
}
