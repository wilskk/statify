import { useState } from "react";
import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";

let wasmModule: any = null;
let ECM: any = null;

const initWasm = async () => {
    if (!wasmModule) {
        try {
            const module = await import("@/public/workers/TimeSeries/timeseries.js");
            await module.default();
            ECM = module.ECM;
            wasmModule = module;
            console.log("ECM WASM module loaded successfully");
        } catch (error) {
            console.error("Failed to load ECM WASM module:", error);
            throw new Error("Failed to initialize ECM module");
        }
    }
};

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

    const handleAnalyzes = async () => {
        if (dependentVariable.length === 0 || independentVariable.length === 0) {
            setErrorMsg("Please select both dependent and independent variables");
            return;
        }

        setIsCalculating(true);
        setErrorMsg(null);

        try {
            await initWasm();

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
            console.log(`Max lag ADF: ${maxLagADF}, Max lag ECM: ${maxLagECM}`);

            // Create ECM model
            const ecm = new ECM(
                new Float64Array(yData), 
                new Float64Array(xData),
                maxLagADF,
                maxLagECM
            );

            // Estimate ECM
            ecm.estimate_ecm();

            // Get results
            const beta0 = ecm.get_long_run_beta0();
            const beta1 = ecm.get_long_run_beta1();
            const adfStat = ecm.get_adf_statistic();
            const isCointegrated = ecm.get_is_cointegrated();

            const results = {
                longRunBeta0: beta0.toFixed(4),
                longRunBeta1: beta1.toFixed(4),
                adfStatistic: adfStat.toFixed(4),
                isCointegrated,
                observations: yData.length,
            };

            console.log("ECM Results:", results);

            const message = isCointegrated 
                ? `Cointegration detected! β₀=${beta0.toFixed(2)}, β₁=${beta1.toFixed(2)}`
                : `No cointegration found (ADF=${adfStat.toFixed(2)})`;

            toast.success("ECM estimation completed!", {
                description: message,
            });

            // Free memory
            ecm.free();

            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMsg(errorMessage);
            toast.error(`ECM Estimation Failed: ${errorMessage}`);
            console.error("ECM estimation error:", error);
        } finally {
            setIsCalculating(false);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
};
