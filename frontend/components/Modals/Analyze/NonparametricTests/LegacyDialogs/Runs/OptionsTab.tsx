import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dispatch, SetStateAction } from "react";

interface OptionsTabProps {
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
    setDisplayStatistics: React.Dispatch<React.SetStateAction<{
        descriptive: boolean;
        quartiles: boolean;
    }>>;
    cutPoint: {
        median: boolean;
        mode: boolean;
        mean: boolean;
        custom: boolean;
    };
    setCutPoint: Dispatch<SetStateAction<{
        median: boolean;
        mode: boolean;
        mean: boolean;
        custom: boolean;
    }>>;
    customValue: number;
    setCustomValue: Dispatch<SetStateAction<number>>;
}

const OptionsTab: FC<OptionsTabProps> = ({
    displayStatistics,
    setDisplayStatistics,
    cutPoint,
    setCutPoint,
    customValue,
    setCustomValue
}) => {
    return (
        <div>
            {/* Cut Point Section */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-2">Cut Point</div>
                <div className="border p-4 rounded-md flex flex-wrap gap-6">
                    <div className="flex items-center">
                        <Checkbox
                            id="median"
                            checked={cutPoint.median}
                            onCheckedChange={(checked) => setCutPoint({ ...cutPoint, median: !!checked })}
                            className="mr-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="median">Median</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="mode"
                            checked={cutPoint.mode}
                            onCheckedChange={(checked) => setCutPoint({ ...cutPoint, mode: !!checked })}
                            className="mr-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="mode">Mode</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="mean"
                            checked={cutPoint.mean}
                            onCheckedChange={(checked) => setCutPoint({ ...cutPoint, mean: !!checked })}
                            className="mr-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="mean">Mean</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="custom"
                            checked={cutPoint.custom}
                            onCheckedChange={(checked) => setCutPoint({ ...cutPoint, custom: !!checked })}
                            className="mr-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="custom">Custom</Label>
                        <Input
                            id="custom-value"
                            type="number"
                            disabled={cutPoint.custom === false}
                            value={customValue}
                            onChange={(e) => setCustomValue(Number(e.target.value))}
                            className="ml-2 w-16 h-8 text-sm"
                        />
                    </div>
                </div>
            </div>
            
            {/* Statistics Section */}
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
                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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
                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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
                            className="h-4 w-4 text-primary border-input"
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
                            className="h-4 w-4 text-primary border-input"
                        />
                        <Label htmlFor="exclude-listwise" className="text-sm">Exclude cases listwise</Label>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default OptionsTab;