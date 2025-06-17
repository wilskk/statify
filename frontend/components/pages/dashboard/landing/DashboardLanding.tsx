"use client";

import React from 'react';
import { DataAction, ResourceItem } from './types';
import { DataActionCard } from './DataActionCard';
import { ResourceCard } from './ResourceCard';

export * from './types';

interface DashboardLandingProps {
    dataActions: DataAction[];
    resources: ResourceItem[];
}

export const DashboardLanding: React.FC<DashboardLandingProps> = ({ dataActions, resources }) => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="mb-12">
                <h1 className="text-3xl font-semibold text-foreground mb-2">Selamat Datang di Statify</h1>
                <p className="text-muted-foreground">Mulai analisis statistik atau buka proyek yang sudah ada.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
                {dataActions.map((action) => (
                    <DataActionCard key={action.id} action={action} />
                ))}
            </div>

            <div>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Sumber Daya</h2>
                </div>
                <div className="space-y-4">
                    {resources.map((resource, index) => (
                        <ResourceCard key={index} resource={resource} />
                    ))}
                </div>
            </div>
        </div>
    );
}; 