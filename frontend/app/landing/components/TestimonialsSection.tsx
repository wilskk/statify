import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

export const TestimonialsSection = () => {
    const testimonials = [
        {
            quote: "Statify sangat membantu penelitian saya. Interfacenya intuitif dan saya bisa mengakses dari mana saja tanpa biaya.",
            name: "Nama Pengguna 1",
            role: "Dosen Statistik"
        },
        {
            quote: "Pendekatan client-side membuat analisis data jauh lebih cepat. Semua proses berjalan di browser saya tanpa lag, bahkan untuk dataset besar.",
            name: "Nama Pengguna 2",
            role: "Peneliti Data"
        },
        {
            quote: "Sebagai mahasiswa, platform ini adalah penyelamat. Semua fitur yang saya butuhkan tersedia secara gratis dan bisa diakses kapan saja.",
            name: "Nama Pengguna 3",
            role: "Mahasiswa Pascasarjana"
        }
    ];

    return (
        <section id="testimonials" className="py-24 w-full bg-background">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Testimoni Pengguna</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-base">
                        Pengalaman pengguna Statify dari berbagai kalangan akademisi dan peneliti.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card
                            key={index}
                            className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col"
                        >
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="mb-4">
                                    <Quote className="h-8 w-8 text-foreground opacity-20" />
                                </div>
                                <blockquote className="text-muted-foreground text-base mb-6 flex-grow">
                                    {testimonial.quote}
                                </blockquote>
                                <div className="pt-4 border-t border-border">
                                    <div className="font-semibold text-card-foreground text-base">{testimonial.name}</div>
                                    <div className="text-muted-foreground text-sm mt-1">{testimonial.role}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}