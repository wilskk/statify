import { useState } from "react";
import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";

let wasmModule: any = null;
let GARCH: any = null;

const initWasm = async () => {
    if (!wasmModule) {
        try {
            const module = await import("@/public/workers/TimeSeries/timeseries.js");
            await module.default();
            GARCH = module.GARCH;
            wasmModule = module;
            console.log("ARCH WASM module loaded successfully");
        } catch (error) {
            console.error("Failed to load ARCH WASM module:", error);
            throw new Error("Failed to initialize ARCH module");
        }
    }
};

export const useAnalyzeHook = (
    selectedVariables: Variable[],
    data: DataRow[],
    selectedPeriod: any,
    qOrder: number,
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
            await initWasm();

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

            // ARCH is GARCH with p=0
            const garch = new GARCH(new Float64Array(returns), 0, qOrder);
            garch.estimate();

            const variance = garch.get_variance();
            const aic = garch.get_aic();
            const bic = garch.get_bic();
            const logLikelihood = garch.get_log_likelihood();

            console.log("ARCH Results:", {
                model: `ARCH(${qOrder})`,
                observations: returns.length,
                logLikelihood: logLikelihood.toFixed(4),
                aic: aic.toFixed(4),
                bic: bic.toFixed(4),
            });

            toast.success(`ARCH(${qOrder}) estimation completed!`, {
                description: `AIC: ${aic.toFixed(2)}, BIC: ${bic.toFixed(2)}`,
            });

            garch.free();

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMsg(errorMessage);
            toast.error(`ARCH Estimation Failed: ${errorMessage}`);
            console.error("ARCH estimation error:", error);
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
