"use client";
import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatisticsTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

const StatisticsTab: FC<StatisticsTabProps> = ({
    showDescriptives,
    setShowDescriptives,
    confidenceInterval,
    setConfidenceInterval,

    showOutliers,
    setShowOutliers,
    containerType = "dialog",
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    const descriptivesStep = getStepIndex('explore-descriptives-section');
    const additionalStatsStep = getStepIndex('explore-additional-stats-section');
    
    return (
        <div className="space-y-4">
            <div id="explore-descriptives-section" className="p-4 border rounded-md relative">
                {/* Descriptives Checkbox */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="descriptives"
                        checked={showDescriptives}
                        onCheckedChange={(checked) => setShowDescriptives(checked as boolean)}
                        className="h-4 w-4"
                    />
                    <Label htmlFor="descriptives" className="text-sm font-medium cursor-pointer">
                        Descriptives
                    </Label>
                </div>

                {/* Confidence Interval Input - Conditionally enabled */}
                <div className={`flex items-center ml-8 mt-2 space-x-2 ${!showDescriptives ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Label htmlFor="confidenceInterval" className="text-sm">
                        Confidence Interval for Mean:
                    </Label>
                    <div className="flex items-center">
                        <Input
                            id="confidenceInterval"
                            value={confidenceInterval}
                            onChange={(e) => setConfidenceInterval(e.target.value)}
                            className="h-8 text-sm w-16"
                            disabled={!showDescriptives}
                        />
                        <span className="ml-1 text-sm">%</span>
                    </div>
                </div>
                <ActiveElementHighlight active={tourActive && currentStep === descriptivesStep} />
            </div>

            <div id="explore-additional-stats-section" className="p-4 border rounded-md space-y-2 relative">
                {/* Outliers Checkbox */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="outliers"
                        checked={showOutliers}
                        onCheckedChange={(checked) => setShowOutliers(checked as boolean)}
                        className="h-4 w-4"
                    />
                    <Label htmlFor="outliers" className="text-sm font-medium cursor-pointer">
                        Outliers
                    </Label>
                </div>


                <ActiveElementHighlight active={tourActive && currentStep === additionalStatsStep} />
            </div>
        </div>
    );
};

export default StatisticsTab; 