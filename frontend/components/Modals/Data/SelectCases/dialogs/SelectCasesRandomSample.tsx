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

interface RandomSampleResult {
    sampleType: "approximate" | "exact";
    percentage?: number;
    exactCount?: number;
    fromFirstCount?: number;
}

interface SelectCasesRandomSampleProps {
    onClose: () => void;
    onContinue: (result: RandomSampleResult) => void;
    initialConfig?: RandomSampleResult | null;
}

const SelectCasesRandomSample: FC<SelectCasesRandomSampleProps> = ({
                                                                       onClose,
                                                                       onContinue,
                                                                       initialConfig
                                                                   }) => {
    const [sampleType, setSampleType] = useState<"approximate" | "exact">(
        initialConfig?.sampleType || "approximate"
    );
    const [percentage, setPercentage] = useState<string>(
        initialConfig?.percentage?.toString() || ""
    );
    const [exactCount, setExactCount] = useState<string>(
        initialConfig?.exactCount?.toString() || ""
    );
    const [fromFirstCount, setFromFirstCount] = useState<string>(
        initialConfig?.fromFirstCount?.toString() || ""
    );

    const handleContinue = () => {
        const result: RandomSampleResult = {
            sampleType
        };

        if (sampleType === "approximate" && percentage) {
            result.percentage = parseFloat(percentage);
        } else if (sampleType === "exact") {
            if (exactCount) result.exactCount = parseInt(exactCount);
            if (fromFirstCount) result.fromFirstCount = parseInt(fromFirstCount);
        }

        onContinue(result);
    };

    return (
        <DialogContent className="max-w-[450px] p-4 bg-popover border border-border">
            <DialogHeader className="p-0 mb-2">
                <DialogTitle className="text-[18px] font-semibold text-popover-foreground">Select Cases: Random Sample</DialogTitle>
            </DialogHeader>
            <Separator className="my-0" />

            <div className="py-4">
                <div className="border border-border rounded-md p-3 bg-card">
                    <Label className="text-[14px] font-medium text-card-foreground mb-3 block">Sample Size</Label>

                    <div className="space-y-4 pl-1">
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                                <input
                                    type="radio"
                                    id="approximately"
                                    name="sampleType"
                                    checked={sampleType === "approximate"}
                                    onChange={() => setSampleType("approximate")}
                                    className="w-3.5 h-3.5 accent-primary"
                                />
                            </div>
                            <Label htmlFor="approximately" className="text-[14px] text-card-foreground">Approximately</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    className="w-16 h-8 text-[14px]"
                                    value={percentage}
                                    onChange={(e) => setPercentage(e.target.value)}
                                    disabled={sampleType !== "approximate"}
                                    type="number"
                                />
                                <span className="text-[14px] text-card-foreground">% of all cases</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-start gap-2">
                                <div className="mt-0.5">
                                    <input
                                        type="radio"
                                        id="exactly"
                                        name="sampleType"
                                        checked={sampleType === "exact"}
                                        onChange={() => setSampleType("exact")}
                                        className="w-3.5 h-3.5 accent-primary"
                                    />
                                </div>
                                <Label htmlFor="exactly" className="text-[14px] text-card-foreground">Exactly</Label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Input
                                        className="w-16 h-8 text-[14px]"
                                        value={exactCount}
                                        onChange={(e) => setExactCount(e.target.value)}
                                        disabled={sampleType !== "exact"}
                                        type="number"
                                    />
                                    <span className="text-[14px] text-card-foreground">cases from the first</span>
                                    <Input
                                        className="w-16 h-8 text-[14px]"
                                        value={fromFirstCount}
                                        onChange={(e) => setFromFirstCount(e.target.value)}
                                        disabled={sampleType !== "exact"}
                                        type="number"
                                    />
                                    <span className="text-[14px] text-card-foreground">cases</span>
                                </div>
                            </div>
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

export default SelectCasesRandomSample; 