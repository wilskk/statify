"use client";
import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Updated Props interface for PlotsTab (removed props for deleted sections)
interface PlotsTabProps {
    boxplotOption: string;
    setBoxplotOption: React.Dispatch<React.SetStateAction<string>>;
    showStemAndLeaf: boolean;
    setShowStemAndLeaf: React.Dispatch<React.SetStateAction<boolean>>;
    showHistogram: boolean;
    setShowHistogram: React.Dispatch<React.SetStateAction<boolean>>;
    showNormalityPlots: boolean;
    setShowNormalityPlots: React.Dispatch<React.SetStateAction<boolean>>;
    // Removed: spreadVsLevelOption, setSpreadVsLevelOption
    // Removed: transformationPower, setTransformationPower
    // Removed: displayOption, setDisplayOption
    containerType?: "dialog" | "sidebar";
}

const PlotsTab: FC<PlotsTabProps> = ({
    boxplotOption,
    setBoxplotOption,
    showStemAndLeaf,
    setShowStemAndLeaf,
    showHistogram,
    setShowHistogram,
    showNormalityPlots,
    setShowNormalityPlots,
    // Removed destructured props for deleted sections
    containerType = "dialog"
}) => {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                {/* Boxplots Section */}
                <div className="bg-card border border-border rounded-md p-4">
                    {/* Removed underline from h3 */}
                    <h3 className="text-sm font-medium mb-3 text-card-foreground">Boxplots</h3>
                    <RadioGroup
                        value={boxplotOption}
                        onValueChange={setBoxplotOption}
                        className="space-y-2"
                    >
                        <div className="flex items-center">
                            <RadioGroupItem value="factorLevels" id="factorLevels" className="mr-2 h-4 w-4" />
                            <Label htmlFor="factorLevels" className="text-sm cursor-pointer">Factor levels together</Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem value="dependents" id="dependents" className="mr-2 h-4 w-4" />
                            <Label htmlFor="dependents" className="text-sm cursor-pointer">Dependents together</Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem value="none" id="noneBox" className="mr-2 h-4 w-4" />
                            <Label htmlFor="noneBox" className="text-sm cursor-pointer">None</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Descriptive Plots Section */}
                <div className="bg-card border border-border rounded-md p-4">
                     {/* Removed underline from h3 */}
                    <h3 className="text-sm font-medium mb-3 text-card-foreground">Descriptive</h3>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox id="stemAndLeaf" checked={showStemAndLeaf} onCheckedChange={(checked) => setShowStemAndLeaf(checked as boolean)} className="mr-2 h-4 w-4" />
                            <Label htmlFor="stemAndLeaf" className="text-sm cursor-pointer">Stem-and-leaf</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="histogram" checked={showHistogram} onCheckedChange={(checked) => setShowHistogram(checked as boolean)} className="mr-2 h-4 w-4" />
                            <Label htmlFor="histogram" className="text-sm cursor-pointer">Histogram</Label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Normality Plots Section */}
            <div className="bg-card border border-border rounded-md p-4 mb-5">
                <div className="flex items-center">
                    <Checkbox id="normalityPlots" checked={showNormalityPlots} onCheckedChange={(checked) => setShowNormalityPlots(checked as boolean)} className="mr-2 h-4 w-4" />
                    {/* Removed underline from Label */}
                    <Label htmlFor="normalityPlots" className="text-sm cursor-pointer">Normality plots with tests</Label>
                </div>
            </div>

            {/* Removed Spread vs Level Section */}

            {/* Removed Display Options Section */}
        </div>
    );
};

export default PlotsTab;