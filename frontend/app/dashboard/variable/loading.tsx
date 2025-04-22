// app/dashboard/variables/loading.tsx
import { VariableTableSkeleton } from "@/components/ui/Skeletons";

export default function VariablesLoading() {
    return (
        <div className="h-full w-full">
            <VariableTableSkeleton />
        </div>
    );
}