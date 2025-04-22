"use client";
import React, { FC, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface StatisticsDialogProps {
    initialOptions: {
        confidenceInterval: string;
        showDescriptives: boolean;
        showMEstimators: boolean;
        showOutliers: boolean;
        showPercentiles: boolean;
    };
    onClose: () => void;
    onSubmit: (options: any) => void;
}

const StatisticsDialog: FC<StatisticsDialogProps> = ({ initialOptions, onClose, onSubmit }) => {
    const [confidenceInterval, setConfidenceInterval] = useState<string>(initialOptions.confidenceInterval || "95");
    const [showDescriptives, setShowDescriptives] = useState<boolean>(initialOptions.showDescriptives === undefined ? true : initialOptions.showDescriptives);
    const [showMEstimators, setShowMEstimators] = useState<boolean>(initialOptions.showMEstimators || false);
    const [showOutliers, setShowOutliers] = useState<boolean>(initialOptions.showOutliers || false);
    const [showPercentiles, setShowPercentiles] = useState<boolean>(initialOptions.showPercentiles || false);

    const handleSubmit = () => {
        onSubmit({
            confidenceInterval,
            showDescriptives,
            showMEstimators,
            showOutliers,
            showPercentiles
        });
    };

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[400px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md">
                <DialogHeader className="px-4 py-3 border-b border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                    <DialogTitle className="text-lg font-semibold">Explore: Statistics</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="descriptives"
                            checked={showDescriptives}
                            onCheckedChange={(checked) => setShowDescriptives(checked as boolean)}
                            className="border-[#CCCCCC] h-4 w-4"
                        />
                        <Label htmlFor="descriptives" className="text-sm font-medium cursor-pointer underline">
                            Descriptives
                        </Label>
                    </div>

                    {/* Confidence Interval section - indented under Descriptives */}
                    <div className="flex items-center ml-8 space-x-2">
                        <Label htmlFor="confidenceInterval" className="text-sm">
                            Confidence Interval for Mean:
                        </Label>
                        <div className="flex items-center">
                            <Input
                                id="confidenceInterval"
                                value={confidenceInterval}
                                onChange={(e) => setConfidenceInterval(e.target.value)}
                                className="h-8 text-sm w-16 border-[#CCCCCC]"
                            />
                            <span className="ml-1 text-sm">%</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="mEstimators"
                            checked={showMEstimators}
                            onCheckedChange={(checked) => setShowMEstimators(checked as boolean)}
                            className="border-[#CCCCCC] h-4 w-4"
                        />
                        <Label htmlFor="mEstimators" className="text-sm font-medium cursor-pointer underline">
                            M-estimators
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="outliers"
                            checked={showOutliers}
                            onCheckedChange={(checked) => setShowOutliers(checked as boolean)}
                            className="border-[#CCCCCC] h-4 w-4"
                        />
                        <Label htmlFor="outliers" className="text-sm font-medium cursor-pointer underline">
                            Outliers
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="percentiles"
                            checked={showPercentiles}
                            onCheckedChange={(checked) => setShowPercentiles(checked as boolean)}
                            className="border-[#CCCCCC] h-4 w-4"
                        />
                        <Label htmlFor="percentiles" className="text-sm font-medium cursor-pointer underline">
                            Percentiles
                        </Label>
                    </div>
                </div>

                <DialogFooter className="px-4 py-3 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                    <div className="flex justify-end space-x-2">
                        <Button
                            className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                            onClick={handleSubmit}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        >
                            Help
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StatisticsDialog;