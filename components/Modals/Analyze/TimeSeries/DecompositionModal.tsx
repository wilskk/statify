// DecompositionModal.tsx
import React, { useState, useEffect, FC } from "react";
import { CornerDownLeft, CornerDownRight } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { handleDecomposition } from "./handleAnalyze/handleDecomposition";
import { Variable } from "@/types/Variable";
import db from "@/lib/db";

type RawData = string[][];

interface DecompositionModalProps {
    onClose: () => void;
}

interface DecompositionMethod {
    value: string;
    label: string;
}

interface TrendedMethod {
    value: string;
    label: string;
}

interface PeriodOption {
    value: string;
    label: string;
    id: string;
}

const DecompositionModal: FC<DecompositionModalProps> = ({ onClose }) => {
    // Define constants
    const decompositionMethods: DecompositionMethod[] = [
        { value: 'additive', label: 'additive' },
        { value: 'multiplicative', label: 'multiplicative' },
    ];

    const trendedMethods: TrendedMethod[] = [
        { value: 'linear', label: 'Linear' },
        { value: 'quadratic', label: 'Quadratic' },
        { value: 'exponential', label: 'Exponential' },
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
    const [selectedDecompositionMethod, setSelectedDecompositionMethod] = useState<string[]>(['additive','additive']);
    const [selectedTrendedMethod, setSelectedTrendedMethod] = useState<string[]>(['linear','Linear']);
    const [selectedPeriod, setSelectedPeriod] = useState<string[]>(['7','Daily in Week']);
    const [saveDecomposition, setSaveDecomposition] = useState<boolean>(false);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    // Reset all selections
    const handleReset = () => {
        setSelectedDecompositionMethod(['additive','additive']);
        setSelectedTrendedMethod(['linear','Linear']);
        setSelectedPeriod(['7','Daily in Week']);
        setSaveDecomposition(false);
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
        if (!selectedTrendedMethod[0]) {
            return "Please select a method.";
        }
        return null;
    };

    // Prepare data for decomposition
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

    // Save decomposition results as new variables
    const saveDecompositionResults = async (
        seasonal: any[],
        trend: any[],
        irrengular: any[],
        forecasting: any[],
        dataVarDef: Variable
    ) => {
        const rawData = data as RawData;
        let currentData = [...rawData];
        let nextColumnIndex = storeVariables.length;
        
        // Helper function to add a component as a new variable
        const addComponentAsVariable = async (
            componentValues: any[],
            componentType: string,
            suffix: string
        ) => {
            // Prepare values array with proper length
            const fullValues = [...componentValues];
            if (fullValues.length < currentData.length) {
                const missingRows = currentData.length - fullValues.length;
                fullValues.push(...new Array(missingRows).fill(""));
            }
            
            // Update data with new values
            const updatedData = currentData.map((row, index) => {
                const updatedRow = [...row];
                const value = fullValues[index]?.toString() || "";
                
                // Find first empty column
                for (let colIndex = 0; colIndex < updatedRow.length; colIndex++) {
                    if (updatedRow[colIndex] === '') {
                        updatedRow[colIndex] = value;
                        break;
                    }
                }
                
                return updatedRow;
            });
            
            // Create variable definition
            const variableName = `${dataVarDef.name}-${suffix}-${nextColumnIndex}`;
            
            const newVariable: Partial<Variable> = {
                name: variableName,
                columnIndex: nextColumnIndex,
                type: "NUMERIC",
                label: `${dataVarDef.label || dataVarDef.name} (${componentType})`,
                values: [],
                missing: [],
                measure: "scale",
                width: 8,
                decimals: 3,
                columns: 1,
                align: "right",
            };
            
            // Update data and add variable
            currentData = updatedData;
            await addVariable(newVariable);
            
            // Save to IndexDB
            const cells = fullValues.map((value, index) => ({
                x: nextColumnIndex,
                y: index,
                value: value.toString(),
            }));
            
            await db.cells.bulkPut(cells);
            
            // Increment column index for next variable
            nextColumnIndex++;
            
            return { updatedData, newVarIndex: nextColumnIndex };
        };
        
        // Add each component as a variable
        await addComponentAsVariable(seasonal, "Seasonal Component", "SC");
        await addComponentAsVariable(trend, "Trend Component", "TC");
        await addComponentAsVariable(irrengular, "Irregular Component", "IC");
        await addComponentAsVariable(forecasting, "Forecasting", "Forecasting");
        
        // Update the data store with final data
        setData(currentData);
    };

    // Process decomposition results
    const processDecompositionResults = async (
        results: [any[], any[], any[], any[], any[], any, any, any],
        dataVarDef: Variable,
        timeVarDef: Variable
    ) => {
        const [testing, seasonal, trend, irrengular, forecasting, evaluation, seasonIndices, equation] = results;
        
        // Create log entry
        const logMsg = `DECOMPOSITION: ${dataVarDef.label ? dataVarDef.label + ' Using' : dataVarDef.name + ' Using'} ${selectedDecompositionMethod[1]}.`;
        const logId = await addLog({ log: logMsg });

        // Create analytic entry
        const analyticId = await addAnalytic(logId, {
            title: `Decomposition ${selectedDecompositionMethod[1]}`,
            note: "",
        });

        // Add seasonal indices statistic
        await addStatistic(analyticId, {
            title: "Seasonal Indices",
            output_data: seasonIndices,
            components: "Seasonal Indices",
            description: "",
        });

        // Add equation for multiplicative method
        if (selectedDecompositionMethod[0] === 'multiplicative') {
            await addStatistic(analyticId, {
                title: "Equation",
                output_data: equation,
                components: "Equation Trend",
                description: "",
            });
        }

        // Add evaluation statistic
        await addStatistic(analyticId, {
            title: "Evalution",
            output_data: evaluation,
            components: "Forecasting Evaluation",
            description: "",
        });

        // Save as variables if requested
        if (saveDecomposition) {
            await saveDecompositionResults(seasonal, trend, irrengular, forecasting, dataVarDef);
        }
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
            
            // Additional validation for periodicity
            const periodicity = Number(selectedPeriod[0]);
            if (dataValues.length < 4 * periodicity) {
                throw new Error(`Data length is less than 4 times the periodicity.`);
            }
            if (dataValues.length % periodicity !== 0) {
                throw new Error("Data length is not a multiple of the periodicity.");
            }
            
            // Execute decomposition calculation
            const results = await handleDecomposition(
                dataValues,
                dataVarDef.name,
                timeValues,
                timeVarDef.name,
                selectedDecompositionMethod[0],
                selectedTrendedMethod[0],
                Number(selectedPeriod[0]),
                selectedPeriod[1]
            );
            
            // Process and save results
            await processDecompositionResults(results, dataVarDef, timeVarDef);
            
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
                    <DialogTitle className="font-bold text-2xl">Decomposition</DialogTitle>
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
                        {/* Decomposition Method Section */}
                        <div className="border-2 rounded-md w-[370px] p-4 flex flex-col gap-4">
                            <label className="font-semibold">Decomposition Method</label>
                            
                            <RadioGroup
                                value={selectedDecompositionMethod[0]}
                                onValueChange={(value) => setSelectedDecompositionMethod([
                                    value, 
                                    decompositionMethods.find(m => m.value === value)?.label || ''
                                ])}
                                className="flex flex-row gap-4"
                            >
                                {decompositionMethods.map((method) => (
                                    <div key={method.value} className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value={method.value}
                                            id={method.value}
                                            className="w-4 h-4"
                                        />
                                        <label htmlFor={method.value} className="text-sm font-medium text-gray-700">
                                            {method.label}
                                        </label>
                                    </div>
                                ))}
                            </RadioGroup>
                            
                            {selectedDecompositionMethod[0] === 'multiplicative' && (
                                <div className="flex flex-col gap-4">
                                    <Label className="w-[120px]">trend: </Label>
                                    <RadioGroup
                                        value={selectedTrendedMethod[0]}
                                        onValueChange={(value) => setSelectedTrendedMethod([
                                            value, 
                                            trendedMethods.find(m => m.value === value)?.label || ''
                                        ])}
                                        className="flex flex-row gap-4"
                                    >
                                        {trendedMethods.map((method) => (
                                            <div key={method.value} className="flex flex-row items-center space-x-2">
                                                <RadioGroupItem
                                                    value={method.value}
                                                    id={method.value}
                                                    className="w-4 h-4"
                                                />
                                                <label htmlFor={method.value} className="text-sm font-medium text-gray-700">
                                                    {method.label}
                                                </label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}
                            
                            <div className="flex flex-row gap-2 items-center">
                                <label className="text-sm w-[150px] font-semibold">
                                    periodicity : {selectedPeriod[0]}
                                </label>
                                <Select
                                    onValueChange={(value) => {
                                        const selected = periods.find(p => p.id === value);
                                        if (selected) {
                                            setSelectedPeriod([selected.value, selected.label]);
                                        }
                                    }}
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
                        </div>

                        {/* Save Options Section */}
                        <div className="border-2 rounded-md w-[370px] pl-2 pt-2 pb-4 flex flex-col gap-2">
                            <div className="ml-2">
                                <Label className="font-semibold">Save:</Label>
                            </div>
                            <div className="flex flex-row gap-2 ml-8">
                                <Checkbox 
                                    checked={saveDecomposition} 
                                    onCheckedChange={(isChecked) => setSaveDecomposition(Boolean(isChecked))}
                                />
                                <Label>Save Decomposition Component as Variable</Label>
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

export default DecompositionModal;