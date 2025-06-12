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
    initialConfig?: RangeResult | null;
}

const SelectCasesRange: FC<SelectCasesRangeProps> = ({
                                                         onClose,
                                                         onContinue,
                                                         initialConfig
                                                     }) => {
    const [firstCase, setFirstCase] = useState<string>(initialConfig?.firstCase || "");
    const [lastCase, setLastCase] = useState<string>(initialConfig?.lastCase || "");

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
        <DialogContent className="max-w-[450px] p-4 bg-popover border border-border">
            <DialogHeader className="p-0 mb-2">
                <DialogTitle className="text-[18px] font-semibold text-popover-foreground">Select Cases: Range</DialogTitle>
            </DialogHeader>
            <Separator className="my-0" />

            <div className="py-4">
                <div className="border border-border rounded-md p-3 bg-card">
                    <Label className="text-[14px] font-medium text-card-foreground mb-3 block">Case Range</Label>

                    <div className="space-y-4 pl-1">
                        <div className="flex items-center gap-2">
                            <Label className="text-[14px] text-card-foreground min-w-20">First Case:</Label>
                            <Input
                                className="w-24 h-8 text-[14px]"
                                value={firstCase}
                                onChange={(e) => setFirstCase(e.target.value)}
                                placeholder="1"
                                type="number"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-[14px] text-card-foreground min-w-20">Last Case:</Label>
                            <Input
                                className="w-24 h-8 text-[14px]"
                                value={lastCase}
                                onChange={(e) => setLastCase(e.target.value)}
                                placeholder="Last"
                                type="number"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="pt-3">
                <Button variant="link" size="sm" className="text-xs p-0 h-auto mr-auto text-muted-foreground hover:text-foreground" onClick={() => console.log("Help requested")}>Help</Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleContinue}>Continue</Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default SelectCasesRange; 