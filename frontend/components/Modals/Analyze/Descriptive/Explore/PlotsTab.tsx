"use client";
import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlotsTabProps } from "./types";

const PlotsTab: FC<PlotsTabProps> = ({
    boxplotType,
    setBoxplotType,
    showStemAndLeaf,
    setShowStemAndLeaf,
    showHistogram,
    setShowHistogram,
    showNormalityPlots: _showNormalityPlots,
    setShowNormalityPlots: _setShowNormalityPlots,
    factorVariablesCount: _factorVariablesCount,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    
    // Boxplot options are always enabled; user can configure before selecting variables.

    void _factorVariablesCount; // intentional no-op to acknowledge unused prop

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-md">
                <Label className="text-base font-medium">Boxplots</Label>
                <RadioGroup 
                    value={boxplotType} 
                    onValueChange={setBoxplotType}
                    className="mt-2 space-y-1"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none" className="font-normal">None</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="factor-levels-together" id="factor-levels" />
                        <Label htmlFor="factor-levels" className="font-normal">Factor levels together</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dependents-together" id="dependents" />
                        <Label htmlFor="dependents" className="font-normal">Dependents together</Label>
                    </div>
                </RadioGroup>
                {/* Info text removed so user can preconfigure before variable selection */}
            </div>
            
            <div className="p-4 border rounded-md space-y-3">
                <Label className="text-base font-medium">Descriptives</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="stem-and-leaf"
                        checked={showStemAndLeaf}
                        onCheckedChange={(checked) => setShowStemAndLeaf(checked as boolean)}
                    />
                    <Label htmlFor="stem-and-leaf" className="font-normal">Stem-and-leaf</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="histogram"
                        checked={showHistogram}
                        onCheckedChange={(checked) => setShowHistogram(checked as boolean)}
                    />
                    <Label htmlFor="histogram" className="font-normal">Histogram</Label>
                </div>
            </div>

            {/* Normality plots with tests option removed as per requirement */}
        </div>
    );
};

export default PlotsTab; 