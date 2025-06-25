// DecompositionModal.tsx
import React, { useState, useEffect, FC } from "react";
import { CornerDownLeft, CornerDownRight } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { handleDecomposition } from "./handleAnalyze/handleDecomposition";
import { InputRow } from "./timeSeriesComponent/timeSeriesInput";
import { Variable } from "@/types/Variable";

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
        { value: 'exponential', label: 'Exponential' },
    ];

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

    // Local state management
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);
    const [dataVariable, setDataVariable] = useState<string[]>([]);
    const { getTypeDate, getYear, getWeek, getDay, setTypeDate, setYear, setWeek, setDay } = useTimeSeriesStore();
    
    // UI state management
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
    const [selectedDecompositionMethod, setSelectedDecompositionMethod] = useState<string[]>(['additive','additive']);
    const [selectedTrendedMethod, setSelectedTrendedMethod] = useState<string[]>(['linear','Linear']);
    const [selectedPeriod, setSelectedPeriod] = useState<string[]>([periods.find(p => p.id === getTypeDate())?.value || '0', periods.find(p => p.id === getTypeDate())?.label || 'Not Dated']);
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
        setSelectedDecompositionMethod(['additive','additive']);
        setSelectedTrendedMethod(['linear','Linear']);
        setSelectedPeriod([periods.find(p => p.id === getTypeDate())?.value || '0', periods.find(p => p.id === getTypeDate())?.label || 'Not Dated']);
        setSaveDecomposition(false);
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
        if (!selectedTrendedMethod[0]) {
            return "Please select a method.";
        }
        if (selectedPeriod[0] === '0') {
            return "Please the selected time spesification don't have periodicity.";
        }
        return null;
    };

    // Prepare data for decomposition
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

    // Save decomposition results as new variables
    const saveDecompositionResults = async (
        seasonal: any[],
        trend: any[],
        irrengular: any[],
        forecasting: any[],
        dataVarDef: Variable
    ) => {
        let nextColumnIndex = storeVariables.length;
        
        // Helper function to add a component as a new variable
        const addComponentAsVariable = async (
            componentValues: any[],
            componentType: string,
            suffix: string
        ) => {
            // Create variable definition
            const variableName = `${dataVarDef.name}-${suffix}`;
            
            const newVariable: Partial<Variable> = {
                name: variableName,
                columnIndex: nextColumnIndex,
                type: "NUMERIC",
                label: `${dataVarDef.label || dataVarDef.name} (${componentType})`,
                values: [],
                missing: null,
                measure: "scale",
                width: 8,
                decimals: 3,
                columns: 100,
                align: "right",
            };
            
            // Add variable
            await addVariable(newVariable);
            
            // Prepare updates array
            const updates = [];
            
            // Add each value to the updates array
            for (let rowIndex = 0; rowIndex < componentValues.length; rowIndex++) {
                if (newVariable.columnIndex !== undefined) {
                    updates.push({
                        row: rowIndex,
                        col: newVariable.columnIndex,
                        value: componentValues[rowIndex].toString()
                    });
                }
            }
            
            // Use bulk update to efficiently add all data
            if (updates.length > 0) {
                await updateCells(updates);
            }
            
            // Increment column index for next variable
            nextColumnIndex++;
        };
        
        // Add each component as a variable
        await addComponentAsVariable(seasonal, "Seasonal Component", "SC");
        await addComponentAsVariable(trend, "Trend Component", "TC");
        await addComponentAsVariable(irrengular, "Irregular Component", "IC");
        await addComponentAsVariable(forecasting, "Forecasting", "Forecasting");
    };

    // Process decomposition results
    const processDecompositionResults = async (
        results: [any, any[], any[], any[], any[], any[], any, any, any, any],
        dataVarDef: Variable,
    ) => {
        const [descriptionTable, testing, seasonal, trend, irrengular, forecasting, evaluation, seasonIndices, equation, graphic] = results;
        
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
            title: "Description Table",
            output_data: descriptionTable,
            components: "Description Table",
            description: "",
        });
        
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

        await addStatistic(analyticId, {
            title: "Graphic Forecasting",
            output_data: graphic,
            components: "Graphic Forecasting",
            description: "",
        });

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
            const { dataValues, dataVarDef} = prepareData();
            
            // Validate data
            if (dataValues.length === 0) {
                throw new Error("No data available for the selected variables.");
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
            const results = await handleDecomposition(
                dataValues,
                dataVarDef.name,
                selectedDecompositionMethod[0],
                selectedTrendedMethod[0],
                Number(selectedPeriod[0]),
                selectedPeriod[1],
                getTypeDate(),
                startDate,
            );
            
            // Process and save results
            await processDecompositionResults(results, dataVarDef);
            
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