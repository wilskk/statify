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
}

const SelectCasesRandomSample: FC<SelectCasesRandomSampleProps> = ({
                                                                       onClose,
                                                                       onContinue
                                                                   }) => {
    const [sampleType, setSampleType] = useState<"approximate" | "exact">("approximate");
    const [percentage, setPercentage] = useState<string>("");
    const [exactCount, setExactCount] = useState<string>("");
    const [fromFirstCount, setFromFirstCount] = useState<string>("");

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
        <DialogContent className="max-w-[450px] p-4">
            <DialogHeader className="p-0 mb-2">
                <DialogTitle className="text-[18px] font-semibold">Select Cases: Random Sample</DialogTitle>
            </DialogHeader>
            <Separator className="my-0" />

            <div className="py-4">
                <div className="border border-[#CCCCCC] rounded-md p-3">
                    <Label className="text-[14px] font-medium text-[#444444] mb-3 block">Sample Size</Label>

                    <div className="space-y-4 pl-1">
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                                <input
                                    type="radio"
                                    id="approximately"
                                    name="sampleType"
                                    checked={sampleType === "approximate"}
                                    onChange={() => setSampleType("approximate")}
                                    className="w-3.5 h-3.5 border-[#888888]"
                                />
                            </div>
                            <Label htmlFor="approximately" className="text-[14px] text-[#444444]">Approximately</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    className="w-16 h-8 text-[14px] border-[#CCCCCC] focus:border-black focus:ring-0"
                                    value={percentage}
                                    onChange={(e) => setPercentage(e.target.value)}
                                    disabled={sampleType !== "approximate"}
                                />
                                <span className="text-[14px] text-[#444444]">% of all cases</span>
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
                                        className="w-3.5 h-3.5 border-[#888888]"
                                    />
                                </div>
                                <Label htmlFor="exactly" className="text-[14px] text-[#444444]">Exactly</Label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Input
                                        className="w-16 h-8 text-[14px] border-[#CCCCCC] focus:border-black focus:ring-0"
                                        value={exactCount}
                                        onChange={(e) => setExactCount(e.target.value)}
                                        disabled={sampleType !== "exact"}
                                    />
                                    <span className="text-[14px] text-[#444444]">cases from the first</span>
                                    <Input
                                        className="w-16 h-8 text-[14px] border-[#CCCCCC] focus:border-black focus:ring-0"
                                        value={fromFirstCount}
                                        onChange={(e) => setFromFirstCount(e.target.value)}
                                        disabled={sampleType !== "exact"}
                                    />
                                    <span className="text-[14px] text-[#444444]">cases</span>
                                </div>
                            </div>
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

export default SelectCasesRandomSample;