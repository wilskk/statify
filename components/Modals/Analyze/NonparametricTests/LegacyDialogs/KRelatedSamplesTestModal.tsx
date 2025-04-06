"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { CornerDownLeft, CornerDownRight } from "lucide-react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

interface KRelatedSamplesTestModalProps {
    onClose: () => void;
}

const KRelatedSamplesTestModal: React.FC<KRelatedSamplesTestModalProps> = ({ onClose }) => {
    const [listVariables, setListVariables] = useState<string[]>([]);
    const [testVariables, setTestVariables] = useState<string[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
    const [friedmanOption, setFriedmanOption] = useState<boolean>(true);
    const [kendallsWOption, setKendallsWOption] = useState<boolean>(false);
    const [cochransQOption, setCochransQOption] = useState<boolean>(false);

    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const variables = useVariableStore.getState().variables as Variable[];
    const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

    // Initialize available variables on component mount
    useEffect(() => {
        const varNames = variables.map(v => v.name);
        setListVariables(varNames);
    }, [variables]);

    const handleMoveTestVariables = () => {
        if (highlightedVariable) {
            if (listVariables.includes(highlightedVariable)) {
                setTestVariables((prev) => [...prev, highlightedVariable]);
                setListVariables((prev) => prev.filter((item) => item !== highlightedVariable));
            } else if (testVariables.includes(highlightedVariable)) {
                setListVariables((prev) => {
                    const newList = [...prev, highlightedVariable];
                    return newList.sort((a, b) => {
                        const indexA = variables.findIndex(v => v.name === a);
                        const indexB = variables.findIndex(v => v.name === b);
                        return indexA - indexB;
                    });
                });
                setTestVariables((prev) => prev.filter((item) => item !== highlightedVariable));
            }
            setHighlightedVariable(null);
        }
    };

    const handleSelectedVariable = (variable: string) => {
        if (highlightedVariable === variable) {
            setTestVariables((prev) => [...prev, highlightedVariable]);
            setListVariables((prev) => prev.filter((item) => item !== variable));
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable(variable);
        }
    };
    
    const handleDeselectVariable = (variable: string) => {
        if (highlightedVariable === variable) {
            setListVariables((prev) => {
                const newList = [...prev, highlightedVariable];
                return newList.sort((a, b) => {
                    const indexA = variables.findIndex(v => v.name === a);
                    const indexB = variables.findIndex(v => v.name === b);
                    return indexA - indexB;
                });
            });
            setTestVariables((prev) => prev.filter((item) => item !== highlightedVariable));
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable(variable);
        }
    };

    const handleReset = () => {
        setListVariables(variables.map(v => v.name));
        setTestVariables([]);
        setHighlightedVariable(null);
        setFriedmanOption(true);
        setKendallsWOption(false);
        setCochransQOption(false);
    };

    const handleRunTest = async () => {
        if (!testVariables.length) {
            setErrorMsg("Please select at least one variable.");
            return;
        }
        setErrorMsg(null);
        setIsCalculating(true);
    
        try {
            // 1. Prepare variable data using useDataStore's getVariableData
            const variableDataPromises = [];
            for (const varName of testVariables) {
                const varDef = variables.find((v) => v.name === varName);
                if (!varDef) continue;
                variableDataPromises.push(useDataStore.getState().getVariableData(varDef));
            }
            const variableData = await Promise.all(variableDataPromises);

            // 2. Create worker and set up handlers
            const worker = new Worker("/workers/KRelatedSamplesTest/index.js",  { type: 'module' });

            // Set a timeout to prevent worker hanging
            const timeoutId = setTimeout(() => {
                worker.terminate();
                setErrorMsg("Analysis timed out. Please try again with fewer variables.");
                setIsCalculating(false);
            }, 60000); // 60 second timeout

            worker.onmessage = async (e) => {
                clearTimeout(timeoutId);
                const wData = e.data;

                if (wData.success) {
                    try {
                        // Create log message conditionally based on test options
                        let logParts = ['NPAR TESTS'];

                        // Only add tests that are enabled
                        if (friedmanOption) {
                        logParts.push(`{FRIEDMAN=${testVariables.join(" ")}}`);
                        }

                        if (cochransQOption) {
                        logParts.push(`{COCHRAN=${testVariables.join(" ")}}`);
                        }

                        if (kendallsWOption) {
                        logParts.push(`{KENDALL=${testVariables.join(" ")}}`);
                        }

                        // Join all parts with spaces
                        let logMsg = logParts.join(' ');

                        // If no tests are selected, provide a default message
                        if (logParts.length === 1) {
                            logMsg = 'NPAR TESTS {No specific tests selected}';
                        }

                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "NPar Tests", note: "" });

                        if (friedmanOption) {
                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: wData.ranks,
                                components: "Friedman Test",
                                description: ""
                            });

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: wData.friedmanTest,
                                components: "Friedman Test",
                                description: ""
                            });
                        }

                        setIsCalculating(false);
                        worker.terminate();
                        onClose();
                    } catch (err) {
                        console.error(err);
                        setErrorMsg(`Error saving results.`);
                        setIsCalculating(false);
                        worker.terminate();
                    }
                } else {
                    setErrorMsg(wData.error || "Worker returned an error.");
                    setIsCalculating(false);
                    worker.terminate();
                }
            };

            worker.onerror = (event) => {
                clearTimeout(timeoutId);
                console.error("Worker error:", event);
                setIsCalculating(false);
                setErrorMsg("Worker error occurred. Check console for details.");
                worker.terminate();
            };

            // 3. Send data to worker - using the new format with variableData
            worker.postMessage({
                variableData:variableData,
                friedmanOption:friedmanOption,
                kendallsWOption:kendallsWOption,
                cochransQOption:cochransQOption
            });
        
        } catch (ex) {
            console.error(ex);
            setErrorMsg("Something went wrong.");
            setIsCalculating(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
                <DialogTitle>Tests for Several Related Samples</DialogTitle>
            </DialogHeader>

            <Separator className="my-2" />

            <div className="grid grid-cols-9 gap-2 py-4">
                {/* List Variables */}
                <div
                    className="col-span-3 flex flex-col border p-4 rounded-md overflow-y-auto"
                    style={{
                        height: "348px"
                    }}
                >
                    <label className="font-semibold">List Variables</label>
                    <div className="space-y-2">
                        {listVariables.map((variable) => (
                            <div
                                key={variable}
                                className={`p-2 border cursor-pointer rounded-md hover:bg-gray-100 ${
                                    highlightedVariable === variable
                                        ? "bg-blue-100 border-blue-500"
                                        : "border-gray-300"
                                }`}
                                onClick={() => handleSelectedVariable(variable)}
                            >
                                {variable}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Move Buttons */}
                <div className="col-span-1 flex flex-col items-center justify-center space-y-32">
                    <Button
                        variant="link"
                        onClick={handleMoveTestVariables}
                        disabled={
                            !highlightedVariable // Jika tidak ada variable yang disorot
                        }
                    >
                        {highlightedVariable && listVariables.includes(highlightedVariable) ? (
                            <CornerDownRight size={24} />
                        ) : highlightedVariable && testVariables.includes(highlightedVariable) ? (
                            <CornerDownLeft size={24} />
                        ) : (
                            <CornerDownLeft size={24} />
                        )}
                    </Button>
                </div>

                {/* Test Variables */}
                <div className="col-span-3 flex flex-col border p-4 rounded-md overflow-y-auto"
                    style={{
                        minHeight: "348px"
                    }}
                >
                    <label className="font-semibold">Variables</label>
                    <div className="space-y-2">
                        {testVariables.map((variable) => (
                            <div
                                key={variable}
                                className={`p-2 border cursor-pointer rounded-md hover:bg-gray-100 ${
                                    highlightedVariable === variable
                                        ? "bg-blue-100 border-blue-500"
                                        : "border-gray-300"
                                }`}
                                onClick={() => handleDeselectVariable(variable)}
                            >
                                {variable}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="col-span-2 m-fit flex flex-col justify-start space-y-4 p-4">
                    <Button variant="outline">Exact...</Button>
                    <Button variant="outline">Statistics...</Button>
                </div>

                {/* Cut Point */}
                <div className="col-span-7 ">
                    <Label htmlFor="display-options" className="font-semibold text-base">Cut Point</Label>
                    <div className="border p-4 rounded-md flex space-x-4 items-center">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="friedman-option"
                                checked={friedmanOption}
                                onCheckedChange={(checked) => setFriedmanOption(checked as boolean)}
                            />
                        <label htmlFor="friedman-option">Friedman</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="kendalls-w-option"
                                checked={kendallsWOption}
                                onCheckedChange={(checked) => setKendallsWOption(checked as boolean)}
                            />
                            <label htmlFor="kendalls-w-option">Kendall&rsquo;s W</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="cochrans-q-option"
                                checked={cochransQOption}
                                onCheckedChange={(checked) => setCochransQOption(checked as boolean)}
                            />
                            <label htmlFor="cochrans-q-option">Cochran&rsquo;s Q</label>
                        </div>
                    </div>
                </div>
            </div>

            {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
            {/* Footer Buttons */}
            <DialogFooter className="flex justify-center space-x-4">
                <Button
                    onClick={handleRunTest}
                    disabled={
                        isCalculating ||
                        testVariables.length < 2 ||
                        (
                            friedmanOption === false &&
                            kendallsWOption === false &&
                            cochransQOption === false
                        )
                    }
                >
                    {isCalculating ? "Calculating..." : "OK"}
                </Button>
                <Button
                    variant="outline"
                    disabled={isCalculating}
                >
                    Paste
                </Button>
                <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isCalculating}
                >
                    Reset
                </Button>
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isCalculating}
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    disabled={isCalculating}
                >
                    Help
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default KRelatedSamplesTestModal;