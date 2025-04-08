import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface OptionsTabProps {
    primaryCaseIndicator: "last" | "first";
    setPrimaryCaseIndicator: (value: "last" | "first") => void;
    primaryName: string;
    setPrimaryName: (value: string) => void;
    filterByIndicator: boolean;
    setFilterByIndicator: (value: boolean) => void;
    sequentialCount: boolean;
    setSequentialCount: (value: boolean) => void;
    sequentialName: string;
    setSequentialName: (value: string) => void;
    moveMatchingToTop: boolean;
    setMoveMatchingToTop: (value: boolean) => void;
    displayFrequencies: boolean;
    setDisplayFrequencies: (value: boolean) => void;
}

const OptionsTab: FC<OptionsTabProps> = ({
                                             primaryCaseIndicator,
                                             setPrimaryCaseIndicator,
                                             primaryName,
                                             setPrimaryName,
                                             filterByIndicator,
                                             setFilterByIndicator,
                                             sequentialCount,
                                             setSequentialCount,
                                             sequentialName,
                                             setSequentialName,
                                             moveMatchingToTop,
                                             setMoveMatchingToTop,
                                             displayFrequencies,
                                             setDisplayFrequencies
                                         }) => {
    return (
        <>
            <div className="border border-[#E6E6E6] rounded-md p-6 mb-6">
                <div className="text-sm font-medium mb-4">Variables to Create</div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="primaryIndicator"
                                    checked={true}
                                    className="mr-2 border-[#CCCCCC]"
                                    disabled={true}
                                />
                                <Label htmlFor="primaryIndicator" className="text-sm font-medium cursor-pointer">
                                    Indicator of primary cases (1=unique or primary, 0=duplicate)
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-[#888888]">
                                Creates a variable that identifies primary cases (1) and duplicate cases (0)
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="primaryName" className="text-xs whitespace-nowrap mr-2">
                                Name:
                            </Label>
                            <Input
                                id="primaryName"
                                value={primaryName}
                                onChange={(e) => setPrimaryName(e.target.value)}
                                className="h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                            />
                        </div>
                    </div>

                    <div className="ml-6 space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="last"
                                checked={primaryCaseIndicator === "last"}
                                onCheckedChange={() => setPrimaryCaseIndicator("last")}
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="last" className="text-sm cursor-pointer">
                                Last case in each group is primary
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox
                                id="first"
                                checked={primaryCaseIndicator === "first"}
                                onCheckedChange={() => setPrimaryCaseIndicator("first")}
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="first" className="text-sm cursor-pointer">
                                First case in each group is primary
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox
                                id="filterIndicator"
                                checked={filterByIndicator}
                                onCheckedChange={(checked) => setFilterByIndicator(!!checked)}
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="filterIndicator" className="text-sm cursor-pointer">
                                Filter by indicator values
                            </Label>
                        </div>
                    </div>

                    <Separator className="my-4 border-[#E6E6E6]" />

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="sequentialCount"
                                    checked={sequentialCount}
                                    onCheckedChange={(checked) => setSequentialCount(!!checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="sequentialCount" className="text-sm font-medium cursor-pointer">
                                    Sequential count of matching case in each group (0=nonmatching case)
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-[#888888]">
                                Sequential count of matching cases in each group (0=nonmatching case)
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="sequentialName" className="text-xs whitespace-nowrap mr-2">
                                Name:
                            </Label>
                            <Input
                                id="sequentialName"
                                value={sequentialName}
                                onChange={(e) => setSequentialName(e.target.value)}
                                className="h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                                disabled={!sequentialCount}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-6">
                <div className="text-sm font-medium mb-4">Additional Options</div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="moveToTop"
                            checked={moveMatchingToTop}
                            onCheckedChange={(checked) => setMoveMatchingToTop(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="moveToTop" className="text-sm cursor-pointer">
                            Move matching cases to the top of the file
                        </Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="displayFrequencies"
                            checked={displayFrequencies}
                            onCheckedChange={(checked) => setDisplayFrequencies(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="displayFrequencies" className="text-sm cursor-pointer">
                            Display frequencies for created variables
                        </Label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OptionsTab;