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
    qOrder: number,
    onClose: () => void
) => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const handleAnalyzes = async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable");
            return;
        }

        setIsCalculating(true);
        setErrorMsg(null);

        try {

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

            console.log(`Running ARCH(${qOrder}) with ${returns.length} observations`);
            
            // Use Web Worker
            const worker = new Worker("/workers/TimeSeries/worker.js", { type: "module" });
            
            worker.onmessage = async (e) => {
                const { status, result, error } = e.data;
                
                if (status === "success") {
                    console.log("ARCH Results:", result);
                    
                    toast.success(`ARCH(${qOrder}) estimation completed!`);
                    
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
                        const varianceData = result.variance || [];
                        const periods = Array.from({ length: varianceData.length }, (_, i) => ({
                            index: i + 1,
                            variance: varianceData[i],
                            residual: result.residuals ? result.residuals[i] : 0
                        }));

                        // Conditional Variance Chart
                        const varianceChart = ChartService.createChartJSON({
                            chartType: "Line Chart",
                            chartData: periods,
                            chartVariables: {
                                x: ["index"],
                                y: ["variance"]
                            },
                            chartMetadata: {
                                title: "Conditional Variance",
                                subtitle: `ARCH(${qOrder}) Process`
                            },
                            chartConfig: {
                                axisLabels: { x: "Time", y: "Variance" }
                            }
                        });
                        charts.push(varianceChart);

                         // Residuals Chart
                        const residualsChart = ChartService.createChartJSON({
                            chartType: "Line Chart",
                            chartData: periods,
                            chartVariables: {
                                x: ["index"],
                                y: ["residual"]
                            },
                            chartMetadata: {
                                title: "Residuals",
                                subtitle: `ARCH(${qOrder}) Process`
                            },
                            chartConfig: {
                                axisLabels: { x: "Time", y: "Residual" }
                            }
                        });
                        charts.push(residualsChart);

                        // 3. Dispatch Results directly to Output Output
                        const logMsg = `ARCH(${qOrder}) Estimation on ${variable.name}`;
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: `ARCH Results`, note: `q=${qOrder}` });

                        await addStatistic(analyticId, {
                            title: `ARCH Estimation Output`,
                            output_data: JSON.stringify({ tables, charts }),
                            components: "GarchAnalysis",
                            description: `Estimation results for ARCH model`
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
            
            worker.postMessage({
                type: "ARCH",
                payload: {
                    data: returns,
                    p: 0,
                    q: qOrder
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMsg(errorMessage);
            toast.error(`ARCH Estimation Failed: ${errorMessage}`);
            console.error("ARCH estimation error:", error);
            setIsCalculating(false);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
};
