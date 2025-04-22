// app/dashboard/results/loading.tsx
import { ResultsSkeleton, SidebarSkeleton } from "@/components/ui/Skeletons";

export default function ResultsLoading() {
    return (
        <div className="flex h-full w-full overflow-hidden">
            <div className="h-full">
                <SidebarSkeleton />
            </div>
            <div className="flex-1 overflow-y-auto">
                <ResultsSkeleton />
            </div>
        </div>
    );
}