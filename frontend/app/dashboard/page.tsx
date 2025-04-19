// app/dashboard/page.tsx
import Link from 'next/link';
import { FolderOpen, FilePlus, Upload, Database, History, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardLanding() {
    const dataActions = [
        {
            icon: <FilePlus className="h-12 w-12 text-black" />,
            title: 'Proyek Baru',
            description: 'Mulai proyek analisis data baru dari awal',
            link: '/data/new',
            primary: true
        },
        {
            icon: <FolderOpen className="h-12 w-12 text-black" />,
            title: 'Buka Proyek',
            description: 'Lanjutkan proyek analisis yang sudah ada',
            link: '/data/open',
            primary: false
        },
        {
            icon: <Upload className="h-12 w-12 text-black" />,
            title: 'Impor Data',
            description: 'Impor data dari CSV, Excel, atau format lainnya',
            link: '/data/import',
            primary: false
        }
    ];

    const recentProjects = [
        {
            title: 'Analisis Regresi Q4 2024',
            date: '27 Mar 2025',
            description: 'Analisis regresi linier untuk data penjualan kuartal 4',
            link: '/project/1'
        },
        {
            title: 'Uji T Sampel Independen',
            date: '24 Mar 2025',
            description: 'Perbandingan dua kelompok sampel independen',
            link: '/project/2'
        },
        {
            title: 'ANOVA Faktor Tunggal',
            date: '20 Mar 2025',
            description: 'Analisis varians untuk 3 kelompok perlakuan',
            link: '/project/3'
        }
    ];

    const resources = [
        {
            icon: <Database className="h-6 w-6 text-black" />,
            title: 'Dataset Contoh',
            description: 'Akses berbagai dataset untuk latihan',
            link: '/resources/datasets'
        },
        {
            icon: <BookOpen className="h-6 w-6 text-black" />,
            title: 'Tutorial Analisis',
            description: 'Panduan lengkap untuk berbagai metode statistik',
            link: '/resources/tutorials'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7F7F7]">
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="mb-12">
                    <h1 className="text-3xl font-semibold text-black mb-2">Dashboard Statify</h1>
                    <p className="text-[#444444]">Mulai analisis statistik atau lanjutkan proyek yang sudah ada</p>
                </div>

                {/* Data Action Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {dataActions.map((action, index) => (
                        <Link href={action.link} key={index} className="block h-full">
                            <Card className={`h-full border border-[#E6E6E6] shadow-sm hover:shadow-md transition-all duration-200 ${
                                action.primary ? 'bg-black text-white' : 'bg-white text-black'
                            }`}>
                                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                                    <div className={`p-4 rounded-full mb-4 ${
                                        action.primary ? 'bg-white/10' : 'bg-[#F7F7F7]'
                                    }`}>
                                        {action.icon}
                                    </div>
                                    <CardTitle className={`text-xl font-semibold mb-2 ${
                                        action.primary ? 'text-white' : 'text-black'
                                    }`}>
                                        {action.title}
                                    </CardTitle>
                                    <CardDescription className={
                                        action.primary ? 'text-white/80' : 'text-[#444444]'
                                    }>
                                        {action.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Recent Projects Section */}
                    <div className="md:col-span-2">
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-black flex items-center">
                                <History className="h-5 w-5 mr-2" />
                                Proyek Terbaru
                            </h2>
                            <Link href="/data/projects">
                                <Button variant="outline" className="text-xs h-8 px-3 bg-white border border-[#E6E6E6] text-black hover:bg-[#F7F7F7]">
                                    Lihat Semua
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {recentProjects.map((project, index) => (
                                <Link href={project.link} key={index} className="block">
                                    <Card className="bg-white border border-[#E6E6E6] shadow-sm hover:shadow-md transition-all duration-200">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium text-black">{project.title}</h3>
                                                    <p className="text-sm text-[#444444] mt-1">{project.description}</p>
                                                </div>
                                                <div className="text-xs text-[#888888]">{project.date}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-black">Sumber Daya</h2>
                        </div>

                        <div className="space-y-4">
                            {resources.map((resource, index) => (
                                <Link href={resource.link} key={index} className="block">
                                    <Card className="bg-white border border-[#E6E6E6] shadow-sm hover:shadow-md transition-all duration-200">
                                        <CardContent className="p-4">
                                            <div className="flex items-center">
                                                <div className="mr-4 p-2 bg-[#F7F7F7] rounded-full">
                                                    {resource.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-black">{resource.title}</h3>
                                                    <p className="text-sm text-[#444444]">{resource.description}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}