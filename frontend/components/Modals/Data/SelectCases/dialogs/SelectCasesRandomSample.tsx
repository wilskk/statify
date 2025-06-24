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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleContinue = () => {
        // Validate inputs
        if (sampleType === "approximate" && (!percentage || parseFloat(percentage) <= 0 || parseFloat(percentage) > 100)) {
            setValidationError("Percentage must be between 1 and 100");
            return;
        } else if (sampleType === "exact") {
            if (!exactCount || parseInt(exactCount) <= 0) {
                setValidationError("Number of cases must be greater than 0");
                return;
            }
        }

        const result: RandomSampleResult = {
            sampleType
        };

        if (sampleType === "approximate" && percentage) {
            result.percentage = parseFloat(percentage);
        } else if (sampleType === "exact") {
            if (exactCount) result.exactCount = parseInt(exactCount);
            if (fromFirstCount) result.fromFirstCount = parseInt(fromFirstCount);
        }

        setValidationError(null);
        onContinue(result);
    };

    return (
        <DialogContent
            className="w-full p-0 border border-border rounded-md"
            style={{ 
                maxWidth: "500px",
                width: "100%",
                maxHeight: "450px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}
        >
            <div className="px-3 py-2 flex-shrink-0">
                <DialogHeader className="p-0">
                    <DialogTitle className="text-sm font-semibold flex items-center">
                        <span>Select Cases: Random Sample</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                                        <HelpCircle size={14} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p className="text-xs">Define a random sample of cases to select.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </DialogTitle>
                </DialogHeader>
            </div>
            <Separator className="flex-shrink-0" />
            <div className="p-3 flex-grow overflow-y-auto">
                <div className="border rounded-md p-3 bg-card/50">
                    <Label className="text-xs font-medium mb-2 block">Sample Size</Label>

                    <div className="space-y-3 pl-1">
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
                            <Label htmlFor="approximately" className="text-xs">Approximately</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    className="w-16 h-7 text-xs"
                                    value={percentage}
                                    onChange={(e) => setPercentage(e.target.value)}
                                    disabled={sampleType !== "approximate"}
                                    type="number"
                                />
                                <span className="text-xs">% of all cases</span>
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
                                <Label htmlFor="exactly" className="text-xs">Exactly</Label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Input
                                        className="w-16 h-7 text-xs"
                                        value={exactCount}
                                        onChange={(e) => setExactCount(e.target.value)}
                                        disabled={sampleType !== "exact"}
                                        type="number"
                                    />
                                    <span className="text-xs">cases from the first</span>
                                    <Input
                                        className="w-16 h-7 text-xs"
                                        value={fromFirstCount}
                                        onChange={(e) => setFromFirstCount(e.target.value)}
                                        disabled={sampleType !== "exact"}
                                        type="number"
                                    />
                                    <span className="text-xs">cases</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Separator className="flex-shrink-0" />
            <DialogFooter className="px-3 py-2 flex-shrink-0">
                {validationError && (
                    <div className="w-full mb-1">
                        <p className="text-xs text-destructive">{validationError}</p>
                    </div>
                )}
                <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Cancel</Button>
                    <Button size="sm" className="h-7 text-xs" onClick={handleContinue}>Continue</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default SelectCasesRandomSample; 