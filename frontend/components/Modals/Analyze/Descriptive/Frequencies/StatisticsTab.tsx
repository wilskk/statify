import React, { FC, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import type { StatisticsOptions } from "@/types/Analysis";

interface StatisticsTabProps {
    showStatistics: boolean;
    setShowStatistics: React.Dispatch<React.SetStateAction<boolean>>;
    resetCounter: number;
    onOptionsChange: (options: StatisticsOptions) => void;
}

const StatisticsTab: FC<StatisticsTabProps> = ({
                                                   showStatistics,
                                                   setShowStatistics,
                                                   resetCounter,
                                                   onOptionsChange
                                               }) => {
    const [percentileValues, setPercentileValues] = useState<string[]>([]);
    const [currentPercentile, setCurrentPercentile] = useState("");
    const [selectedPercentile, setSelectedPercentile] = useState<string | null>(null);
    const [cutPointsValue, setCutPointsValue] = useState("10");
    const [enablePercentiles, setEnablePercentiles] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ title: "", description: "" });

    // State for individual checkboxes
    const [quartilesChecked, setQuartilesChecked] = useState(false);
    const [cutPointsChecked, setCutPointsChecked] = useState(false);
    const [meanChecked, setMeanChecked] = useState(false);
    const [medianChecked, setMedianChecked] = useState(false);
    const [modeChecked, setModeChecked] = useState(false);
    const [sumChecked, setSumChecked] = useState(false);
    const [stdDevChecked, setStdDevChecked] = useState(false);
    const [varianceChecked, setVarianceChecked] = useState(false);
    const [rangeChecked, setRangeChecked] = useState(false);
    const [minChecked, setMinChecked] = useState(false);
    const [maxChecked, setMaxChecked] = useState(false);
    const [seMeanChecked, setSeMeanChecked] = useState(false);
    const [kurtosisChecked, setKurtosisChecked] = useState(false);
    const [skewnessChecked, setSkewnessChecked] = useState(false);

    // Effect to report options change
    useEffect(() => {
        const options: StatisticsOptions = {
            percentileValues: {
                quartiles: quartilesChecked,
                cutPoints: cutPointsChecked,
                cutPointsN: parseInt(cutPointsValue, 10) || 10,
                enablePercentiles: enablePercentiles,
                percentilesList: percentileValues,
            },
            centralTendency: {
                mean: meanChecked,
                median: medianChecked,
                mode: modeChecked,
                sum: sumChecked,
            },
            dispersion: {
                stddev: stdDevChecked,
                variance: varianceChecked,
                range: rangeChecked,
                minimum: minChecked,
                maximum: maxChecked,
                stdErrorMean: seMeanChecked,
            },
            distribution: {
                skewness: skewnessChecked,
                stdErrorSkewness: skewnessChecked,
                kurtosis: kurtosisChecked,
                stdErrorKurtosis: kurtosisChecked,
            },
        };
        onOptionsChange(options);
    }, [
        quartilesChecked, cutPointsChecked, cutPointsValue, enablePercentiles, percentileValues,
        meanChecked, medianChecked, modeChecked, sumChecked,
        stdDevChecked, varianceChecked, rangeChecked, minChecked, maxChecked, seMeanChecked,
        kurtosisChecked, skewnessChecked,
    ]);

    // Reset Effect
    useEffect(() => {
        if (resetCounter > 0) {
            // Reset percentile states
            setPercentileValues([]);
            setCurrentPercentile("");
            setSelectedPercentile(null);
            setCutPointsValue("10");
            setEnablePercentiles(false);

            // Reset checkbox states
            setQuartilesChecked(false);
            setCutPointsChecked(false);
            setMeanChecked(false);
            setMedianChecked(false);
            setModeChecked(false);
            setSumChecked(false);
            setStdDevChecked(false);
            setVarianceChecked(false);
            setRangeChecked(false);
            setMinChecked(false);
            setMaxChecked(false);
            setSeMeanChecked(false);
            setKurtosisChecked(false);
            setSkewnessChecked(false);
        }
    }, [resetCounter]);

    // Helper function to validate percentile value
    const validatePercentileValue = (value: string): boolean => {
        const numValue = Number(value);
        if (isNaN(numValue)) return false;
        if (numValue < 0 || numValue > 100) return false;
        return true;
    };

    const handleAddPercentile = () => {
        if (!currentPercentile) return;

        // Validate the percentile value is between 0-100
        if (!validatePercentileValue(currentPercentile)) {
            setAlertMessage({
                title: "Invalid percentile",
                description: "Percentile must be a number between 0 and 100"
            });
            setAlertOpen(true);
            return;
        }

        // Check for duplicates
        if (percentileValues.includes(currentPercentile)) {
            setAlertMessage({
                title: "Duplicate percentile",
                description: "This percentile value already exists"
            });
            setAlertOpen(true);
            return;
        }

        setPercentileValues([...percentileValues, currentPercentile]);
        setCurrentPercentile("");
    };

    const handleChangePercentile = () => {
        if (!selectedPercentile || !currentPercentile) return;

        // Skip if no actual change
        if (selectedPercentile === currentPercentile) {
            setSelectedPercentile(null);
            setCurrentPercentile("");
            return;
        }

        // Validate the percentile value is between 0-100
        if (!validatePercentileValue(currentPercentile)) {
            setAlertMessage({
                title: "Invalid percentile",
                description: "Percentile must be a number between 0 and 100"
            });
            setAlertOpen(true);
            return;
        }

        // Check if the new value would create a duplicate
        if (percentileValues.includes(currentPercentile)) {
            setAlertMessage({
                title: "Duplicate percentile",
                description: "This percentile value already exists"
            });
            setAlertOpen(true);
            return;
        }

        const newValues = percentileValues.map(p =>
            p === selectedPercentile ? currentPercentile : p
        );

        setPercentileValues(newValues);
        setSelectedPercentile(null);
        setCurrentPercentile("");
    };

    const handleRemovePercentile = () => {
        if (selectedPercentile) {
            setPercentileValues(percentileValues.filter(p => p !== selectedPercentile));
            setSelectedPercentile(null);
            setCurrentPercentile("");
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
                        <AlertDialogDescription>{alertMessage.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="border border-[#E6E6E6] rounded-md p-4">
                <div className={`text-sm font-medium mb-3 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Percentile Values</div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="quartiles"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={quartilesChecked}
                            onCheckedChange={(checked) => setQuartilesChecked(!!checked)}
                        />
                        <Label htmlFor="quartiles" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Quartiles
                        </Label>
                    </div>

                    <div>
                        <div className="flex items-start mb-2">
                            <Checkbox
                                id="cutPoints"
                                className="mr-2 border-[#CCCCCC] mt-1"
                                disabled={!showStatistics}
                                checked={cutPointsChecked}
                                onCheckedChange={(checked) => setCutPointsChecked(!!checked)}
                            />
                            <div className="flex flex-wrap items-center">
                                <Label htmlFor="cutPoints" className={`text-sm cursor-pointer mr-2 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                                    Cut points for
                                </Label>
                                <div className="flex items-center">
                                    <Input
                                        className="w-16 h-7 text-sm border-[#CCCCCC]"
                                        value={cutPointsValue}
                                        onChange={(e) => setCutPointsValue(e.target.value)}
                                        disabled={!showStatistics}
                                    />
                                    <span className={`text-sm ml-2 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>equal groups</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center mb-2">
                            <Checkbox
                                id="enablePercentiles"
                                className="mr-2 border-[#CCCCCC]"
                                checked={enablePercentiles}
                                onCheckedChange={(checked) => setEnablePercentiles(!!checked)}
                                disabled={!showStatistics}
                            />
                            <Label htmlFor="enablePercentiles" className={`text-sm font-medium cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                                Percentile(s):
                            </Label>
                        </div>

                        <div className="flex">
                            <div className="flex flex-col gap-1.5 mr-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-3 border-[#CCCCCC] text-xs font-medium hover:bg-[#F5F5F5]"
                                    onClick={handleAddPercentile}
                                    disabled={!showStatistics || !enablePercentiles || !currentPercentile}
                                >
                                    Add
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-3 border-[#CCCCCC] text-xs font-medium hover:bg-[#F5F5F5]"
                                    onClick={handleChangePercentile}
                                    disabled={!showStatistics || !enablePercentiles || !selectedPercentile || !currentPercentile}
                                >
                                    Change
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-3 border-[#CCCCCC] text-xs font-medium hover:bg-[#F5F5F5]"
                                    onClick={handleRemovePercentile}
                                    disabled={!showStatistics || !enablePercentiles || !selectedPercentile}
                                >
                                    Remove
                                </Button>
                            </div>

                            <div className="flex-1">
                                <Input
                                    id="percentiles"
                                    className="h-8 text-sm border-[#CCCCCC] mb-2"
                                    value={currentPercentile}
                                    onChange={(e) => setCurrentPercentile(e.target.value)}
                                    disabled={!showStatistics || !enablePercentiles}
                                    placeholder="Enter value (0-100)"
                                />

                                <div
                                    className={`border border-[#CCCCCC] bg-white rounded-sm h-[110px] overflow-y-auto ${(!showStatistics || !enablePercentiles) ? 'bg-[#F5F5F5]' : ''}`}
                                    onClick={() => setSelectedPercentile(null)}
                                >
                                    {percentileValues.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-[#AAAAAA] text-xs italic">
                                            {(!showStatistics || !enablePercentiles) ? "Percentiles disabled" : "No percentiles added"}
                                        </div>
                                    )}
                                    {percentileValues.map((value, index) => (
                                        <div
                                            key={index}
                                            className={`text-sm py-1.5 px-2 cursor-pointer border-b border-[#F0F0F0] last:border-b-0 ${
                                                selectedPercentile === value ? 'bg-[#E6E6E6]' : 'hover:bg-[#F8F8F8]'
                                            } ${(!showStatistics || !enablePercentiles) ? 'text-[#AAAAAA]' : ''}`}
                                            onClick={(e) => {
                                                if (!showStatistics || !enablePercentiles) return;
                                                e.stopPropagation();
                                                setSelectedPercentile(value);
                                                setCurrentPercentile(value);
                                            }}
                                        >
                                            {value}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-4">
                <div className={`text-sm font-medium mb-3 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Central Tendency</div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <Checkbox
                            id="mean"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={meanChecked}
                            onCheckedChange={(checked) => setMeanChecked(!!checked)}
                        />
                        <Label htmlFor="mean" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Mean
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="median"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={medianChecked}
                            onCheckedChange={(checked) => setMedianChecked(!!checked)}
                        />
                        <Label htmlFor="median" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Median
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="mode"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={modeChecked}
                            onCheckedChange={(checked) => setModeChecked(!!checked)}
                        />
                        <Label htmlFor="mode" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Mode
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="sum"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={sumChecked}
                            onCheckedChange={(checked) => setSumChecked(!!checked)}
                        />
                        <Label htmlFor="sum" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Sum
                        </Label>
                    </div>

                    {/* Values are group midpoints moved here, with separator */}
                    <div className="pt-3 mt-2 border-t border-[#F0F0F0]">
                        <div className="flex items-center">
                            <Checkbox
                                id="groupMidpoints"
                                className="mr-2 border-[#CCCCCC]"
                                disabled={!showStatistics}
                            />
                            <Label htmlFor="groupMidpoints" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                                Values are group midpoints
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-4">
                <div className={`text-sm font-medium mb-3 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Dispersion</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center">
                        <Checkbox
                            id="stdDeviation"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={stdDevChecked}
                            onCheckedChange={(checked) => setStdDevChecked(!!checked)}
                        />
                        <Label htmlFor="stdDeviation" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Std. deviation
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="minimum"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={minChecked}
                            onCheckedChange={(checked) => setMinChecked(!!checked)}
                        />
                        <Label htmlFor="minimum" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Minimum
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="variance"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={varianceChecked}
                            onCheckedChange={(checked) => setVarianceChecked(!!checked)}
                        />
                        <Label htmlFor="variance" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Variance
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="maximum"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={maxChecked}
                            onCheckedChange={(checked) => setMaxChecked(!!checked)}
                        />
                        <Label htmlFor="maximum" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Maximum
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="range"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={rangeChecked}
                            onCheckedChange={(checked) => setRangeChecked(!!checked)}
                        />
                        <Label htmlFor="range" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Range
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="seMean"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={seMeanChecked}
                            onCheckedChange={(checked) => setSeMeanChecked(!!checked)}
                        />
                        <Label htmlFor="seMean" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            S.E. mean
                        </Label>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-4">
                <div className={`text-sm font-medium mb-3 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Distribution</div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <Checkbox
                            id="skewness"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={skewnessChecked}
                            onCheckedChange={(checked) => setSkewnessChecked(!!checked)}
                        />
                        <Label htmlFor="skewness" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Skewness
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="kurtosis"
                            className="mr-2 border-[#CCCCCC]"
                            disabled={!showStatistics}
                            checked={kurtosisChecked}
                            onCheckedChange={(checked) => setKurtosisChecked(!!checked)}
                        />
                        <Label htmlFor="kurtosis" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                            Kurtosis
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsTab;