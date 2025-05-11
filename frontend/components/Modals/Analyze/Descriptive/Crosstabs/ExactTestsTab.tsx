import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface ExactTestsTabProps {
    exactTestMethod: 'asymptotic' | 'monteCarlo' | 'exact';
    confidenceLevel: string;
    monteCarloSamples: string;
    timeLimit: string;
    useTimeLimit: boolean;
    setExactTestMethod: (value: 'asymptotic' | 'monteCarlo' | 'exact') => void;
    setConfidenceLevel: (value: string) => void;
    setMonteCarloSamples: (value: string) => void;
    setTimeLimit: (value: string) => void;
    setUseTimeLimit: (value: boolean) => void;
}

const ExactTestsTab: FC<ExactTestsTabProps> = ({
                                                   exactTestMethod,
                                                   confidenceLevel,
                                                   monteCarloSamples,
                                                   timeLimit,
                                                   useTimeLimit,
                                                   setExactTestMethod,
                                                   setConfidenceLevel,
                                                   setMonteCarloSamples,
                                                   setTimeLimit,
                                                   setUseTimeLimit
                                               }) => {
    return (
        <div className="p-6">
            <div className="border border-[#E6E6E6] rounded-md p-6">
                <div className="text-sm font-medium mb-4">Exact Tests Method</div>
                <RadioGroup
                    value={exactTestMethod}
                    onValueChange={(value) => setExactTestMethod(value as 'asymptotic' | 'monteCarlo' | 'exact')}
                    className="space-y-4"
                >
                    <div className="flex items-center">
                        <RadioGroupItem
                            value="asymptotic"
                            id="asymptotic"
                            className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <Label htmlFor="asymptotic" className="text-sm ml-2 cursor-pointer">
                            Asymptotic only
                        </Label>
                    </div>

                    <div>
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="monteCarlo"
                                id="monteCarlo"
                                className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                            />
                            <Label htmlFor="monteCarlo" className="text-sm ml-2 cursor-pointer">
                                Monte Carlo
                            </Label>
                        </div>

                        <div className="ml-6 mt-2 space-y-2">
                            <div className="flex items-center">
                                <Label htmlFor="confidenceLevel" className="text-sm w-36">
                                    Confidence level:
                                </Label>
                                <Input
                                    id="confidenceLevel"
                                    value={confidenceLevel}
                                    onChange={(e) => setConfidenceLevel(e.target.value)}
                                    className="h-8 text-sm w-16 border-[#CCCCCC] focus:border-black focus:ring-black"
                                    disabled={exactTestMethod !== 'monteCarlo'}
                                />
                                <span className="ml-2 text-sm">%</span>
                            </div>

                            <div className="flex items-center">
                                <Label htmlFor="monteCarloSamples" className="text-sm w-36">
                                    Number of samples:
                                </Label>
                                <Input
                                    id="monteCarloSamples"
                                    value={monteCarloSamples}
                                    onChange={(e) => setMonteCarloSamples(e.target.value)}
                                    className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                                    disabled={exactTestMethod !== 'monteCarlo'}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center">
                            <RadioGroupItem
                                value="exact"
                                id="exact"
                                className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                            />
                            <Label htmlFor="exact" className="text-sm ml-2 cursor-pointer">
                                Exact
                            </Label>
                        </div>

                        <div className="ml-6 mt-2">
                            <div className="flex items-center">
                                <Checkbox
                                    id="useTimeLimit"
                                    checked={useTimeLimit}
                                    onCheckedChange={(checked) => setUseTimeLimit(!!checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                    disabled={exactTestMethod !== 'exact'}
                                />
                                <Label htmlFor="useTimeLimit" className="text-sm cursor-pointer">
                                    Time limit per test
                                </Label>
                                <Input
                                    id="timeLimit"
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(e.target.value)}
                                    className="h-8 text-sm w-16 ml-3 mr-2 border-[#CCCCCC] focus:border-black focus:ring-black"
                                    disabled={!useTimeLimit || exactTestMethod !== 'exact'}
                                />
                                <span className="text-sm">minutes</span>
                            </div>
                        </div>
                    </div>
                </RadioGroup>

                <div className="mt-6 text-xs text-[#444444]">
                    <p>Exact method will be used instead of Monte Carlo when computational limits allow.</p>
                    <p className="mt-2">For nonasymptotic methods, cell counts are always rounded or truncated in computing the test statistics.</p>
                </div>
            </div>
        </div>
    );
};

export default ExactTestsTab;