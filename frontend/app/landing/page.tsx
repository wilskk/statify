// app/landing/page.tsx
import HeroSection from '@/components/pages/landing/HeroSection';
import FeaturesSection from '@/components/pages/landing/FeaturesSection';
import ComparisonSection from '@/components/pages/landing/ComparisonSection';
import TestimonialsSection from '@/components/pages/landing/TestimonialsSection';
import LandingHeader from '@/components/layout/landing/LandingHeader';
import LandingFooter from '@/components/layout/landing/LandingFooter';

export default function LandingPage() {
    return (
        <>
            <LandingHeader />
            <main>
                <HeroSection />
                <FeaturesSection />
                <ComparisonSection />
                <TestimonialsSection />
            </main>
            <LandingFooter />
        </>
    );
}