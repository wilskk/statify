"use client";
import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlotsTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const PlotsTab: FC<PlotsTabProps> = ({
    boxplotType,
    setBoxplotType,
    showStemAndLeaf,
    setShowStemAndLeaf,
    showHistogram,
    setShowHistogram,
    showNormalityPlots,
    setShowNormalityPlots,
    factorVariablesCount,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    
    const boxplotDisabled = factorVariablesCount === 0;

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-md">
                <Label className="text-base font-medium">Boxplots</Label>
                <RadioGroup 
                    value={boxplotType} 
                    onValueChange={setBoxplotType}
                    className="mt-2 space-y-1"
                    disabled={boxplotDisabled}
                >
                    <div className={`flex items-center space-x-2 ${boxplotDisabled ? 'text-muted-foreground' : ''}`}>
                        <RadioGroupItem value="factor-levels-together" id="factor-levels" />
                        <Label htmlFor="factor-levels" className="font-normal">Factor levels together</Label>
                    </div>
                    <div className={`flex items-center space-x-2 ${boxplotDisabled ? 'text-muted-foreground' : ''}`}>
                        <RadioGroupItem value="dependents-together" id="dependents" />
                        <Label htmlFor="dependents" className="font-normal">Dependents together</Label>
                    </div>
                </RadioGroup>
                {boxplotDisabled && (
                    <p className="text-xs text-muted-foreground mt-2">Boxplot options are available when one or more factor variables are selected.</p>
                )}
            </div>
            
            <div className="p-4 border rounded-md space-y-3">
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

            <div className="p-4 border rounded-md">
                 <div className="flex items-center space-x-2">
                    <Checkbox
                        id="normality-plots"
                        checked={showNormalityPlots}
                        onCheckedChange={(checked) => setShowNormalityPlots(checked as boolean)}
                    />
                    <Label htmlFor="normality-plots" className="font-normal">Normality plots with tests</Label>
                </div>
            </div>
        </div>
    );
};

export default PlotsTab; 