"use client"

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MissingValuesSpec, VariableType } from '@/types/Variable';

interface MissingValuesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (missingValues: MissingValuesSpec | null) => void;
    initialMissingValues: MissingValuesSpec | null;
    variableType: VariableType;
}

export const MissingValuesDialog: React.FC<MissingValuesDialogProps> = ({
                                                                            open,
                                                                            onOpenChange,
                                                                            onSave,
                                                                            initialMissingValues,
                                                                            variableType = "NUMERIC"
                                                                        }) => {
    const [option, setOption] = useState<"none" | "discrete" | "range">("none");
    const [discreteValues, setDiscreteValues] = useState<string[]>(["", "", ""]);
    const [rangeMin, setRangeMin] = useState<string>("");
    const [rangeMax, setRangeMax] = useState<string>("");
    const [rangeDiscreteValue, setRangeDiscreteValue] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const isStringType = variableType === "STRING";

    useEffect(() => {
        setError(null);

        if (!initialMissingValues) {
            setOption("none");
            setDiscreteValues(["", "", ""]);
            setRangeMin("");
            setRangeMax("");
            setRangeDiscreteValue("");
            return;
        }

        if (initialMissingValues.discrete && initialMissingValues.discrete.length > 0) {
            setOption("discrete");
            const initialDiscrete = initialMissingValues.discrete.map(String);
            while (initialDiscrete.length < 3) {
                initialDiscrete.push("");
            }
            setDiscreteValues(initialDiscrete.slice(0, 3));
            setRangeMin("");
            setRangeMax("");
            setRangeDiscreteValue("");
        } else if (initialMissingValues.range) {
            setOption("range");
            setRangeMin(initialMissingValues.range.min !== undefined ? String(initialMissingValues.range.min) : "");
            setRangeMax(initialMissingValues.range.max !== undefined ? String(initialMissingValues.range.max) : "");
            setDiscreteValues(["", "", ""]);
            setRangeDiscreteValue("");
        } else {
            setOption("none");
            setDiscreteValues(["", "", ""]);
            setRangeMin("");
            setRangeMax("");
            setRangeDiscreteValue("");
        }

    }, [initialMissingValues, open]);

    const handleDiscreteValueChange = (index: number, value: string) => {
        const rawValue = value;

        if (isStringType && new TextEncoder().encode(rawValue).length > 8) {
            setError("String missing values cannot exceed 8 bytes");
            return;
        }

        if (!isStringType && rawValue.trim() !== "" && isNaN(Number(rawValue))) {
            setError(`Value "${rawValue}" is not a valid number.`);
            return;
        }

        const newValues = [...discreteValues];
        newValues[index] = rawValue;
        setDiscreteValues(newValues);
        setError(null);
    };

    const validateRangeOption = (): { valid: boolean; range?: { min?: number; max?: number }; discrete?: (number | string)[] } => {
        let rangeSpec: { min?: number; max?: number } = {};
        let discreteSpec: (number | string)[] = [];
        let isValid = true;
        let errorMsg: string | null = null;

        const hasMin = rangeMin.trim() !== "";
        const hasMax = rangeMax.trim() !== "";
        const hasDiscrete = rangeDiscreteValue.trim() !== "";

        let numMin: number | undefined = undefined;
        let numMax: number | undefined = undefined;
        let numDiscrete: number | undefined = undefined;

        if (!hasMin && !hasMax) {
            errorMsg = "At least one range value (Low or High) must be provided for the range option.";
            isValid = false;
        }

        if (isValid && hasMin) {
            numMin = Number(rangeMin);
            if (isNaN(numMin)) {
                errorMsg = `Low range value "${rangeMin}" is not a valid number.`;
                isValid = false;
            } else {
                rangeSpec.min = numMin;
            }
        }

        if (isValid && hasMax) {
            numMax = Number(rangeMax);
            if (isNaN(numMax)) {
                errorMsg = `High range value "${rangeMax}" is not a valid number.`;
                isValid = false;
            } else {
                rangeSpec.max = numMax;
            }
        }

        if (isValid && numMin !== undefined && numMax !== undefined && numMin > numMax) {
            errorMsg = "Low range value must be less than or equal to High range value.";
            isValid = false;
        }

        if (isValid && hasDiscrete) {
            numDiscrete = Number(rangeDiscreteValue);
            if (isNaN(numDiscrete)) {
                errorMsg = `Discrete value "${rangeDiscreteValue}" is not a valid number.`;
                isValid = false;
            } else {
                const isWithinRange = (numMin !== undefined && numDiscrete >= numMin) && (numMax !== undefined && numDiscrete <= numMax);
                if (isWithinRange) {
                }
                discreteSpec.push(numDiscrete);
            }
        }

        setError(errorMsg);
        return { valid: isValid, range: Object.keys(rangeSpec).length > 0 ? rangeSpec : undefined, discrete: discreteSpec.length > 0 ? discreteSpec : undefined };
    };

    const validateDiscreteOption = (): { valid: boolean; discrete?: (number | string)[] } => {
        const finalDiscreteValues: (number | string)[] = [];
        let isValid = true;
        let errorMsg: string | null = null;

        const processedValues = discreteValues
            .map(v => v)
            .filter(v => v !== "");

        if (processedValues.length === 0) {
        } else if (processedValues.length > 3) {
            errorMsg = "A maximum of 3 discrete missing values are allowed.";
            isValid = false;
        } else {
            for (const val of processedValues) {
                if (isStringType) {
                    if (new TextEncoder().encode(val).length > 8) {
                        errorMsg = `String value "${val}" exceeds 8 bytes.`;
                        isValid = false;
                        break;
                    }
                    finalDiscreteValues.push(val);
                } else {
                    const numVal = Number(val);
                    if (isNaN(numVal)) {
                        if (val.trim() === '') {
                           finalDiscreteValues.push(val);
                        } else {
                            errorMsg = `Value "${val}" is not a valid number.`;
                            isValid = false;
                            break;
                        }
                    } else {
                        finalDiscreteValues.push(numVal);
                    }
                }
            }
        }

        if (isValid && finalDiscreteValues.length > 0) {
            const uniqueValues = new Set(finalDiscreteValues.map(v => typeof v === 'number' ? v : v.toLowerCase()));
             if (uniqueValues.size !== finalDiscreteValues.length) {
                errorMsg = "Duplicate discrete missing values are not allowed.";
                isValid = false;
            }
        }

        setError(errorMsg);
        return { valid: isValid, discrete: finalDiscreteValues.length > 0 ? finalDiscreteValues : undefined };
    };

    const handleSave = () => {
        setError(null);
        let finalMissingSpec: MissingValuesSpec | null = null;

        if (option === "none") {
            finalMissingSpec = null;
        } else if (option === "discrete") {
            const validationResult = validateDiscreteOption();
            if (validationResult.valid) {
                if (validationResult.discrete && validationResult.discrete.length > 0) {
                    finalMissingSpec = { discrete: validationResult.discrete };
                } else {
                    finalMissingSpec = null;
                }
            } else {
                return;
            }
        } else if (option === "range") {
             if (isStringType) {
                 setError("Range missing values are only applicable for numeric variables.");
                 return;
             }
            const validationResult = validateRangeOption();
            if (validationResult.valid) {
                 if (validationResult.range || (validationResult.discrete && validationResult.discrete.length > 0)) {
                     finalMissingSpec = {};
                     if(validationResult.range) {
                         finalMissingSpec.range = validationResult.range;
                     }
                     if (validationResult.discrete && validationResult.discrete.length > 0) {
                         finalMissingSpec.discrete = validationResult.discrete;
                     }
                     if (!finalMissingSpec.range && !finalMissingSpec.discrete) {
                        finalMissingSpec = null;
                     } else if (!finalMissingSpec.range && finalMissingSpec.discrete) {
                         setOption("discrete");
                         setDiscreteValues([finalMissingSpec.discrete[0].toString(), "", ""]);
                         setRangeMin("");
                         setRangeMax("");
                         setRangeDiscreteValue("");
                         const discreteValidation = validateDiscreteOption();
                         if (discreteValidation.valid && discreteValidation.discrete) {
                             finalMissingSpec = { discrete: discreteValidation.discrete };
                         } else {
                              finalMissingSpec = null;
                              if (!discreteValidation.valid) return;
                         }

                     } else if (finalMissingSpec.range && !finalMissingSpec.discrete) {
                         delete finalMissingSpec.discrete;
                     }

                 } else {
                     finalMissingSpec = null;
                 }
            } else {
                return;
            }
        }

        onSave(finalMissingSpec);
        onOpenChange(false);
    };

    const handleRangeMinChange = (value: string) => {
        setRangeMin(value);
        setError(null);
    };

    const handleRangeMaxChange = (value: string) => {
        setRangeMax(value);
        setError(null);
    };

    const handleRangeDiscreteChange = (value: string) => {
        if (!isStringType && value.trim() !== "" && isNaN(Number(value))) {
            setError(`Discrete value "${value}" is not a valid number.`);
        } else {
            setError(null);
        }
        setRangeDiscreteValue(value);
    };

    // Handler for RadioGroup to ensure type safety
    const handleOptionChange = (value: string) => {
        if (value === "none" || value === "discrete" || value === "range") {
            setOption(value);
            setError(null); // Reset error when changing option type
        } else {
            // Handle unexpected value if necessary, though UI should prevent this
            console.error("Invalid missing value option received:", value);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white shadow-md rounded-none p-0 overflow-hidden">
                <DialogHeader className="bg-gray-200 p-2 border-b border-gray-300">
                    <DialogTitle className="text-md font-medium text-gray-800">Missing Values</DialogTitle>
                </DialogHeader>

                <div className="p-4 space-y-4">
                    {error && (
                        <div className="text-xs text-red-500 font-medium border-l-2 border-red-500 pl-2 py-1 bg-red-50">
                            {error}
                        </div>
                    )}

                    <RadioGroup value={option} onValueChange={handleOptionChange} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="none" className="border-gray-400 text-gray-800" />
                            <Label htmlFor="none" className="text-gray-800 font-medium">
                                No missing values
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="discrete" id="discrete" className="border-gray-400 text-gray-800" />
                                <Label htmlFor="discrete" className="text-gray-800 font-medium">
                                    Discrete missing values
                                </Label>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pl-6">
                                {discreteValues.map((value, index) => (
                                    <Input
                                        key={index}
                                        type={isStringType ? "text" : "text"}
                                        value={value}
                                        onChange={(e) => handleDiscreteValueChange(index, e.target.value)}
                                        className="h-8 text-xs border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={option !== 'discrete'}
                                        maxLength={isStringType ? 8 : undefined}
                                        inputMode={isStringType ? "text" : "numeric"}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 pl-6">
                                Specify up to three discrete values. {isStringType ? "Max 8 bytes per value." : "Values must be numeric."}
                            </p>
                        </div>

                        {!isStringType && (
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="range" id="range" className="border-gray-400 text-gray-800" />
                                    <Label htmlFor="range" className="text-gray-800 font-medium">
                                        Range plus one optional discrete missing value
                                    </Label>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pl-6 items-center">
                                    <div>
                                        <Label htmlFor="range-low" className="text-xs text-gray-600">Low:</Label>
                                        <Input
                                            id="range-low"
                                            type="text"
                                            inputMode='numeric'
                                            value={rangeMin}
                                            onChange={(e) => handleRangeMinChange(e.target.value)}
                                            className="h-8 text-xs border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={option !== 'range'}
                                            placeholder='e.g., 0'
                                        />
                                    </div>
                                     <div>
                                        <Label htmlFor="range-high" className="text-xs text-gray-600">High:</Label>
                                        <Input
                                            id="range-high"
                                             type="text"
                                             inputMode='numeric'
                                            value={rangeMax}
                                            onChange={(e) => handleRangeMaxChange(e.target.value)}
                                            className="h-8 text-xs border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={option !== 'range'}
                                             placeholder='e.g., 99'
                                        />
                                    </div>
                                </div>
                                 <div className="pl-6 mt-2">
                                    <Label htmlFor="range-discrete" className="text-xs text-gray-600">Optional Discrete Value:</Label>
                                    <Input
                                        id="range-discrete"
                                         type="text"
                                         inputMode='numeric'
                                        value={rangeDiscreteValue}
                                        onChange={(e) => handleRangeDiscreteChange(e.target.value)}
                                        className="h-8 text-xs border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-1/2"
                                        disabled={option !== 'range'}
                                         placeholder='e.g., -1'
                                    />
                                </div>
                                <p className="text-xs text-gray-500 pl-6">
                                     Specify a range (Low/High) and/or a single discrete value. Values must be numeric.
                                </p>
                            </div>
                        )}
                    </RadioGroup>
                </div>

                <DialogFooter className="bg-gray-100 p-2 border-t border-gray-300 flex justify-end space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs px-3 py-1 border-gray-400 text-gray-700 hover:bg-gray-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};