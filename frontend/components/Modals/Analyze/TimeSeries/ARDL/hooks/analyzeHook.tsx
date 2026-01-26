import { useState } from "react";
import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";
import { ChartService } from "@/services/chart/ChartService";
import { useResultStore } from "@/stores/useResultStore";

export const useAnalyzeHook = (
    dependentVariable: Variable[],
    independentVariables: Variable[],
    data: DataRow[],
    selectedPeriod: any,
    pOrder: number,
    qOrders: number[],
    onClose: () => void
) => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const handleAnalyzes = async () => {
        if (dependentVariable.length === 0 || independentVariables.length === 0) {
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

            // Extract X (independent) data for each variable
            const xDataArrays: number[][] = [];
            for (const xVar of independentVariables) {
                const xDataSingle: number[] = [];
                for (const row of data) {
                    const value = row[xVar.columnIndex];
                    if (value !== null && value !== undefined && !isNaN(Number(value))) {
                        xDataSingle.push(Number(value));
                    }
                }
                xDataArrays.push(xDataSingle);
            }

            // Validate data
            const nObs = yData.length;
            if (nObs < 10) {
                throw new Error("Insufficient data points (minimum 10 required)");
            }

            for (let i = 0; i < xDataArrays.length; i++) {
                if (xDataArrays[i].length !== nObs) {
                    throw new Error(`Variable ${independentVariables[i].name} has different length than Y`);
                }
            }

            // Flatten X data
            const xFlat: number[] = [];
            for (const xArray of xDataArrays) {
                xFlat.push(...xArray);
            }

            console.log(`Running ARDL(${pOrder}, [${qOrders.join(', ')}]) with ${nObs} observations`);
            
            // Ensure qOrders matches number of X variables
            const qOrdersArray = qOrders.length === independentVariables.length 
                ? qOrders 
                : Array(independentVariables.length).fill(qOrders[0] || 1);
            
            // Use Web Worker
            const worker = new Worker("/workers/TimeSeries/worker.js", { type: "module" });
            
            worker.onmessage = async (e) => {
                const { status, result, error } = e.data;
                
                if (status === "success") {
                    console.log("ARDL Results:", result);
                    
                    toast.success("ARDL estimation completed!");
                    
                    try {
                        const tables = [];
                        
                        // Bounds Test Table
                        if (result.boundsF) {
                            tables.push({
                                title: "Bounds Test F-Statistic (Pesaran et al.)",
                                columnHeaders: [
                                    { header: "Test Statistic", key: "stat" },
                                    { header: "Value", key: "val" }
                                ],
                                rows: [
                                    { stat: "F-Statistic", val: result.boundsF },
                                    { stat: "Conclusion", val: parseFloat(result.boundsF) > 4.0 ? "Evidence of Cointegration" : "Inconclusive/No Cointegration" },
                                    { stat: "R-Squared", val: result.rSquared }
                                ]
                            });
                        }

                        // Long Run Coefficients
                        // result.longRun is an array of coefficients corresponding to X variables
                        if (result.longRun && Array.isArray(result.longRun)) {
                            const rows = result.longRun.map((val: string, index: number) => ({
                                param: independentVariables[index]?.name || `Var ${index + 1}`,
                                val: val
                            }));
                            
                            tables.push({
                                title: "Long Run Coefficients",
                                columnHeaders: [
                                     { header: "Variable", key: "param" },
                                     { header: "Coefficient", key: "val" }
                                ],
                                rows: rows
                            });
                        }

                        const charts = [];
                        
                        // Residuals Chart
                        if (result.residuals) {
                            const resData = result.residuals.map((val: number, i: number) => ({
                                index: i + 1,
                                residual: val
                            }));

                            const residualsChart = ChartService.createChartJSON({
                                chartType: "Line Chart",
                                chartData: resData,
                                chartVariables: { x: ["index"], y: ["residual"] },
                                chartMetadata: { title: "Residuals Plot", subtitle: "ARDL Model" },
                                chartConfig: { axisLabels: { x: "Time", y: "Residual" } }
                            });
                            charts.push(residualsChart);
                        }

                         // Dispatch
                        const logMsg = `ARDL: ${yVar.name} vs X Variables`;
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "ARDL Analysis", note: `p=${pOrder}, q=[${qOrdersArray}]` });

                        await addStatistic(analyticId, {
                            title: "ARDL Output",
                            output_data: JSON.stringify({ tables, charts }),
                            components: "ArdlAnalysis",
                            description: "Auto-Regressive Distributed Lag results"
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
                type: "ARDL",
                payload: {
                    y: yData,
                    x: xFlat,
                    n_vars: independentVariables.length,
                    p: pOrder,
                    q: qOrdersArray
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMsg(errorMessage);
            toast.error(`ARDL Estimation Failed: ${errorMessage}`);
            console.error("ARDL estimation error:", error);
            setIsCalculating(false);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
};
