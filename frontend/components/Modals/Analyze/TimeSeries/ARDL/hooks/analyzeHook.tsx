import { useState } from "react";
import type { Variable } from "@/types/Variable";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";

let wasmModule: any = null;
let ARDL: any = null;

const initWasm = async () => {
    if (!wasmModule) {
        try {
            const module = await import("@/public/workers/TimeSeries/timeseries.js");
            await module.default();
            ARDL = module.ARDL;
            wasmModule = module;
            console.log("ARDL WASM module loaded successfully");
        } catch (error) {
            console.error("Failed to load ARDL WASM module:", error);
            throw new Error("Failed to initialize ARDL module");
        }
    }
};

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

    const handleAnalyzes = async () => {
        if (dependentVariable.length === 0 || independentVariables.length === 0) {
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

            // Flatten X data: [x1[0], x1[1], ..., x2[0], x2[1], ...]
            const xFlat: number[] = [];
            for (const xArray of xDataArrays) {
                xFlat.push(...xArray);
            }

            console.log(`Running ARDL(${pOrder}, [${qOrders.join(', ')}]) with ${nObs} observations`);
            console.log(`Number of X variables: ${independentVariables.length}`);
            console.log(`Flattened X length: ${xFlat.length} (should be ${independentVariables.length * nObs})`);

            // Ensure qOrders matches number of X variables
            const qOrdersArray = qOrders.length === independentVariables.length 
                ? qOrders 
                : Array(independentVariables.length).fill(qOrders[0] || 1);

            // Create ARDL model
            const ardl = new ARDL(
                new Float64Array(yData),
                new Float64Array(xFlat),
                independentVariables.length, // n_vars
                pOrder,                       // p
                new Uint32Array(qOrdersArray) // q orders
            );

            const nVars = ardl.get_n_vars();
            const modelNObs = ardl.get_n_obs();

            console.log("ARDL Model Created:", {
                nVariables: nVars,
                observations: modelNObs,
                pOrder,
                qOrders: qOrdersArray,
            });

            toast.success("ARDL model created successfully!", {
                description: `ARDL(${pOrder}, ${qOrdersArray.join(', ')}) with ${nVars} variables`,
            });

            // Free memory
            ardl.free();

            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMsg(errorMessage);
            toast.error(`ARDL Estimation Failed: ${errorMessage}`);
            console.error("ARDL estimation error:", error);
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
