// UnitRootTestModal.tsx
import React, { useState, useEffect, FC } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { CornerDownLeft, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { handleUnitRootTest } from "./handleAnalyze/handleUnitRootTest";
import { Variable } from "@/types/Variable";

type RawData = string[][];

interface UnitRootTestModalProps {
    onClose: () => void;
}

interface UnitRootMethod {
    value: string;
    label: string;
}

interface DifferenceOption {
    value: string;
    label: string;
}

interface EquationOption {
    value: string;
    label: string;
}

const UnitRootTestModal: FC<UnitRootTestModalProps> = ({ onClose }) => {
    // Define constants
    const methods: UnitRootMethod[] = [
        { value: 'dickey-fuller', label: 'dickey-fuller' },
        { value: 'augmented-dickey-fuller', label: 'augmented dickey-fuller' },
    ];

    const differences: DifferenceOption[] = [
        { value: 'level', label: 'level' },
        { value: 'first-difference', label: 'first difference' },
        { value: 'second-difference', label: 'second difference' },
    ];

    const equations: EquationOption[] = [
        { value: 'no_constant', label: 'none' },
        { value: 'no_trend', label: 'intercept' },
        { value: 'with_trend', label: 'trend and intercept' },
    ];

    // Store references
    const { variables, loadVariables } = useVariableStore();
    const { data } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Local state management
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);
    const [dataVariable, setDataVariable] = useState<string[]>([]);
    
    // UI state management
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string[]>(['dickey-fuller', 'dickey-fuller']);
    const [selectedDifference, setSelectedDifference] = useState<string[]>(['level', 'level']);
    const [selectedEquation, setSelectedEquation] = useState<string[]>(['no_trend', 'intercept']);
    const [lengthLag, setLengthLag] = useState<number>(1);
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

    const handleDeselectDataVariable = (variable: string) => {
        if (highlightedVariable === variable) {
            setAvailableVariables(prev => [...prev, variable]);
            setDataVariable([]);
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable(variable);
        }
    };

    // Method selection handlers
    const handleMethodChange = (value: string) => {
        const methodLabel = methods.find(m => m.value === value)?.label || '';
        setSelectedMethod([value, methodLabel]);
        setSelectedEquation(['no_trend', 'intercept']);
    };

    // Difference selection handler
    const handleDifferenceChange = (value: string) => {
        const differenceLabel = differences.find(d => d.value === value)?.label || '';
        setSelectedDifference([value, differenceLabel]);
    };

    // Equation selection handler
    const handleEquationChange = (value: string) => {
        const equationLabel = equations.find(e => e.value === value)?.label || '';
        setSelectedEquation([value, equationLabel]);
    };

    // Reset all selections
    const handleReset = () => {
        setSelectedMethod(['dickey-fuller', 'dickey-fuller']);
        setSelectedDifference(['level', 'level']);
        setSelectedEquation(['no_trend', 'intercept']);
        setLengthLag(1);
        setAvailableVariables(storeVariables.map(v => v.name));
        setDataVariable([]);
        setHighlightedVariable(null);
        setErrorMsg(null);
    };

    // Validate input
    const validateInputs = () => {
        if (!dataVariable.length) {
            return "Please select at least one used variable.";
        }
        if (lengthLag < 1 ) {
            return "Lag length minimum is 1.";
        }
        return null;
    };

    // Prepare data for unit root test
    const prepareData = () => {
        // Find variable that matches the selected name
        const dataVarDef = storeVariables.find(v => v.name === dataVariable[0]);
        
        if (!dataVarDef) {
            throw new Error("Selected variable not found");
        }

        // Find last row with data
        let maxIndex = -1;
        (data as RawData).forEach((row, rowIndex) => {
            const rawValue = row[dataVarDef.columnIndex];
            if (rawValue !== null && rawValue !== "") {
                maxIndex = rowIndex;
            }
        });
        
        if (maxIndex < 0) maxIndex = 0;

        // Extract data values
        const dataValues: number[] = [];
        
        for (let i = 0; i <= maxIndex; i++) {
            const row = (data as RawData)[i];
            const rawValue = row[dataVarDef.columnIndex];
            
            if (rawValue) {
                const numVal = parseFloat(rawValue as string);
                if (!isNaN(numVal)) {
                    dataValues.push(numVal);
                }
            }
        }
        
        return { dataValues, dataVarDef };
    };

    // Process unit root test results
    const processUnitRootTestResults = async (
        descriptionTable: any,
        df_stat: any,
        coef_stat: any,
        sel_crit: any,
        methodName: string,
        dataVarDef: Variable
    ) => {
        // Create log entry
        const logMsg = `UNIT ROOT TEST: ${dataVarDef.label || dataVarDef.name} on ${selectedDifference[1]} ${selectedEquation[1]} ${selectedMethod[1] === 'augmented dickey-fuller' ? `with lag length ${lengthLag}` : ''}`;
        const logId = await addLog({ log: logMsg });

        // Create analytic entry
        const analyticId = await addAnalytic(logId, {
            title: `Unit Root Test: ${methodName}`,
            note: "",
        });

        // Add Dickey Fuller test statistic
        await addStatistic(analyticId, {
            title: `Description Table`,
            output_data: descriptionTable,
            components: `Description Table`,
            description: "",
        });

        await addStatistic(analyticId, {
            title: `${methodName} Test Statistic`,
            output_data: df_stat,
            components: `${methodName} Test Statistic`,
            description: "",
        });

        // Add coefficient regression test
        await addStatistic(analyticId, {
            title: `Coeficient Regression Test`,
            output_data: coef_stat,
            components: `Coeficient Regression Test`,
            description: "",
        });

        // Add selection criterion
        await addStatistic(analyticId, {
            title: `Selection Criterion`,
            output_data: sel_crit,
            components: `Selection Criterion`,
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
            const { dataValues, dataVarDef } = prepareData();
            
            // Validate data
            if (dataValues.length === 0) {
                throw new Error("No data available for the selected variable.");
            }
            if (dataValues.length < 20) {
                throw new Error(`Data length is less than 20 observations.`);
            }
            
            // Execute unit root test calculation
            const [descriptionTable, testing, df_stat, coef_stat, sel_crit, methodName] = await handleUnitRootTest(
                dataValues,
                dataVarDef.name,
                selectedMethod[0],
                lengthLag,
                selectedEquation[0],
                selectedDifference[0]
            );
            
            // Process results
            await processUnitRootTestResults(
                descriptionTable,
                df_stat,
                coef_stat,
                sel_crit,
                methodName,
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
                    <DialogTitle className="font-bold text-2xl">Unit Root Test</DialogTitle>
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

                    {/* Variable Selection and Method Column */}
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
                        
                        {/* Method Selection */}
                        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-[270px]">
                            <label className="w-[100px] font-semibold">Method:</label>
                            <RadioGroup
                                value={selectedMethod[0]}
                                onValueChange={handleMethodChange}
                                className="flex flex-col gap-4"
                            >
                                {methods.map((method) => (
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
                    </div>

                    {/* Options Column */}
                    <div className="flex flex-col gap-4">
                        <div className="border-2 rounded-md w-[420px] pb-2">
                            <div className="mt-4 ml-4">
                                <label className="font-semibold">Unit Root Test Options:</label>
                            </div>
                            
                            {/* Difference Selection */}
                            <div className="w-full pl-4 pr-4 border-0 rounded-t-md flex flex-col gap-4 mt-4">
                                <Label className="w-[200px]">calculate on:</Label>
                                <RadioGroup
                                    value={selectedDifference[0]}
                                    onValueChange={handleDifferenceChange}
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
                            
                            {/* Equation Selection */}
                            <div className="w-full pl-4 pr-4 border-0 rounded-t-md flex flex-col gap-4 mt-4">
                                <Label className="w-[120px]">equation: </Label>
                                <RadioGroup
                                    value={selectedEquation[0]}
                                    onValueChange={handleEquationChange}
                                    className="flex flex-row gap-4"
                                >
                                    {equations.map((equation) => (
                                        <div key={equation.value} className="flex flex-row items-center space-x-2">
                                            <RadioGroupItem
                                                value={equation.value}
                                                id={equation.value}
                                                className="w-4 h-4"
                                            />
                                            <label htmlFor={equation.value} className="text-sm font-medium text-gray-700">
                                                {equation.label}
                                            </label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                            
                            {/* Lag Length (shown only for augmented Dickey-Fuller) */}
                            {selectedMethod[0] === 'augmented-dickey-fuller' && (
                                <div className="flex flex-row gap-4 ml-4 mt-4">
                                    <div className="flex items-center">
                                        <Label>lag length:</Label>
                                    </div>
                                    <Input 
                                        type="number" 
                                        className="w-[60px]" 
                                        placeholder="1" 
                                        min="1" 
                                        max="5" 
                                        step="1"
                                        value={lengthLag}
                                        onChange={(e) => setLengthLag(Number(e.target.value))}
                                    /> 
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

export default UnitRootTestModal;