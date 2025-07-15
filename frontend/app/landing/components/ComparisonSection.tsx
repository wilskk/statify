import { Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const ComparisonSection = () => {
    const statifyFeatures = [
        "100% Gratis untuk digunakan",
        "Open Source - dapat dikustomisasi",
        "Akses dari browser mana saja",
        "Update otomatis tanpa instalasi",
        "Komputasi client-side tanpa server",
        "Fokus pada privasi data pengguna",
        "Antarmuka minimalis yang intuitif"
    ];

    const spssFeatures = [
        "Biaya lisensi tahunan yang mahal",
        "Kode tertutup - tidak dapat dimodifikasi",
        "Memerlukan instalasi pada komputer",
        "Update manual dengan biaya tambahan",
        "Penyimpanan lokal terbatas",
        "Kolaborasi terbatas",
        "Dukungan teknis terbatas"
    ];

    return (
        <section id="comparison" className="py-16 bg-background">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Perbandingan dengan SPSS Komersial</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-base">
                        Lihat bagaimana Statify menjadi alternatif yang kuat dengan biaya nol.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="pb-4 border-b border-border">
                            <CardTitle className="text-xl font-semibold text-card-foreground">Statify</CardTitle>
                            <CardDescription className="text-muted-foreground text-base mt-1">
                                Alternatif Non-Komersial Berbasis Web
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ul className="space-y-4">
                                {statifyFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-start text-base">
                                        <div className="flex-shrink-0 mt-0.5 bg-accent p-1 rounded-full mr-3">
                                            <Check className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="pb-4 border-b border-border">
                            <CardTitle className="text-xl font-semibold text-card-foreground">SPSS Komersial</CardTitle>
                            <CardDescription className="text-muted-foreground text-base mt-1">
                                Solusi Berbayar Desktop
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ul className="space-y-4">
                                {spssFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-start text-base">
                                        <div className="flex-shrink-0 mt-0.5 bg-accent p-1 rounded-full mr-3">
                                            {index === 6 ? (
                                                <Check className="h-4 w-4 text-primary" />
                                            ) : (
                                                <X className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}