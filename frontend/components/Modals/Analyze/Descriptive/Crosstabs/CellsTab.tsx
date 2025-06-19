import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CellsTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const CellsTab: FC<CellsTabProps> = ({
    options,
    setOptions,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    
    const countsStep = getStepIndex('crosstabs-counts-section');
    const percentagesStep = getStepIndex('crosstabs-percentages-section');

    const handleCellChange = (key: keyof typeof options.cells, value: boolean) => {
        setOptions(prev => ({
            ...prev,
            cells: {
                ...prev.cells,
                [key]: value,
            }
        }));
    };

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div id="crosstabs-counts-section" className="bg-card border border-border rounded-md p-4 relative">
                    <div className="text-sm font-medium mb-3">Counts</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="observedCounts"
                                checked={options.cells.observed}
                                onCheckedChange={(checked) => handleCellChange('observed', !!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="observedCounts" className="text-sm cursor-pointer">
                                Observed
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="expectedCounts"
                                checked={options.cells.expected}
                                onCheckedChange={(checked) => handleCellChange('expected', !!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="expectedCounts" className="text-sm cursor-pointer">
                                Expected
                            </Label>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === countsStep} />
                </div>

                <div id="crosstabs-percentages-section" className="bg-card border border-border rounded-md p-4 relative">
                    <div className="text-sm font-medium mb-3">Percentages</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="rowPercentages"
                                checked={options.cells.row}
                                onCheckedChange={(checked) => handleCellChange('row', !!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="rowPercentages" className="text-sm cursor-pointer">
                                Row
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="columnPercentages"
                                checked={options.cells.column}
                                onCheckedChange={(checked) => handleCellChange('column', !!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="columnPercentages" className="text-sm cursor-pointer">
                                Column
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="totalPercentages"
                                checked={options.cells.total}
                                onCheckedChange={(checked) => handleCellChange('total', !!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="totalPercentages" className="text-sm cursor-pointer">
                                Total
                            </Label>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === percentagesStep} />
                </div>
            </div>
        </div>
    );
};

export default CellsTab;