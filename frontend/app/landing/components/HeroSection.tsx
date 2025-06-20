import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const HeroSection = () => {
    return (
        <section id="home" className="pt-32 pb-16 w-full bg-background">
            <div className="container px-4 md:px-8 max-w-3xl mx-auto text-center">
                <div className="inline-block px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium mb-6">
                    100% Gratis & Open Source
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight tracking-tight">
                    Analisis Statistik untuk Semua
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                    Statify menyediakan alternatif non-komersial berbasis web untuk SPSS dengan fitur lengkap untuk analisis, visualisasi, dan interpretasi data statistik Anda.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                    <Link href="/dashboard/" className="w-full sm:w-auto">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 h-14 text-base font-semibold group w-full transition-all duration-200">
                            <span>Mulai Analisis</span>
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                        </Button>
                    </Link>
                    <Button className="bg-background border border-border text-foreground hover:bg-accent px-8 py-6 h-14 text-base font-semibold transition-colors duration-200 w-full sm:w-auto">
                        Lihat Demo
                    </Button>
                </div>
            </div>

            {/* Hero Image */}
            <div className="mt-16 container px-4 sm:px-6 max-w-5xl mx-auto">
                <div className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                        {/* Placeholder untuk screenshot aplikasi */}
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="flex flex-col items-center">
                                <BarChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <div className="text-muted-foreground text-base">Screenshot Dashboard Aplikasi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Simple bar chart icon component
function BarChartIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
        </svg>
    );
}