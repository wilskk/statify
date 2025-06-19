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
    tempDefineGroups: DefineGroupsOptions;
    setTempDefineGroups: (groups: DefineGroupsOptions) => void;
    tempGroup1: number | null;
    setTempGroup1: (value: number | null) => void;
    tempGroup2: number | null;
    setTempGroup2: (value: number | null) => void;
    tempCutPointValue: number | null;
    setTempCutPointValue: (value: number | null) => void;
    
    // Error handling
    groupRangeError: string | null;
    setGroupRangeError: (error: string | null) => void;
    
    // Submit handler
    onApply: () => void;
}

const DefineGroupsDialog: React.FC<DefineGroupsDialogProps> = ({
    open,
    onOpenChange,
    tempDefineGroups,
    setTempDefineGroups,
    tempGroup1,
    setTempGroup1,
    tempGroup2,
    setTempGroup2,
    tempCutPointValue,
    setTempCutPointValue,
    groupRangeError,
    setGroupRangeError,
    onApply
}) => {
    // Helper function to determine if we're using specified values
    const isUsingSpecifiedValues = (): boolean => {
        return tempDefineGroups.useSpecifiedValues;
    };

    // Helper function to determine if we're using cut point
    const isUsingCutPoint = (): boolean => {
        return tempDefineGroups.cutPoint;
    };

    // Radio group value
    const [radioValue, setRadioValue] = useState<string>(
        isUsingSpecifiedValues() ? "Use specified values" : "Cut point"
    );

    // Update radio value when tempDefineGroups changes
    useEffect(() => {
        setRadioValue(isUsingSpecifiedValues() ? "Use specified values" : "Cut point");
    }, [tempDefineGroups]);

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
                            setTempDefineGroups({
                                useSpecifiedValues: true,
                                cutPoint: false,
                                group1: tempGroup1,
                                group2: tempGroup2,
                                cutPointValue: null
                            });
                        } else {
                            setTempDefineGroups({
                                useSpecifiedValues: false,
                                cutPoint: true,
                                group1: null,
                                group2: null,
                                cutPointValue: tempCutPointValue
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
                            value={tempGroup1 !== null ? tempGroup1 : ""}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                setTempGroup1(value);
                                
                                // Validate for integer
                                if (value !== null && !Number.isInteger(value)) {
                                    setGroupRangeError("Values must be integers");
                                } else if (value !== null && tempGroup2 !== null && value >= tempGroup2) {
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
                            value={tempGroup2 !== null ? tempGroup2 : ""}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                setTempGroup2(value);
                                
                                // Validate for integer
                                if (value !== null && !Number.isInteger(value)) {
                                    setGroupRangeError("Values must be integers");
                                } else if (value !== null && tempGroup1 !== null && value <= tempGroup1) {
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
                            value={tempCutPointValue !== null ? tempCutPointValue : ""}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                setTempCutPointValue(value);
                                
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
                        onClick={onApply}
                        disabled={
                            (isUsingSpecifiedValues() && (tempGroup1 === null || tempGroup2 === null || tempGroup1 >= tempGroup2)) ||
                            (isUsingCutPoint() && tempCutPointValue === null) ||
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