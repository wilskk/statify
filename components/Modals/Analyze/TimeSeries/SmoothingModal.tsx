// SmoothingModal.tsx
import React, { useState, useEffect, FC} from "react";
import { CornerDownLeft, CornerDownRight } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";  
import { Label } from "@/components/ui/label";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { InputRow } from "./timeSeriesComponent/timeSeriesInput";
import { handleSmoothing } from "./handleAnalyze/handleSmoothing";
import { Variable } from "@/types/Variable";
import db from "@/lib/db";

type RawData = string[][];

interface SmoothingModalProps {
    onClose: () => void;
}

interface SmoothingMethod {
    value: string;
    label: string;
}

interface PeriodOption {
    value: string;
    label: string;
    id: string;
}

interface MethodParameters {
    [key: string]: number[];
}

const SmoothingModal: FC<SmoothingModalProps> = ({ onClose }) => {
    // Define constants
    const methods: SmoothingMethod[] = [
        { value: 'sma', label: 'Simple Moving Average' },
        { value: 'dma', label: 'Double Moving Average' },
        { value: 'ses', label: 'Simple Exponential Smoothing' },
        { value: 'des', label: 'Double Exponential Smoothing' },
        { value: 'holt', label: 'Holt\'s Method Exponential Smoothing' },
        { value: 'winter', label: 'Winter\'s Method Exponential Smoothing' },
    ];

    const periods: PeriodOption[] = [
        { value: '7', label: 'Daily in Week', id: 'diw'},
        { value: '30', label: 'Daily in Month', id: 'dim'},
        { value: '4', label: 'Weekly in Month', id: 'wim'},
        { value: '2', label: 'Semi Annual', id: 'sa'},
        { value: '3', label: 'Four-Monthly', id: 'fm'},
        { value: '4', label: 'Quarterly', id: 'q'},
        { value: '12', label: 'Monthly', id: 'm'},
    ];

    // Store references
    const { variables, loadVariables, addVariable } = useVariableStore();
    const { data, setData } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Local state management
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);
    const [dataVariable, setDataVariable] = useState<string[]>([]);
    const [timeVariable, setTimeVariable] = useState<string[]>([]);
    
    // UI state management
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string[]>(['','']);
    const [parameters, setParameters] = useState<number[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string[]>(['7','Daily in Week']);
    const [saveForecasting, setSaveForecasting] = useState<boolean>(false);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Default parameters for each method
    const defaultParameters: MethodParameters = {
        'sma': [2],
        'dma': [2],
        'ses': [0.1],
        'des': [0.1],
        'holt': [0.1, 0.1],
        'winter': [0.1, 0.1, 0.1, 7],
    };

    // Load variables on component mount
    useEffect(() => {
        const loadVars = async () => {
            await loadVariables();
            setStoreVariables(variables.filter(v => v.name !== ""));
        };
        loadVars();
    }, [loadVariables, variables]);

    // Update available variables when store variables change
    useEffect(() => {
        setAvailableVariables(storeVariables.map(v => v.name));
    }, [storeVariables]);

    // Update parameters when method changes
    useEffect(() => {
        if (selectedMethod[0] && defaultParameters[selectedMethod[0]]) {
            const newParams = [...defaultParameters[selectedMethod[0]]];
            if (selectedMethod[0] === 'winter') {
                newParams[3] = parseInt(selectedPeriod[0]);
            }
            setParameters(newParams);
        } else {
            setParameters([]);
        }
    }, [selectedMethod, selectedPeriod]);

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

    // Method and parameter handlers
    const handleSelectedMethod = (value: string) => {
        const methodLabel = methods.find(m => m.value === value)?.label || '';
        setSelectedMethod([value, methodLabel]);
        setSaveForecasting(true);
    };

    const handleSelectedPeriod = (id: string) => {
        const period = periods.find(p => p.id === id);
        if (!period) return;
        
        setSelectedPeriod([period.value, period.label]);
        
        if (selectedMethod[0] === 'winter') {
            const periodValue = parseInt(period.value);
            const newParams = [...parameters];
            newParams[3] = periodValue;
            setParameters(newParams);
        }
    };

    const handleInputChange = (index: number, value: number) => {
        const newParameters = [...parameters];
        newParameters[index] = value;
        setParameters(newParameters);
    };

    // Reset all selections
    const handleReset = () => {
        setSelectedMethod(['','']);
        setParameters([]);
        setSelectedPeriod(['7','Daily in Week']);
        setSaveForecasting(false);
        setAvailableVariables(storeVariables.map(v => v.name));
        setDataVariable([]);
        setTimeVariable([]);
        setHighlightedVariable(null);
        setErrorMsg(null);
    };

    // Prepare input parameters UI based on selected method
    const inputParameters = (method: string) => {
        switch (method) {
            case 'sma': case 'dma':
                return (
                    <InputRow 
                        label="distance" 
                        id="par1" 
                        value={parameters[0]} 
                        min={'2'} 
                        max={'11'} 
                        step={'1'} 
                        onChange={(value) => handleInputChange(0, value)} 
                    />
                );
            case 'ses': case 'des':
                return (
                    <InputRow 
                        label="alpha" 
                        id="par1" 
                        value={parameters[0]} 
                        min={'0.1'} 
                        max={'0.9'} 
                        step={'0.1'} 
                        onChange={(value) => handleInputChange(0, value)} 
                    />
                );
            case 'holt':
                return (
                    <div className="flex flex-row gap-2">
                        <InputRow 
                            label="alpha" 
                            id="par1" 
                            value={parameters[0]} 
                            min={'0.1'} 
                            max={'0.9'} 
                            step={'0.1'} 
                            onChange={(value) => handleInputChange(0, value)} 
                        />
                        <InputRow 
                            label="beta" 
                            id="par2" 
                            value={parameters[1]} 
                            min={'0.1'} 
                            max={'0.9'} 
                            step={'0.1'} 
                            onChange={(value) => handleInputChange(1, value)} 
                        />
                    </div>
                );
            case 'winter':
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2">
                            <InputRow 
                                label="alpha" 
                                id="par1" 
                                value={parameters[0]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(0, value)} 
                            />
                            <InputRow 
                                label="beta" 
                                id="par2" 
                                value={parameters[1]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(1, value)} 
                            />
                            <InputRow 
                                label="gamma" 
                                id="par3" 
                                value={parameters[2]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(2, value)} 
                            />
                        </div>
                        
                        <div className="flex flex-row mt-2">
                            <div className="flex items-center">
                                <label className="w-[100px] text-sm font-semibold" htmlFor="par4">
                                    periodicity : {selectedPeriod[0]}
                                </label>
                            </div>
                            <Select 
                                onValueChange={handleSelectedPeriod} 
                                defaultValue={selectedPeriod[1]}
                            >
                                <SelectTrigger className="">
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
                    </div>
                );
            default:
                return (<div></div>);
        }
    };

    // Validate input and prepare data for processing
    const validateInputs = () => {
        if (!dataVariable.length) {
            return "Please select at least one used variable.";
        }
        if (!timeVariable.length) {
            return "Please select at least one time variable.";
        }
        if (!selectedMethod[0]) {
            return "Please select a method.";
        }
        return null;
    };

    // Prepare data for smoothing
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

    // Process smoothing results
    const processSmoothingResults = async (
        smoothingResult: any[],
        dataVarDef: Variable,
        timeVarDef: Variable,
        smoothingGraphic: any,
        smoothingEvaluation: any
    ) => {
        // Create log entry
        const logMsg = `SMOOTHING: ${dataVarDef.label ? dataVarDef.label + ' Using' : dataVarDef.name + ' Using'} ${selectedMethod[1]} method with parameters ${parameters.join(", ")}.`;
        const logId = await addLog({ log: logMsg });

        // Create analytic entry
        const analyticId = await addAnalytic(logId, {
            title: `Smoothing ${selectedMethod[1]}`,
            note: "",
        });

        // Add statistics
        await addStatistic(analyticId, {
            title: `Smoothing Graphic`,
            output_data: smoothingGraphic,
            components: "Smoothing Graphic",
            description: "",
        });

        await addStatistic(analyticId, {
            title: "Smoothing Evalution",
            output_data: smoothingEvaluation,
            components: "Smoothing Evaluation",
            description: ""
        });

        if (saveForecasting) {
            await saveSmoothingResultsAsVariable(smoothingResult, dataVarDef);
        }
    };

    // Save smoothing results as a new variable
    const saveSmoothingResultsAsVariable = async (smoothingResult: any[], dataVarDef: Variable) => {
        const rawData = data as RawData;
        
        // Prepare result array with proper length
        const fullResult = [...smoothingResult];
        if (fullResult.length < rawData.length) {
            const missingRows = rawData.length - fullResult.length;
            fullResult.push(...new Array(missingRows).fill(""));
        }
        
        // Find first empty column for each row
        const updatedData = rawData.map((row, index) => {
            const updatedRow = [...row];
            const value = fullResult[index]?.toString() || "";
            
            // Find first empty column
            for (let colIndex = 0; colIndex < updatedRow.length; colIndex++) {
                if (updatedRow[colIndex] === '') {
                    updatedRow[colIndex] = value;
                    break;
                }
            }
            
            return updatedRow;
        });
        
        // Create new variable definition
        const newVarIndex = storeVariables.length;
        const newVarName = `${dataVarDef.name} ${selectedMethod[0]}-${newVarIndex}`;
        const newVarLabel = `${dataVarDef.label || dataVarDef.name} (${selectedMethod[0]})`;
        
        const smoothingVariable: Partial<Variable> = {
            name: newVarName,
            columnIndex: newVarIndex,
            type: "NUMERIC" as const,
            label: newVarLabel,
            values: [],
            missing: [],
            measure: "scale",
            width: 8,
            decimals: 2,
            columns: 1,
            align: "right",
        };
        
        // Update data store with the new data
        setData(updatedData);
        
        // Add the new variable
        await addVariable(smoothingVariable);
        
        // Save cells to IndexDB
        const smoothingCells = fullResult.map((value, index) => ({
            x: smoothingVariable.columnIndex,
            y: index,
            value: value.toString(),
        }));
        
        await db.cells.bulkPut(smoothingCells);
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
            
            // Additional validation for Winter's method
            if (selectedMethod[0] === 'winter') {
                const periodicity = Number(selectedPeriod[0]);
                if (dataValues.length < 4 * periodicity) {
                    throw new Error("Data length is less than 4 times the periodicity.");
                }
                if (dataValues.length % periodicity !== 0) {
                    throw new Error("Data length is not a multiple of the periodicity.");
                }
            }
            
            // Execute smoothing calculation
            const [smoothingResult, smoothingGraphic, smoothingEvaluation] = await handleSmoothing(
                dataValues,
                dataVarDef.name,
                timeValues,
                timeVarDef.name,
                parameters,
                selectedMethod[0]
            );
            
            // Process and save results
            await processSmoothingResults(
                smoothingResult, 
                dataVarDef, 
                timeVarDef, 
                smoothingGraphic, 
                smoothingEvaluation
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
                    <DialogTitle className="font-bold text-2xl">Smoothing</DialogTitle>
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

                    {/* Method Selection Column */}
                    <div className="flex flex-col gap-4">
                        {/* Smoothing Method Section */}
                        <div className="border-2 rounded-md w-[420px] pb-2">
                            <div className="mt-4 ml-4">
                                <label className="font-semibold">Smoothing Method</label>
                            </div>
                            <div className="w-full pl-4 border-0 rounded-t-md flex flex-row gap-4 mt-4">
                                <div className="flex items-center">
                                    <Label className="font-semibold">method:</Label>
                                </div>
                                <Select onValueChange={handleSelectedMethod}>
                                    <SelectTrigger className="mr-2">
                                        <SelectValue placeholder="Choose Your Method">
                                            {selectedMethod[1] || "Choose Your Method"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {methods.map((method) => (
                                            <SelectItem key={method.value} value={method.value}>
                                                {method.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2 p-2 ml-2 mt-2">
                                {inputParameters(selectedMethod[0])}
                            </div>
                        </div>

                        {/* Save Options Section */}
                        <div className="border-2 rounded-md w-[420px] pl-2 pt-2 pb-4 flex flex-col gap-2">
                            <div className="ml-2">
                                <Label className="font-semibold">Save:</Label>
                            </div>
                            <div className="flex flex-row gap-2 ml-8">
                                <Checkbox 
                                    checked={saveForecasting} 
                                    onCheckedChange={(isChecked) => setSaveForecasting(Boolean(isChecked))}
                                />
                                <Label>Save Smoothing Result as Variable</Label>
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

export default SmoothingModal;