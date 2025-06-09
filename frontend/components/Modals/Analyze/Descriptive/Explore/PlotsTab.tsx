"use client";
import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlotsTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const PlotsTab: FC<PlotsTabProps> = ({
    boxplotOption,
    setBoxplotOption,
    showStemAndLeaf,
    setShowStemAndLeaf,
    showHistogram,
    setShowHistogram,
    showNormalityPlots,
    setShowNormalityPlots,
    containerType = "dialog",
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    const boxplotsStep = getStepIndex('explore-boxplots-descriptive-section');
    const normalityStep = getStepIndex('explore-normality-plots-section');

    return (
        <div>
            <div id="explore-boxplots-descriptive-section" className="relative">
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
                <ActiveElementHighlight active={tourActive && currentStep === boxplotsStep} />
            </div>

            {/* Normality Plots Section */}
            <div id="explore-normality-plots-section" className="bg-card border border-border rounded-md p-4 mb-5 relative">
                <div className="flex items-center">
                    <Checkbox id="normalityPlots" checked={showNormalityPlots} onCheckedChange={(checked) => setShowNormalityPlots(checked as boolean)} className="mr-2 h-4 w-4" />
                    {/* Removed underline from Label */}
                    <Label htmlFor="normalityPlots" className="text-sm cursor-pointer">Normality plots with tests</Label>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === normalityStep} />
            </div>
        </div>
    );
};

export default PlotsTab;