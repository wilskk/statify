"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, HelpCircle, RotateCcw } from "lucide-react";

// Stores & Hooks
import { useVariableStore } from "@/stores/useVariableStore";
import { useModalStore } from "@/stores/useModalStore";
import { useDataStore } from "@/stores/useDataStore";

// Komponen Tab (Pastikan Anda membuat file-file ini di folder yang sama)
import { VariablesTab } from "./VariablesTab";
import { StatisticsTab } from "./StatisticsTab";
import { CriteriaTab } from "./CriteriaTab";
import { OptionsTab } from "./OptionsTab";
import { SaveTab } from "./SaveTab";

// Types
import { Variable } from "@/types/Variable";

export const MultinomialLogisticMain = () => {
    const { closeModal } = useModalStore();
    const variables = useVariableStore((state) => state.variables);
    const [isLoading, setIsLoading] = useState(false);

    // State untuk opsi Multinomial Logistic (Sesuai SPSS)
    const [options, setOptions] = useState({
        dependent: null as Variable | null,
        factors: [] as Variable[],
        covariates: [] as Variable[],
        referenceCategory: "last", // first, last, or custom
        statistics: {
            caseProcessing: true,
            modelFitting: true,
            pseudoRSquare: true,
            stepSummary: false,
            classificationTable: true,
            goodnessOfFit: true,
            parameterEstimates: true,
            likelihoodRatioTests: true,
            confidenceInterval: 95,
        },
        criteria: {
            iterations: 100,
            convergence: 0.000001,
            singularity: 0.00000001,
            delta: 0.5,
        },
        save: {
            predictedProbability: false,
            predictedCategory: false,
        }
    });

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            // Logika pemanggilan WASM Worker akan diletakkan di sini
            console.log("Analyzing with options:", options);
            // Simulasi proses
            await new Promise(resolve => setTimeout(resolve, 1500));
            closeModal("MULTINOMIAL_LOGISTIC");
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetOptions = () => {
        setOptions({
            dependent: null,
            factors: [],
            covariates: [],
            referenceCategory: "last",
            statistics: {
                caseProcessing: true,
                modelFitting: true,
                pseudoRSquare: true,
                stepSummary: false,
                classificationTable: true,
                goodnessOfFit: true,
                parameterEstimates: true,
                likelihoodRatioTests: true,
                confidenceInterval: 95,
            },
            criteria: {
                iterations: 100,
                convergence: 0.000001,
                singularity: 0.00000001,
                delta: 0.5,
            },
            save: {
                predictedProbability: false,
                predictedCategory: false,
            }
        });
    };

    return (
        <div className="flex flex-col w-full max-w-[850px] h-[550px] bg-background text-foreground mx-auto overflow-hidden">
            <div className="flex-1 overflow-hidden flex flex-col p-4 pb-0">
                <Tabs defaultValue="variables" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid grid-cols-5 w-full shrink-0">
                        <TabsTrigger value="variables" className="text-xs">Model</TabsTrigger>
                        <TabsTrigger value="statistics" className="text-xs">Statistics</TabsTrigger>
                        <TabsTrigger value="criteria" className="text-xs">Criteria</TabsTrigger>
                        <TabsTrigger value="options" className="text-xs">Options</TabsTrigger>
                        <TabsTrigger value="save" className="text-xs">Save</TabsTrigger>
                    </TabsList>

                    <Separator className="my-3" />

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                        <TabsContent value="variables" className="mt-0 h-full focus-visible:outline-none">
                            <VariablesTab
                                variables={variables}
                                options={options}
                                setOptions={setOptions}
                            />
                        </TabsContent>

                        <TabsContent value="statistics" className="mt-0 focus-visible:outline-none h-full">
                            <StatisticsTab
                                options={options.statistics}
                                onChange={(stats) => setOptions({ ...options, statistics: stats })}
                            />
                        </TabsContent>

                        <TabsContent value="criteria" className="mt-0 focus-visible:outline-none h-full">
                            <CriteriaTab
                                options={options.criteria}
                                onChange={(crit) => setOptions({ ...options, criteria: crit })}
                            />
                        </TabsContent>

                        <TabsContent value="options" className="mt-0 focus-visible:outline-none h-full">
                            <OptionsTab
                                referenceCategory={options.referenceCategory}
                                onChange={(val) => setOptions({ ...options, referenceCategory: val })}
                                dependentVariable={options.dependent}
                            />
                        </TabsContent>

                        <TabsContent value="save" className="mt-0 focus-visible:outline-none h-full">
                            <SaveTab
                                options={options.save}
                                onChange={(save) => setOptions({ ...options, save: save })}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="shrink-0">
                <Separator />
                <div className="p-4 flex items-center justify-between bg-muted/30 px-6">
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                        <HelpCircle className="h-4 w-4 opacity-70" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p className="text-xs">Bantuan Multinomial Logistic</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            onClick={() => { }}
                            disabled={isLoading || !options.dependent}
                            className="min-w-[80px]"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "OK"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { }}
                            disabled={isLoading}
                        >
                            <RotateCcw className="mr-2 h-3 w-3" />
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => closeModal("MULTINOMIAL_LOGISTIC")}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};