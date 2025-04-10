import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StatisticsTabProps {
    displayStatistics: {
        mean: boolean;
        stdDev: boolean;
        minimum: boolean;
        maximum: boolean;
        variance: boolean;
        range: boolean;
        sum: boolean;
        median: boolean;
        skewness: boolean;
        kurtosis: boolean;
        standardError: boolean;
    };
    setDisplayStatistics: React.Dispatch<React.SetStateAction<{
        mean: boolean;
        stdDev: boolean;
        minimum: boolean;
        maximum: boolean;
        variance: boolean;
        range: boolean;
        sum: boolean;
        median: boolean;
        skewness: boolean;
        kurtosis: boolean;
        standardError: boolean;
    }>>;
}

const StatisticsTab: FC<StatisticsTabProps> = ({
                                                   displayStatistics,
                                                   setDisplayStatistics
                                               }) => {
    return (
        <div className="border border-[#E6E6E6] rounded-md p-6">
            <div className="text-sm font-medium mb-4">Descriptive Statistics</div>

            <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center">
                    <Checkbox
                        id="mean"
                        checked={displayStatistics.mean}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, mean: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="mean" className="text-sm cursor-pointer">
                        Mean
                    </Label>
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="variance"
                        checked={displayStatistics.variance}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, variance: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="variance" className="text-sm cursor-pointer">
                        Variance
                    </Label>
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="stdDev"
                        checked={displayStatistics.stdDev}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, stdDev: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="stdDev" className="text-sm cursor-pointer">
                        Standard deviation
                    </Label>
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="range"
                        checked={displayStatistics.range}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, range: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="range" className="text-sm cursor-pointer">
                        Range
                    </Label>
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="minimum"
                        checked={displayStatistics.minimum}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, minimum: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="minimum" className="text-sm cursor-pointer">
                        Minimum
                    </Label>
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="sum"
                        checked={displayStatistics.sum}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, sum: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="sum" className="text-sm cursor-pointer">
                        Sum
                    </Label>
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="maximum"
                        checked={displayStatistics.maximum}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, maximum: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="maximum" className="text-sm cursor-pointer">
                        Maximum
                    </Label>
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="median"
                        checked={displayStatistics.median}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, median: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="median" className="text-sm cursor-pointer">
                        Median
                    </Label>
                </div>
            </div>

            <div className="mt-6 border-t border-[#E6E6E6] pt-4">
                <div className="text-sm font-medium mb-3">Distribution</div>

                <div className="grid grid-cols-2 gap-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="skewness"
                            checked={displayStatistics.skewness}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, skewness: !!checked})}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="skewness" className="text-sm cursor-pointer">
                            Skewness
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="kurtosis"
                            checked={displayStatistics.kurtosis}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, kurtosis: !!checked})}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="kurtosis" className="text-sm cursor-pointer">
                            Kurtosis
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="standardError"
                            checked={displayStatistics.standardError}
                            onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, standardError: !!checked})}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="standardError" className="text-sm cursor-pointer">
                            Standard error of mean
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsTab;