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

    const getTextClass = (disabled: boolean) => {
        return disabled ? "text-muted-foreground" : "";
    };

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

            <div className="border border-border rounded-md p-4 space-y-3 bg-card">
                <div className={`text-sm font-medium ${getTextClass(!showStatistics)}`}>Percentile Values</div>
                <div className="flex items-center">
                    <Checkbox
                        id="quartiles"
                        className="mr-2"
                        disabled={!showStatistics}
                        checked={quartilesChecked}
                        onCheckedChange={(checked) => setQuartilesChecked(!!checked)}
                    />
                    <Label htmlFor="quartiles" className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>
                        Quartiles
                    </Label>
                </div>

                <div>
                    <div className="flex items-start mb-2">
                        <Checkbox
                            id="cutPoints"
                            className="mr-2 mt-1"
                            disabled={!showStatistics}
                            checked={cutPointsChecked}
                            onCheckedChange={(checked) => setCutPointsChecked(!!checked)}
                        />
                        <div className="flex flex-wrap items-center">
                            <Label htmlFor="cutPoints" className={`text-sm mr-2 cursor-pointer ${getTextClass(!showStatistics)}`}>
                                Cut points for
                            </Label>
                            <Input
                                type="number"
                                id="cutPointsValue"
                                value={cutPointsValue}
                                onChange={(e) => setCutPointsValue(e.target.value)}
                                className={`w-20 h-8 mr-2 ${getTextClass(!showStatistics || !cutPointsChecked)}`}
                                disabled={!showStatistics || !cutPointsChecked}
                            />
                            <Label htmlFor="cutPointsValue" className={`text-sm cursor-pointer ${getTextClass(!showStatistics || !cutPointsChecked)}`}>
                                equal groups
                            </Label>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="percentiles"
                            className="mr-2"
                            disabled={!showStatistics}
                            checked={enablePercentiles}
                            onCheckedChange={(checked) => setEnablePercentiles(!!checked)}
                        />
                        <Label htmlFor="percentiles" className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>
                            Percentiles
                        </Label>
                    </div>
                    {enablePercentiles && showStatistics && (
                        <div className="space-y-2 pl-6">
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="number"
                                    placeholder="0-100"
                                    value={currentPercentileInput}
                                    onChange={(e) => setCurrentPercentileInput(e.target.value)}
                                    className="w-24 h-8"
                                />
                                <Button onClick={handleAddPercentile} size="sm" variant="outline" className="h-8">Add</Button>
                                <Button onClick={handleChangePercentile} size="sm" variant="outline" className="h-8" disabled={!selectedPercentileItem}>Change</Button>
                                <Button onClick={handleRemovePercentile} size="sm" variant="destructive" className="h-8" disabled={!selectedPercentileItem}>Remove</Button>
                            </div>
                            {percentileValues.length > 0 && (
                                <div className="max-h-20 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                                    {percentileValues.map((p) => (
                                        <div
                                            key={p}
                                            onClick={() => {
                                                setSelectedPercentileItem(p);
                                                setCurrentPercentileInput(p);
                                            }}
                                            className={`p-1 rounded-md cursor-pointer text-sm ${selectedPercentileItem === p ? "bg-muted text-muted-foreground" : "hover:bg-muted/50"
                                                }`}
                                        >
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="border border-border rounded-md p-4 space-y-2 bg-card">
                <div className={`text-sm font-medium mb-2 ${getTextClass(!showStatistics)}`}>Central Tendency</div>
                {[
                    { id: "mean", label: "Mean", checked: meanChecked, setter: setMeanChecked },
                    { id: "median", label: "Median", checked: medianChecked, setter: setMedianChecked },
                    { id: "mode", label: "Mode", checked: modeChecked, setter: setModeChecked },
                    { id: "sum", label: "Sum", checked: sumChecked, setter: setSumChecked },
                ].map(({ id, label, checked, setter }) => (
                    <div key={id} className="flex items-center">
                        <Checkbox
                            id={id}
                            className="mr-2"
                            disabled={!showStatistics}
                            checked={checked}
                            onCheckedChange={(val) => setter(!!val)}
                        />
                        <Label htmlFor={id} className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>{label}</Label>
                    </div>
                ))}
            </div>

            <div className="border border-border rounded-md p-4 space-y-2 bg-card">
                <div className={`text-sm font-medium mb-2 ${getTextClass(!showStatistics)}`}>Dispersion</div>
                {[
                    { id: "stddev", label: "Std. deviation", checked: stdDevChecked, setter: setStdDevChecked },
                    { id: "variance", label: "Variance", checked: varianceChecked, setter: setVarianceChecked },
                    { id: "range", label: "Range", checked: rangeChecked, setter: setRangeChecked },
                    { id: "minimum", label: "Minimum", checked: minChecked, setter: setMinChecked },
                    { id: "maximum", label: "Maximum", checked: maxChecked, setter: setMaxChecked },
                    { id: "semean", label: "S. E. mean", checked: seMeanChecked, setter: setSeMeanChecked },
                ].map(({ id, label, checked, setter }) => (
                    <div key={id} className="flex items-center">
                        <Checkbox
                            id={id}
                            className="mr-2"
                            disabled={!showStatistics}
                            checked={checked}
                            onCheckedChange={(val) => setter(!!val)}
                        />
                        <Label htmlFor={id} className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>{label}</Label>
                    </div>
                ))}
            </div>

            <div className="border border-border rounded-md p-4 space-y-2 bg-card">
                <div className={`text-sm font-medium mb-2 ${getTextClass(!showStatistics)}`}>Distribution</div>
                {[
                    { id: "skewness", label: "Skewness", checked: skewnessChecked, setter: setSkewnessChecked },
                    { id: "kurtosis", label: "Kurtosis", checked: kurtosisChecked, setter: setKurtosisChecked },
                ].map(({ id, label, checked, setter }) => (
                    <div key={id} className="flex items-center">
                        <Checkbox
                            id={id}
                            className="mr-2"
                            disabled={!showStatistics}
                            checked={checked}
                            onCheckedChange={(val) => setter(!!val)}
                        />
                        <Label htmlFor={id} className={`text-sm cursor-pointer ${getTextClass(!showStatistics)}`}>{label}</Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatisticsTab;