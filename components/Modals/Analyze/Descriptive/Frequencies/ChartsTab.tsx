import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ChartsTabProps {
    showCharts: boolean;
    setShowCharts: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChartsTab: FC<ChartsTabProps> = ({
                                           showCharts,
                                           setShowCharts
                                       }) => {
    return (
        <>
            <div className="border border-[#E6E6E6] rounded-md p-6">
                <div className="text-sm font-medium mb-4">Display</div>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="showCharts"
                            checked={showCharts}
                            onCheckedChange={(checked) => setShowCharts(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="showCharts" className="text-sm cursor-pointer">
                            Display charts
                        </Label>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-6 mt-6">
                <div className="text-sm font-medium mb-4">Chart Type</div>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="barCharts"
                            className="mr-2 border-[#CCCCCC]"
                            checked={true}
                            disabled={!showCharts}
                        />
                        <Label htmlFor="barCharts" className="text-sm cursor-pointer">
                            Bar charts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="pieCharts"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showCharts}
                        />
                        <Label htmlFor="pieCharts" className="text-sm cursor-pointer">
                            Pie charts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="histograms"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showCharts}
                        />
                        <Label htmlFor="histograms" className="text-sm cursor-pointer">
                            Histograms (numeric variables only)
                        </Label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChartsTab;