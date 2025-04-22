// ./components/Modals/Analyze/Descriptive/PPPlots/OptionsTab.tsx
import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Interface OptionsTabProps
interface OptionsTabProps {
    testDistribution: string;
    setTestDistribution: React.Dispatch<React.SetStateAction<string>>;
    degreesOfFreedom: string;
    setDegreesOfFreedom: React.Dispatch<React.SetStateAction<string>>;
    estimateFromData: boolean;
    setEstimateFromData: React.Dispatch<React.SetStateAction<boolean>>;
    threshold: string;
    setThreshold: React.Dispatch<React.SetStateAction<string>>;
    shape: string;
    setShape: React.Dispatch<React.SetStateAction<string>>;
    naturalLogTransform: boolean;
    setNaturalLogTransform: React.Dispatch<React.SetStateAction<boolean>>;
    standardizeValues: boolean;
    setStandardizeValues: React.Dispatch<React.SetStateAction<boolean>>;
    difference: boolean;
    setDifference: React.Dispatch<React.SetStateAction<boolean>>;
    differenceValue: string;
    setDifferenceValue: React.Dispatch<React.SetStateAction<string>>;
    seasonallyDifference: boolean;
    setSeasonallyDifference: React.Dispatch<React.SetStateAction<boolean>>;
    seasonallyDifferenceValue: string;
    setSeasonallyDifferenceValue: React.Dispatch<React.SetStateAction<string>>;
    currentPeriodicity: string;
    proportionEstimation: string;
    setProportionEstimation: React.Dispatch<React.SetStateAction<string>>;
    rankAssignedToTies: string;
    setRankAssignedToTies: React.Dispatch<React.SetStateAction<string>>;
}

