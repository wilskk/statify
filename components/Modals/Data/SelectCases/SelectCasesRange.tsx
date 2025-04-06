"use client";

import React, { FC, useState } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RangeResult {
    firstCase?: string;
    lastCase?: string;
}

interface SelectCasesRangeProps {
    onClose: () => void;
    onContinue: (result: RangeResult) => void;
}

const SelectCasesRange: FC<SelectCasesRangeProps> = ({
                                                         onClose,
                                                         onContinue
                                                     }) => {
    const [firstCase, setFirstCase] = useState<string>("");
    const [lastCase, setLastCase] = useState<string>("");

    const handleContinue = () => {
        const result: RangeResult = {};

        if (firstCase) {
            result.firstCase = firstCase;
        }

        if (lastCase) {
            result.lastCase = lastCase;
        }

        onContinue(result);
    };

    return (
        <DialogContent className="max-w-[450px] p-4">
            <DialogHeader className="p-0 mb-2">
                <DialogTitle className="text-[18px] font-semibold">Select Cases: Range</DialogTitle>
            </DialogHeader>
            <Separator className="my-0" />

            <div className="py-4">
                <div className="border border-[#CCCCCC] rounded-md p-3">
                    <Label className="text-[14px] font-medium text-[#444444] mb-3 block">Case Range</Label>

                    <div className="space-y-4 pl-1">
                        <div className="flex items-center gap-2">
                            <Label className="text-[14px] text-[#444444] min-w-20">First Case:</Label>
                            <Input
                                className="w-24 h-8 text-[14px] border-[#CCCCCC] focus:border-black focus:ring-0"
                                value={firstCase}
                                onChange={(e) => setFirstCase(e.target.value)}
                                placeholder="1"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-[14px] text-[#444444] min-w-20">Last Case:</Label>
                            <Input
                                className="w-24 h-8 text-[14px] border-[#CCCCCC] focus:border-black focus:ring-0"
                                value={lastCase}
                                onChange={(e) => setLastCase(e.target.value)}
                                placeholder="Last"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2 mt-2 p-0">
                <Button
                    variant="default"
                    size="sm"
                    className="bg-black hover:bg-gray-800 text-white h-8 text-[14px]"
                    onClick={handleContinue}
                >
                    Continue
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-[#CCCCCC] hover:bg-[#E6E6E6] text-black h-8 text-[14px]"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-[#CCCCCC] hover:bg-[#E6E6E6] text-black h-8 text-[14px]"
                    onClick={() => console.log("Help requested")}
                >
                    Help
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default SelectCasesRange;