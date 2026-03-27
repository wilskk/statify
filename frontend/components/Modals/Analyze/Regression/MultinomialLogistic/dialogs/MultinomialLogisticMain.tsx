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
    const { addLog, addAnalytic, addStatistic, loadResults } = useResultStore();


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
            console.log("Struktur Baris Data:", data[0]);
            console.log("ID Variabel Dependen:", options.dependent.id);
            console.log("Nama Variabel Dependen:", options.dependent.name);

            const dependentVar = options.dependent;
            const factorVars = options.factors;
            const covariateVars = options.covariates;

            const dependentIndex = dependentVar.columnIndex;
            const factorIndices = factorVars.map(v => v.columnIndex);
            const covariateIndices = covariateVars.map(v => v.columnIndex);

            const allSelectedIndices = [dependentIndex, ...factorIndices, ...covariateIndices];

            // Validasi keberadaan kolom berdasarkan index
            const availableColumns = (data[0] || []).map((_: any, idx: number) => idx);
            const missingVars = [dependentVar, ...factorVars, ...covariateVars]
                .filter(v => v.columnIndex >= (data[0]?.length ?? 0))
                .map(v => v.name);

            if (missingVars.length > 0) {
                throw new Error(
                    `Kolom tidak ditemukan di data: ${missingVars.join(", ")}. Kolom yang tersedia: ${availableColumns.join(", ")}`
                );
            }

            // 2. Listwise Deletion menggunakan index kolom
            const validData = data.filter((row: any[]) => {
                return allSelectedIndices.every((idx) => {
                    const val = row[idx];
                    return val !== null && val !== undefined && String(val).trim() !== "";
                });
            });

            console.log("Debug Data Access:", {
                sampleRow: data[0],
                lookingFor: allSelectedIndices,
                foundCount: validData.length
            });

            if (validData.length === 0) {
                throw new Error("Tidak ada data valid. Pastikan variabel yang dipilih memiliki nilai pada semua baris.");
            }

            const formattedData = {
                dependent: validData.map((row: any[]) => {
                    const val = row[dependentIndex];
                    const num = parseFloat(String(val));
                    return isNaN(num) ? val : num;
                }),
                independent: [
                    ...factorIndices.map(idx => validData.map((row: any[]) => row[idx])),
                    ...covariateIndices.map(idx => validData.map((row: any[]) => parseFloat(String(row[idx]))))
                ],
                weights: null
            };

            console.log("[Multinomial UI] Formatted data sample:", {
                dependent: formattedData.dependent.slice(0, 5),
                independentCount: formattedData.independent.length,
                independent0Sample: formattedData.independent[0]?.slice(0, 5),
                independent1Sample: formattedData.independent[1]?.slice(0, 5)
            });

            const worker = new Worker('/workers/MultinomialLogistic/multinomial_logistic.js', { type: 'module' });

            const workerOptions = {
                referenceCategory: options.referenceCategory,
                confidenceInterval: options.statistics.confidenceInterval / 100,
                iterations: options.criteria.iterations,
                tolerance: options.criteria.convergence,
                singularity: options.criteria.singularity,
                includeIntercept: true
            };

            console.log("[Multinomial UI] Worker options:", workerOptions);

            worker.postMessage({
                data: formattedData,
                options: workerOptions
            });

            worker.onmessage = (e) => {
                const { type, payload, error } = e.data;
                console.log("[Multinomial UI] Worker response:", { type, hasPayload: !!payload, error });

                if (type === "SUCCESS") {
                    (async () => {
                        try {
                            const result = typeof payload === "string" ? JSON.parse(payload) : payload;
                            console.log("[Multinomial UI] Parsed result:", result);
                            console.log("[Multinomial UI] Result keys:", Object.keys(result));

                            // DEBUG: Check new fields
                            console.log("[Multinomial UI] NEW FIELDS CHECK:", {
                                hasClassificationTable: !!result?.classificationTable,
                                classificationTable: result?.classificationTable,
                                hasGoodnessOfFit: !!result?.goodnessOfFit,
                                goodnessOfFit: result?.goodnessOfFit,
                                hasLikelihoodRatioTests: !!result?.likelihoodRatioTests,
                                likelihoodRatioTests: result?.likelihoodRatioTests,
                                hasCIs: !!(result?.ciLower && result?.ciUpper),
                            });

                            console.log("[Multinomial UI] Result structure:", {
                                logLikelihood: result?.logLikelihood,
                                chiSquare: result?.chiSquare,
                                df: result?.df,
                                pValueModel: result?.pValueModel,
                                pseudoRSquare: result?.pseudoRSquare,
                                coefficients: result?.coefficients,
                                stdErrors: result?.stdErrors,
                                waldStats: result?.waldStats,
                                pValues: result?.pValues,
                                expBeta: result?.expBeta
                            });

                            const logMessage = `NOMREG ${options.dependent!.name}
/METHOD=ENTER ${[...options.factors, ...options.covariates].map(v => v.name).join(" ")}
/CRITERIA=ITERATE(${options.criteria.iterations}) CONVERGE(${options.criteria.convergence})`;

                            console.log("[Multinomial UI] Creating log entry...");
                            const logId = await addLog({ log: logMessage });
                            console.log("[Multinomial UI] Log ID:", logId);

                            const analyticId = await addAnalytic(logId, {
                                title: "Multinomial Logistic Regression",
                                note: "",
                            });
                            console.log("[Multinomial UI] Analytic ID:", analyticId);

                            const paramNames = [
                                "Intercept",
                                ...options.factors.map(v => v.name),
                                ...options.covariates.map(v => v.name),
                            ];

                            const coeffs: number[][] = result?.coefficients || [];
                            const stdErrors: number[][] = result?.stdErrors || [];
                            const waldStats: number[][] = result?.waldStats || [];
                            const pValues: number[][] = result?.pValues || [];
                            const expBeta: number[][] = result?.expBeta || [];
                            const ciLower: number[][] = result?.ciLower || [];
                            const ciUpper: number[][] = result?.ciUpper || [];
                            const expCiLower: number[][] = result?.expCiLower || [];
                            const expCiUpper: number[][] = result?.expCiUpper || [];

                            console.log("[Multinomial UI] Extracted data:", {
                                coeffsLength: coeffs.length,
                                stdErrorsLength: stdErrors.length,
                                waldStatsLength: waldStats.length,
                                pValuesLength: pValues.length,
                                expBetaLength: expBeta.length,
                                hasCIs: ciLower.length > 0
                            });

                            const nParams = coeffs[0]?.length ?? 0;
                            const usedParamNames = paramNames.slice(0, nParams);

                            // Parameter table with Confidence Intervals
                            const parameterRows = coeffs.flatMap((row, catIdx) =>
                                row.map((coef, pIdx) => ({
                                    rowHeader: [
                                        `Category ${catIdx + 1}`,
                                        usedParamNames[pIdx] ?? `Param ${pIdx + 1}`,
                                    ],
                                    "B": coef?.toFixed(3) ?? "",
                                    "Std. Error": stdErrors[catIdx]?.[pIdx]?.toFixed(3) ?? "",
                                    "Wald": waldStats[catIdx]?.[pIdx]?.toFixed(3) ?? "",
                                    "Sig.": (() => {
                                        const p = pValues[catIdx]?.[pIdx];
                                        return p !== undefined ? (p < 0.001 ? "< .001" : p.toFixed(3)) : "";
                                    })(),
                                    "Exp(B)": expBeta[catIdx]?.[pIdx]?.toFixed(3) ?? "",
                                    [`${options.statistics.confidenceInterval}% CI for B`]:
                                        ciLower[catIdx]?.[pIdx] !== undefined && ciUpper[catIdx]?.[pIdx] !== undefined
                                            ? `[${ciLower[catIdx][pIdx].toFixed(3)}, ${ciUpper[catIdx][pIdx].toFixed(3)}]`
                                            : "",
                                    [`${options.statistics.confidenceInterval}% CI for Exp(B)`]:
                                        expCiLower[catIdx]?.[pIdx] !== undefined && expCiUpper[catIdx]?.[pIdx] !== undefined
                                            ? `[${expCiLower[catIdx][pIdx].toFixed(3)}, ${expCiUpper[catIdx][pIdx].toFixed(3)}]`
                                            : "",
                                }))
                            );

                            const modelFittingTable = {
                                title: "Model Fitting Information",
                                columnHeaders: [
                                    { header: "" },
                                    { header: "-2 Log Likelihood" },
                                    { header: "Chi-Square" },
                                    { header: "df" },
                                    { header: "Sig." },
                                ],
                                rows: [
                                    {
                                        rowHeader: ["Final"],
                                        "-2 Log Likelihood": (result?.logLikelihood !== undefined ? (-2 * result.logLikelihood).toFixed(3) : ""),
                                        "Chi-Square": (result?.chiSquare?.toFixed(3) ?? ""),
                                        "df": (result?.df ?? ""),
                                        "Sig.": (result?.pValueModel < 0.001 ? "< .001" : result?.pValueModel?.toFixed(3) ?? ""),
                                    },
                                ],
                            };

                            const pseudoRSquareTable = {
                                title: "Pseudo R-Square",
                                columnHeaders: [
                                    { header: "" },
                                    { header: "Value" },
                                ],
                                rows: [
                                    { rowHeader: ["Cox & Snell"], "Value": (result?.pseudoRSquare?.coxSnell?.toFixed(3) ?? "") },
                                    { rowHeader: ["Nagelkerke"], "Value": (result?.pseudoRSquare?.nagelkerke?.toFixed(3) ?? "") },
                                    { rowHeader: ["McFadden"], "Value": (result?.pseudoRSquare?.mcfadden?.toFixed(3) ?? "") },
                                ],
                            };

                            const parameterEstimatesTable = {
                                title: "Parameter Estimates",
                                columnHeaders: [
                                    { header: "Category" },
                                    { header: "" },
                                    { header: "B" },
                                    { header: "Std. Error" },
                                    { header: "Wald" },
                                    { header: "Sig." },
                                    { header: "Exp(B)" },
                                    { header: `${options.statistics.confidenceInterval}% CI for B` },
                                    { header: `${options.statistics.confidenceInterval}% CI for Exp(B)` },
                                ],
                                rows: parameterRows,
                            };

                            // NEW: Classification Table
                            const classificationTable = result?.classificationTable ? {
                                title: "Classification Table",
                                columnHeaders: [
                                    { header: "Observed" },
                                    ...Array.from({ length: result.classificationTable.confusionMatrix.length }, (_, i) => ({ header: `Predicted ${i}` })),
                                    { header: "Percent Correct" },
                                ],
                                rows: result.classificationTable.confusionMatrix.map((row: number[], idx: number) => ({
                                    rowHeader: [`Category ${idx}`],
                                    ...row.reduce((acc, val, predIdx) => {
                                        acc[`Predicted ${predIdx}`] = String(val);
                                        return acc;
                                    }, {} as Record<string, string>),
                                    "Percent Correct": `${result.classificationTable.categoryPercentages[idx].toFixed(1)}%`,
                                })).concat([{
                                    rowHeader: ["Overall"],
                                    ...Array.from({ length: result.classificationTable.confusionMatrix.length }, () => "").reduce((acc, _, i) => {
                                        acc[`Predicted ${i}`] = "";
                                        return acc;
                                    }, {} as Record<string, string>),
                                    "Percent Correct": `${result.classificationTable.overallPercentage.toFixed(1)}%`,
                                }]),
                            } : null;

                            // NEW: Goodness-of-Fit Tests
                            const goodnessOfFitTable = result?.goodnessOfFit ? {
                                title: "Goodness-of-Fit Tests",
                                columnHeaders: [
                                    { header: "" },
                                    { header: "Chi-Square" },
                                    { header: "df" },
                                    { header: "Sig." },
                                ],
                                rows: [
                                    {
                                        rowHeader: ["Pearson"],
                                        "Chi-Square": result.goodnessOfFit.pearsonChiSquare.toFixed(3),
                                        "df": String(result.goodnessOfFit.pearsonDf),
                                        "Sig.": result.goodnessOfFit.pearsonPValue < 0.001 ? "< .001" : result.goodnessOfFit.pearsonPValue.toFixed(3),
                                    },
                                    {
                                        rowHeader: ["Deviance"],
                                        "Chi-Square": result.goodnessOfFit.deviance.toFixed(3),
                                        "df": String(result.goodnessOfFit.devianceDf),
                                        "Sig.": result.goodnessOfFit.deviancePValue < 0.001 ? "< .001" : result.goodnessOfFit.deviancePValue.toFixed(3),
                                    },
                                ],
                            } : null;

                            // NEW: Likelihood Ratio Tests
                            const likelihoodRatioTable = result?.likelihoodRatioTests && result.likelihoodRatioTests.length > 0 ? {
                                title: "Likelihood Ratio Tests",
                                columnHeaders: [
                                    { header: "Effect" },
                                    { header: "Chi-Square" },
                                    { header: "df" },
                                    { header: "Sig." },
                                ],
                                rows: result.likelihoodRatioTests.map((test: any) => ({
                                    rowHeader: [test.effect],
                                    "Chi-Square": test.chiSquare.toFixed(3),
                                    "df": String(test.df),
                                    "Sig.": test.pValue < 0.001 ? "< .001" : test.pValue.toFixed(3),
                                })),
                            } : null;

                            console.log("[Multinomial UI] Creating statistics with tables:", {
                                modelFitting: modelFittingTable,
                                pseudoRSquare: pseudoRSquareTable,
                                parameterEstimates: parameterEstimatesTable,
                                classificationTable,
                                goodnessOfFit: goodnessOfFitTable,
                                likelihoodRatio: likelihoodRatioTable,
                            });

                            // DEBUG: Check what will be saved
                            console.log("[Multinomial UI] Statistics to save:", {
                                modelFitting: options.statistics.modelFitting,
                                pseudoRSquare: options.statistics.pseudoRSquare,
                                parameterEstimates: options.statistics.parameterEstimates,
                                classificationTable: options.statistics.classificationTable,
                                goodnessOfFit: options.statistics.goodnessOfFit,
                                likelihoodRatioTests: options.statistics.likelihoodRatioTests,
                            });

                            console.log("[Multinomial UI] Tables availability:", {
                                hasClassificationTable: !!classificationTable,
                                hasGoodnessOfFit: !!goodnessOfFitTable,
                                hasLikelihoodRatio: !!likelihoodRatioTable,
                            });

                            // Save Model Fitting Information (always)
                            if (options.statistics.modelFitting) {
                                await addStatistic(analyticId, {
                                    title: "Model Fitting Information",
                                    description: "Model fit summary.",
                                    output_data: JSON.stringify({ tables: [modelFittingTable] }),
                                    components: "Model Fitting Information",
                                });
                                console.log("[Multinomial UI] Model Fitting statistic added");
                            }

                            // Save Pseudo R-Square (if enabled)
                            if (options.statistics.pseudoRSquare) {
                                await addStatistic(analyticId, {
                                    title: "Pseudo R-Square",
                                    description: "Pseudo R-Square measures.",
                                    output_data: JSON.stringify({ tables: [pseudoRSquareTable] }),
                                    components: "Pseudo R-Square",
                                });
                                console.log("[Multinomial UI] Pseudo R-Square statistic added");
                            }

                            // Save Parameter Estimates (if enabled)
                            if (options.statistics.parameterEstimates) {
                                await addStatistic(analyticId, {
                                    title: "Parameter Estimates",
                                    description: "Parameter estimates for each category with confidence intervals.",
                                    output_data: JSON.stringify({ tables: [parameterEstimatesTable] }),
                                    components: "Parameter Estimates",
                                });
                                console.log("[Multinomial UI] Parameter Estimates statistic added");
                            }

                            // NEW: Save Classification Table (if enabled)
                            if (options.statistics.classificationTable && classificationTable) {
                                await addStatistic(analyticId, {
                                    title: "Classification Table",
                                    description: "Observed vs Predicted categories with accuracy percentages.",
                                    output_data: JSON.stringify({ tables: [classificationTable] }),
                                    components: "Classification Table",
                                });
                                console.log("[Multinomial UI] Classification Table statistic added");
                            }

                            // NEW: Save Goodness-of-Fit Tests (if enabled)
                            if (options.statistics.goodnessOfFit && goodnessOfFitTable) {
                                await addStatistic(analyticId, {
                                    title: "Goodness-of-Fit Tests",
                                    description: "Pearson Chi-Square and Deviance tests for model fit.",
                                    output_data: JSON.stringify({ tables: [goodnessOfFitTable] }),
                                    components: "Goodness-of-Fit",
                                });
                                console.log("[Multinomial UI] Goodness-of-Fit statistic added");
                            }

                            // NEW: Save Likelihood Ratio Tests (if enabled)
                            if (options.statistics.likelihoodRatioTests && likelihoodRatioTable) {
                                await addStatistic(analyticId, {
                                    title: "Likelihood Ratio Tests",
                                    description: "Likelihood ratio tests for predictor effects.",
                                    output_data: JSON.stringify({ tables: [likelihoodRatioTable] }),
                                    components: "Likelihood Ratio Tests",
                                });
                                console.log("[Multinomial UI] Likelihood Ratio Tests statistic added");
                            }

                            console.log("[Multinomial UI] Loading results...");
                            await loadResults();
                            console.log("[Multinomial UI] Results loaded, closing modal");

                            closeModal("MULTINOMIAL_LOGISTIC");
                            worker.terminate();
                            setIsLoading(false);
                        } catch (saveError: any) {
                            console.error("[Multinomial UI] Failed to save result:", saveError);
                            alert("Gagal menyimpan hasil: " + saveError.message);
                            setIsLoading(false);
                            worker.terminate();
                        }
                    })();
                } else {
                    console.error("[Multinomial UI] Analysis Error:", error);
                    alert(`Analysis Error: ${error || "Unknown error"}`);
                    setIsLoading(false);
                    worker.terminate();
                }
            };

            worker.onerror = (err) => {
                console.error("[Multinomial UI] Worker Execution Error:", err);
                alert(`Worker Error: ${err.message || String(err)}`);
                setIsLoading(false);
                worker.terminate();
            };

        } catch (error: any) {
            console.error("[Multinomial UI] Exception in handleAnalyze:", error);
            alert(error.message || String(error));
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