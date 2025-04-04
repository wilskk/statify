// BoxJenkinsModelModal.tsx
import React, { useState, useEffect, FC } from "react";
import { CornerDownLeft, CornerDownRight } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { handleBoxJenkinsModel } from "./handleAnalyze/handleBoxJenkinsModel";
import { Variable } from "@/types/Variable";
import db from "@/lib/db";

type RawData = string[][];

interface BoxJenkinsModelModalProps {
    onClose: () => void;
}

interface PeriodOption {
    value: string;
    label: string;
    id: string;
}

const BoxJenkinsModelModal: FC<BoxJenkinsModelModalProps> = ({ onClose }) => {
    // Define constants
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
    const [selectedPeriod, setSelectedPeriod] = useState<string[]>(['7','Daily in Week']);
    const [maOrder, setMaOrder] = useState<number>(0);
    const [arOrder, setArOrder] = useState<number>(0);
    const [diffOrder, setDiffOrder] = useState<number>(0);
    const [checkedForecasting, setCheckedForecasting] = useState<boolean>(false);
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
        setMaOrder(0);
        setArOrder(0);
        setDiffOrder(0);
        setCheckedForecasting(false);
        setSelectedPeriod(['7','Daily in Week']);
        setAvailableVariables(storeVariables.map(v => v.name));
        setDataVariable([]);
        setTimeVariable([]);
        setHighlightedVariable(null);
        setErrorMsg(null);
    };

    // Handle period selection
    const handleSelectedPeriod = (id: string) => {
        const period = periods.find(p => p.id === id);
        if (!period) return;
        
        setSelectedPeriod([period.value, period.label]);
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

    // Prepare data for Box-Jenkins model
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

    // Process Box-Jenkins model results
    const processBoxJenkinsResults = async (
        results: [any[], any, any, any, any[]],
        dataVarDef: Variable
    ) => {
        const [test, coefficient, criteria, evaluation, forecast] = results;
        
        // Create log entry
        const logMsg = `ARIMA(${arOrder},${diffOrder},${maOrder}) ${dataVarDef.label || dataVarDef.name}.`;
        const logId = await addLog({ log: logMsg });

        // Create analytic entry
        const analyticId = await addAnalytic(logId, {
            title: `ARIMA(${arOrder},${diffOrder},${maOrder})`,
            note: "",
        });

        // Add coefficient test statistic
        await addStatistic(analyticId, {
            title: `Coeficient Test for ARIMA(${arOrder},${diffOrder},${maOrder})`,
            output_data: coefficient,
            components: `Coeficient Test for ARIMA(${arOrder},${diffOrder},${maOrder})`,
            description: "",
        });

        // Add criteria selection statistic
        await addStatistic(analyticId, {
            title: `Criteria Selection for ARIMA(${arOrder},${diffOrder},${maOrder})`,
            output_data: criteria,
            components: `Criteria Selection for ARIMA(${arOrder},${diffOrder},${maOrder})`,
            description: "",
        });

        // Add forecasting evaluation if forecasting is checked
        if (checkedForecasting) {
            await addStatistic(analyticId, {
                title: `Forecasting Evaluation for ARIMA(${arOrder},${diffOrder},${maOrder})`,
                output_data: evaluation,
                components: `Forecasting Evaluation for ARIMA(${arOrder},${diffOrder},${maOrder})`,
                description: "",
            });
            
            // Save forecasting results as variable
            await saveForcastingAsVariable(forecast, dataVarDef);
        }
    };

    // Save forecasting results as a new variable
    const saveForcastingAsVariable = async (forecast: any[], dataVarDef: Variable) => {
        const rawData = data as RawData;
        
        // Prepare result array with proper length
        const fullResult = [...forecast];
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
        const newVarName = `${dataVarDef.name} ARIMA (${arOrder},${diffOrder},${maOrder}) ${newVarIndex}`;
        
        const forecastingVariable: Partial<Variable> = {
            name: newVarName,
            columnIndex: newVarIndex,
            type: "NUMERIC",
            label: `${dataVarDef.label || dataVarDef.name} ARIMA (${arOrder},${diffOrder},${maOrder})`,
            values: [],
            missing: [],
            measure: "scale",
            width: 8,
            decimals: 3,
            columns: 1,
            align: "right",
        };
        
        // Update data store with the new data
        setData(updatedData);
        
        // Add the new variable
        await addVariable(forecastingVariable);
        
        // Save cells to IndexDB
        const forecastCells = fullResult.map((value, index) => ({
            x: forecastingVariable.columnIndex,
            y: index,
            value: value.toString(),
        }));
        
        await db.cells.bulkPut(forecastCells);
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
            
            // Execute Box-Jenkins model calculation
            const results = await handleBoxJenkinsModel(
                dataValues,
                dataVarDef.name,
                timeValues,
                timeVarDef.name,
                [arOrder, diffOrder, maOrder],
                checkedForecasting,
                Number(selectedPeriod[0])
            );
            
            // Process and save results
            await processBoxJenkinsResults(results, dataVarDef);
            
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
                    <DialogTitle className="font-bold text-2xl">Box-Jenkins Model</DialogTitle>
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

                    {/* Parameter and Options Column */}
                    <div className="flex flex-col gap-4">
                        {/* Parameter Order Section */}
                        <div className="border-2 rounded-md w-[420px] flex flex-col gap-4 py-4">
                            <div className="ml-4">
                                <label className="font-semibold">Parameter Order</label>
                            </div>

                            <div className="flex flex-row ml-4 mt-2">
                                {/* AR Order */}
                                <div className="flex flex-row gap-4 ml-4">
                                    <div className="flex items-center">
                                        <Label>p:</Label>
                                    </div>
                                    <Input 
                                        type="number" 
                                        className="w-[80px]" 
                                        placeholder="1" 
                                        min="0" 
                                        max="5" 
                                        step="1"
                                        value={arOrder}
                                        onChange={(e) => setArOrder(Number(e.target.value))}
                                    />
                                </div>
                                
                                {/* Differencing Order */}
                                <div className="flex flex-row gap-4 ml-4">
                                    <div className="flex items-center">
                                        <Label>d:</Label>
                                    </div>
                                    <Input 
                                        type="number" 
                                        className="w-[80px]" 
                                        placeholder="1" 
                                        min="0" 
                                        max="2" 
                                        step="1"
                                        value={diffOrder}
                                        onChange={(e) => setDiffOrder(Number(e.target.value))}
                                    />
                                </div>
                                
                                {/* MA Order */}
                                <div className="flex flex-row gap-4 ml-4">
                                    <div className="flex items-center">
                                        <Label>q:</Label>
                                    </div>
                                    <Input 
                                        type="number" 
                                        className="w-[80px]" 
                                        placeholder="1" 
                                        min="0" 
                                        max="5" 
                                        step="1"
                                        value={maOrder}
                                        onChange={(e) => setMaOrder(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Forecasting Option */}
                            <div className="flex flex-row gap-2 ml-8 mt-2">
                                <Checkbox 
                                    checked={checkedForecasting} 
                                    onCheckedChange={(isChecked) => setCheckedForecasting(Boolean(isChecked))}
                                />
                                <Label>Forecasting Model</Label>
                            </div>

                            {/* Periodicity Selection (shown only when forecasting is enabled) */}
                            {checkedForecasting && (
                                <div className="flex flex-row gap-2 items-center mx-8">
                                    <label className="text-sm w-[150px] font-semibold">
                                        periodicity: {selectedPeriod[0]}
                                    </label>
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

export default BoxJenkinsModelModal;