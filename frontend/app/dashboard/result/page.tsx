// app/dashboard/result/page.tsx
"use client";

import React, {Suspense} from 'react';
import Sidebar from './components/Sidebar';
import ResultOutput from "./components/ResultOutput";
import { ResultsSkeleton, SidebarSkeleton } from '@/components/ui/Skeletons';

export default function ResultPage() {
    return (
        <div className="grid grid-cols-[auto_1fr] h-full w-full overflow-hidden" data-testid="result-page">
            <Suspense fallback={<SidebarSkeleton data-testid="result-sidebar-loading" />}>
                <Sidebar />
            </Suspense>
<<<<<<< HEAD
            <div className="h-full overflow-auto" data-testid="result-content">
=======
            <div className="h-full overflow-auto min-w-0" data-testid="result-content">
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
                <Suspense fallback={<ResultsSkeleton data-testid="result-output-loading" />}>
                    <ResultOutput />
                </Suspense>
            </div>
        </div>
    );
}