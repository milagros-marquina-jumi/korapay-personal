import type { Metadata } from 'next';
import { HeroSection } from '@/components/landing/hero-section';
import { LandingFooter, LandingNav } from '@/components/landing/landing-chrome';
import { LandingSections } from '@/components/landing/landing-sections';
import { MarqueeStrip } from '@/components/landing/marquee-strip';
import { SpotlightSection } from '@/components/landing/spotlight-section';
import { StorySection } from '@/components/landing/story-section';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <MarqueeStrip />
        <StorySection />
        <SpotlightSection />
        <LandingSections />
      </main>
      <LandingFooter />
    </div>
  );
}
