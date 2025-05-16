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
import { ValueLabel } from "@/types/Variable";
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValueLabelsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (values: ValueLabel[]) => void;
    initialValues: ValueLabel[];
    variableName: string;
    variableType: string;
}

export const ValueLabelsDialog = ({
    open,
    onOpenChange,
    onSave,
    initialValues,
    variableName,
    variableType = "NUMERIC" // Default to NUMERIC if not specified
}: ValueLabelsDialogProps) => {
    const { isMobile } = useMobile();
    const [values, setValues] = useState<ValueLabel[]>([]);
    const [currentValue, setCurrentValue] = useState("");
    const [currentLabel, setCurrentLabel] = useState("");
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [originalValue, setOriginalValue] = useState<string | null>(null);
    const [originalLabel, setOriginalLabel] = useState<string | null>(null);

    const isStringType = variableType === "STRING";

    useEffect(() => {
        setValues(initialValues || []);
    }, [initialValues]);

    const validateValue = (value: string): boolean => {
        // Empty string is not valid, but a single space is valid for string variables
        const isSpace = value === " ";
        const isEmpty = value === "" || value === undefined;

        if (isEmpty) {
            setError("Value cannot be empty");
            return false;
        }

        // For non-string types, ensure value is numeric (but allow space for string type)
        if (!isStringType && !isSpace && isNaN(Number(value))) {
            setError("Value must be numeric for this variable type");
            return false;
        }

        // Check for duplicates (if not in editing mode or if editing with a different value)
        const valueToCompare = isStringType ? value : Number(value); // Compare with correct type
        const isDuplicate = values.some((v, index) => {
            // Skip comparing with the value being edited
            if (selectedIndex !== null && index === selectedIndex) {
                return false;
            }
            // Handle comparison carefully for numbers and strings (including space)
            if (isStringType) {
                return v.value === valueToCompare;
            } else {
                // Ensure we compare numbers with numbers
                return typeof v.value === 'number' && v.value === valueToCompare;
            }
        });

        if (isDuplicate) {
            setError("This value already exists");
            return false;
        }

        setError(null);
        return true;
    };

    const handleAdd = () => {
        if (!validateValue(currentValue)) return;

        // Special handling for space value
        const processedValue = isStringType ? currentValue : Number(currentValue);

        // For the label, handle space character specially
        let valueLabel = currentLabel;
        if (valueLabel === "") {
            valueLabel = currentValue === " " ? "[Space]" : currentValue;
        }

        const newValue: ValueLabel = {
            variableName,
            value: processedValue,
            label: valueLabel
        };

        // Check if label is too long (120 bytes)
        if (new TextEncoder().encode(newValue.label).length > 120) {
            setError("Label cannot exceed 120 bytes");
            return;
        }

        setValues([...values, newValue]);
        setCurrentValue("");
        setCurrentLabel("");
    };

    const handleChange = () => {
        if (selectedIndex === null || !validateValue(currentValue)) return;

        // Check if anything was actually changed
        if (originalValue === currentValue && originalLabel === currentLabel) {
            setError("No changes were made");
            return;
        }

        const processedValue = isStringType ? currentValue : Number(currentValue);

        // For the label, handle space character specially
        let valueLabel = currentLabel;
        if (valueLabel === "") {
            valueLabel = currentValue === " " ? "[Space]" : currentValue;
        }

        const updatedValues = [...values];
        updatedValues[selectedIndex] = {
            ...updatedValues[selectedIndex],
            value: processedValue,
            label: valueLabel
        };

        // Check if label is too long
        if (new TextEncoder().encode(updatedValues[selectedIndex].label).length > 120) {
            setError("Label cannot exceed 120 bytes");
            return;
        }

        setValues(updatedValues);
        setCurrentValue("");
        setCurrentLabel("");
        setSelectedIndex(null);
        setOriginalValue(null);
        setOriginalLabel(null);
    };

    const handleRemove = () => {
        if (selectedIndex === null) return;

        const updatedValues = [...values];
        updatedValues.splice(selectedIndex, 1);

        setValues(updatedValues);
        setCurrentValue("");
        setCurrentLabel("");
        setSelectedIndex(null);
    };

    const handleSelect = (index: number) => {
        const selected = values[index];
        setSelectedIndex(index);
        setCurrentValue(selected.value.toString());
        setCurrentLabel(selected.label);
        // Store original values to detect changes
        setOriginalValue(selected.value.toString());
        setOriginalLabel(selected.label);
        setError(null);
    };

    const handleSave = () => {
        onSave(values);
        onOpenChange(false);
    };

    const isValueChanged = () => {
        if (selectedIndex === null) return false;
        return originalValue !== currentValue || originalLabel !== currentLabel;
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setError(null); // Clear error on change

        // Allow space for string type always
        if (isStringType) {
             setCurrentValue(newValue);
             return;
        }

        // For numeric type: allow empty, minus, decimal point, and numbers
        if (newValue === '' || newValue === '-' || (!isNaN(Number(newValue)) || (newValue.endsWith('.') && !newValue.slice(0, -1).includes('.')))) {
            setCurrentValue(newValue);
        } else {
            // Optionally provide feedback or prevent invalid input more strictly here
            // For now, we just don't update the state for invalid numeric chars
             setError("Invalid numeric input."); // Set error for invalid chars
        }

    };

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLabel = e.target.value;
        setError(null); // Clear error on change

        // Check byte length immediately
        if (new TextEncoder().encode(newLabel).length > 120) {
            setError("Label cannot exceed 120 bytes");
            // Optionally truncate or prevent further input
        } else {
            setCurrentLabel(newLabel);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "bg-card flex flex-col",
                isMobile ? "max-w-[95vw] h-full max-h-full rounded-none border-none" : "max-w-[650px] max-h-[85vh]"
            )}>
                <DialogHeader className="px-6 py-4 flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Value Labels</DialogTitle>
                </DialogHeader>
                <Separator />

                <div className="flex-grow overflow-y-auto px-6 py-5">
                    <div className="space-y-4">
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                            <Label htmlFor="value" className="text-right">
                                Value:
                            </Label>
                            <div className="flex-1 relative">
                                <Input
                                    id="value"
                                    value={currentValue}
                                    onChange={handleValueChange}
                                    className="h-9 w-full"
                                    placeholder={isStringType ? "Any text or space" : "Numeric value"}
                                />
                                {currentValue === " " && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-primary/20 px-1.5 py-0.5 rounded text-primary">
                                        Space
                                    </div>
                                )}
                            </div>

                            <Label htmlFor="label" className="text-right">
                                Label:
                            </Label>
                            <Input
                                id="label"
                                value={currentLabel}
                                onChange={handleLabelChange}
                                className="h-9 w-full"
                                placeholder="Enter label (max 120 bytes)"
                            />
                        </div>

                        <div className="flex justify-end items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={selectedIndex === null ? handleAdd : handleChange}
                                disabled={!currentValue.trim() && currentValue !== " "}
                            >
                                {selectedIndex === null ? "Add" : (isValueChanged() ? "Change" : "Change")}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRemove}
                                disabled={selectedIndex === null}
                            >
                                Remove
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Label className="block pt-2 pb-1 text-sm font-medium">Defined Labels:</Label>
                        <div className={cn(
                            "border rounded-md overflow-y-auto bg-background/50",
                            isMobile ? "h-48" : "h-64"
                        )}>
                            {values.length === 0 && (
                                <div className="p-4 text-center text-muted-foreground">
                                    No value labels defined.
                                </div>
                            )}
                            {values.map((item, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-2 cursor-pointer border-b last:border-b-0 text-sm",
                                        selectedIndex === index
                                            ? 'bg-primary/10 text-primary-foreground'
                                            : 'hover:bg-muted/50',
                                        "flex justify-between items-center"
                                    )}
                                    onClick={() => handleSelect(index)}
                                >
                                    <span className="font-mono break-all pr-2">
                                        {item.value === " " ? "[Space]" : item.value.toString()}
                                    </span>
                                    <span className="text-muted-foreground break-all text-right">
                                        = &quot;{item.label}&quot;
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />
                <DialogFooter className="px-6 py-4 flex-shrink-0 sm:justify-between">
                    <div className="flex space-x-2 justify-end">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>OK</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};