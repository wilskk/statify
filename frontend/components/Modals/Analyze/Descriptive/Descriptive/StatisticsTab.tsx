import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DescriptiveStatisticsOptions, DisplayOrderType } from "./types";
import { Dispatch, SetStateAction } from "react";
import { TourStep } from "./hooks/useTourGuide";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

export interface StatisticsTabProps {
    displayStatistics: DescriptiveStatisticsOptions;
    setDisplayStatistics: Dispatch<SetStateAction<DescriptiveStatisticsOptions>>;
    displayOrder: DisplayOrderType;
    setDisplayOrder: Dispatch<SetStateAction<DisplayOrderType>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

const StatisticsTab: FC<StatisticsTabProps> = ({
    displayStatistics,
    setDisplayStatistics,
    displayOrder,
    setDisplayOrder,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const handleDisplayOrderChange = (value: string) => {
        setDisplayOrder(value as DisplayOrderType);
    };

    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    
    const centralTendencyStepIndex = getStepIndex("descriptive-central-tendency");
    const dispersionStepIndex = getStepIndex("descriptive-dispersion");
    const distributionStepIndex = getStepIndex("descriptive-distribution");
    const displayOrderStepIndex = getStepIndex("display-order-section");

    return (
        <div className="space-y-6">
            <div id="descriptive-central-tendency" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Central Tendency</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="mean"
                            checked={displayStatistics.mean}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, mean: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="mean" className="text-sm cursor-pointer">Mean</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="median"
                            checked={displayStatistics.median}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, median: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="median" className="text-sm cursor-pointer">Median</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="sum"
                            checked={displayStatistics.sum}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, sum: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="sum" className="text-sm cursor-pointer">Sum</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === centralTendencyStepIndex} />
            </div>

            <div id="descriptive-dispersion" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Dispersion</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="stdDev"
                            checked={displayStatistics.stdDev}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, stdDev: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="stdDev" className="text-sm cursor-pointer">Std. deviation</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="minimum"
                            checked={displayStatistics.minimum}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, minimum: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="minimum" className="text-sm cursor-pointer">Minimum</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="variance"
                            checked={displayStatistics.variance}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, variance: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="variance" className="text-sm cursor-pointer">Variance</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="maximum"
                            checked={displayStatistics.maximum}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, maximum: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="maximum" className="text-sm cursor-pointer">Maximum</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="range"
                            checked={displayStatistics.range}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, range: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="range" className="text-sm cursor-pointer">Range</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="standardError"
                            checked={displayStatistics.standardError}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, standardError: !!checked})}
                            className="mr-2"
                        />
                        <Label htmlFor="standardError" className="text-sm cursor-pointer">S.E. mean</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === dispersionStepIndex} />
            </div>
            
            <div id="descriptive-distribution" className="bg-card border border-border rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Distribution</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="kurtosis"
                            checked={displayStatistics.kurtosis}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, kurtosis: !!checked})}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="kurtosis" className="text-sm cursor-pointer">Kurtosis</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="skewness"
                            checked={displayStatistics.skewness}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, skewness: !!checked})}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="skewness" className="text-sm cursor-pointer">Skewness</Label>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === distributionStepIndex} />
            </div>

            <div id="display-order-section" className="border border-[#E6E6E6] rounded-md p-5 relative">
                <div className="text-sm font-medium mb-3">Display Order</div>
                <RadioGroup value={displayOrder} onValueChange={handleDisplayOrderChange} className="space-y-2">
                    <div className="flex items-center">
                        <RadioGroupItem id="variableList" value="variableList" className="mr-2 border-[#CCCCCC]" />
                        <Label htmlFor="variableList" className="text-sm cursor-pointer">Variable list</Label>
                    </div>
                    <div className="flex items-center">
                        <RadioGroupItem id="alphabetic" value="alphabetic" className="mr-2 border-[#CCCCCC]" />
                        <Label htmlFor="alphabetic" className="text-sm cursor-pointer">Alphabetic</Label>
                    </div>
                    <div className="flex items-center">
                        <RadioGroupItem id="ascendingMeans" value="ascendingMeans" className="mr-2 border-[#CCCCCC]" />
                        <Label htmlFor="ascendingMeans" className="text-sm cursor-pointer">Ascending means</Label>
                    </div>
                    <div className="flex items-center">
                        <RadioGroupItem id="descendingMeans" value="descendingMeans" className="mr-2 border-[#CCCCCC]" />
                        <Label htmlFor="descendingMeans" className="text-sm cursor-pointer">Descending means</Label>
                    </div>
                </RadioGroup>
                
                <ActiveElementHighlight active={tourActive && currentStep === displayOrderStepIndex} />
            </div>
        </div>
    );
};

export default StatisticsTab;