import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const FormatTab: FC = () => {
    return (
        <>
            <div className="border border-[#E6E6E6] rounded-md p-6">
                <div className="text-sm font-medium mb-4">Order</div>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="ascendingValues"
                            className="mr-2 border-[#CCCCCC]"
                            checked={true}
                        />
                        <Label htmlFor="ascendingValues" className="text-sm cursor-pointer">
                            Ascending values
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="descendingValues"
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="descendingValues" className="text-sm cursor-pointer">
                            Descending values
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="ascendingCounts"
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="ascendingCounts" className="text-sm cursor-pointer">
                            Ascending counts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="descendingCounts"
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="descendingCounts" className="text-sm cursor-pointer">
                            Descending counts
                        </Label>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-6 mt-6">
                <div className="text-sm font-medium mb-4">Multiple Variables</div>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="compareVariables"
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="compareVariables" className="text-sm cursor-pointer">
                            Compare variables (side-by-side tables)
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="suppressTables"
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="suppressTables" className="text-sm cursor-pointer">
                            Suppress tables with more than 100 distinct values
                        </Label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FormatTab;