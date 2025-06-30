import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CellsTabProps, NonintegerWeightsType } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { useMetaStore } from "@/stores/useMetaStore";

const CellsTab: FC<CellsTabProps> = ({
    options,
    setOptions,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const { meta } = useMetaStore();
    const isWeightActive = !!meta.weight;

    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    
    const countsStep = getStepIndex('crosstabs-counts-section');
    const percentagesStep = getStepIndex('crosstabs-percentages-section');
    const residualsStep = getStepIndex('crosstabs-residuals-section');
    const nonintegerWeightsStep = getStepIndex('crosstabs-noninteger-weights-section');

    const handleCellChange = (key: keyof typeof options.cells, value: boolean) => {
        setOptions(prev => ({
            ...prev,
            cells: {
                ...prev.cells,
                [key]: value,
            }
        }));
    };

    const handleResidualChange = (key: keyof typeof options.residuals, value: boolean) => {
        setOptions(prev => ({
            ...prev,
            residuals: {
                ...prev.residuals,
                [key]: value,
            }
        }));
    };

    const handleWeightChange = (value: NonintegerWeightsType) => {
        setOptions(prev => ({ ...prev, nonintegerWeights: value }));
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
                            <Checkbox id="rowPercentages" checked={options.cells.row} onCheckedChange={(checked) => handleCellChange('row', !!checked)} className="mr-2" />
                            <Label htmlFor="rowPercentages" className="text-sm cursor-pointer">Row</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="columnPercentages" checked={options.cells.column} onCheckedChange={(checked) => handleCellChange('column', !!checked)} className="mr-2" />
                            <Label htmlFor="columnPercentages" className="text-sm cursor-pointer">Column</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="totalPercentages" checked={options.cells.total} onCheckedChange={(checked) => handleCellChange('total', !!checked)} className="mr-2" />
                            <Label htmlFor="totalPercentages" className="text-sm cursor-pointer">Total</Label>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === percentagesStep} />
                </div>

                <div id="crosstabs-residuals-section" className="bg-card border border-border rounded-md p-4 relative">
                    <div className="text-sm font-medium mb-3">Residuals</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox id="unstandardizedResiduals" checked={options.residuals.unstandardized} onCheckedChange={(checked) => handleResidualChange('unstandardized', !!checked)} className="mr-2" />
                            <Label htmlFor="unstandardizedResiduals" className="text-sm cursor-pointer">Unstandardized</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="standardizedResiduals" checked={options.residuals.standardized} onCheckedChange={(checked) => handleResidualChange('standardized', !!checked)} className="mr-2" />
                            <Label htmlFor="standardizedResiduals" className="text-sm cursor-pointer">Standardized</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="adjStandardizedResiduals" checked={options.residuals.adjustedStandardized} onCheckedChange={(checked) => handleResidualChange('adjustedStandardized', !!checked)} className="mr-2" />
                            <Label htmlFor="adjStandardizedResiduals" className="text-sm cursor-pointer">Adjusted standardized</Label>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === residualsStep} />
                </div>

                {isWeightActive && (
                    <div id="crosstabs-noninteger-weights-section" className="bg-card border border-border rounded-md p-4 relative">
                        <div className="text-sm font-medium mb-3">Noninteger Weights</div>
                        <RadioGroup value={options.nonintegerWeights} onValueChange={handleWeightChange} className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="roundCase" id="roundCase" />
                                <Label htmlFor="roundCase" className="font-normal cursor-pointer">Round case weights</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="roundCell" id="roundCell" />
                                <Label htmlFor="roundCell" className="font-normal cursor-pointer">Round cell counts</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="truncateCase" id="truncateCase" />
                                <Label htmlFor="truncateCase" className="font-normal cursor-pointer">Truncate case weights</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="truncateCell" id="truncateCell" />
                                <Label htmlFor="truncateCell" className="font-normal cursor-pointer">Truncate cell counts</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="noAdjustment" id="noAdjustment" />
                                <Label htmlFor="noAdjustment" className="font-normal cursor-pointer">No adjustments</Label>
                            </div>
                        </RadioGroup>
                        <ActiveElementHighlight active={tourActive && currentStep === nonintegerWeightsStep} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CellsTab;