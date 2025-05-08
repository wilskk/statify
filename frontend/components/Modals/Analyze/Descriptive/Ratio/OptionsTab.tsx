import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Variable } from "@/types/Variable";

interface OptionsTabProps {
    groupVariable: Variable | null;
    sortByGroup: boolean;
    setSortByGroup: React.Dispatch<React.SetStateAction<boolean>>;
    sortOrder: "ascending" | "descending";
    setSortOrder: React.Dispatch<React.SetStateAction<"ascending" | "descending">>;
    displayResults: boolean;
    setDisplayResults: React.Dispatch<React.SetStateAction<boolean>>;
    saveToFile: boolean;
    setSaveToFile: React.Dispatch<React.SetStateAction<boolean>>;
    handleFileBrowse: () => void;
    handleStatistics: () => void;
}

const OptionsTab: FC<OptionsTabProps> = ({
                                             groupVariable,
                                             sortByGroup,
                                             setSortByGroup,
                                             sortOrder,
                                             setSortOrder,
                                             displayResults,
                                             setDisplayResults,
                                             saveToFile,
                                             setSaveToFile,
                                             handleFileBrowse,
                                             handleStatistics
                                         }) => {
    return (
        <div className="p-6 overflow-y-auto">
            <div className="space-y-6">
                {/* Sorting options */}
                <div className="border border-[#E6E6E6] rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Sort Options</div>

                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="sortByGroup"
                            checked={sortByGroup}
                            onCheckedChange={(checked) => setSortByGroup(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!groupVariable}
                        />
                        <Label htmlFor="sortByGroup" className="text-sm cursor-pointer">
                            Sort by group variable
                        </Label>
                    </div>

                    <div className="pl-6">
                        <RadioGroup
                            value={sortOrder}
                            onValueChange={(value) => setSortOrder(value as "ascending" | "descending")}
                            className="space-y-1"
                            disabled={!sortByGroup || !groupVariable}
                        >
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="ascending"
                                    id="ascending"
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="ascending" className="text-sm cursor-pointer">
                                    Ascending order
                                </Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="descending"
                                    id="descending"
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="descending" className="text-sm cursor-pointer">
                                    Descending order
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                {/* Output options */}
                <div className="border border-[#E6E6E6] rounded-md p-4">
                    <div className="text-sm font-medium mb-3">Output Options</div>

                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="displayResults"
                            checked={displayResults}
                            onCheckedChange={(checked) => setDisplayResults(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="displayResults" className="text-sm cursor-pointer">
                            Display results
                        </Label>
                    </div>

                    <div className="flex items-center mb-3">
                        <Checkbox
                            id="saveToFile"
                            checked={saveToFile}
                            onCheckedChange={(checked) => setSaveToFile(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="saveToFile" className="text-sm cursor-pointer">
                            Save results to external file
                        </Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Button
                                variant="outline"
                                className="h-8 px-4 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] text-sm"
                                onClick={handleFileBrowse}
                                disabled={!saveToFile}
                            >
                                File...
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                className="h-8 px-4 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] text-sm"
                                onClick={handleStatistics}
                            >
                                Statistics...
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptionsTab;