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
import { useResultStore } from "@/stores/useResultStore";

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
    const { data } = useDataStore();
    const addResult = useResultStore((state) => state.addResult);


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
        // 1. Gunakan 'data' dari store dan pastikan tidak kosong
        if (!options.dependent || !data || data.length === 0) return;
        setIsLoading(true);

        try {
            // [EDIT: Algoritma pengambilan data mengikuti Binary Logistic]
            console.log("Struktur Baris Data:", data[0]);
            console.log("ID Variabel Dependen:", options.dependent.id);
            console.log("Nama Variabel Dependen:", options.dependent.name);
            const dependentName = options.dependent.name;
            const factorNames = options.factors.map(v => v.name);
            const covariateNames = options.covariates.map(v => v.name);

            const allSelectedNames = [dependentName, ...factorNames, ...covariateNames];

            // 2. Listwise Deletion menggunakan .name
            const validData = data.filter((row: any) => {
                return allSelectedNames.every(name => {
                    const val = row[name];
                    return val !== null && val !== undefined && String(val).trim() !== "";
                });
            });

            console.log("Debug Data Access:", {
                sampleRow: data[0],
                lookingFor: allSelectedNames,
                foundCount: validData.length
            });

            if (validData.length === 0) {
                throw new Error("Tidak ada data valid. Pastikan nama variabel sesuai dengan header di tabel data.");
            }

            // 3. Formatting data (Hanya memproses angka jika memungkinkan)
            const formattedData = {
                // Jika variabel dependen adalah kategori string, biarkan tetap string/diubah di Rust
                dependent: validData.map((row: any) => {
                    const val = row[dependentName];
                    return isNaN(parseFloat(val)) ? val : parseFloat(val);
                }),
                // Independent dipisah antara factor (kategori) dan covariate (numerik)
                independent: [
                    ...factorNames.map(name => validData.map((row: any) => row[name])),
                    ...covariateNames.map(name => validData.map((row: any) => parseFloat(row[name])))
                ],
                weights: null
            };

            // 4. Inisialisasi Worker (Sesuai Binary Logistic)
            const worker = new Worker(
                new URL("/workers/Regression/multinomialLogistic.worker.js", window.location.origin),
                { type: "module" }
            );

            worker.postMessage({
                data: formattedData,
                options: {
                    reference_category: options.referenceCategory,
                    confidence_interval: options.statistics.confidenceInterval / 100,
                    iterations: options.criteria.iterations,
                    convergence: options.criteria.convergence,
                    singularity: options.criteria.singularity,
                    include_intercept: true
                }
            });

            worker.onmessage = (e) => {
                const { type, payload, error } = e.data;
                if (type === "SUCCESS") {
                    addResult({
                        id: Date.now().toString(),
                        type: 'MULTINOMIAL_LOGISTIC',
                        label: `Multinomial Logistic: ${options.dependent!.name}`,
                        data: payload,
                    });
                    closeModal("MULTINOMIAL_LOGISTIC");
                    worker.terminate();
                } else {
                    alert(`Analysis Error: ${error}`);
                    setIsLoading(false);
                    worker.terminate();
                }
            };

            worker.onerror = (err) => {
                console.error("Worker Execution Error:", err);
                setIsLoading(false);
                worker.terminate();
            };

        } catch (error: any) {
            alert(error.message);
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
                            // [EDIT: Panggil fungsi handleAnalyze di sini]
                            onClick={handleAnalyze}
                            // Tombol mati jika loading atau variabel dependen belum dipilih
                            disabled={isLoading || !options.dependent}
                            className="min-w-[80px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "OK"
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetOptions} // Gunakan fungsi reset yang sudah kita buat sebelumnya
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