// AutocorrelationModal.tsx
import React, { useState, useEffect, FC } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { CornerDownLeft, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";  
import { Label } from "@/components/ui/label";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { handleAutocorrelation } from "./handleAnalyze/handleAutocorrelation";
import { Variable } from "@/types/Variable";

type RawData = string[][];

interface AutocorrelationModalProps {
    onClose: () => void;
}

interface DifferenceOption {
    value: string;
    label: string;
}

interface PeriodOption {
    value: string;
    label: string;
    id: string;
}

const AutocorrelationModal: FC<AutocorrelationModalProps> = ({ onClose }) => {
    // Define constants
    const differences: DifferenceOption[] = [
        { value: 'level', label: 'level' },
        { value: 'first-difference', label: 'first difference' },
        { value: 'second-difference', label: 'second difference' },
    ];

    const periods: PeriodOption[] = [
        { value: '7', label: 'Daily in Week', id: 'diw' },
        { value: '30', label: 'Daily in Month', id: 'dim' },
        { value: '4', label: 'Weekly in Month', id: 'wim' },
        { value: '2', label: 'Semi Annual', id: 'sa' },
        { value: '3', label: 'Four-Monthly', id: 'fm' },
        { value: '4', label: 'Quarterly', id: 'q' },
        { value: '12', label: 'Monthly', id: 'm' },
    ];

    // Store references
    const { variables, loadVariables } = useVariableStore();
    const { data } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Local state management
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);
    const [dataVariable, setDataVariable] = useState<string[]>([]);
    const [timeVariable, setTimeVariable] = useState<string[]>([]);
    
    // UI state management
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
    const [selectedDifference, setSelectedDifference] = useState<string[]>(['level', 'level']);
    const [selectedPeriod, setSelectedPeriod] = useState<string[]>(['7', 'Daily in Week']);
    const [maximumLag, setMaximumLag] = useState<number>(10);
    const [seasonally, setSeasonally] = useState<boolean>(false);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Load variables on component mount
    useEffect(() => {
        const loadVars = async () => {
            await loadVariables();
            setStoreVariables(variables.filter(v => v.name !== ""));
        };
        loadVars();
    }, [loadVariables]);

    // Update available variables when store variables change
    useEffect(() => {
        setAvailableVariables(storeVariables.map(v => v.name));
    }, [storeVariables]);

    // Variable selection handlers
    const handleVariableHighlight = (variable: string) => {
        if (highlightedVariable === variable) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable(variable);
        }
    };

    const handleSelectDataVariable = (variable: string) => {
        if (highlightedVariable === variable && dataVariable.length === 0) {
            setDataVariable([variable]);
            setAvailableVariables(prev => prev.filter(item => item !== variable));
            setHighlightedVariable(null);
        } else {
            setErrorMsg("A variable can only belong to one group, and Data Variable can only contain one variable.");
        }
    };

    const handleSelectTimeVariable = (variable: string) => {
        if (highlightedVariable === variable && timeVariable.length === 0) {
            setTimeVariable([variable]);
            setAvailableVariables(prev => prev.filter(item => item !== variable));
            setHighlightedVariable(null);
        } else {
            setErrorMsg("A variable can only belong to one group, and Time Variable can only contain one variable.");
        }
    };

    const handleDeselectDataVariable = (variable: string) => {
        if (highlightedVariable === variable) {
            setAvailableVariables(prev => [...prev, variable]);
            setDataVariable([]);
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable(variable);
        }
    };

    const handleDeselectTimeVariable = (variable: string) => {
        if (highlightedVariable === variable) {
            setAvailableVariables(prev => [...prev, variable]);
            setTimeVariable([]);
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable(variable);
        }
    };

    // Handle period selection
    const handleSelectedPeriod = (id: string) => {
        const period = periods.find(p => p.id === id);
        if (!period) return;
        
        setSelectedPeriod([period.value, period.label]);
    };

    // Handle difference selection
    const handleSelectedDifference = (value: string) => {
        const difference = differences.find(d => d.value === value);
        if (!difference) return;
        
        setSelectedDifference([difference.value, difference.label]);
    };

    // Reset all selections
    const handleReset = () => {
        setSelectedDifference(['level', 'level']);
        setSelectedPeriod(['7', 'Daily in Week']);
        setMaximumLag(10);
        setSeasonally(false);
        setAvailableVariables(storeVariables.map(v => v.name));
        setDataVariable([]);
        setTimeVariable([]);
        setHighlightedVariable(null);
        setErrorMsg(null);
    };

    // Validate input and prepare data for processing
    const validateInputs = () => {
        if (!dataVariable.length) {
            return "Please select at least one used variable.";
        }
        if (!timeVariable.length) {
            return "Please select at least one time variable.";
        }
        return null;
    };

    // Prepare data for autocorrelation
    const prepareData = () => {
        // Find variables that match the selected names
        const dataVarDef = storeVariables.find(v => v.name === dataVariable[0]);
        const timeVarDef = storeVariables.find(v => v.name === timeVariable[0]);
        
        if (!dataVarDef || !timeVarDef) {
            throw new Error("Selected variables not found");
        }

        // Find last row with data in selected variables
        let maxIndex = -1;
        const selectedVariables = [dataVarDef, timeVarDef];
        
        (data as RawData).forEach((row, rowIndex) => {
            let hasData = false;
            for (const varDef of selectedVariables) {
                const rawValue = row[varDef.columnIndex];
                if (rawValue !== null && rawValue !== "") {
                    hasData = true;
                    break;
                }
            }
            if (hasData) maxIndex = rowIndex;
        });
        
        if (maxIndex < 0) maxIndex = 0;

        // Extract data values and time values
        const dataValues: number[] = [];
        const timeValues: string[] = [];
        
        for (let i = 0; i <= maxIndex; i++) {
            const row = (data as RawData)[i];
            const rawDataValue = row[dataVarDef.columnIndex];
            const rawTimeValue = row[timeVarDef.columnIndex];
            
            if (rawDataValue && rawTimeValue) {
                const numVal = parseFloat(rawDataValue as string);
                if (!isNaN(numVal)) {
                    dataValues.push(numVal);
                    timeValues.push(String(rawTimeValue));
                }
            }
        }
        
        return { dataValues, timeValues, dataVarDef, timeVarDef };
    };

    // Process autocorrelation results
    const processAutocorrelationResults = async (
        acfValue: any[],
        acf: any,
        pacf: any,
        acfGraphicJSON: any,
        pacfGraphicJSON: any,
        dataVarDef: Variable
    ) => {
        // Create log entry
        const logMsg = `AUTOCORRELATION: ${dataVarDef.label || dataVarDef.name} on ${selectedDifference[1]} ${seasonally ? `with periodicity ${selectedPeriod[1]}` : ""} with maximum lag ${maximumLag}`;
        const logId = await addLog({ log: logMsg });

        // Create analytic entry
        const analyticId = await addAnalytic(logId, {
            title: `Autocorrelation`,
            note: "",
        });

        // Add ACF table statistic
        await addStatistic(analyticId, {
            title: "Autocorrelation Table",
            output_data: acf,
            components: "Autocorrelation Table",
            description: "",
        });
        
        // Add ACF graphic statistic
        await addStatistic(analyticId, {
            title: "Autocorrelation Graphic",
            output_data: acfGraphicJSON,
            components: "Autocorrelation Graphic",
            description: "",
        });

        // Add PACF table statistic
        await addStatistic(analyticId, {
            title: "Partial Autocorrelation Table",
            output_data: pacf,
            components: "Partial Autocorrelation Table",
            description: "",
        });

        // Add PACF graphic statistic
        await addStatistic(analyticId, {
            title: "Partial Autocorrelation Graphic",
            output_data: pacfGraphicJSON,
            components: "Partial Autocorrelation Graphic",
            description: "",
        });
    };

    // Main analysis function
    const handleAnalyzes = async () => {
        // Validate inputs
        const validationError = validateInputs();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }
        
        setErrorMsg(null);
        setIsCalculating(true);
        
        try {
            // Prepare data for processing
            const { dataValues, timeValues, dataVarDef, timeVarDef } = prepareData();
            
            // Validate data
            if (dataValues.length === 0) {
                throw new Error("No data available for the selected variables.");
            }
            if (timeValues.length === 0) {
                throw new Error("No data available for the selected time variables.");
            }
            if (dataValues.length !== timeValues.length) {
                throw new Error("Data and Time length is not equal");
            }
            
            // Additional validation for seasonal analysis
            if (seasonally) {
                const periodicity = Number(selectedPeriod[0]);
                if (dataValues.length < 4 * periodicity) {
                    throw new Error("Data length is less than 4 times the periodicity.");
                }
                if (dataValues.length % periodicity !== 0) {
                    throw new Error("Data length is not a multiple of the periodicity.");
                }
            }
            
            // Execute autocorrelation calculation
            const [acfValue, acf, pacf, acfGraphicJSON, pacfGraphicJSON] = await handleAutocorrelation(
                dataValues,
                dataVarDef.name,
                maximumLag,
                selectedDifference[0],
                seasonally ? Number(selectedPeriod[0]) : 0
            );
            
            // Process results
            await processAutocorrelationResults(
                acfValue,
                acf,
                pacf,
                acfGraphicJSON,
                pacfGraphicJSON,
                dataVarDef
            );
            
            setIsCalculating(false);
            onClose();
        } catch (ex) {
            if (ex instanceof Error) {
                setErrorMsg(ex.message);
            } else {
                setErrorMsg("An unknown error occurred.");
            }
            setIsCalculating(false);
        }
    };

    return (
        <DialogContent className="max-w-[75vw] max-h-[90vh] flex flex-col space-y-0 overflow-y-auto">
            <div className="pb-4 ml-4">
                <DialogHeader>
                    <DialogTitle className="font-bold text-2xl">Autocorrelation</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center">
                <div className="flex md:flex-row flex-col gap-4">
                    {/* Available Variables Column */}
                    <div className="col-span-3 flex flex-col border-2 gap-4 p-4 rounded-md max-h-[300px] overflow-y-auto w-[200px]">
                        <label className="font-semibold text-center">Available Variables</label>
                        <div className="space-y-2">
                            {availableVariables.map((variable) => (
                                <div
                                    key={variable}
                                    className={`p-2 border cursor-pointer rounded-md hover:bg-gray-100 ${
                                        highlightedVariable === variable ? "bg-blue-100 border-blue-500" : "border-gray-300"
                                    }`}
                                    onClick={() => handleVariableHighlight(variable)}
                                >
                                    {variable}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Variable Selection Column */}
                    <div className="col-span-1 flex flex-col gap-4">
                        {/* Data Variable Row */}
                        <div className="flex flex-row gap-4">
                            <div className="flex items-center">
                                <Button
                                    variant="link"
                                    className="border-2 rounded-md"
                                    disabled={!highlightedVariable}
                                    onClick={() => highlightedVariable && (dataVariable.length === 0 || availableVariables.includes(highlightedVariable)) ?
                                        handleSelectDataVariable(highlightedVariable) : 
                                        highlightedVariable && handleDeselectDataVariable(highlightedVariable)
                                    }
                                >
                                    {highlightedVariable && availableVariables.includes(highlightedVariable) ? (
                                        <CornerDownRight size={24} />
                                    ) : highlightedVariable && dataVariable.includes(highlightedVariable) ? (
                                        <CornerDownLeft size={24} />
                                    ) : (
                                        <CornerDownLeft size={24} />
                                    )}
                                </Button>
                            </div>
                            <div className="flex flex-col border-2 gap-4 p-4 rounded-md h-[120px] overflow-y-auto w-[200px]">
                                <label className="font-semibold text-center">Used Variable</label>
                                <div className="space-y-2">
                                    {dataVariable.map((variable) => (
                                        <div 
                                            key={variable} 
                                            className={`p-2 border cursor-pointer rounded-md hover:bg-blue-100 ${
                                                highlightedVariable === variable ? "bg-blue-100 border-blue-500" : "border-gray-300"
                                            }`} 
                                            onClick={() => handleVariableHighlight(variable)}
                                        >
                                            {variable}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Time Variable Row */}
                        <div className="flex flex-row gap-4">
                            <div className="flex items-center">
                                <Button
                                    variant="link"
                                    className="border-2 rounded-md"
                                    disabled={!highlightedVariable}
                                    onClick={() => highlightedVariable && (timeVariable.length === 0 || availableVariables.includes(highlightedVariable)) ?
                                        handleSelectTimeVariable(highlightedVariable) : 
                                        highlightedVariable && handleDeselectTimeVariable(highlightedVariable)
                                    }
                                >
                                    {highlightedVariable && availableVariables.includes(highlightedVariable) ? (
                                        <CornerDownRight size={24} />
                                    ) : highlightedVariable && timeVariable.includes(highlightedVariable) ? (
                                        <CornerDownLeft size={24} />
                                    ) : (
                                        <CornerDownLeft size={24} />
                                    )}
                                </Button>
                            </div>
                            <div className="flex flex-col border-2 gap-4 p-4 rounded-md h-[120px] overflow-y-auto w-[200px]">
                                <label className="font-semibold text-center">Time Variable</label>
                                <div className="space-y-2">
                                    {timeVariable.map((variable) => (
                                        <div 
                                            key={variable} 
                                            className={`p-2 border cursor-pointer rounded-md hover:bg-blue-100 ${
                                                highlightedVariable === variable ? "bg-blue-100 border-blue-500" : "border-gray-300"
                                            }`} 
                                            onClick={() => handleVariableHighlight(variable)}
                                        >
                                            {variable}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Options Column */}
                    <div className="flex flex-col gap-4">
                        <div className="border-2 rounded-md w-[420px] pb-2">
                            <div className="mt-4 ml-4">
                                <label className="font-semibold">Autocorrelation Options:</label>
                            </div>
                            
                            {/* Maximum Lag */}
                            <div className="w-full pl-4 border-0 rounded-t-md flex flex-row gap-4 mt-4">
                                <div className="flex items-center">
                                    <Label>maximum lag:</Label>
                                </div>
                                <Input 
                                    type="number" 
                                    className="w-[60px]" 
                                    placeholder="10" 
                                    min="10" 
                                    max="20" 
                                    step="1"
                                    value={maximumLag}
                                    onChange={(e) => setMaximumLag(Number(e.target.value))}
                                />
                            </div>
                            
                            {/* Seasonally Checkbox */}
                            <div className="w-full pl-4 border-0 rounded-t-md flex flex-row gap-4 mt-4">
                                <div className="flex flex-row gap-2">
                                    <Checkbox 
                                        checked={seasonally} 
                                        onCheckedChange={(isChecked) => setSeasonally(Boolean(isChecked))}
                                    />
                                    <Label>seasonally difference</Label>
                                </div>
                            </div>
                            
                            {/* Period Selection (shown only when seasonally is enabled) */}
                            {seasonally && (
                                <div className="w-full pl-4 pr-4 border-0 rounded-t-md flex flex-row items-center gap-4 mt-4">
                                    <Label className="w-[120px]">periodicity: {selectedPeriod[0]}</Label>
                                    <Select
                                        onValueChange={handleSelectedPeriod}
                                        defaultValue={periods.find(p => p.value === selectedPeriod[0])?.id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>{selectedPeriod[1]}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {periods.map((period) => (
                                                <SelectItem key={period.id} value={period.id}>
                                                    {period.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            
                            {/* Difference Selection */}
                            <div className="w-full pl-4 pr-4 border-0 rounded-t-md flex flex-col gap-4 mt-5">
                                <Label className="w-[200px]">autocorrelate on:</Label>
                                <RadioGroup
                                    value={selectedDifference[0]}
                                    onValueChange={handleSelectedDifference}
                                    className="flex flex-row gap-4"
                                >
                                    {differences.map((difference) => (
                                        <div key={difference.value} className="flex flex-row items-center space-x-2">
                                            <RadioGroupItem
                                                value={difference.value}
                                                id={difference.value}
                                                className="w-4 h-4"
                                            />
                                            <label htmlFor={difference.value} className="text-sm font-medium text-gray-700">
                                                {difference.label}
                                            </label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {errorMsg && <div className="text-red-600 mb-2 flex justify-center">{errorMsg}</div>}
            
            <div className="flex justify-center pt-4">
                <DialogFooter>
                    <Button variant="outline" disabled={isCalculating} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="outline" disabled={isCalculating} onClick={handleReset}>
                        Reset
                    </Button>
                    <Button variant="outline" disabled={isCalculating} onClick={handleAnalyzes}>
                        {isCalculating ? "Calculating..." : "OK"}
                    </Button>
                </DialogFooter>
            </div>
        </DialogContent>
    );
};

export default AutocorrelationModal;