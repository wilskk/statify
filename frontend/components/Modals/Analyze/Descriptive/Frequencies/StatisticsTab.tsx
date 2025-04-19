import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StatisticsTabProps {
    showFrequencyTables: boolean;
    setShowFrequencyTables: React.Dispatch<React.SetStateAction<boolean>>;
    showStatistics: boolean;
    setShowStatistics: React.Dispatch<React.SetStateAction<boolean>>;
}

const StatisticsTab: FC<StatisticsTabProps> = ({
                                                   showFrequencyTables,
                                                   setShowFrequencyTables,
                                                   showStatistics,
                                                   setShowStatistics
                                               }) => {
    return (
        <>
            <div className="border border-[#E6E6E6] rounded-md p-6">
                <div className="text-sm font-medium mb-4">Display</div>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="frequencyTables"
                            checked={showFrequencyTables}
                            onCheckedChange={(checked) => setShowFrequencyTables(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="frequencyTables" className="text-sm cursor-pointer">
                            Frequency tables
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="showStatistics"
                            checked={showStatistics}
                            onCheckedChange={(checked) => setShowStatistics(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="showStatistics" className="text-sm cursor-pointer">
                            Show statistics
                        </Label>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-6 mt-6">
                <div className="text-sm font-medium mb-4">Statistics</div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="percentiles"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                        />
                        <Label htmlFor="percentiles" className="text-sm cursor-pointer">
                            Percentiles
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="centralTendency"
                            className="mr-2 border-[#CCCCCC]"
                            checked={true}
                            disabled={!showStatistics}
                        />
                        <Label htmlFor="centralTendency" className="text-sm cursor-pointer">
                            Central Tendency
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="dispersion"
                            className="mr-2 border-[#CCCCCC]"
                            checked={true}
                            disabled={!showStatistics}
                        />
                        <Label htmlFor="dispersion" className="text-sm cursor-pointer">
                            Dispersion
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="distribution"
                            className="mr-2 border-[#CCCCCC]"
                            checked={true}
                            disabled={!showStatistics}
                        />
                        <Label htmlFor="distribution" className="text-sm cursor-pointer">
                            Distribution
                        </Label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StatisticsTab;