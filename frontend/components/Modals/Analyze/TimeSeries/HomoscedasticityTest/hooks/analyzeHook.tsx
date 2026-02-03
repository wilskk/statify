
import { useState } from "react";
import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";
import { useResultStore } from "@/stores/useResultStore";

export const useAnalyzeHook = (
    selectedVariables: Variable[],
    data: DataRow[],
    lags: number,
    onClose: () => void
) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleAnalyze = async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select a residual variable");
            return;
        }

        setIsCalculating(true);
        setErrorMsg(null);

        try {
            // Extract data for selected variable
            const variable = selectedVariables[0];
            const residuals: number[] = [];

            for (const row of data) {
                const value = row[variable.columnIndex];
                if (value !== null && value !== undefined && !isNaN(Number(value))) {
                    residuals.push(Number(value));
                }
            }

            if (residuals.length < 10) {
                throw new Error("Insufficient data points (minimum 10 required)");
            }

            console.log(`Running ARCH-LM Test with ${residuals.length} residuals and ${lags} lags`);

            // Use Web Worker
            const worker = new Worker("/workers/TimeSeries/worker.js", { type: "module" });

            worker.onmessage = async (e) => {
                const { status, result, error } = e.data;
                
                if (status === "success") {
                    console.log(`ARCH-LM Results:`, result);
                    
                    toast.success(`ARCH-LM Test completed!`);
                    
                    try {
                        // Prepare Visualization Data (Squared Residuals Scatter/Correlogram placeholder)
                        // Note: Correlogram logic would go here if we calculated ACF of e^2
                        
                        // Dispatch Results
                        const logMsg = `Homoscedasticity Test (ARCH-LM) on ${variable.name}`;
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: `ARCH-LM Test`, note: `Lags=${lags}` });

                        // Add statistic output
                        // We reuse the existing HomoscedasticityTest component
                        // It expects a JSON string with specific structure
                        const outputData = {
                            title: "Homoscedasticity Test (ARCH-LM)",
                            description: `Test for ARCH effects in ${variable.name} (Lags: ${lags})`,
                            isHomoscedastic: result.isHomoscedastic,
                            tests: {
                                archLM: {
                                    testName: "ARCH-LM Test",
                                    statistic: parseFloat(result.statistic),
                                    pValue: parseFloat(result.pValue),
                                    isHomoscedastic: result.isHomoscedastic,
                                    df: lags
                                }
                            },
                            residualStats: {
                                count: residuals.length,
                                mean: residuals.reduce((a,b)=>a+b,0)/residuals.length,
                                stdDev: Math.sqrt(residuals.map(x=>x*x).reduce((a,b)=>a+b,0)/residuals.length - (residuals.reduce((a,b)=>a+b,0)/residuals.length)**2),
                                min: Math.min(...residuals),
                                max: Math.max(...residuals)
                            }
                        };

                        await addStatistic(analyticId, {
                            title: `ARCH-LM Test Output`,
                            output_data: JSON.stringify(outputData),
                            components: "HomoscedasticityTest", // Maps to component in Output/Statistics/index.tsx
                            description: `Result of ARCH-LM Test`
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
                    toast.error(`Test Failed: ${error}`);
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
                type: "ARCH_LM", 
                payload: {
                    residuals: residuals,
                    lags: lags
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
        handleAnalyze,
    };
};
