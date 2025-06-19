import React, { FC } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DefineGroupsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tempGroup1: number | null;
    setTempGroup1: React.Dispatch<React.SetStateAction<number | null>>;
    tempGroup2: number | null;
    setTempGroup2: React.Dispatch<React.SetStateAction<number | null>>;
    groupRangeError: string | null;
    setGroupRangeError: React.Dispatch<React.SetStateAction<string | null>>;
    onApply: () => void;
}

export const DefineGroupsDialog: FC<DefineGroupsDialogProps> = ({
    open,
    onOpenChange,
    tempGroup1,
    setTempGroup1,
    tempGroup2,
    setTempGroup2,
    groupRangeError,
    setGroupRangeError,
    onApply
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Two Independent Samples: Define Groups</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="grid grid-cols-4 gap-2 items-center mb-2">
                        <label className="text-sm text-right" htmlFor="group1">Group 1:</label>
                        <input
                            id="group1"
                            type="number"
                            step="1"
                            value={tempGroup1 !== null ? tempGroup1 : ""}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                setTempGroup1(value);
                                
                                // Validate for integer
                                if (value !== null && !Number.isInteger(value)) {
                                    setGroupRangeError("Values must be integers");
                                } else if (value !== null && tempGroup2 !== null && value >= tempGroup2) {
                                    setGroupRangeError("Group 1 must be less than Group 2");
                                } else {
                                    setGroupRangeError(null);
                                }
                            }}
                            className="col-span-3 border border-[#CCCCCC] rounded p-2"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2 items-center">
                        <label className="text-sm text-right" htmlFor="group2">Group 2:</label>
                        <input
                            id="group2"
                            type="number"
                            step="1"
                            value={tempGroup2 !== null ? tempGroup2 : ""}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                setTempGroup2(value);
                                
                                // Validate for integer
                                if (value !== null && !Number.isInteger(value)) {
                                    setGroupRangeError("Values must be integers");
                                } else if (tempGroup1 !== null && value !== null && tempGroup1 >= value) {
                                    setGroupRangeError("Group 2 must be greater than Group 1");
                                } else {
                                    setGroupRangeError(null);
                                }
                            }}
                            className="col-span-3 border border-[#CCCCCC] rounded p-2"
                        />
                    </div>
                    {groupRangeError && (
                        <div className="mt-2 text-red-600 text-sm">{groupRangeError}</div>
                    )}
                </div>
                <DialogFooter>
                    <Button 
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={onApply}
                        disabled={
                            tempGroup1 === null || 
                            tempGroup2 === null || 
                            tempGroup1 >= tempGroup2 || 
                            groupRangeError !== null
                        }
                    >
                        Continue
                    </Button>
                    <Button 
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DefineGroupsDialog; 