const OptionsTab: FC<OptionsTabProps> = ({
                                             testDistribution,
                                             setTestDistribution,
                                             degreesOfFreedom,
                                             setDegreesOfFreedom,
                                             estimateFromData,
                                             setEstimateFromData,
                                             threshold,
                                             setThreshold,
                                             shape,
                                             setShape,
                                             naturalLogTransform,
                                             setNaturalLogTransform,
                                             standardizeValues,
                                             setStandardizeValues,
                                             difference,
                                             setDifference,
                                             differenceValue,
                                             setDifferenceValue,
                                             seasonallyDifference,
                                             setSeasonallyDifference,
                                             seasonallyDifferenceValue,
                                             setSeasonallyDifferenceValue,
                                             currentPeriodicity,
                                             proportionEstimation,
                                             setProportionEstimation,
                                             rankAssignedToTies,
                                             setRankAssignedToTies
                                         }) => {
    const distributionNeedsDf = ["t", "Chi-square", "F"];

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">

            {/* === Column 1 === */}
            <div className="flex flex-col space-y-6">
                {/* Distribution Section Card */}
                <div className="rounded-md border border-[#E6E6E6] p-6">
                    {/* Test Distribution Sub-section */}
                    <div>
                        <div className="mb-4 text-sm font-medium">Test Distribution</div>
                        <div className="space-y-4">
                            <Select
                                value={testDistribution}
                                onValueChange={setTestDistribution}
                            >
                                <SelectTrigger className="h-9 border-[#CCCCCC] text-sm focus:border-black focus:ring-black">
                                    <SelectValue placeholder="Select a distribution" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Uniform">Uniform</SelectItem>
                                    <SelectItem value="Exponential">Exponential</SelectItem>
                                    <SelectItem value="t">Student&apos;s t</SelectItem>
                                    <SelectItem value="Chi-square">Chi-square</SelectItem>
                                    <SelectItem value="F">F</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="degreesOfFreedom" className="w-20 flex-shrink-0 text-sm">
                                    df:
                                </Label>
                                <Input
                                    id="degreesOfFreedom"
                                    value={degreesOfFreedom}
                                    onChange={(e) => setDegreesOfFreedom(e.target.value)}
                                    className="h-9 flex-1 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                    disabled={!distributionNeedsDf.includes(testDistribution)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Distribution Parameters Sub-section */}
                    <div className="mt-6 border-t border-[#E6E6E6] pt-4">
                        <div className="mb-4 text-sm font-medium">Distribution Parameters</div>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="estimateFromData"
                                    checked={estimateFromData}
                                    onCheckedChange={(checked) => setEstimateFromData(!!checked)}
                                    className="border-[#CCCCCC]"
                                />
                                <Label htmlFor="estimateFromData" className="cursor-pointer text-sm">
                                    Estimate from data
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="location" className="w-20 flex-shrink-0 text-sm">
                                    Location:
                                </Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="h-9 flex-1 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                    disabled={estimateFromData}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="scale" className="w-20 flex-shrink-0 text-sm">
                                    Scale:
                                </Label>
                                <Input
                                    id="scale"
                                    value={scale}
                                    onChange={(e) => setScale(e.target.value)}
                                    className="h-9 flex-1 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                    disabled={estimateFromData}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="threshold" className="w-20 flex-shrink-0 text-sm">
                                    Threshold:
                                </Label>
                                <Input
                                    id="threshold"
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                    className="h-9 flex-1 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                    disabled={estimateFromData}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="shape" className="w-20 flex-shrink-0 text-sm">
                                    Shape:
                                </Label>
                                <Input
                                    id="shape"
                                    value={shape}
                                    onChange={(e) => setShape(e.target.value)}
                                    className="h-9 flex-1 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                    disabled={estimateFromData}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proportion Estimation Formula Section */}
                <div className="rounded-md border border-[#E6E6E6] p-6">
                    <div className="mb-4 text-sm font-medium">Proportion Estimation Formula</div>
                    <RadioGroup
                        value={proportionEstimation}
                        onValueChange={setProportionEstimation}
                        className="space-y-3"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Blom's"
                                    id="bloms"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="bloms" className="cursor-pointer text-sm">
                                    Blom&apos;s
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Rankit"
                                    id="rankit"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="rankit" className="cursor-pointer text-sm">
                                    Rankit
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Tukey's"
                                    id="tukeys"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="tukeys" className="cursor-pointer text-sm">
                                    Tukey&apos;s
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Van der Waerden's"
                                    id="vanderwaerdens"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="vanderwaerdens" className="cursor-pointer text-sm">
                                    Van der Waerden&apos;s
                                </Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            {/* === Column 2 === */}
            <div className="flex flex-col space-y-6">
                {/* Transform Section Card */}
                <div className="rounded-md border border-[#E6E6E6] p-6">
                    <div className="mb-4 text-sm font-medium">Transform</div>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="naturalLogTransform"
                                checked={naturalLogTransform}
                                onCheckedChange={(checked) => setNaturalLogTransform(!!checked)}
                                className="border-[#CCCCCC]"
                            />
                            <Label htmlFor="naturalLogTransform" className="cursor-pointer text-sm">
                                Natural log transform
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="standardizeValues"
                                checked={standardizeValues}
                                onCheckedChange={(checked) => setStandardizeValues(!!checked)}
                                className="border-[#CCCCCC]"
                            />
                            <Label htmlFor="standardizeValues" className="cursor-pointer text-sm">
                                Standardize values
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="difference"
                                checked={difference}
                                onCheckedChange={(checked) => setDifference(!!checked)}
                                className="border-[#CCCCCC] flex-shrink-0"
                            />
                            <Label htmlFor="difference" className="cursor-pointer text-sm">
                                Difference:
                            </Label>
                            <Input
                                id="differenceValue"
                                value={differenceValue}
                                onChange={(e) => setDifferenceValue(e.target.value)}
                                className="ml-auto h-9 w-16 flex-shrink-0 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                disabled={!difference}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="seasonallyDifference"
                                checked={seasonallyDifference}
                                onCheckedChange={(checked) => setSeasonallyDifference(!!checked)}
                                className="border-[#CCCCCC] flex-shrink-0"
                                disabled={true}
                            />
                            <Label htmlFor="seasonallyDifference" className="cursor-pointer text-sm text-gray-400">
                                Seasonally difference:
                            </Label>
                            <Input
                                id="seasonallyDifferenceValue"
                                value={seasonallyDifferenceValue}
                                onChange={(e) => setSeasonallyDifferenceValue(e.target.value)}
                                className="ml-auto h-9 w-16 flex-shrink-0 border-[#CCCCCC] bg-gray-100 text-sm focus:border-black focus:ring-black"
                                disabled={true}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-1">
                            <Label className="text-sm">
                                Current Periodicity:
                            </Label>
                            <span className="text-sm">{currentPeriodicity || 'None'}</span>
                        </div>
                    </div>
                </div>

                {/* Rank Assigned to Ties Section */}
                <div className="rounded-md border border-[#E6E6E6] p-6">
                    <div className="mb-4 text-sm font-medium">Rank Assigned to Ties</div>
                    <RadioGroup
                        value={rankAssignedToTies}
                        onValueChange={setRankAssignedToTies}
                        className="space-y-3"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Mean"
                                    id="mean"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="mean" className="cursor-pointer text-sm">
                                    Mean
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="High"
                                    id="high"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="high" className="cursor-pointer text-sm">
                                    High
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Low"
                                    id="low"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="low" className="cursor-pointer text-sm">
                                    Low
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Break ties arbitrarily"
                                    id="breaktiesarbitrarily"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="breaktiesarbitrarily" className="cursor-pointer text-sm">
                                    Break ties arbitrarily
                                </Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>
            </div>
        </div>
    );
};

export default OptionsTab;