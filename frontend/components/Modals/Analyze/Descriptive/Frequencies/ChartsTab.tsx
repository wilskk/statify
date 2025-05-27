import React, { FC, useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ChartsTabProps {
    showCharts: boolean;
    setShowCharts: React.Dispatch<React.SetStateAction<boolean>>;
    chartType: "none" | "barCharts" | "pieCharts" | "histograms";
    setChartType: React.Dispatch<React.SetStateAction<"none" | "barCharts" | "pieCharts" | "histograms">>;
    chartValues: "frequencies" | "percentages";
    setChartValues: React.Dispatch<React.SetStateAction<"frequencies" | "percentages">>;
    showNormalCurve: boolean;
    setShowNormalCurve: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChartsTab: FC<ChartsTabProps> = ({
    showCharts,
    setShowCharts,
    chartType,
    setChartType,
    chartValues,
    setChartValues,
    showNormalCurve,
    setShowNormalCurve,
}) => {
    // Function to determine text styling based on disabled state
    const getTextClass = (disabled: boolean) => {
        return disabled ? "text-muted-foreground" : "";
    };

    const isChartValuesDisabled = !showCharts || chartType === "none" || chartType === "histograms";

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="border border-border rounded-md p-4 bg-card">
                <div className="flex items-center mb-4">
                    <Checkbox
                        id="displayCharts"
                        checked={showCharts}
                        onCheckedChange={(checked) => setShowCharts(!!checked)}
                        className="mr-2"
                    />
                    <Label htmlFor="displayCharts" className="text-sm font-medium cursor-pointer">
                        Display charts
                    </Label>
                </div>

                <div className="text-sm font-medium mb-3">Chart Type</div>
                <RadioGroup
                    value={chartType}
                    onValueChange={(value) => setChartType(value as typeof chartType)}
                    className="space-y-2"
                    disabled={!showCharts}
                >
                    <div className="flex items-center">
                        <RadioGroupItem id="none" value="none" className="mr-2" disabled={!showCharts} />
                        <Label htmlFor="none" className={`text-sm cursor-pointer ${getTextClass(!showCharts)}`}>
                            None
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem id="barCharts" value="barCharts" className="mr-2" disabled={!showCharts} />
                        <Label htmlFor="barCharts" className={`text-sm cursor-pointer ${getTextClass(!showCharts)}`}>
                            Bar charts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem id="pieCharts" value="pieCharts" className="mr-2" disabled={!showCharts} />
                        <Label htmlFor="pieCharts" className={`text-sm cursor-pointer ${getTextClass(!showCharts)}`}>
                            Pie charts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem id="histograms" value="histograms" className="mr-2" disabled={!showCharts} />
                        <Label htmlFor="histograms" className={`text-sm cursor-pointer ${getTextClass(!showCharts)}`}>
                            Histograms
                        </Label>
                    </div>

                    <div className="flex items-center ml-6">
                        <Checkbox
                            id="normalCurve"
                            checked={showNormalCurve}
                            onCheckedChange={(checked) => setShowNormalCurve(!!checked)}
                            className="mr-2"
                            disabled={!showCharts || chartType !== "histograms"}
                        />
                        <Label
                            htmlFor="normalCurve"
                            className={`text-sm cursor-pointer ${getTextClass(!showCharts || chartType !== "histograms")}`}
                        >
                            Show normal curve on histogram
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="border border-border rounded-md p-4 bg-card">
                <div className={`text-sm font-medium mb-3 ${getTextClass(isChartValuesDisabled)}`}>Chart Values</div>
                <RadioGroup
                    value={chartValues}
                    onValueChange={(value) => setChartValues(value as typeof chartValues)}
                    className="space-y-2"
                    disabled={isChartValuesDisabled}
                >
                    <div className="flex items-center">
                        <RadioGroupItem
                            id="frequencies"
                            value="frequencies"
                            className="mr-2"
                            disabled={isChartValuesDisabled}
                        />
                        <Label
                            htmlFor="frequencies"
                            className={`text-sm cursor-pointer ${getTextClass(isChartValuesDisabled)}`}
                        >
                            Frequencies
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <RadioGroupItem
                            id="percentages"
                            value="percentages"
                            className="mr-2"
                            disabled={isChartValuesDisabled}
                        />
                        <Label
                            htmlFor="percentages"
                            className={`text-sm cursor-pointer ${getTextClass(isChartValuesDisabled)}`}
                        >
                            Percentages
                        </Label>
                    </div>
                </RadioGroup>
            </div>
        </div>
    );
};

export default ChartsTab;