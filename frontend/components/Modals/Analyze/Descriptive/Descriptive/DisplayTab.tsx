import React, { FC } from "react";
import { Label } from "@/components/ui/label";

interface DisplayTabProps {
    displayOrder: string;
    setDisplayOrder: React.Dispatch<React.SetStateAction<string>>;
    variableListFormat: string;
    setVariableListFormat: React.Dispatch<React.SetStateAction<string>>;
}

const DisplayTab: FC<DisplayTabProps> = ({
                                             displayOrder,
                                             setDisplayOrder,
                                             variableListFormat,
                                             setVariableListFormat
                                         }) => {
    return (
        <>
            <div className="border border-[#E6E6E6] rounded-md p-6 mb-6">
                <div className="text-sm font-medium mb-4">Display Order</div>

                <div className="space-y-3">
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="analysisOrder"
                            checked={displayOrder === "analysis"}
                            onChange={() => setDisplayOrder("analysis")}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="analysisOrder" className="text-sm cursor-pointer">
                            Variable list order
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="alphabeticalOrder"
                            checked={displayOrder === "alphabetical"}
                            onChange={() => setDisplayOrder("alphabetical")}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="alphabeticalOrder" className="text-sm cursor-pointer">
                            Alphabetical
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="ascendingMeans"
                            checked={displayOrder === "ascendingMeans"}
                            onChange={() => setDisplayOrder("ascendingMeans")}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="ascendingMeans" className="text-sm cursor-pointer">
                            Ascending means
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="descendingMeans"
                            checked={displayOrder === "descendingMeans"}
                            onChange={() => setDisplayOrder("descendingMeans")}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="descendingMeans" className="text-sm cursor-pointer">
                            Descending means
                        </Label>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-6">
                <div className="text-sm font-medium mb-4">Variable List Format</div>

                <div className="space-y-3">
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="nameFormat"
                            checked={variableListFormat === "name"}
                            onChange={() => setVariableListFormat("name")}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="nameFormat" className="text-sm cursor-pointer">
                            Variable names
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="labelFormat"
                            checked={variableListFormat === "label"}
                            onChange={() => setVariableListFormat("label")}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="labelFormat" className="text-sm cursor-pointer">
                            Variable labels
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="bothFormat"
                            checked={variableListFormat === "both"}
                            onChange={() => setVariableListFormat("both")}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="bothFormat" className="text-sm cursor-pointer">
                            Both names and labels
                        </Label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DisplayTab;