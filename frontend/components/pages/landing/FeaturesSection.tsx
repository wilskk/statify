import { BarChart2, Database, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeaturesSection() {
    const features = [
        {
            icon: <BarChart2 className="h-10 w-10 text-black" />,
            title: 'Analisis Statistik Real-time',
            description: 'Berbagai metode statistik deskriptif dan inferensial dengan hasil analisis instan tanpa perlu menunggu.'
        },
        {
            icon: <Database className="h-10 w-10 text-black" />,
            title: 'Komputasi Client-side',
            description: 'Proses data secara lokal di browser tanpa mengirim ke server, menjamin privasi data Anda dan penggunaan tanpa koneksi internet.'
        },
        {
            icon: <BookOpen className="h-10 w-10 text-black" />,
            title: 'Laporan dan Visualisasi Interaktif',
            description: 'Buat visualisasi data interaktif dan laporan yang bisa diunduh dalam format PDF dengan tampilan profesional.'
        }
    ];

    return (
        <section id="features" className="py-16 bg-[#F7F7F7]">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-semibold text-black mb-4">Fitur Utama</h2>
                    <p className="text-[#444444] max-w-2xl mx-auto text-base">
                        Solusi lengkap untuk kebutuhan analisis data statistik Anda dengan antarmuka web yang intuitif.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className="bg-white border border-[#E6E6E6] shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col"
                        >
                            <CardHeader className="pb-2 flex flex-col items-center text-center">
                                <div className="mb-4 p-4 bg-[#F7F7F7] rounded-full">
                                    {feature.icon}
                                </div>
                                <CardTitle className="text-lg font-medium text-black">
                                    {feature.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-center">
                                <p className="text-[#444444] text-base text-center">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}