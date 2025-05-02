import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StatisticsTabProps {
    displayStatistics: {
        descriptive: boolean;
        quartile: boolean;
    };
    setDisplayStatistics: React.Dispatch<React.SetStateAction<{
        descriptive: boolean;
        quartile: boolean;
    }>>;
}

const StatisticsTab: FC<StatisticsTabProps> = ({
    displayStatistics,
    setDisplayStatistics
}) => {
    return (
        <div className="border border-[#E6E6E6] rounded-md p-6">
            <div className="text-sm font-medium mb-4">Statistics</div>

            <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center">
                    <Checkbox
                        id="descriptive"
                        checked={displayStatistics.descriptive}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, descriptive: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="descriptive" className="text-sm cursor-pointer">
                        Descriptive
                    </Label>
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="quartile"
                        checked={displayStatistics.quartile}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, quartile: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="quartile" className="text-sm cursor-pointer">
                        Quartile
                    </Label>
                </div>
            </div>
        </div>
    );
};

export default StatisticsTab;