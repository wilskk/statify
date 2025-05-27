"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderOpen, FilePlus, Database, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMetaStore } from '@/stores/useMetaStore';
import { useModal, ModalType } from '@/hooks/useModal';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { DashboardLandingSkeleton } from '@/components/ui/Skeletons';
import { ExampleDatasetModal } from '@/components/Modals/ExampleDatasetModal';

interface ResourceItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    link?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { meta, isLoading: metaIsLoading, isLoaded: metaIsLoaded, setMeta } = useMetaStore();
    const { openModal } = useModal();
    const { resetData } = useDataStore();
    const { resetVariables } = useVariableStore();

    useEffect(() => {
        if (metaIsLoaded && meta.name) {
            console.log("Navigating to /dashboard/data because project is active:", meta.name);
            router.push('/dashboard/data');
        }
    }, [metaIsLoaded, meta.name, router]);

    const handleOpenProject = () => {
        openModal(ModalType.OpenData);
    };

    const handleNewProject = async () => {
        await resetData();
        await resetVariables();
        await setMeta({ name: 'Proyek Baru', location: '', created: new Date() });
    };

    const dataActions = [
        {
            id: 'new',
            icon: <FilePlus className="h-12 w-12 text-primary" />,
            title: 'Proyek Baru',
            description: 'Mulai proyek analisis data baru dari awal',
            action: handleNewProject,
            primary: true
        },
        {
            id: 'open',
            icon: <FolderOpen className="h-12 w-12 text-primary" />,
            title: 'Buka Proyek',
            description: 'Buka file data SPSS (.sav)',
            action: handleOpenProject,
            primary: false
        },
        {
            id: 'example',
            icon: <Database className="h-12 w-12 text-primary" />,
            title: 'Dataset Contoh',
            description: 'Akses berbagai dataset untuk latihan',
            action: () => openModal(ModalType.ExampleDataset),
            primary: false
        }
    ];

    if (metaIsLoading || !metaIsLoaded) {
        return <DashboardLandingSkeleton />;
    }

    if (meta.name) {
        return <DashboardLandingSkeleton />;
        // return null;
    }

    const resources: ResourceItem[] = [
        /*
        {
            icon: <BookOpen className="h-6 w-6 text-black" />,
            title: 'Tutorial Analisis',
            description: 'Panduan lengkap untuk berbagai metode statistik',
            link: '/resources/tutorials'
        }
        */
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="mb-12">
                <h1 className="text-3xl font-semibold text-foreground mb-2">Selamat Datang di Statify</h1>
                <p className="text-muted-foreground">Mulai analisis statistik atau buka proyek yang sudah ada.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
                {dataActions.map((action) => (
                    <Card
                        key={action.id}
                        onClick={action.action}
                        className={`h-full border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                            action.primary ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'
                        }`}
                    >
                        <CardContent className="p-6 flex flex-col items-center text-center h-full">
                            <div className={`p-4 rounded-full mb-4 ${
                                action.primary ? 'bg-primary-foreground/10' : 'bg-muted'
                            }`}>
                                {action.icon}
                            </div>
                            <CardTitle className={`text-xl font-semibold mb-2 ${
                                action.primary ? 'text-primary-foreground' : 'text-card-foreground'
                            }`}>
                                {action.title}
                            </CardTitle>
                            <CardDescription className={
                                action.primary ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }>
                                {action.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Sumber Daya</h2>
                </div>
                <div className="space-y-4">
                    {resources.map((resource, index) => {
                        /*
                        if ('link' in resource && resource.link) {
                            return (
                                <Link href={resource.link} key={index} className="block">
                                    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-200">
                                        <CardContent className="p-4">
                                            <div className="flex items-center">
                                                <div className="mr-4 p-2 bg-muted rounded-full">
                                                    {resource.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-card-foreground">{resource.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        }
                        return null;
                        */
                        return null;
                    })}
                </div>
            </div>
            <ExampleDatasetModal />
        </div>
    );
}