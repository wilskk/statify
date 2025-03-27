import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import ComparisonSection from '@/components/landing/ComparisonSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
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