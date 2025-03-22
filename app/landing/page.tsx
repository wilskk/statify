import HeroSection from '@/components/Landing/HeroSection';
import FeaturesSection from '@/components/Landing/FeaturesSection';
import ComparisonSection from '@/components/Landing/ComparisonSection';
import TestimonialsSection from '@/components/Landing/TestimonialsSection';
import LandingHeader from '@/components/Header/Landing/LandingHeader';
import LandingFooter from '@/components/Footer/Landing/LandingFooter';

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