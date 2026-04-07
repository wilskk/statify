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
import { StatisticsTab, StatisticsOptions } from "./StatisticsTab";
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
            pseudoRSquare: true,
            stepSummary: true,
            modelFitting: true,
            informationCriteria: true,
            cellProbabilities: true,
            classificationTable: true,
            goodnessOfFit: true,
            monotonicityMeasures: false,
            parameterEstimates: true,
            likelihoodRatioTests: true,
            asymptoticCorrelations: false,
            asymptoticCovariances: false,
            confidenceInterval: 95,
            subpopulationMode: "factors" as StatisticsOptions["subpopulationMode"],
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

            // 2. Case base: abaikan baris yang benar-benar kosong pada semua variabel terpilih.
            const analysisBaseData = data.filter((row: any[]) => {
                return allSelectedIndices.some((idx) => {
                    const val = row[idx];
                    return val !== null && val !== undefined && String(val).trim() !== "";
                });
            });

            // 3. Listwise Deletion menggunakan index kolom
            const validData = analysisBaseData.filter((row: any[]) => {
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

            const normalizeCategory = (value: unknown) => String(value).trim();
            const compareCategory = (a: string, b: string) => {
                const aNum = Number(a);
                const bNum = Number(b);
                const aIsNum = Number.isFinite(aNum);
                const bIsNum = Number.isFinite(bNum);
                if (aIsNum && bIsNum) return aNum - bNum;
                return a.localeCompare(b, undefined, { numeric: true });
            };
            // SPSS-like factor handling: indicator (dummy) coding with one reference level omitted.
            const encodedFactorColumns = factorVars.flatMap((factorVar) => {
                const idx = factorVar.columnIndex;
                const categories = Array.from(
                    new Set(validData.map((row: any[]) => normalizeCategory(row[idx])))
                ).sort(compareCategory);

                if (categories.length <= 1) {
                    return [] as Array<{ name: string; values: number[] }>;
                }

                const referenceCategory = categories[categories.length - 1];
                const nonReferenceCategories = categories.filter((cat) => cat !== referenceCategory);

                return nonReferenceCategories.map((category) => {
                    return {
                        name: `${factorVar.name}=${category}`,
                        values: validData.map((row: any[]) =>
                            normalizeCategory(row[idx]) === category ? 1.0 : 0.0
                        ),
                    };
                });
            });

            const covariateColumns = covariateIndices.map((idx, covIdx) => ({
                name: covariateVars[covIdx]?.name ?? `X${covIdx + 1}`,
                values: validData.map((row: any[]) => parseFloat(String(row[idx]))),
            }));

            const allPredictorColumns = [...covariateColumns, ...encodedFactorColumns];

            const formattedData = {
                dependent: validData.map((row: any[]) => {
                    const val = row[dependentIndex];
                    const num = parseFloat(String(val));
                    return isNaN(num) ? val : num;
                }),
                independent: allPredictorColumns.map((col) => col.values),
                weights: null,
                variableNames: allPredictorColumns.map((col) => col.name),
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

                            const coeffs: number[][] = result?.coefficients || [];
                            const stdErrors: number[][] = result?.stdErrors || [];
                            const waldStats: number[][] = result?.waldStats || [];
                            const pValues: number[][] = result?.pValues || [];
                            const expBeta: number[][] = result?.expBeta || [];
                            const expCiLower: number[][] = result?.expCiLower || [];
                            const expCiUpper: number[][] = result?.expCiUpper || [];
                            const asymptoticCovariance: number[][] = result?.asymptoticCovariance || [];
                            const asymptoticCorrelation: number[][] = result?.asymptoticCorrelation || [];
                            const sampleSize = validData.length;
                            const validCases = validData.length;
                            const totalCases = analysisBaseData.length;
                            const missingCases = totalCases - validCases;

                            console.log("[Multinomial UI] Extracted data:", {
                                coeffsLength: coeffs.length,
                                stdErrorsLength: stdErrors.length,
                                waldStatsLength: waldStats.length,
                                pValuesLength: pValues.length,
                                expBetaLength: expBeta.length,
                                hasExpCIs: expCiLower.length > 0
                            });

                            const nParams = coeffs[0]?.length ?? 0;
                            const usedParamNames = ["Intercept", ...allPredictorColumns.map((col) => col.name)].slice(0, nParams);
                            const kParams = coeffs.reduce((sum, row) => sum + row.length, 0);
                            const finalNeg2LL = result?.logLikelihood !== undefined ? (-2 * result.logLikelihood) : NaN;

                            const formatSpssNumber = (value: number | undefined, digits = 3) => {
                                if (value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
                                    return ".";
                                }
                                const fixed = value.toFixed(digits);
                                if (fixed.startsWith("-0.")) {
                                    return `-${fixed.slice(2)}`;
                                }
                                if (fixed.startsWith("0.")) {
                                    return fixed.slice(1);
                                }
                                return fixed;
                            };

                            const formatCategoryValue = (value: number | string | undefined) => {
                                if (value === undefined || value === null) return "";
                                if (typeof value === "number") {
                                    if (!Number.isFinite(value)) return "";
                                    return Number.isInteger(value) ? String(value) : value.toString();
                                }
                                return String(value);
                            };

                            const findValueLabel = (variable: Variable, rawValue: number | string | undefined) => {
                                if (rawValue === undefined || rawValue === null || !Array.isArray(variable.values)) {
                                    return null;
                                }

                                const rawStr = String(rawValue).trim();
                                const rawNum = Number(rawValue);
                                const hasRawNum = Number.isFinite(rawNum);

                                const matched = variable.values.find((item) => {
                                    const itemStr = String(item.value).trim();
                                    if (itemStr === rawStr) return true;

                                    const itemNum = Number(item.value);
                                    return hasRawNum && Number.isFinite(itemNum) && itemNum === rawNum;
                                });

                                return matched?.label ?? null;
                            };

                            const formatCategoryWithLabel = (variable: Variable, rawValue: number | string | undefined) => {
                                const valueText = formatCategoryValue(rawValue);
                                const valueLabel = findValueLabel(variable, rawValue);
                                return valueLabel && valueLabel.trim() !== "" ? valueLabel : valueText;
                            };

                            const dependentCategoryMap = Array.from(
                                new Set(
                                    formattedData.dependent
                                        .map((val: any) => Number(val))
                                        .filter((val: number) => Number.isFinite(val))
                                )
                            ).sort((a, b) => a - b);

                            const referenceCategoryValue = (() => {
                                if (dependentCategoryMap.length === 0) return undefined;
                                if (options.referenceCategory === "first") return dependentCategoryMap[0];
                                if (options.referenceCategory === "last") return dependentCategoryMap[dependentCategoryMap.length - 1];
                                const parsed = Number(options.referenceCategory);
                                return Number.isFinite(parsed) && dependentCategoryMap.includes(parsed)
                                    ? parsed
                                    : dependentCategoryMap[dependentCategoryMap.length - 1];
                            })();

                            const nonReferenceCategories = dependentCategoryMap.filter(
                                (cat) => cat !== referenceCategoryValue
                            );

                            const formatPValue = (p: number | undefined) => {
                                if (p === undefined || Number.isNaN(p)) return "";
                                if (p < 0.001) return "< .001";
                                return formatSpssNumber(p, 3);
                            };

                            const formatFixed = (value: number | undefined, digits = 3) => {
                                if (value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
                                    return "";
                                }
                                return value.toFixed(digits);
                            };

                            const formatExpValueForDisplay = (value: number | undefined) => formatSpssNumber(value, 3);

                            // Parameter table with Exp(B) confidence intervals
                            const parameterRows = coeffs.flatMap((row, catIdx) =>
                                row.map((coef, pIdx) => ({
                                    rowHeader: [
                                        formatCategoryWithLabel(dependentVar, nonReferenceCategories[catIdx]),
                                        usedParamNames[pIdx]?.includes("=")
                                            ? `[${usedParamNames[pIdx]}]`
                                            : (usedParamNames[pIdx] ?? `Param ${pIdx + 1}`),
                                    ],
                                    "B": formatSpssNumber(coef),
                                    "Std. Error": formatSpssNumber(stdErrors[catIdx]?.[pIdx]),
                                    "Wald": formatSpssNumber(waldStats[catIdx]?.[pIdx]),
                                    "df": "1",
                                    "Sig.": (() => {
                                        const p = pValues[catIdx]?.[pIdx];
                                        return p !== undefined ? formatPValue(p) : "";
                                    })(),
                                    "Exp(B)": formatExpValueForDisplay(expBeta[catIdx]?.[pIdx]),
                                    "Lower Bound": formatSpssNumber(expCiLower[catIdx]?.[pIdx]),
                                    "Upper Bound": formatSpssNumber(expCiUpper[catIdx]?.[pIdx]),
                                }))
                            );

                            const nullNeg2LL = result?.nullLogLikelihood !== undefined
                                ? (-2 * result.nullLogLikelihood)
                                : NaN;
                            const interceptOnlyParams = Math.max((dependentCategoryMap.length || 1) - 1, 1);

                            const modelFittingTable = {
                                title: "Model Fitting Information",
                                columnHeaders: [
                                    { header: "Model" },
                                    { header: "AIC" },
                                    { header: "BIC" },
                                    { header: "-2 Log Likelihood" },
                                    { header: "Chi-Square" },
                                    { header: "df" },
                                    { header: "Sig." },
                                ],
                                rows: [
                                    {
                                        rowHeader: ["Intercept Only"],
                                        "AIC": Number.isFinite(nullNeg2LL) ? (nullNeg2LL + 2 * interceptOnlyParams).toFixed(3) : "",
                                        "BIC": Number.isFinite(nullNeg2LL) && sampleSize > 0
                                            ? (nullNeg2LL + Math.log(sampleSize) * interceptOnlyParams).toFixed(3)
                                            : "",
                                        "-2 Log Likelihood": Number.isFinite(nullNeg2LL) ? nullNeg2LL.toFixed(3) : "",
                                        "Chi-Square": "",
                                        "df": "",
                                        "Sig.": "",
                                    },
                                    {
                                        rowHeader: ["Final"],
                                        "AIC": Number.isFinite(finalNeg2LL) ? (finalNeg2LL + 2 * kParams).toFixed(3) : "",
                                        "BIC": Number.isFinite(finalNeg2LL) && sampleSize > 0
                                            ? (finalNeg2LL + Math.log(sampleSize) * kParams).toFixed(3)
                                            : "",
                                        "-2 Log Likelihood": Number.isFinite(finalNeg2LL) ? finalNeg2LL.toFixed(3) : "",
                                        "Chi-Square": (result?.chiSquare?.toFixed(3) ?? ""),
                                        "df": (result?.df ?? ""),
                                        "Sig.": formatPValue(result?.pValueModel),
                                    },
                                ],
                            };

                            const categoricalEntries = [
                                { label: dependentVar.name, index: dependentIndex, variable: dependentVar },
                                ...factorVars.map((factor) => ({ label: factor.name, index: factor.columnIndex, variable: factor })),
                            ];

                            const categoryBreakdownRows = categoricalEntries.flatMap((entry) => {
                                const freq = validData.reduce((acc, row) => {
                                    const raw = row[entry.index];
                                    const key = String(raw);
                                    acc[key] = (acc[key] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>);

                                return Object.entries(freq)
                                    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
                                    .map(([category, count]) => ({
                                        rowHeader: [entry.label, formatCategoryWithLabel(entry.variable, category)],
                                        N: String(count),
                                        Percent: validCases > 0 ? `${((count / validCases) * 100).toFixed(1)}%` : "0.0%",
                                        n: String(count),
                                        percent: validCases > 0 ? `${((count / validCases) * 100).toFixed(1)}%` : "0.0%",
                                    }));
                            });

                            const caseProcessingRows = [
                                ...categoryBreakdownRows,
                                {
                                    rowHeader: ["Overall", "Valid"],
                                    N: String(validCases),
                                    Percent: totalCases > 0 ? `${((validCases / totalCases) * 100).toFixed(1)}%` : "0.0%",
                                    n: String(validCases),
                                    percent: totalCases > 0 ? `${((validCases / totalCases) * 100).toFixed(1)}%` : "0.0%",
                                },
                                {
                                    rowHeader: ["Overall", "Missing"],
                                    N: String(missingCases),
                                    Percent: totalCases > 0 ? `${((missingCases / totalCases) * 100).toFixed(1)}%` : "0.0%",
                                    n: String(missingCases),
                                    percent: totalCases > 0 ? `${((missingCases / totalCases) * 100).toFixed(1)}%` : "0.0%",
                                },
                                {
                                    rowHeader: ["Overall", "Total"],
                                    N: String(totalCases),
                                    Percent: "100.0%",
                                    n: String(totalCases),
                                    percent: "100.0%",
                                },
                                {
                                    rowHeader: ["Overall", "Subpopulation"],
                                    N: String(validCases),
                                    Percent: "",
                                    n: String(validCases),
                                    percent: "",
                                },
                            ];

                            if (categoryBreakdownRows.length === 0) {
                                caseProcessingRows.push({
                                    rowHeader: [dependentVar.name, "(no categories found)"],
                                    N: "0",
                                    Percent: "0.0%",
                                    n: "0",
                                    percent: "0.0%",
                                });
                            }

                            const caseProcessingTable = {
                                title: "Case Processing Summary",
                                columnHeaders: [
                                    { header: "N" },
                                    { header: "Percent" },
                                ],
                                rows: caseProcessingRows,
                            };

                            const stepSummaryTable = {
                                title: "Step Summary",
                                columnHeaders: [
                                    { header: "" },
                                    { header: "Value" },
                                ],
                                rows: [
                                    { rowHeader: ["Iterations"], "Value": String(result?.iterations ?? "") },
                                    { rowHeader: ["Converged"], "Value": result?.converged ? "Yes" : "No" },
                                    { rowHeader: ["Final -2 Log Likelihood"], "Value": Number.isFinite(finalNeg2LL) ? finalNeg2LL.toFixed(3) : "" },
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
                                    { header: "Category", key: "row_header_col_1" },
                                    { header: "", key: "row_header_col_2" },
                                    { header: "B", key: "B" },
                                    { header: "Std. Error", key: "Std. Error" },
                                    { header: "Wald", key: "Wald" },
                                    { header: "df", key: "df" },
                                    { header: "Sig.", key: "Sig." },
                                    { header: "Exp(B)", key: "Exp(B)" },
                                    {
                                        header: `${options.statistics.confidenceInterval}% Confidence Interval for Exp(B)`,
                                        children: [
                                            { header: "Lower Bound", key: "Lower Bound" },
                                            { header: "Upper Bound", key: "Upper Bound" },
                                        ],
                                    },
                                ],
                                rows: parameterRows,
                                footer: [
                                    `a. The reference category is: ${formatCategoryWithLabel(dependentVar, referenceCategoryValue)}.`,
                                    "b. This parameter is set to zero because it is redundant.",
                                ],
                            };

                            // NEW: Classification Table
                            const classificationTable = result?.classificationTable ? {
                                title: "Classification Table",
                                columnHeaders: [
                                    { header: "Observed" },
                                    ...Array.from(
                                        { length: result.classificationTable.confusionMatrix.length },
                                        (_, i) => ({ header: `Predicted ${formatCategoryWithLabel(dependentVar, dependentCategoryMap[i])}` })
                                    ),
                                    { header: "Percent Correct" },
                                ],
                                rows: result.classificationTable.confusionMatrix.map((row: number[], idx: number) => ({
                                    rowHeader: [formatCategoryWithLabel(dependentVar, dependentCategoryMap[idx])],
                                    ...row.reduce((acc, val, predIdx) => {
                                        acc[`Predicted ${formatCategoryWithLabel(dependentVar, dependentCategoryMap[predIdx])}`] = String(val);
                                        return acc;
                                    }, {} as Record<string, string>),
                                    "Percent Correct": `${result.classificationTable.categoryPercentages[idx].toFixed(1)}%`,
                                })).concat([{
                                    rowHeader: ["Overall"],
                                    ...Array.from({ length: result.classificationTable.confusionMatrix.length }, () => "").reduce((acc, _, i) => {
                                        acc[`Predicted ${formatCategoryWithLabel(dependentVar, dependentCategoryMap[i])}`] = "";
                                        return acc;
                                    }, {} as Record<string, string>),
                                    "Percent Correct": `${result.classificationTable.overallPercentage.toFixed(1)}%`,
                                }]),
                            } : null;

                            const cellProbabilitiesTable = result?.classificationTable ? {
                                title: "Cell Probabilities",
                                columnHeaders: [
                                    { header: "Observed" },
                                    ...Array.from(
                                        { length: result.classificationTable.confusionMatrix.length },
                                        (_, i) => ({ header: `Predicted ${formatCategoryWithLabel(dependentVar, dependentCategoryMap[i])}` })
                                    ),
                                ],
                                rows: result.classificationTable.confusionMatrix.map((row: number[], idx: number) => {
                                    const total = row.reduce((sum, value) => sum + value, 0);
                                    return {
                                        rowHeader: [formatCategoryWithLabel(dependentVar, dependentCategoryMap[idx])],
                                        ...row.reduce((acc, value, predIdx) => {
                                            acc[`Predicted ${formatCategoryWithLabel(dependentVar, dependentCategoryMap[predIdx])}`] = total > 0
                                                ? (value / total).toFixed(4)
                                                : "0.0000";
                                            return acc;
                                        }, {} as Record<string, string>),
                                    };
                                }),
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
                                    { header: "Effect", key: "row_header_col_1" },
                                    {
                                        header: "Model Fit",
                                        children: [
                                            { header: "AIC", key: "AIC" },
                                            { header: "BIC", key: "BIC" },
                                            { header: "-2LL", key: "-2LL" },
                                        ],
                                    },
                                    {
                                        header: "LR Test",
                                        children: [
                                            { header: "Chi-Square", key: "Chi-Square" },
                                            { header: "df", key: "df" },
                                            { header: "Sig.", key: "Sig." },
                                        ],
                                    },
                                ],
                                rows: result.likelihoodRatioTests.map((test: any) => ({
                                    rowHeader: [test.effect],
                                    "AIC": formatSpssNumber(test.aicReduced),
                                    "BIC": formatSpssNumber(test.bicReduced),
                                    "-2LL": test.equivalentToFinal
                                        ? `${formatSpssNumber(test.neg2LogLikelihoodReduced)}<sup>a</sup>`
                                        : formatSpssNumber(test.neg2LogLikelihoodReduced),
                                    "Chi-Square": formatSpssNumber(test.chiSquare),
                                    "df": String(test.df),
                                    "Sig.": Number.isFinite(test.pValue) ? formatPValue(test.pValue) : ".",
                                })),
                                footer: [
                                    "The chi-square statistic is the difference in -2 log-likelihoods between the final model and a reduced model. The reduced model is formed by omitting an effect from the final model. The null hypothesis is that all parameters of that effect are 0.",
                                    "a. This reduced model is equivalent to the final model because omitting the effect does not increase the degrees of freedom.",
                                ],
                            } : null;

                            const monotonicityTable = result?.classificationTable?.observed && result?.classificationTable?.predicted
                                ? (() => {
                                    const observed = result.classificationTable.observed as number[];
                                    const predicted = result.classificationTable.predicted as number[];
                                    const n = observed.length;
                                    if (n === 0) {
                                        return null;
                                    }

                                    const meanObserved = observed.reduce((s, v) => s + v, 0) / n;
                                    const meanPredicted = predicted.reduce((s, v) => s + v, 0) / n;
                                    const covariance = observed.reduce(
                                        (s, v, i) => s + (v - meanObserved) * (predicted[i] - meanPredicted),
                                        0,
                                    );
                                    const varObserved = observed.reduce((s, v) => s + (v - meanObserved) ** 2, 0);
                                    const varPredicted = predicted.reduce((s, v) => s + (v - meanPredicted) ** 2, 0);
                                    const rho = varObserved > 0 && varPredicted > 0
                                        ? covariance / Math.sqrt(varObserved * varPredicted)
                                        : 0;

                                    return {
                                        title: "Monotonicity Measures",
                                        columnHeaders: [
                                            { header: "Measure" },
                                            { header: "Value" },
                                        ],
                                        rows: [
                                            { rowHeader: ["Spearman rho (Observed vs Predicted)"], "Value": rho.toFixed(4) },
                                            { rowHeader: ["N"], "Value": String(n) },
                                        ],
                                    };
                                })()
                                : null;

                            const parameterDisplayNames = usedParamNames.map((name, idx) =>
                                name?.includes("=") ? `[${name}]` : (name ?? `Param ${idx + 1}`)
                            );

                            const matrixColumnKeys = nonReferenceCategories.flatMap((cat) =>
                                parameterDisplayNames.map((paramName) => `${formatCategoryWithLabel(dependentVar, cat)}||${paramName}`)
                            );

                            const matrixColumnGroups = nonReferenceCategories.map((cat) => ({
                                header: formatCategoryWithLabel(dependentVar, cat),
                                children: parameterDisplayNames.map((paramName) => ({
                                    header: paramName,
                                    key: `${formatCategoryWithLabel(dependentVar, cat)}||${paramName}`,
                                })),
                            }));

                            const buildAsymptoticRows = (matrix: number[][]) => {
                                const paramsPerCategory = parameterDisplayNames.length;
                                return matrix.map((row: number[], rowIdx: number) => {
                                    const catIdx = paramsPerCategory > 0 ? Math.floor(rowIdx / paramsPerCategory) : 0;
                                    const paramIdx = paramsPerCategory > 0 ? rowIdx % paramsPerCategory : rowIdx;
                                    return {
                                        rowHeader: [
                                            formatCategoryWithLabel(dependentVar, nonReferenceCategories[catIdx]),
                                            parameterDisplayNames[paramIdx] ?? `Param ${paramIdx + 1}`,
                                        ],
                                        ...matrixColumnKeys.reduce((acc, colKey, colIdx) => {
                                            const val = row[colIdx];
                                            acc[colKey] = Number.isFinite(val) ? val.toFixed(4) : "";
                                            return acc;
                                        }, {} as Record<string, string>),
                                    };
                                });
                            };

                            const asymptoticCovariancesTable = asymptoticCovariance.length > 0 ? {
                                title: "Asymptotic Covariance Matrix<sup>a</sup>",
                                columnHeaders: [
                                    { header: "", key: "row_header_col_1" },
                                    { header: "", key: "row_header_col_2" },
                                    {
                                        header: dependentVar.name,
                                        children: matrixColumnGroups,
                                    },
                                ],
                                rows: buildAsymptoticRows(asymptoticCovariance),
                                footer: [
                                    "a. There is no overdispersion adjustment.",
                                    `b. The reference category is: ${formatCategoryWithLabel(dependentVar, referenceCategoryValue)}.`,
                                ],
                            } : null;

                            const asymptoticCorrelationsTable = asymptoticCorrelation.length > 0 ? {
                                title: "Asymptotic Correlation Matrix",
                                columnHeaders: [
                                    { header: "", key: "row_header_col_1" },
                                    { header: "", key: "row_header_col_2" },
                                    {
                                        header: dependentVar.name,
                                        children: matrixColumnGroups,
                                    },
                                ],
                                rows: buildAsymptoticRows(asymptoticCorrelation),
                                footer: `The reference category is: ${formatCategoryWithLabel(dependentVar, referenceCategoryValue)}.`,
                            } : null;

                            console.log("[Multinomial UI] Creating statistics with tables:", {
                                caseProcessingTable,
                                stepSummaryTable,
                                modelFitting: modelFittingTable,
                                pseudoRSquare: pseudoRSquareTable,
                                cellProbabilitiesTable,
                                parameterEstimates: parameterEstimatesTable,
                                classificationTable,
                                goodnessOfFit: goodnessOfFitTable,
                                likelihoodRatio: likelihoodRatioTable,
                                monotonicityTable,
                                asymptoticCovariancesTable,
                                asymptoticCorrelationsTable,
                            });

                            // DEBUG: Check what will be saved
                            console.log("[Multinomial UI] Statistics to save:", {
                                caseProcessing: options.statistics.caseProcessing,
                                stepSummary: options.statistics.stepSummary,
                                modelFitting: options.statistics.modelFitting,
                                informationCriteria: options.statistics.informationCriteria,
                                pseudoRSquare: options.statistics.pseudoRSquare,
                                cellProbabilities: options.statistics.cellProbabilities,
                                parameterEstimates: options.statistics.parameterEstimates,
                                classificationTable: options.statistics.classificationTable,
                                goodnessOfFit: options.statistics.goodnessOfFit,
                                likelihoodRatioTests: options.statistics.likelihoodRatioTests,
                                monotonicityMeasures: options.statistics.monotonicityMeasures,
                                asymptoticCovariances: options.statistics.asymptoticCovariances,
                                asymptoticCorrelations: options.statistics.asymptoticCorrelations,
                            });

                            console.log("[Multinomial UI] Tables availability:", {
                                hasCellProbabilities: !!cellProbabilitiesTable,
                                hasClassificationTable: !!classificationTable,
                                hasGoodnessOfFit: !!goodnessOfFitTable,
                                hasLikelihoodRatio: !!likelihoodRatioTable,
                                hasMonotonicity: !!monotonicityTable,
                                hasAsymptoticCovariances: !!asymptoticCovariancesTable,
                                hasAsymptoticCorrelations: !!asymptoticCorrelationsTable,
                            });

                            if (options.statistics.caseProcessing) {
                                await addStatistic(analyticId, {
                                    title: "Case Processing Summary",
                                    description: "Valid and missing case summary used in model estimation.",
                                    output_data: JSON.stringify({ tables: [caseProcessingTable] }),
                                    components: "Case Processing Summary",
                                });
                                console.log("[Multinomial UI] Case Processing statistic added");
                            }

                            if (options.statistics.stepSummary) {
                                await addStatistic(analyticId, {
                                    title: "Step Summary",
                                    description: "Convergence and iteration summary.",
                                    output_data: JSON.stringify({ tables: [stepSummaryTable] }),
                                    components: "Step Summary",
                                });
                                console.log("[Multinomial UI] Step Summary statistic added");
                            }

                            const saveMergedModelFitting = options.statistics.modelFitting || options.statistics.informationCriteria;
                            if (saveMergedModelFitting) {
                                await addStatistic(analyticId, {
                                    title: "Model Fitting Information",
                                    description: "Model fitting criteria and likelihood ratio tests.",
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

                            if (options.statistics.cellProbabilities && cellProbabilitiesTable) {
                                await addStatistic(analyticId, {
                                    title: "Cell Probabilities",
                                    description: "Row-wise predicted probabilities by observed category.",
                                    output_data: JSON.stringify({ tables: [cellProbabilitiesTable] }),
                                    components: "Cell Probabilities",
                                });
                                console.log("[Multinomial UI] Cell Probabilities statistic added");
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

                            if (options.statistics.monotonicityMeasures && monotonicityTable) {
                                await addStatistic(analyticId, {
                                    title: "Monotonicity Measures",
                                    description: "Monotonic association between observed and predicted class order.",
                                    output_data: JSON.stringify({ tables: [monotonicityTable] }),
                                    components: "Monotonicity Measures",
                                });
                                console.log("[Multinomial UI] Monotonicity Measures statistic added");
                            }

                            if (options.statistics.asymptoticCovariances && asymptoticCovariancesTable) {
                                await addStatistic(analyticId, {
                                    title: "Asymptotic Covariances",
                                    description: "Asymptotic covariance matrix of the parameter estimates.",
                                    output_data: JSON.stringify({ tables: [asymptoticCovariancesTable] }),
                                    components: "Asymptotic Covariances",
                                });
                                console.log("[Multinomial UI] Asymptotic Covariances statistic added");
                            }

                            if (options.statistics.asymptoticCorrelations && asymptoticCorrelationsTable) {
                                await addStatistic(analyticId, {
                                    title: "Asymptotic Correlations",
                                    description: "Asymptotic correlation matrix of the parameter estimates.",
                                    output_data: JSON.stringify({ tables: [asymptoticCorrelationsTable] }),
                                    components: "Asymptotic Correlations",
                                });
                                console.log("[Multinomial UI] Asymptotic Correlations statistic added");
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
                const detail = err.message
                    ? `${err.message} (${err.filename || "unknown"}:${err.lineno || 0}:${err.colno || 0})`
                    : `${String(err)} (${err.filename || "unknown"}:${err.lineno || 0}:${err.colno || 0})`;
                alert(`Worker Error: ${detail}`);
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
                pseudoRSquare: true,
                stepSummary: true,
                modelFitting: true,
                informationCriteria: true,
                cellProbabilities: true,
                classificationTable: true,
                goodnessOfFit: true,
                monotonicityMeasures: false,
                parameterEstimates: true,
                likelihoodRatioTests: true,
                asymptoticCorrelations: false,
                asymptoticCovariances: false,
                confidenceInterval: 95,
                subpopulationMode: "factors",
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