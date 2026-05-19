"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type SubpopulationMode = "factors" | "variableList";

export interface StatisticsOptions {
    caseProcessing: boolean;
    pseudoRSquare: boolean;
    stepSummary: boolean;
    modelFitting: boolean;
    informationCriteria: boolean;
    cellProbabilities: boolean;
    classificationTable: boolean;
    goodnessOfFit: boolean;
    monotonicityMeasures: boolean;
    parameterEstimates: boolean;
    likelihoodRatioTests: boolean;
    asymptoticCorrelations: boolean;
    asymptoticCovariances: boolean;
    confidenceInterval: number;
    subpopulationMode: SubpopulationMode;
}

interface StatisticsTabProps {
    options: StatisticsOptions;
    onChange: (stats: StatisticsOptions) => void;
}

type ToggleableStatistic = Exclude<
    keyof StatisticsOptions,
    "confidenceInterval" | "subpopulationMode"
>;

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ options, onChange }) => {
    const handleToggle = (key: ToggleableStatistic) => {
        onChange({
            ...options,
            [key]: !options[key],
        });
    };

    const handleCIChange = (val: string) => {
        const num = parseInt(val, 10);
        onChange({
            ...options,
            confidenceInterval: isNaN(num) ? 95 : Math.max(1, Math.min(99, num)),
        });
    };

    const handleSubpopulationChange = (value: SubpopulationMode) => {
        onChange({
            ...options,
            subpopulationMode: value,
        });
    };

    const modelOptions: Array<{ key: ToggleableStatistic; label: string }> = [
        { key: "pseudoRSquare", label: "Pseudo R-square" },
        { key: "stepSummary", label: "Step summary" },
        { key: "modelFitting", label: "Model fitting information" },
        { key: "informationCriteria", label: "Information criteria" },
        { key: "cellProbabilities", label: "Cell probabilities" },
        { key: "classificationTable", label: "Classification table" },
        { key: "goodnessOfFit", label: "Goodness-of-fit" },
        { key: "monotonicityMeasures", label: "Monotonicity measures" },
    ];

    const parameterOptions: Array<{ key: ToggleableStatistic; label: string }> = [
        { key: "parameterEstimates", label: "Estimates" },
        { key: "likelihoodRatioTests", label: "Likelihood ratio tests" },
        { key: "asymptoticCorrelations", label: "Asymptotic correlations" },
        { key: "asymptoticCovariances", label: "Asymptotic covariances" },
    ];

    return (
        <div className="space-y-5 p-1">
            <section className="rounded-md border bg-muted/10 p-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Case processing summary
                </Label>
                <div className="mt-3 flex items-center space-x-3">
                    <Checkbox
                        id="caseProcessing"
                        checked={options.caseProcessing}
                        onCheckedChange={() => handleToggle("caseProcessing")}
                    />
                    <Label htmlFor="caseProcessing" className="text-sm font-normal">
                        Include case processing summary table
                    </Label>
                </div>
            </section>

            <section className="rounded-md border p-4">
                <div className="mb-3 flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Model
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Match SPSS layout</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    {modelOptions.map((item) => (
                        <label key={item.key} className="flex items-center space-x-2 text-sm">
                            <Checkbox
                                id={item.key}
                                checked={options[item.key] as boolean}
                                onCheckedChange={() => handleToggle(item.key)}
                            />
                            <span>{item.label}</span>
                        </label>
                    ))}
                </div>
            </section>

            <section className="rounded-md border p-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Parameters
                </Label>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {parameterOptions.map((item) => (
                        <label key={item.key} className="flex items-center space-x-2 text-sm">
                            <Checkbox
                                id={item.key}
                                checked={options[item.key] as boolean}
                                onCheckedChange={() => handleToggle(item.key)}
                            />
                            <span>{item.label}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 pl-1">
                    <Label htmlFor="ci" className="text-xs font-semibold uppercase text-muted-foreground">
                        Confidence interval (%)
                    </Label>
                    <Input
                        id="ci"
                        type="number"
                        value={options.confidenceInterval}
                        onChange={(e) => handleCIChange(e.target.value)}
                        className="w-20"
                        min={1}
                        max={99}
                    />
                </div>
            </section>

            <section className="rounded-md border p-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Define subpopulations
                </Label>
                <RadioGroup
                    className="mt-3 space-y-3"
                    value={options.subpopulationMode}
                    onValueChange={(value) => handleSubpopulationChange(value as SubpopulationMode)}
                >
                    <div className="flex items-start space-x-3">
                        <RadioGroupItem value="factors" id="subpop-factors" />
                        <div>
                            <Label htmlFor="subpop-factors" className="text-sm font-normal">
                                Covariate patterns defined by factors and covariates
                            </Label>
                            <p className="text-xs text-muted-foreground">Matches SPSS default behavior.</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <RadioGroupItem value="variableList" id="subpop-variables" />
                        <div className="w-full">
                            <Label htmlFor="subpop-variables" className="text-sm font-normal">
                                Covariate patterns defined by variable list below
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Coming soon: select custom variables to mirror SPSS subpopulation lists.
                            </p>
                            <div className="mt-2 h-16 rounded border border-dashed border-muted-foreground/40 bg-muted/10 text-center text-[11px] text-muted-foreground flex items-center justify-center">
                                Variable list placeholder
                            </div>
                        </div>
                    </div>
                </RadioGroup>
            </section>
        </div>
    );
};