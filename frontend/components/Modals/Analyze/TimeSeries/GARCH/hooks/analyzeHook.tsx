import { useState } from "react";
import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";

// Import WASM module
let wasmModule: any = null;
let GARCH: any = null;

const initWasm = async () => {
    if (!wasmModule) {
        try {
            const module = await import("@/public/workers/TimeSeries/timeseries.js");
            await module.default(); // Initialize WASM
            GARCH = module.GARCH;
            wasmModule = module;
            console.log("GARCH WASM module loaded successfully");
        } catch (error) {
            console.error("Failed to load GARCH WASM module:", error);
            throw new Error("Failed to initialize GARCH module");
        }
    }
};

export const useAnalyzeHook = (
    selectedVariables: Variable[],
    data: DataRow[],
    selectedPeriod: any,
    pOrder: number,
    qOrder: number,
    modelType: string,
    onClose: () => void
) => {
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
            // Initialize WASM if not already done
            await initWasm();

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

            // Create GARCH model
            const garch = new GARCH(new Float64Array(returns), pOrder, qOrder);

            //  Estimate model
            garch.estimate();

            // Get results
            const variance = garch.get_variance();
            const aic = garch.get_aic();
            const bic = garch.get_bic();
            const logLikelihood = garch.get_log_likelihood();

            // Display results
            const results = {
                model: `${modelType}(${pOrder},${qOrder})`,
                observations: returns.length,
                logLikelihood: logLikelihood.toFixed(4),
                aic: aic.toFixed(4),
                bic: bic.toFixed(4),
                variance: variance.slice(0, 10).map((v: number) => v.toFixed(6)),
            };

            console.log("GARCH Results:", results);

            toast.success(`${modelType} estimation completed!`, {
                description: `AIC: ${aic.toFixed(2)}, BIC: ${bic.toFixed(2)}`,
            });

            // TODO: Store results in state/store for display in results tab
            // For now, just showing toast

            // Free memory
            garch.free();

            // Close modal after successful calculation
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMsg(errorMessage);
            toast.error(`GARCH Estimation Failed: ${errorMessage}`);
            console.error("GARCH estimation error:", error);
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
