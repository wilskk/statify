import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface OptionsTabProps {
    isAlreadySorted: boolean;
    setIsAlreadySorted: (value: boolean) => void;
    sortBeforeAggregating: boolean;
    setSortBeforeAggregating: (value: boolean) => void;
}

const OptionsTab: FC<OptionsTabProps> = ({
                                             isAlreadySorted,
                                             setIsAlreadySorted,
                                             sortBeforeAggregating,
                                             setSortBeforeAggregating
                                         }) => {
    return (
        <div className="border border-border p-2 rounded-md bg-card">
            <div className="text-xs font-semibold mb-2 text-foreground">Options for Very Large Datasets</div>
            <div className="space-y-3">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="already-sorted"
                        className="w-3 h-3"
                        checked={isAlreadySorted}
                        onCheckedChange={(checked) => setIsAlreadySorted(!!checked)}
                    />
                    <Label htmlFor="already-sorted" className="text-xs cursor-pointer text-foreground">
                        File is already sorted on break variable(s)
                    </Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="sort-before"
                        className="w-3 h-3"
                        checked={sortBeforeAggregating}
                        onCheckedChange={(checked) => setSortBeforeAggregating(!!checked)}
                    />
                    <Label htmlFor="sort-before" className="text-xs cursor-pointer text-foreground">
                        Sort file before aggregating
                    </Label>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                    <p>For very large datasets, sorting can improve performance significantly.</p>
                    <p className="mt-1">
                        If your data is already sorted by the break variables, check the first option to skip the sorting step.
                        Otherwise, checking the second option will sort your data before aggregating.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OptionsTab;