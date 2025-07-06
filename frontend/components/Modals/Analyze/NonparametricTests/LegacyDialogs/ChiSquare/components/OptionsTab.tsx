import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TourStep } from "../types";

interface OptionsTabProps {
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
    setDisplayStatistics: React.Dispatch<React.SetStateAction<{
        descriptive: boolean;
        quartiles: boolean;
    }>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

const OptionsTab: FC<OptionsTabProps> = ({
    displayStatistics,
    setDisplayStatistics,
    tourActive = false,
    currentStep = 0,
    tourSteps = []
}) => {
    return (
        <div>
            <div className="mb-4">
                <div className="text-sm font-medium mb-2">Statistics</div>
                <div className="border p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                            id="descriptive"
                            checked={displayStatistics.descriptive}
                            onCheckedChange={(checked) => 
                                setDisplayStatistics({ ...displayStatistics, descriptive: !!checked })
                            }
                        />
                        <Label htmlFor="descriptive" className="text-sm">Descriptive</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="quartiles"
                            checked={displayStatistics.quartiles}
                            onCheckedChange={(checked) => 
                                setDisplayStatistics({ ...displayStatistics, quartiles: !!checked })
                            }
                        />
                        <Label htmlFor="quartiles" className="text-sm">Quartiles</Label>
                    </div>
                </div>
            </div>
            
            {/* <div className="mb-4">
                <div className="text-sm font-medium mb-2">Missing Values</div>
                <div className="border p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="radio"
                            id="exclude-cases"
                            name="missing-values"
                            checked={true}
                            readOnly
                            className="h-4 w-4 text-black border-[#CCCCCC]"
                        />
                        <Label htmlFor="exclude-cases" className="text-sm">Exclude cases test-by-test</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="exclude-listwise"
                            name="missing-values"
                            checked={false}
                            readOnly
                            className="h-4 w-4 text-black border-[#CCCCCC]"
                        />
                        <Label htmlFor="exclude-listwise" className="text-sm">Exclude cases listwise</Label>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default OptionsTab;