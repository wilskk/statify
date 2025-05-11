import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface OptionsTabProps {
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
    setDisplayStatistics: React.Dispatch<React.SetStateAction<{
        descriptive: boolean;
        quartiles: boolean;
    }>>;
}

const OptionsTab: FC<OptionsTabProps> = ({
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
                        id="quartiles"
                        checked={displayStatistics.quartiles}
                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, quartiles: !!checked})}
                        className="mr-2 border-[#CCCCCC]"
                    />
                    <Label htmlFor="quartiles" className="text-sm cursor-pointer">
                        Quartiles
                    </Label>
                </div>
            </div>
        </div>
    );
};

export default OptionsTab;