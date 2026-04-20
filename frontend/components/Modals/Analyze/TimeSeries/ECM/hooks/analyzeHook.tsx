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

            // Extract Y and X data, ensuring no missing values in any row
            const yVar = dependentVariable[0];
            const yData: number[] = [];
            const xData: number[] = [];
            const n_vars = independentVariable.length;

            for (const row of data) {
                const yValue = row[yVar.columnIndex];
                if (yValue === null || yValue === undefined || isNaN(Number(yValue))) {
                    continue; // Skip rows with missing Y
                }

                let xRowValid = true;
                const xRowValues = [];
                for (const xVar of independentVariable) {
                    const xValue = row[xVar.columnIndex];
                    if (xValue === null || xValue === undefined || isNaN(Number(xValue))) {
                        xRowValid = false;
                        break;
                    }
                    xRowValues.push(Number(xValue));
                }

                if (xRowValid) {
                    yData.push(Number(yValue));
                    xData.push(...xRowValues);
                }
            }

            if (yData.length < 10) {
                throw new Error("Insufficient data points (minimum 10 required)");
            }

            // Use Web Worker
            const worker = new Worker("/workers/TimeSeries/worker.js", { type: "module" });

            worker.postMessage({
                type: "ECM",
                payload: {
                    y: yData,
                    x: xData,
                    n_vars: n_vars,
                    max_lag_adf: maxLagADF,
                    max_lag_ecm: maxLagECM
                }
            });
            
            worker.onmessage = async (e: any) => {
                const { status, result, error } = e.data;
                
                if (status === "success") {
                    console.log("ECM Results:", result);
                    
                    const isCointegrated = result.cointegration.isCointegrated;
                    toast.success("ECM estimation completed!");
                    
                    try {
                        const tables = [];
                        
                        // 1. Long Run Table
                        const longRunRows = [];
                        longRunRows.push({
                            var: "C (Intercept)",
                            coef: result.longRun.coefficients[0],
                            se: result.longRun.stdErrors[0],
                            tstat: result.longRun.tStats[0],
                            prob: result.longRun.pValues[0]
                        });
                        for (let i = 0; i < independentVariable.length; i++) {
                            longRunRows.push({
                                var: independentVariable[i].name,
                                coef: result.longRun.coefficients[i + 1],
                                se: result.longRun.stdErrors[i + 1],
                                tstat: result.longRun.tStats[i + 1],
                                prob: result.longRun.pValues[i + 1]
                            });
                        }

                        tables.push({
                            title: `Long Run Regression: ${yVar.name} ~ C + ${independentVariable.map(v => v.name).join(" + ")}`,
                            columnHeaders: [
                                { header: "Variable", key: "var" },
                                { header: "Coefficient", key: "coef" },
                                { header: "Std. Error", key: "se" },
                                { header: "t-Statistic", key: "tstat" },
                                { header: "Prob.", key: "prob" }
                            ],
                            rows: longRunRows,
                            footer: `R-squared: ${result.longRun.rSquared} | Adjusted R-squared: ${result.longRun.adjRSquared} | F-statistic: ${result.longRun.fStat}`
                        });

                        // 2. Cointegration Test Table
                        tables.push({
                            title: "Cointegration Test (ADF on Residuals)",
                            columnHeaders: [
                                { header: "Statistic", key: "col" },
                                { header: "Value", key: "val" }
                            ],
                            rows: [
                                { col: "ADF Statistic", val: result.cointegration.adfStat },
                                { col: "p-value", val: result.cointegration.pValue },
                                { col: "Result", val: isCointegrated ? "Cointegrated" : "Not Cointegrated" }
                            ]
                        });
                        
                        // 3. Short Run ECM Table
                        const ecmRows = [];
                        ecmRows.push({
                            var: "C (Intercept)",
                            coef: result.ecm.coefficients[0],
                            se: result.ecm.stdErrors[0],
                            tstat: result.ecm.tStats[0],
                            prob: result.ecm.pValues[0]
                        });
                        ecmRows.push({
                            var: "ECT(-1)",
                            coef: result.ecm.coefficients[1],
                            se: result.ecm.stdErrors[1],
                            tstat: result.ecm.tStats[1],
                            prob: result.ecm.pValues[1]
                        });
                        for (let i = 0; i < independentVariable.length; i++) {
                            ecmRows.push({
                                var: `D(${independentVariable[i].name})`,
                                coef: result.ecm.coefficients[i + 2],
                                se: result.ecm.stdErrors[i + 2],
                                tstat: result.ecm.tStats[i + 2],
                                prob: result.ecm.pValues[i + 2]
                            });
                        }

                        tables.push({
                            title: `Short Run (ECM): D(${yVar.name}) ~ C + ECT(-1) + ${independentVariable.map(v => "D(" + v.name + ")").join(" + ")}`,
                            columnHeaders: [
                                { header: "Variable", key: "var" },
                                { header: "Coefficient", key: "coef" },
                                { header: "Std. Error", key: "se" },
                                { header: "t-Statistic", key: "tstat" },
                                { header: "Prob.", key: "prob" }
                            ],
                            rows: ecmRows,
                            footer: `R-squared: ${result.ecm.rSquared} | Adjusted R-squared: ${result.ecm.adjRSquared} | F-statistic: ${result.ecm.fStat}`
                        });

                        // 4. Classical Assumptions Table
                        tables.push({
                            title: "Classical Assumptions (Residual Diagnostics)",
                            columnHeaders: [
                                { header: "Test", key: "test" },
                                { header: "Statistic", key: "stat" },
                                { header: "Prob.", key: "prob" },
                                { header: "Interpretation", key: "interp" }
                            ],
                            rows: [
                                { 
                                    test: "Normality (Jarque-Bera)", 
                                    stat: result.diagnostics.jarqueBera.stat, 
                                    prob: result.diagnostics.jarqueBera.prob,
                                    interp: parseFloat(result.diagnostics.jarqueBera.prob) > 0.05 ? "Normal" : "Not Normal"
                                },
                                { 
                                    test: "Autocorrelation (Breusch-Godfrey LM)", 
                                    stat: result.diagnostics.breuschGodfrey.stat, 
                                    prob: result.diagnostics.breuschGodfrey.prob,
                                    interp: parseFloat(result.diagnostics.breuschGodfrey.prob) > 0.05 ? "No Autocorrelation" : "Autocorrelation Present"
                                },
                                { 
                                    test: "Heteroskedasticity (Breusch-Pagan)", 
                                    stat: result.diagnostics.breuschPagan.stat, 
                                    prob: result.diagnostics.breuschPagan.prob,
                                    interp: parseFloat(result.diagnostics.breuschPagan.prob) > 0.05 ? "Homoskedastic" : "Heteroskedastic"
                                }
                            ]
                        });

                        // 5. Interpretations Summary
                        const ectCoef = parseFloat(result.ecm.coefficients[1]);
                        const ectProb = parseFloat(result.ecm.pValues[1]);
                        
                        let ecmInterpretation = "";
                        if (ectCoef < 0 && ectProb < 0.05) {
                            ecmInterpretation = `ECM is valid. The Error Correction Term (ECT) is negative and significant (p = ${ectProb.toFixed(4)}), indicating adjustment towards long-run equilibrium at a speed of ${Math.abs(ectCoef * 100).toFixed(2)}% per period.`;
                        } else if (ectCoef >= 0) {
                            ecmInterpretation = `ECM might not be valid. ECT is positive (Coef = ${ectCoef.toFixed(4)}). A valid ECM requires a negative ECT to pull the system back to equilibrium.`;
                        } else {
                            ecmInterpretation = `ECM is not statistically significant because ECT is negative but has a p-value > 0.05 (p = ${ectProb.toFixed(4)}).`;
                        }

                        tables.push({
                            title: "Model Interpretation",
                            columnHeaders: [
                                { header: "Component", key: "col" },
                                { header: "Description", key: "val" }
                            ],
                            rows: [
                                { col: "Cointegration", val: isCointegrated ? "Variables are cointegrated (Long-run relationship exists)." : "Variables are NOT cointegrated." },
                                { col: "Short-Run ECM", val: ecmInterpretation }
                            ]
                        });

                        const charts = [];

                        if (result.longRun?.residuals?.length > 0) {
                            const resData = result.longRun.residuals.map((val: number, i: number) => ({
                                category: String(i + 1),
                                value: val
                            }));
                            const residualsChart = ChartService.createChartJSON({
                                chartType: "Line Chart",
                                chartData: resData,
                                chartMetadata: { title: "Equilibrium Error (Residuals)", subtitle: "Long Run" },
                                chartConfig: { axisLabels: { x: "Time", y: "Residual" } }
                            });
                            charts.push(residualsChart);
                        }

                        if (result.ecm?.residuals?.length > 0) {
                            const ecmResData = result.ecm.residuals.map((val: number, i: number) => ({
                                category: String(i + 1),
                                value: val
                            }));
                            const ecmResidualsChart = ChartService.createChartJSON({
                                chartType: "Line Chart",
                                chartData: ecmResData,
                                chartMetadata: { title: "ECM Residuals", subtitle: "Short Run" },
                                chartConfig: { axisLabels: { x: "Time", y: "Residual" } }
                            });
                            charts.push(ecmResidualsChart);
                        }

                        // Dispatch
                        const logMsg = `ECM: ${yVar.name} vs ${independentVariable.map(v => v.name).join(", ")}`;
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
            
            worker.onerror = (err: any) => {
                console.error("Worker connection error:", err);
                setErrorMsg("Failed to connect to worker");
                setIsCalculating(false);
                worker.terminate();
            };

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
