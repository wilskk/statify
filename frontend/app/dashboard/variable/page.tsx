// app/dashboard/variables/page.tsx

"use client";

import React, {Suspense} from 'react';
import VariableTable from "@/components/pages/dashboard/variableTable";
import { VariableTableSkeleton } from "@/components/ui/Skeletons";

export default function VariablesPage() {
    return (
        <div className="h-full w-full">
            <Suspense fallback={<VariableTableSkeleton />}>
                <VariableTable />
            </Suspense>
        </div>
    );
}
