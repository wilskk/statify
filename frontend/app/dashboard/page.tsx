"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, FilePlus, Database } from 'lucide-react';
import { useMetaStore } from '@/stores/useMetaStore';
import { useModal, ModalType } from '@/hooks/useModal';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { DashboardLandingSkeleton } from '@/components/ui/Skeletons';
import { ExampleDatasetModal } from '@/components/pages/dashboard/landing/ExampleDatasetModal';
import { DashboardLanding, ResourceItem, DataAction } from '@/components/pages/dashboard/landing/DashboardLanding';

export default function DashboardPage() {
    const router = useRouter();
    const { meta, isLoading: metaIsLoading, isLoaded: metaIsLoaded, setMeta } = useMetaStore();
    const { openModal } = useModal();
    const { resetData } = useDataStore();
    const { resetVariables } = useVariableStore();
    const [isExampleDatasetModalOpen, setIsExampleDatasetModalOpen] = useState(false);

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

    const dataActions: DataAction[] = [
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
            action: () => setIsExampleDatasetModalOpen(true),
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
        <>
            <DashboardLanding dataActions={dataActions} resources={resources} />
            <ExampleDatasetModal 
                isOpen={isExampleDatasetModalOpen}
                onClose={() => setIsExampleDatasetModalOpen(false)}
            />
        </>
    );
}