import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

// Define the union type for nonintegerWeights
type NonintegerWeightsType = 'roundCell' | 'roundCase' | 'truncateCell' | 'truncateCase' | 'noAdjustment';

interface CellsTabProps {
    observedCounts: boolean;
    expectedCounts: boolean;
    hideSmallCounts: boolean;
    smallCountThreshold: string;
    rowPercentages: boolean;
    columnPercentages: boolean;
    totalPercentages: boolean;
    compareColumnProportions: boolean;
    adjustPValues: boolean;
    unstandardizedResiduals: boolean;
    standardizedResiduals: boolean;
    adjustedStandardizedResiduals: boolean;
    // Update the type to use the union type instead of string
    nonintegerWeights: NonintegerWeightsType;
    setObservedCounts: (value: boolean) => void;
    setExpectedCounts: (value: boolean) => void;
    setHideSmallCounts: (value: boolean) => void;
    setSmallCountThreshold: (value: string) => void;
    setRowPercentages: (value: boolean) => void;
    setColumnPercentages: (value: boolean) => void;
    setTotalPercentages: (value: boolean) => void;
    setCompareColumnProportions: (value: boolean) => void;
    setAdjustPValues: (value: boolean) => void;
    setUnstandardizedResiduals: (value: boolean) => void;
    setStandardizedResiduals: (value: boolean) => void;
    setAdjustedStandardizedResiduals: (value: boolean) => void;
    // Update the function signature to match the expected type
    setNonintegerWeights: (value: NonintegerWeightsType) => void;
}

const CellsTab: FC<CellsTabProps> = ({
                                         observedCounts,
                                         expectedCounts,
                                         hideSmallCounts,
                                         smallCountThreshold,
                                         rowPercentages,
                                         columnPercentages,
                                         totalPercentages,
                                         compareColumnProportions,
                                         adjustPValues,
                                         unstandardizedResiduals,
                                         standardizedResiduals,
                                         adjustedStandardizedResiduals,
                                         nonintegerWeights,
                                         setObservedCounts,
                                         setExpectedCounts,
                                         setHideSmallCounts,
                                         setSmallCountThreshold,
                                         setRowPercentages,
                                         setColumnPercentages,
                                         setTotalPercentages,
                                         setCompareColumnProportions,
                                         setAdjustPValues,
                                         setUnstandardizedResiduals,
                                         setStandardizedResiduals,
                                         setAdjustedStandardizedResiduals,
                                         setNonintegerWeights
                                     }) => {
    return (
        <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Counts</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="observedCounts"
                                checked={observedCounts}
                                onCheckedChange={(checked) => setObservedCounts(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="observedCounts" className="text-sm cursor-pointer">
                                Observed
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="expectedCounts"
                                checked={expectedCounts}
                                onCheckedChange={(checked) => setExpectedCounts(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="expectedCounts" className="text-sm cursor-pointer">
                                Expected
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="hideSmallCounts"
                                checked={hideSmallCounts}
                                onCheckedChange={(checked) => setHideSmallCounts(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="hideSmallCounts" className="text-sm cursor-pointer">
                                Hide small counts
                            </Label>
                        </div>

                        <div className="flex items-center ml-6">
                            <Label htmlFor="smallCountThreshold" className="text-sm mr-2">
                                Less than
                            </Label>
                            <Input
                                id="smallCountThreshold"
                                value={smallCountThreshold}
                                onChange={(e) => setSmallCountThreshold(e.target.value)}
                                className="h-8 text-sm w-16"
                                disabled={!hideSmallCounts}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Z-test</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="compareColumnProportions"
                                checked={compareColumnProportions}
                                onCheckedChange={(checked) => setCompareColumnProportions(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="compareColumnProportions" className="text-sm cursor-pointer">
                                Compare column proportions
                            </Label>
                        </div>

                        <div className="flex items-center ml-6">
                            <Checkbox
                                id="adjustPValues"
                                checked={adjustPValues}
                                onCheckedChange={(checked) => setAdjustPValues(!!checked)}
                                className="mr-2"
                                disabled={!compareColumnProportions}
                            />
                            <Label htmlFor="adjustPValues" className="text-sm cursor-pointer">
                                Adjust p-values (Bonferroni method)
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Percentages</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="rowPercentages"
                                checked={rowPercentages}
                                onCheckedChange={(checked) => setRowPercentages(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="rowPercentages" className="text-sm cursor-pointer">
                                Row
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="columnPercentages"
                                checked={columnPercentages}
                                onCheckedChange={(checked) => setColumnPercentages(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="columnPercentages" className="text-sm cursor-pointer">
                                Column
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="totalPercentages"
                                checked={totalPercentages}
                                onCheckedChange={(checked) => setTotalPercentages(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="totalPercentages" className="text-sm cursor-pointer">
                                Total
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Residuals</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="unstandardizedResiduals"
                                checked={unstandardizedResiduals}
                                onCheckedChange={(checked) => setUnstandardizedResiduals(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="unstandardizedResiduals" className="text-sm cursor-pointer">
                                Unstandardized
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="standardizedResiduals"
                                checked={standardizedResiduals}
                                onCheckedChange={(checked) => setStandardizedResiduals(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="standardizedResiduals" className="text-sm cursor-pointer">
                                Standardized
                            </Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="adjustedStandardizedResiduals"
                                checked={adjustedStandardizedResiduals}
                                onCheckedChange={(checked) => setAdjustedStandardizedResiduals(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="adjustedStandardizedResiduals" className="text-sm cursor-pointer">
                                Adjusted standardized
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-md p-4 mt-6">
                <div className="text-sm font-medium mb-3">Noninteger Weights</div>
                <RadioGroup
                    value={nonintegerWeights}
                    onValueChange={(value) => setNonintegerWeights(value as NonintegerWeightsType)}
                    className="grid grid-cols-2 gap-2"
                >
                    <div className="flex items-center">
                        <RadioGroupItem
                            value="roundCell"
                            id="roundCell"
                            className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <Label htmlFor="roundCell" className="text-sm ml-2 cursor-pointer">
                            Round cell counts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem
                            value="roundCase"
                            id="roundCase"
                            className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <Label htmlFor="roundCase" className="text-sm ml-2 cursor-pointer">
                            Round case weights
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem
                            value="truncateCell"
                            id="truncateCell"
                            className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <Label htmlFor="truncateCell" className="text-sm ml-2 cursor-pointer">
                            Truncate cell counts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem
                            value="truncateCase"
                            id="truncateCase"
                            className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <Label htmlFor="truncateCase" className="text-sm ml-2 cursor-pointer">
                            Truncate case weights
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem
                            value="noAdjustment"
                            id="noAdjustment"
                            className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <Label htmlFor="noAdjustment" className="text-sm ml-2 cursor-pointer">
                            No adjustments
                        </Label>
                    </div>
                </RadioGroup>
            </div>
        </div>
    );
};

export default CellsTab;