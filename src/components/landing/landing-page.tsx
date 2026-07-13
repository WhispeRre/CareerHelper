import { LandingHeader } from './landing-header';
import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { TemplateShowcaseSection } from './template-showcase-section';
import { MockInterviewSection } from './mock-interview-section';
import { StatsSection } from './stats-section';
import { CTASection } from './cta-section';
import { LandingFooter } from './landing-footer';
import FadeContent from './fade-content';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingHeader />
      <main>
        <HeroSection />
        <FadeContent blur duration={900} ease="power2.out" threshold={0.18} className="relative">
          <FeaturesSection />
        </FadeContent>
        <FadeContent blur duration={900} ease="power2.out" threshold={0.18} className="relative">
          <TemplateShowcaseSection />
        </FadeContent>
        <FadeContent blur duration={900} ease="power2.out" threshold={0.18} className="relative">
          <MockInterviewSection />
        </FadeContent>
        <FadeContent blur duration={850} ease="power2.out" threshold={0.2} className="relative">
          <StatsSection />
        </FadeContent>
        <FadeContent blur duration={900} ease="power2.out" threshold={0.2} className="relative">
          <CTASection />
        </FadeContent>
      </main>
      <LandingFooter />
    </div>
  );
}
