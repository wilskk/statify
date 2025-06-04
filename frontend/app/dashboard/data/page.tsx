// app/dashboard/data/page.tsx

"use client";

import React, { Suspense } from 'react';
import Index from "@/components/pages/dashboard/dataTable";
import { DataTableSkeleton } from "@/components/ui/Skeletons";

export default function DataPage() {
    return (
        <div className="z-0 h-full w-full">
            <Suspense fallback={<DataTableSkeleton />}>
                <Index />
            </Suspense>
        </div>
    );
}
