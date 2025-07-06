import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
    RadioGroup,
    RadioGroupItem 
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DefineGroupsOptions } from "../types";

interface DefineGroupsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    
    // Current values
    currentValues: {
        defineGroups: DefineGroupsOptions;
        group1: number | null;
        group2: number | null;
        cutPointValue: number | null;
    };
    
    // Error handling
    groupRangeError: string | null;
    setGroupRangeError: (error: string | null) => void;
    
    // Submit handler
    onApply: (newValues: {
        defineGroups: DefineGroupsOptions;
        group1: number | null;
        group2: number | null;
        cutPointValue: number | null;
    }) => boolean;
}

const DefineGroupsDialog: React.FC<DefineGroupsDialogProps> = ({
    open,
    onOpenChange,
    currentValues,
    groupRangeError,
    setGroupRangeError,
    onApply
}) => {
    // Local state for dialog values
    const [localValues, setLocalValues] = useState({
        defineGroups: currentValues.defineGroups,
        group1: currentValues.group1,
        group2: currentValues.group2,
        cutPointValue: currentValues.cutPointValue
    });

    // Update local values when the dialog opens or current values change
    useEffect(() => {
        if (open) {
            setLocalValues({
                defineGroups: currentValues.defineGroups,
                group1: currentValues.group1,
                group2: currentValues.group2,
                cutPointValue: currentValues.cutPointValue
            });
            setGroupRangeError(null);
        }
    }, [open, currentValues, setGroupRangeError]);
    
    // Helper function to update local values
    const updateLocalValues = (updates: Partial<typeof localValues>) => {
        setLocalValues(prev => ({ ...prev, ...updates }));
    };

    // Helper function to determine if we're using specified values
    const isUsingSpecifiedValues = (): boolean => {
        return localValues.defineGroups.useSpecifiedValues;
    };

    // Helper function to determine if we're using cut point
    const isUsingCutPoint = (): boolean => {
        return localValues.defineGroups.cutPoint;
    };

    // Radio group value
    const [radioValue, setRadioValue] = useState<string>(
        isUsingSpecifiedValues() ? "Use specified values" : "Cut point"
    );

    // Update radio value when defineGroups changes
    useEffect(() => {
        setRadioValue(isUsingSpecifiedValues() ? "Use specified values" : "Cut point");
    }, [localValues.defineGroups]);

    // Handle apply button click
    const handleApply = () => {
        if (onApply(localValues)) {
            // If apply was successful, close the dialog
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Define Groups</DialogTitle>
                </DialogHeader>
                <RadioGroup
                    value={radioValue}
                    onValueChange={(value: string) => {
                        setRadioValue(value);
                        if (value === "Use specified values") {
                            updateLocalValues({
                                defineGroups: {
                                    useSpecifiedValues: true,
                                    cutPoint: false,
                                }
                            });
                        } else {
                            updateLocalValues({
                                defineGroups: {
                                    useSpecifiedValues: false,
                                    cutPoint: true,
                                }
                            });
                        }
                    }}
                >
                    <div className="grid grid-cols-9 gap-2 items-center justify-items-center" style={{ gridTemplateColumns: "20px 62.836px auto auto auto auto auto auto auto" }}>
                        <RadioGroupItem id="use-specified-values" value="Use specified values"/>
                        <Label htmlFor="use-specified-values" className="text-sm col-span-8 justify-self-start">Use specified values</Label>
                        <label className={`col-span-2 text-sm justify-self-end ${!isUsingSpecifiedValues() ? 'opacity-50' : ''}`} htmlFor="group1">Group 1:</label>
                        <input
                            id="group1"
                            type="number"
                            step="1"
                            disabled={isUsingCutPoint()}
                            value={localValues.group1 !== null ? localValues.group1 : ""}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                updateLocalValues({ group1: value });
                                
                                // Validate for integer
                                if (value !== null && !Number.isInteger(value)) {
                                    setGroupRangeError("Values must be integers");
                                } else if (value !== null && localValues.group2 !== null && value >= localValues.group2) {
                                    setGroupRangeError("Minimum must be less than maximum");
                                } else {
                                    setGroupRangeError(null);
                                }
                            }}
                            className={`col-span-7 border rounded w-full px-2 ml-2 ${
                                isUsingCutPoint() 
                                    ? 'text-muted-foreground' 
                                    : ''
                            }`}
                        />
                        <label className={`col-span-2 text-sm justify-self-end ${!isUsingSpecifiedValues() ? 'opacity-50' : ''}`} htmlFor="group2">Group 2:</label>
                        <input
                            id="group2"
                            type="number"
                            step="1"
                            disabled={isUsingCutPoint()}
                            value={localValues.group2 !== null ? localValues.group2 : ""}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                updateLocalValues({ group2: value });
                                
                                // Validate for integer
                                if (value !== null && !Number.isInteger(value)) {
                                    setGroupRangeError("Values must be integers");
                                } else if (value !== null && localValues.group1 !== null && value <= localValues.group1) {
                                    setGroupRangeError("Maximum must be greater than minimum");
                                } else {
                                    setGroupRangeError(null);
                                }
                            }}
                            className={`col-span-7 border rounded w-full px-2 ml-2 ${
                                isUsingCutPoint() 
                                    ? 'text-muted-foreground' 
                                    : ''
                            }`}
                        />
                        <RadioGroupItem id="cut-point" value="Cut point" />
                        <Label htmlFor="cut-point" className="text-sm">Cut point:</Label>
                        <input
                            id="cut-point"
                            type="number"
                            step="1"
                            disabled={isUsingSpecifiedValues()}
                            value={localValues.cutPointValue !== null ? localValues.cutPointValue : ""}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                updateLocalValues({ cutPointValue: value });
                                
                                // Validate for integer
                                if (value !== null && !Number.isInteger(value)) {
                                    setGroupRangeError("Value must be an integer");
                                } else {
                                    setGroupRangeError(null);
                                }
                            }}
                            className={`col-span-7 border rounded w-full px-2 ml-2 ${
                                isUsingSpecifiedValues() 
                                    ? 'text-muted-foreground' 
                                    : ''
                            }`}
                        />
                    </div>
                </RadioGroup>
                {groupRangeError && (
                    <div className="mt-2 text-destructive text-sm">{groupRangeError}</div>
                )}
                <DialogFooter>
                    <Button 
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                        onClick={handleApply}
                        disabled={
                            (isUsingSpecifiedValues() && (localValues.group1 === null || localValues.group2 === null || localValues.group1 >= localValues.group2)) ||
                            (isUsingCutPoint() && localValues.cutPointValue === null) ||
                            groupRangeError !== null
                        }
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-4"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { DefineGroupsDialog }; 