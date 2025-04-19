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
    const [confidenceInterval, setConfidenceInterval] = useState(initialOptions.confidenceInterval);
    const [showDescriptives, setShowDescriptives] = useState(initialOptions.showDescriptives);
    const [showMEstimators, setShowMEstimators] = useState(initialOptions.showMEstimators);
    const [showOutliers, setShowOutliers] = useState(initialOptions.showOutliers);
    const [showPercentiles, setShowPercentiles] = useState(initialOptions.showPercentiles);

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
            <DialogContent className="max-w-[400px] p-0 bg-[#EBF2F8] border border-[#000000] shadow-md">
                <DialogHeader className="px-4 py-2 border-b border-[#000000] flex-shrink-0 bg-[#EBF2F8]">
                    <DialogTitle className="text-[16px] font-medium">Explore: Statistics</DialogTitle>
                </DialogHeader>

                <div className="p-4 space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="descriptives"
                            checked={showDescriptives}
                            onChange={(e) => setShowDescriptives(e.target.checked)}
                            className="mr-2 border-[#000000]"
                        />
                        <Label htmlFor="descriptives" className="text-sm underline cursor-pointer">Descriptives</Label>
                    </div>

                    <div className="flex items-center pl-6">
                        <Label htmlFor="confidenceInterval" className="text-sm underline mr-2">
                            Confidence Interval for Mean:
                        </Label>
                        <Input
                            id="confidenceInterval"
                            value={confidenceInterval}
                            onChange={(e) => setConfidenceInterval(e.target.value)}
                            className="h-8 text-sm w-16 border-[#000000]"
                        />
                        <span className="ml-1 text-sm">%</span>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="mEstimators"
                            checked={showMEstimators}
                            onChange={(e) => setShowMEstimators(e.target.checked)}
                            className="mr-2 border-[#000000]"
                        />
                        <Label htmlFor="mEstimators" className="text-sm underline cursor-pointer">M-estimators</Label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="outliers"
                            checked={showOutliers}
                            onChange={(e) => setShowOutliers(e.target.checked)}
                            className="mr-2 border-[#000000]"
                        />
                        <Label htmlFor="outliers" className="text-sm underline cursor-pointer">Outliers</Label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="percentiles"
                            checked={showPercentiles}
                            onChange={(e) => setShowPercentiles(e.target.checked)}
                            className="mr-2 border-[#000000]"
                        />
                        <Label htmlFor="percentiles" className="text-sm underline cursor-pointer">Percentiles</Label>
                    </div>
                </div>

                <DialogFooter className="px-4 py-2 border-t border-[#000000] bg-[#EBF2F8] flex-shrink-0">
                    <div className="flex justify-end space-x-2">
                        <Button
                            className="px-6 py-1 h-8 bg-[#ADD8E6] border border-[#000000] hover:bg-[#87CEEB] text-black"
                            onClick={handleSubmit}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-1 h-8 bg-[#ADD8E6] border border-[#000000] hover:bg-[#87CEEB] text-black"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-1 h-8 bg-[#ADD8E6] border border-[#000000] hover:bg-[#87CEEB] text-black"
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