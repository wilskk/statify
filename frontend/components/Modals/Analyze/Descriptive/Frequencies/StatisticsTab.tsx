import React, { FC, useState, useEffect, Dispatch, SetStateAction } from "react";
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
import { useMobile } from '@/hooks/useMobile';

interface StatisticsTabProps {
    showStatistics: boolean;
    setShowStatistics: Dispatch<SetStateAction<boolean>>;

    // Percentiles
    quartilesChecked: boolean;
    setQuartilesChecked: Dispatch<SetStateAction<boolean>>;
    cutPointsChecked: boolean;
    setCutPointsChecked: Dispatch<SetStateAction<boolean>>;
    cutPointsValue: string;
    setCutPointsValue: Dispatch<SetStateAction<string>>;
    enablePercentiles: boolean;
    setEnablePercentiles: Dispatch<SetStateAction<boolean>>;
    percentileValues: string[];
    setPercentileValues: Dispatch<SetStateAction<string[]>>;
    currentPercentileInput: string;
    setCurrentPercentileInput: Dispatch<SetStateAction<string>>;
    selectedPercentileItem: string | null;
    setSelectedPercentileItem: Dispatch<SetStateAction<string | null>>;

    // Central Tendency
    meanChecked: boolean;
    setMeanChecked: Dispatch<SetStateAction<boolean>>;
    medianChecked: boolean;
    setMedianChecked: Dispatch<SetStateAction<boolean>>;
    modeChecked: boolean;
    setModeChecked: Dispatch<SetStateAction<boolean>>;
    sumChecked: boolean;
    setSumChecked: Dispatch<SetStateAction<boolean>>;

    // Dispersion
    stdDevChecked: boolean;
    setStdDevChecked: Dispatch<SetStateAction<boolean>>;
    varianceChecked: boolean;
    setVarianceChecked: Dispatch<SetStateAction<boolean>>;
    rangeChecked: boolean;
    setRangeChecked: Dispatch<SetStateAction<boolean>>;
    minChecked: boolean;
    setMinChecked: Dispatch<SetStateAction<boolean>>;
    maxChecked: boolean;
    setMaxChecked: Dispatch<SetStateAction<boolean>>;
    seMeanChecked: boolean;
    setSeMeanChecked: Dispatch<SetStateAction<boolean>>;

    // Distribution
    skewnessChecked: boolean;
    setSkewnessChecked: Dispatch<SetStateAction<boolean>>;
    kurtosisChecked: boolean;
    setKurtosisChecked: Dispatch<SetStateAction<boolean>>;
}

