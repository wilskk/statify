import { useState } from "react";
import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";
import { ChartService } from "@/services/chart/ChartService";
import { useResultStore } from "@/stores/useResultStore";

export const useAnalyzeHook = (
    dependentVariable: Variable[],
    independentVariable: Variable[],
    data: DataRow[],
    selectedPeriod: any,
    maxLagADF: number,
    maxLagECM: number,
    onClose: () => void
) => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const handleAnalyzes = async () => {
        if (dependentVariable.length === 0 || independentVariable.length === 0) {
            setErrorMsg("Please select both dependent and independent variables");
            return;
        }

        setIsCalculating(true);
        setErrorMsg(null);

        try {

            // Extract Y (dependent) data
            const yVar = dependentVariable[0];
            const yData: number[] = [];
            for (const row of data) {
                const value = row[yVar.columnIndex];
                if (value !== null && value !== undefined && !isNaN(Number(value))) {
                    yData.push(Number(value));
                }
            }

            // Extract X (independent) data
            const xVar = independentVariable[0];
            const xData: number[] = [];
            for (const row of data) {
                const value = row[xVar.columnIndex];
                if (value !== null && value !== undefined && !isNaN(Number(value))) {
                    xData.push(Number(value));
                }
            }

            if (yData.length < 10 || xData.length < 10) {
                throw new Error("Insufficient data points (minimum 10 required)");
            }

            if (yData.length !== xData.length) {
                throw new Error("Y and X must have the same number of observations");
            }

            console.log(`Running ECM with ${yData.length} observations`);
            
            // Use Web Worker
            const worker = new Worker("/workers/TimeSeries/worker.js", { type: "module" });
            
            worker.onmessage = async (e) => {
                const { status, result, error } = e.data;
                
                if (status === "success") {
                    console.log("ECM Results:", result);
                    
                    const isCointegrated = result.cointegration.isCointegrated;
                    
                    toast.success("ECM estimation completed!");
                    
                    try {
                        const tables = [];
                        
                        // Cointegration Test Table
                        tables.push({
                            title: "Cointegration Test (ADF)",
                            columnHeaders: [
                                { header: "Statistic", key: "col" },
                                { header: "Value", key: "val" }
                            ],
                            rows: [
                                { col: "ADF Statistic", val: result.cointegration.adfStat },
                                { col: "Result", val: isCointegrated ? "Cointegrated" : "Not Cointegrated" }
                            ]
                        });

                        // Long Run Table
                        tables.push({
                            title: "Long Run Relationship (Y = β₀ + β₁X)",
                            columnHeaders: [
                                { header: "Parameter", key: "param" },
                                { header: "Coefficient", key: "val" }
                            ],
                            rows: [
                                { param: "Intercept (β₀)", val: result.longRun.beta0 },
                                { param: "Slope (β₁)", val: result.longRun.beta1 }
                            ]
                        });

                        const charts = [];
                        
                         // Prepare chart data (Residuals)
                        if (result.longRun && result.longRun.residuals) {
                            const resData = result.longRun.residuals.map((val: number, i: number) => ({
                                index: i + 1,
                                residual: val
                            }));

                            const residualsChart = ChartService.createChartJSON({
                                chartType: "Line Chart",
                                chartData: resData,
                                chartVariables: { x: ["index"], y: ["residual"] },
                                chartMetadata: { title: "Equilibrium Error (Residuals)", subtitle: "Long Run" },
                                chartConfig: { axisLabels: { x: "Time", y: "Residual" } }
                            });
                            charts.push(residualsChart);
                        }

                        // Dispatch
                        const logMsg = `ECM: ${yVar.name} vs ${xVar.name}`;
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "ECM Analysis", note: "Error Correction Model" });

                        await addStatistic(analyticId, {
                            title: "ECM Output",
                            output_data: JSON.stringify({ tables, charts }),
                            components: "EcmAnalysis",
                            description: "Cointegration and Error Correction results"
                        });
                        
                        setTimeout(() => {
                            onClose();
                            worker.terminate();
                        }, 1500);

                    } catch (err) {
                        console.error("Processing Error", err);
                        setErrorMsg("Failed to process results.");
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
                type: "ECM",
                payload: {
                    y: yData,
                    x: xData,
                    max_lag_adf: maxLagADF,
                    max_lag_ecm: maxLagECM
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMsg(errorMessage);
            toast.error(`ECM Estimation Failed: ${errorMessage}`);
            console.error("ECM estimation error:", error);
            setIsCalculating(false);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
};
