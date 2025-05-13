// app/dashboard/result/page.tsx
"use client";

import React, {Suspense} from 'react';
import Sidebar from '@/components/Output/Sidebar';
import ResultOutput from "@/components/Output/ResultOutput";
import { ResultsSkeleton, SidebarSkeleton } from '@/components/ui/Skeletons';

export default function ResultPage() {
    return (
        <div className="grid grid-cols-[auto_1fr] h-full w-full">
            <Suspense fallback={<SidebarSkeleton />}>
                <Sidebar />
            </Suspense>
            <div className="overflow-x-auto min-w-0">
                <Suspense fallback={<ResultsSkeleton />}>
                    <ResultOutput />
                </Suspense>
            </div>
        </div>
    );
}