const StatisticsTab: FC<StatisticsTabProps> = ({
    showStatistics,
    setShowStatistics,
    // Destructure all new props
    quartilesChecked, setQuartilesChecked,
    cutPointsChecked, setCutPointsChecked,
    cutPointsValue, setCutPointsValue,
    enablePercentiles, setEnablePercentiles,
    percentileValues, setPercentileValues,
    currentPercentileInput, setCurrentPercentileInput,
    selectedPercentileItem, setSelectedPercentileItem,
    meanChecked, setMeanChecked,
    medianChecked, setMedianChecked,
    modeChecked, setModeChecked,
    sumChecked, setSumChecked,
    stdDevChecked, setStdDevChecked,
    varianceChecked, setVarianceChecked,
    rangeChecked, setRangeChecked,
    minChecked, setMinChecked,
    maxChecked, setMaxChecked,
    seMeanChecked, setSeMeanChecked,
    skewnessChecked, setSkewnessChecked,
    kurtosisChecked, setKurtosisChecked
}) => {
    // Remove internal state for statistics options
    // const [percentileValues, setPercentileValues] = useState<string[]>([]);
    // const [currentPercentile, setCurrentPercentile] = useState(""); // Renamed to currentPercentileInput
    // const [selectedPercentile, setSelectedPercentile] = useState<string | null>(null); // Renamed to selectedPercentileItem
    // const [cutPointsValue, setCutPointsValue] = useState("10");
    // const [enablePercentiles, setEnablePercentiles] = useState(false);

    // Keep alert state internal to this component
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ title: "", description: "" });

    // Remove internal state for individual checkboxes
    // const [quartilesChecked, setQuartilesChecked] = useState(false);
    // const [cutPointsChecked, setCutPointsChecked] = useState(false);
    // const [meanChecked, setMeanChecked] = useState(false);
    // const [medianChecked, setMedianChecked] = useState(false);
    // const [modeChecked, setModeChecked] = useState(false);
    // const [sumChecked, setSumChecked] = useState(false);
    // const [stdDevChecked, setStdDevChecked] = useState(false);
    // const [varianceChecked, setVarianceChecked] = useState(false);
    // const [rangeChecked, setRangeChecked] = useState(false);
    // const [minChecked, setMinChecked] = useState(false);
    // const [maxChecked, setMaxChecked] = useState(false);
    // const [seMeanChecked, setSeMeanChecked] = useState(false);
    // const [kurtosisChecked, setKurtosisChecked] = useState(false);
    // const [skewnessChecked, setSkewnessChecked] = useState(false);

    const { isMobile, isPortrait } = useMobile();

    // Remove useEffect that reported changes via onOptionsChange
    // useEffect(() => { ... onOptionsChange(options); }, [...dependencies]);

    // Remove Reset Effect (reset is handled in index.tsx now)
    // useEffect(() => { if (resetCounter > 0) { ... } }, [resetCounter]);

    // Helper function to validate percentile value
    const validatePercentileValue = (value: string): boolean => {
        const numValue = Number(value);
        if (isNaN(numValue)) return false;
        if (numValue < 0 || numValue > 100) return false;
        return true;
    };

    // Update percentile handlers to use props
    const handleAddPercentile = () => {
        if (!currentPercentileInput) return; // Use prop state

        // Validate the percentile value is between 0-100
        if (!validatePercentileValue(currentPercentileInput)) { // Use prop state
            setAlertMessage({
                title: "Invalid percentile",
                description: "Percentile must be a number between 0 and 100"
            });
            setAlertOpen(true);
            return;
        }

        // Check for duplicates
        if (percentileValues.includes(currentPercentileInput)) { // Use prop state
            setAlertMessage({
                title: "Duplicate percentile",
                description: "This percentile value already exists"
            });
            setAlertOpen(true);
            return;
        }

        setPercentileValues([...percentileValues, currentPercentileInput]); // Use prop setter & state
        setCurrentPercentileInput(""); // Use prop setter
    };

    const handleChangePercentile = () => {
        if (!selectedPercentileItem || !currentPercentileInput) return; // Use prop states

        // Skip if no actual change
        if (selectedPercentileItem === currentPercentileInput) { // Use prop states
            setSelectedPercentileItem(null); // Use prop setter
            setCurrentPercentileInput(""); // Use prop setter
            return;
        }

        // Validate the percentile value is between 0-100
        if (!validatePercentileValue(currentPercentileInput)) { // Use prop state
            setAlertMessage({
                title: "Invalid percentile",
                description: "Percentile must be a number between 0 and 100"
            });
            setAlertOpen(true);
            return;
        }

        // Check if the new value would create a duplicate
        if (percentileValues.includes(currentPercentileInput)) { // Use prop state
            setAlertMessage({
                title: "Duplicate percentile",
                description: "This percentile value already exists"
            });
            setAlertOpen(true);
            return;
        }

        const newValues = percentileValues.map(p =>
            p === selectedPercentileItem ? currentPercentileInput : p // Use prop states
        );

        setPercentileValues(newValues); // Use prop setter
        setSelectedPercentileItem(null); // Use prop setter
        setCurrentPercentileInput(""); // Use prop setter
    };

    const handleRemovePercentile = () => {
        if (selectedPercentileItem) { // Use prop state
            setPercentileValues(percentileValues.filter(p => p !== selectedPercentileItem)); // Use prop setter & state
            setSelectedPercentileItem(null); // Use prop setter
            setCurrentPercentileInput(""); // Use prop setter
        }
    };

    return (
        <div className={`grid ${isMobile && isPortrait ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
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
                                        type="number"
                                        className="h-7 w-16 border-[#CCCCCC] text-sm px-2"
                                        disabled={!showStatistics || !cutPointsChecked}
                                        value={cutPointsValue}
                                        onChange={(e) => setCutPointsValue(e.target.value)}
                                    />
                                    <span className={`text-sm ml-2 ${!showStatistics || !cutPointsChecked ? 'text-[#AAAAAA]' : ''}`}>equal groups</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center mb-2">
                            <Checkbox
                                id="enablePercentiles"
                                className="mr-2 border-[#CCCCCC]"
                                disabled={!showStatistics}
                                checked={enablePercentiles}
                                onCheckedChange={(checked) => setEnablePercentiles(!!checked)}
                            />
                            <Label htmlFor="enablePercentiles" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>
                                Percentiles
                            </Label>
                        </div>
                        <div className={`pl-6 space-y-2 ${!enablePercentiles ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="number"
                                    placeholder="0-100"
                                    className="h-7 w-20 border-[#CCCCCC] text-sm px-2"
                                    value={currentPercentileInput}
                                    onChange={(e) => setCurrentPercentileInput(e.target.value)}
                                    disabled={!enablePercentiles || !showStatistics}
                                    min="0"
                                    max="100"
                                    step="any"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs border-[#CCCCCC]"
                                    onClick={handleAddPercentile}
                                    disabled={!enablePercentiles || !showStatistics || !currentPercentileInput}
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <select
                                    size={5}
                                    className="h-auto w-20 border border-[#CCCCCC] text-sm px-1 py-1"
                                    value={selectedPercentileItem ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value || null;
                                        setSelectedPercentileItem(value);
                                        setCurrentPercentileInput(value ?? "");
                                    }}
                                    disabled={!enablePercentiles || !showStatistics || percentileValues.length === 0}
                                >
                                    {percentileValues.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-col space-y-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs border-[#CCCCCC]"
                                        onClick={handleChangePercentile}
                                        disabled={!enablePercentiles || !showStatistics || !selectedPercentileItem || !currentPercentileInput}
                                    >
                                        Change
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs border-[#CCCCCC]"
                                        onClick={handleRemovePercentile}
                                        disabled={!enablePercentiles || !showStatistics || !selectedPercentileItem}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-4">
                <div className={`text-sm font-medium mb-3 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Central Tendency</div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox id="mean" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={meanChecked} onCheckedChange={(checked) => setMeanChecked(!!checked)} />
                        <Label htmlFor="mean" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Mean</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="median" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={medianChecked} onCheckedChange={(checked) => setMedianChecked(!!checked)} />
                        <Label htmlFor="median" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Median</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="mode" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={modeChecked} onCheckedChange={(checked) => setModeChecked(!!checked)} />
                        <Label htmlFor="mode" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Mode</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="sum" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={sumChecked} onCheckedChange={(checked) => setSumChecked(!!checked)} />
                        <Label htmlFor="sum" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Sum</Label>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-4">
                <div className={`text-sm font-medium mb-3 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Dispersion</div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox id="stddev" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={stdDevChecked} onCheckedChange={(checked) => setStdDevChecked(!!checked)} />
                        <Label htmlFor="stddev" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Std. deviation</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="variance" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={varianceChecked} onCheckedChange={(checked) => setVarianceChecked(!!checked)} />
                        <Label htmlFor="variance" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Variance</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="range" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={rangeChecked} onCheckedChange={(checked) => setRangeChecked(!!checked)} />
                        <Label htmlFor="range" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Range</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="minimum" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={minChecked} onCheckedChange={(checked) => setMinChecked(!!checked)} />
                        <Label htmlFor="minimum" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Minimum</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="maximum" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={maxChecked} onCheckedChange={(checked) => setMaxChecked(!!checked)} />
                        <Label htmlFor="maximum" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Maximum</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="semean" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={seMeanChecked} onCheckedChange={(checked) => setSeMeanChecked(!!checked)} />
                        <Label htmlFor="semean" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>S.E. Mean</Label>
                    </div>
                </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-md p-4">
                <div className={`text-sm font-medium mb-3 ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Distribution</div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox id="skewness" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={skewnessChecked} onCheckedChange={(checked) => setSkewnessChecked(!!checked)} />
                        <Label htmlFor="skewness" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Skewness</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox id="kurtosis" className="mr-2 border-[#CCCCCC]" disabled={!showStatistics} checked={kurtosisChecked} onCheckedChange={(checked) => setKurtosisChecked(!!checked)} />
                        <Label htmlFor="kurtosis" className={`text-sm cursor-pointer ${!showStatistics ? 'text-[#AAAAAA]' : ''}`}>Kurtosis</Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsTab;