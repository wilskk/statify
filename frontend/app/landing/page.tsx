// app/landing/page.tsx
import {
    HeroSection,
    FeaturesSection,
    ComparisonSection,
    TestimonialsSection
} from '@/app/landing/components';
import LandingHeader from '@/app/landing/components/layout/LandingHeader';
import LandingFooter from '@/app/landing/components/layout/LandingFooter';

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