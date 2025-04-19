// app/dashboard/data/loading.tsx
import { DataTableSkeleton } from "@/components/Skeletons";

export default function DataLoading() {
    return (
        <div className="z-0 h-full w-full">
            <DataTableSkeleton />
        </div>
    );
}