"use client";
import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Props interface for StatisticsTab
interface StatisticsTabProps {
    showDescriptives: boolean;
    setShowDescriptives: React.Dispatch<React.SetStateAction<boolean>>;
    confidenceInterval: string;
    setConfidenceInterval: React.Dispatch<React.SetStateAction<string>>;
    showMEstimators: boolean;
    setShowMEstimators: React.Dispatch<React.SetStateAction<boolean>>;
    showOutliers: boolean;
    setShowOutliers: React.Dispatch<React.SetStateAction<boolean>>;
    showPercentiles: boolean;
    setShowPercentiles: React.Dispatch<React.SetStateAction<boolean>>;
    containerType?: "dialog" | "sidebar";
}

const StatisticsTab: FC<StatisticsTabProps> = ({
    showDescriptives,
    setShowDescriptives,
    confidenceInterval,
    setConfidenceInterval,
    showMEstimators,
    setShowMEstimators,
    showOutliers,
    setShowOutliers,
    showPercentiles,
    setShowPercentiles,
    containerType = "dialog"
}) => {
    return (
        <div className="space-y-4">
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
            <div className={`flex items-center ml-8 space-x-2 ${!showDescriptives ? 'opacity-50 pointer-events-none' : ''}`}>
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

            {/* M-estimators Checkbox */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="mEstimators"
                    checked={showMEstimators}
                    onCheckedChange={(checked) => setShowMEstimators(checked as boolean)}
                    className="h-4 w-4"
                />
                <Label htmlFor="mEstimators" className="text-sm font-medium cursor-pointer">
                    M-estimators
                </Label>
            </div>

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

            {/* Percentiles Checkbox */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="percentiles"
                    checked={showPercentiles}
                    onCheckedChange={(checked) => setShowPercentiles(checked as boolean)}
                    className="h-4 w-4"
                />
                <Label htmlFor="percentiles" className="text-sm font-medium cursor-pointer">
                    Percentiles
                </Label>
            </div>
        </div>
    );
};

export default StatisticsTab; 