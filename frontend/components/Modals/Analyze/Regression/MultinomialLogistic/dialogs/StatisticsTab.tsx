"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface StatisticsTabProps {
    options: {
        caseProcessing: boolean;
        modelFitting: boolean;
        pseudoRSquare: boolean;
        stepSummary: boolean;
        classificationTable: boolean;
        goodnessOfFit: boolean;
        parameterEstimates: boolean;
        likelihoodRatioTests: boolean;
        confidenceInterval: number;
    };
    onChange: (stats: any) => void;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ options, onChange }) => {

    const handleToggle = (key: string) => {
        onChange({
            ...options,
            [key]: !options[key as keyof typeof options],
        });
    };

    const handleCIChange = (val: string) => {
        const num = parseInt(val);
        onChange({
            ...options,
            confidenceInterval: isNaN(num) ? 95 : num,
        });
    };

    return (
        <div className="grid grid-cols-2 gap-8 p-1">
            {/* Sisi Kiri: Model & Regresi */}
            <div className="space-y-5">
                <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Model Summary</h4>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="caseProcessing"
                            checked={options.caseProcessing}
                            onCheckedChange={() => handleToggle("caseProcessing")}
                        />
                        <Label htmlFor="caseProcessing" className="text-sm font-normal">Case processing summary</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="pseudoRSquare"
                            checked={options.pseudoRSquare}
                            onCheckedChange={() => handleToggle("pseudoRSquare")}
                        />
                        <Label htmlFor="pseudoRSquare" className="text-sm font-normal">Pseudo R-square</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="modelFitting"
                            checked={options.modelFitting}
                            onCheckedChange={() => handleToggle("modelFitting")}
                        />
                        <Label htmlFor="modelFitting" className="text-sm font-normal">Model fitting information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="goodnessOfFit"
                            checked={options.goodnessOfFit}
                            onCheckedChange={() => handleToggle("goodnessOfFit")}
                        />
                        <Label htmlFor="goodnessOfFit" className="text-sm font-normal">Goodness-of-fit (Pearson/Deviance)</Label>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Step Statistics</h4>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="stepSummary"
                            checked={options.stepSummary}
                            onCheckedChange={() => handleToggle("stepSummary")}
                        />
                        <Label htmlFor="stepSummary" className="text-sm font-normal">Step summary</Label>
                    </div>
                </div>
            </div>

            {/* Sisi Kanan: Parameter & Klasifikasi */}
            <div className="space-y-5">
                <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Parameters</h4>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="parameterEstimates"
                            checked={options.parameterEstimates}
                            onCheckedChange={() => handleToggle("parameterEstimates")}
                        />
                        <Label htmlFor="parameterEstimates" className="text-sm font-normal">Parameter estimates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="likelihoodRatioTests"
                            checked={options.likelihoodRatioTests}
                            onCheckedChange={() => handleToggle("likelihoodRatioTests")}
                        />
                        <Label htmlFor="likelihoodRatioTests" className="text-sm font-normal">Likelihood ratio tests</Label>
                    </div>

                    <div className="pl-6 pt-1 flex items-center gap-3">
                        <Label htmlFor="ci" className="text-xs text-muted-foreground italic">Confidence interval (%):</Label>
                        <Input
                            id="ci"
                            type="number"
                            value={options.confidenceInterval}
                            onChange={(e) => handleCIChange(e.target.value)}
                            className="w-16 h-7 text-xs"
                            min={1}
                            max={99}
                        />
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Classification</h4>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="classificationTable"
                            checked={options.classificationTable}
                            onCheckedChange={() => handleToggle("classificationTable")}
                        />
                        <Label htmlFor="classificationTable" className="text-sm font-normal">Classification table</Label>
                    </div>
                </div>
            </div>
        </div>
    );
};