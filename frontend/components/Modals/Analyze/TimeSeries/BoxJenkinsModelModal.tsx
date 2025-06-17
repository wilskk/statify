// BoxJenkinsModelModal.tsx
import React, { useState, useEffect, FC } from "react";
import { CornerDownLeft, CornerDownRight } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { handleBoxJenkinsModel } from "./handleAnalyze/handleBoxJenkinsModel";
import { InputRow } from "./timeSeriesComponent/timeSeriesInput";
import { Variable } from "@/types/Variable";

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
        { value: '0', label: 'Years', id: 'y'},
        { value: '2', label: 'Years-Semesters', id: 'ys'},
        { value: '4', label: 'Years-Quarters', id: 'yq'},
        { value: '12', label: 'Years-Months', id: 'ym'},
        { value: '5', label: 'Weeks-Work Days(5)', id: 'wwd5'},
        { value: '6', label: 'Weeks-Work Days(6)', id: 'wwd6'},
        { value: '7', label: 'Weeks-Days', id: 'wd'},
        { value: '8', label: 'Days-Work Hours(8)', id: 'dwh'},
        { value: '24', label: 'Days-Hour', id: 'dh'},
        { value: '0', label: 'Not Dated', id: 'nd'},
    ];

    // Store references
    const { variables, loadVariables, addVariable } = useVariableStore();
    const { data, updateCells } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { getTypeDate, getYear, getWeek, getDay, setTypeDate, setYear, setWeek, setDay } = useTimeSeriesStore();
    
    // Local state management
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);
    const [dataVariable, setDataVariable] = useState<string[]>([]);
    
    // UI state management
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<string[]>([periods.find(p => p.id === getTypeDate())?.value || '0', periods.find(p => p.id === getTypeDate())?.label || 'Not Dated']);
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

    const handleDeselectDataVariable = (variable: string) => {
        if (highlightedVariable === variable) {
            setAvailableVariables(prev => [...prev, variable]);
            setDataVariable([]);
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable(variable);
        }
    };

    const handleSelectedPeriod = (id: string) => {
        const period = periods.find(p => p.id === id);
        if (!period) return;
        setSelectedPeriod([period.value, period.label]);
        setTypeDate(period.id as any); // Ensure type safety
    };

    // Reset all selections
    const handleReset = () => {
        setTypeDate('nd');
        setMaOrder(0);
        setArOrder(0);
        setDiffOrder(0);
        setCheckedForecasting(false);
        setSelectedPeriod([periods.find(p => p.id === getTypeDate())?.value || '0', periods.find(p => p.id === getTypeDate())?.label || 'Not Dated']);
        setAvailableVariables(storeVariables.map(v => v.name));
        setDataVariable([]);
        setHighlightedVariable(null);
        setErrorMsg(null);
    };

    const inputPeriods = (period: string) => {
        switch (period) {
            case 'y': case 'ys': case 'yq': case 'ym':
                return (
                    <InputRow
                        label="year" 
                        id="year" 
                        value={getYear()} 
                        min={'1900'} 
                        max={'2100'} 
                        step={'1'} 
                        onChange={(value) => setYear(value)}
                    />
                );
            case 'wwd5': case 'wwd6': case 'wd':
                return (
                    <InputRow
                        label="week" 
                        id="week" 
                        value={getWeek()} 
                        min={'1'} 
                        max={'52'} 
                        step={'1'} 
                        onChange={(value) => setWeek(value)}
                    />
                );
            case 'dwh': case 'dh':
                return (
                    <InputRow
                        label="day" 
                        id="day" 
                        value={getDay()} 
                        min={'1'} 
                        max={'31'} 
                        step={'1'} 
                        onChange={(value) => setDay(value)}
                    />
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
        if (selectedPeriod[1] === 'Not Dated') {
            return "Please select a another time spesification.";
        }
        return null;
    };

    // Prepare data for Box-Jenkins model
    const prepareData = () => {
        // Find variables that match the selected names
        const dataVarDef = storeVariables.find(v => v.name === dataVariable[0]);
        
        if (!dataVarDef) {
            throw new Error("Selected variables not found");
        }

        if (dataVarDef.type !== "NUMERIC") {
            throw new Error("Selected variable is not numeric");
        }

        // Find last row with data in selected variables
        let maxIndex = -1;
        const selectedVariables = [dataVarDef];
        
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
        
        for (let i = 0; i <= maxIndex; i++) {
            const row = (data as RawData)[i];
            const rawDataValue = row[dataVarDef.columnIndex];
            
            if (rawDataValue) {
                const numVal = parseFloat(rawDataValue as string);
                if (!isNaN(numVal)) {
                    dataValues.push(numVal);
                }
            }
        }
        
        return { dataValues, dataVarDef};
    };

    // Process Box-Jenkins model results
    const processBoxJenkinsResults = async (
        results: [any, any[], any, any, any, any[], any],
        dataVarDef: Variable
    ) => {
        const [descriptionTable, test, coefficient, criteria, evaluation, forecast, graphic] = results;
        console.log(test);
        console.log(criteria);
        console.log(evaluation);
        console.log(forecast);
        
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
            title: `Description Table`,
            output_data: descriptionTable,
            components: `Description Table`,
            description: "",
        });

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
                title: `Graphic Forecasting for ARIMA(${arOrder},${diffOrder},${maOrder})`,
                output_data: graphic,
                components: `Graphic Forecasting for ARIMA(${arOrder},${diffOrder},${maOrder})`,
                description: "",
            });

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
        // Prepare the new variable definition
        const newVarIndex = storeVariables.length;
        const newVarName = `${dataVarDef.name} ARIMA (${arOrder},${diffOrder},${maOrder})`;
        
        const forecastingVariable: Partial<Variable> = {
            name: newVarName,
            columnIndex: newVarIndex,
            type: "NUMERIC",
            label: `${dataVarDef.label || dataVarDef.name} ARIMA (${arOrder},${diffOrder},${maOrder})`,
            values: [],
            missing: null,
            measure: "scale",
            width: 8,
            decimals: 3,
            columns: 100,
            align: "right",
        };
        
        // Add the new variable
        await addVariable(forecastingVariable);
        
        // Prepare updates array similar to index.tsx pattern
        const updates = [];
        
        // Add each forecast value to the updates array
        for (let rowIndex = 0; rowIndex < forecast.length; rowIndex++) {
            if (forecastingVariable.columnIndex !== undefined) {
                updates.push({
                    row: rowIndex,
                    col: forecastingVariable.columnIndex,
                    value: forecast[rowIndex].toString()
                });
            }
        }
        
        // Use bulk update to efficiently add all data
        if (updates.length > 0) {
            await updateCells(updates);
        }
        
        // Reload variables to reflect changes
        await loadVariables();
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
            const { dataValues, dataVarDef } = prepareData();
            
            // Validate data
            if (dataValues.length === 0) {
                throw new Error("No data available for the selected variables.");
            }
            if (dataValues.length < 20) {
                throw new Error(`Data length is less than 20 observations.`);
            }
            
            // Execute Box-Jenkins model calculation
            let startDate: number;
            switch (getTypeDate()) {
                case 'y': case 'ys': case 'yq': case 'ym':
                    startDate = getYear();
                    break;
                case 'wwd5': case 'wwd6': case 'wd':
                    startDate = getWeek();
                    break;
                case 'dwh': case 'dh':
                    startDate = getDay();
                    break;
                default:
                    startDate = 0;
            };

            const results = await handleBoxJenkinsModel(
                dataValues,
                dataVarDef.name,
                [arOrder, diffOrder, maOrder],
                checkedForecasting,
                Number(selectedPeriod[0]),
                getTypeDate(),
                startDate,
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
                    <div className="col-span-3 flex flex-col border-2 gap-4 p-4 rounded-md max-h-[330px] overflow-y-auto w-[200px]">
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
                            <div className="border-2 rounded-md w-[350px] h-full pb-4">
                                <div className="mt-4 ml-4">
                                        <label className="font-semibold">Time Option</label>
                                </div>
                                <div className="flex items-center p-4">
                                    <div className="flex flex-row w-full">
                                        <div className="flex items-center">
                                            <label className="w-[150px] text-sm font-semibold">
                                                time spesification :
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
                                <div className="flex items-center ml-4">
                                    <label className="w-full text-sm font-semibold">
                                        periodicity : {selectedPeriod[0] === '0' ? "don't have periodicity" : selectedPeriod[0]}
                                    </label>
                                </div>
                                <div className="flex flex-col ml-4 mt-5">
                                    {inputPeriods(getTypeDate())}
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