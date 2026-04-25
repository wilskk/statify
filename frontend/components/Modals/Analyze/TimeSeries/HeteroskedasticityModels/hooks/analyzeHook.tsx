
import { useState } from "react";
import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";
import { ChartService } from "@/services/chart/ChartService";
import { useResultStore } from "@/stores/useResultStore";

export const useAnalyzeHook = (
    selectedVariables: Variable[],
    data: DataRow[],
    selectedPeriod: any,
    pOrder: number,
    qOrder: number,
    modelType: string, // "GARCH", "EGARCH", "TGARCH", "ARCH"
    onClose: () => void
) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleAnalyzes = async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable");
            return;
        }

        setIsCalculating(true);
        setErrorMsg(null);

        try {
            // Extract data for selected variable
            const variable = selectedVariables[0];
            const returns: number[] = [];

            for (const row of data) {
                const value = row[variable.columnIndex];
                if (value !== null && value !== undefined && !isNaN(Number(value))) {
                    returns.push(Number(value));
                }
            }

            if (returns.length < 10) {
                throw new Error("Insufficient data points (minimum 10 required)");
            }

            console.log(`Running ${modelType}(${pOrder},${qOrder}) with ${returns.length} observations`);

            // Use Web Worker
            const worker = new Worker("/workers/TimeSeries/worker.js", { type: "module" });

            worker.onmessage = async (e) => {
                const { status, result, error } = e.data;
                
                if (status === "success") {
                    console.log(`${modelType} Results:`, result);
                    
                    toast.success(`${modelType} estimation completed!`);
                    
                    try {
                        // 1. Prepare Tables
                        const tables = [];
                        
                        // Parameter Table
                        if (result.coefficients) {
                            const rows = [];
                            
                            // Omega
                            if (result.coefficients.omega !== undefined) {
                                rows.push({
                                    rowHeader: ["Omega (ω)"],
                                    coefficient: result.coefficients.omega,
                                    stdError: "-", 
                                    tStat: "-",
                                    pValue: "-" 
                                });
                            }

                            // Alpha terms
                            if (Array.isArray(result.coefficients.alpha)) {
                                result.coefficients.alpha.forEach((val: any, idx: number) => {
                                    rows.push({
                                        rowHeader: [`Alpha (${idx + 1})`],
                                        coefficient: val,
                                        stdError: "-",
                                        tStat: "-",
                                        pValue: "-"
                                    });
                                });
                            }

                            // Beta terms (not for ARCH)
                            if (Array.isArray(result.coefficients.beta)) {
                                result.coefficients.beta.forEach((val: any, idx: number) => {
                                    rows.push({
                                        rowHeader: [`Beta (${idx + 1})`],
                                        coefficient: val,
                                        stdError: "-",
                                        tStat: "-",
                                        pValue: "-"
                                    });
                                });
                            }

                            tables.push({
                                title: "Variance Equation",
                                columnHeaders: [
                                    { header: "Parameter", key: "rowHeader" },
                                    { header: "Coefficient", key: "coefficient" },
                                    { header: "Std. Error", key: "stdError" },
                                    { header: "t-Statistic", key: "tStat" },
                                    { header: "Prob.", key: "pValue" }
                                ],
                                rows: rows,
                            });
                        }

                        // Diagnostics Table
                        if (result.diagnostics) {
                             tables.push({
                                title: "Diagnostics",
                                columnHeaders: [
                                    { header: "Statistic", key: "rowHeader" },
                                    { header: "Value", key: "value" }
                                ],
                                rows: [
                                    { rowHeader: ["AIC"], value: result.diagnostics.aic },
                                    { rowHeader: ["BIC"], value: result.diagnostics.bic },
                                    { rowHeader: ["Log Likelihood"], value: result.diagnostics.logLikelihood }
                                ]
                            });
                        }

                        // 2. Prepare Charts
                        const charts = [];
                        const varianceData: number[] = result.variance || [];
                        const residualsData: number[] = result.residuals || [];

                        if (varianceData.length > 0) {
                            const varianceChartData = varianceData.map((v, i) => ({
                                category: String(i + 1),
                                value: v
                            }));
                            const varianceChart = ChartService.createChartJSON({
                                chartType: "Line Chart",
                                chartData: varianceChartData,
                                chartMetadata: {
                                    title: "Conditional Variance",
                                    subtitle: `${modelType} Process`
                                },
                                chartConfig: {
                                    axisLabels: { x: "Time", y: "Variance" }
                                }
                            });
                            charts.push(varianceChart);
                        }

                        if (residualsData.length > 0) {
                            const residualsChartData = residualsData.map((r, i) => ({
                                category: String(i + 1),
                                value: r
                            }));
                            const residualsChart = ChartService.createChartJSON({
                                chartType: "Line Chart",
                                chartData: residualsChartData,
                                chartMetadata: {
                                    title: "Residuals",
                                    subtitle: `${modelType} Process`
                                },
                                chartConfig: {
                                    axisLabels: { x: "Time", y: "Residual" }
                                }
                            });
                            charts.push(residualsChart);
                        }

                        // 3. Dispatch Results directly to Output Output
                        const logMsg = `${modelType} Estimation on ${variable.name}`;
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: `${modelType} Results`, note: `p=${pOrder}, q=${qOrder}` });

                        await addStatistic(analyticId, {
                            title: `${modelType} Estimation Output`,
                            output_data: JSON.stringify({ tables, charts }),
                            components: "GarchAnalysis", // Reuse GarchAnalysis as the display structure is identical
                            description: `Estimation results for ${modelType} model`
                        });

                        // Close modal on success
                        onClose();

                    } catch (err) {
                        console.error("Error processing results:", err);
                        setErrorMsg("Error processing results for display.");
                    } finally {
                         worker.terminate();
                         setIsCalculating(false);
                    }

                } else {
                    setErrorMsg(error || "Unknown worker error");
                    toast.error(`Estimation Failed: ${error}`);
                    worker.terminate();
                    setIsCalculating(false);
                }
            };

            worker.onerror = (err) => {
                console.error("Worker connection error:", err);
                setErrorMsg("Failed to connect to worker");
                setIsCalculating(false);
                worker.terminate();
            };

            // Send payload to worker
            worker.postMessage({
                type: modelType, 
                payload: {
                    data: returns,
                    p: pOrder,
                    q: qOrder
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMsg(errorMessage);
            toast.error(`Analysis Failed: ${errorMessage}`);
            console.error("Analysis error:", error);
            setIsCalculating(false);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
};
