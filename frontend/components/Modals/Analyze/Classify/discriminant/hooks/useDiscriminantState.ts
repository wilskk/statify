import { useCallback, useEffect, useState } from "react";
import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import type { DiscriminantAnalysisType } from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant-worker";
import type { DiscriminantType, DiscriminantMainType } from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant";
import { DiscriminantDefault } from "@/components/Modals/Analyze/Classify/discriminant/constants/discriminant-default";
import { clearFormData, getFormData, saveFormData } from "@/hooks/useIndexedDB";
import { saveDiscriminantResult } from "@/components/Modals/Analyze/Classify/discriminant/services/store";
import { Variable } from "@/types/Variable";

export type DiscriminantValueUnion = string | number | boolean | string[] | null;

export interface UseDiscriminantStateResult {
    formData: DiscriminantType;
    updateFormData: <T extends keyof DiscriminantType>(
        section: T,
        field: keyof DiscriminantType[T],
        value: DiscriminantType[T][keyof DiscriminantType[T]] | DiscriminantValueUnion
    ) => void;
    executeAnalysis: (mainData: DiscriminantMainType) => Promise<void>;
    resetFormData: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const useDiscriminantState = (
    variables: Variable[],
    dataVariables: string[][]
): UseDiscriminantStateResult => {
    const [formData, setFormData] = useState<DiscriminantType>({
        ...DiscriminantDefault,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load saved form data from IndexedDB on mount
    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("Discriminant");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    // Merge with defaults so sections added after this data was
                    // saved (e.g. `assumptions`) are always present.
                    setFormData({
                        ...DiscriminantDefault,
                        ...(formDataWithoutId as DiscriminantType),
                    });
                } else {
                    setFormData({ ...DiscriminantDefault });
                }
            } catch (err) {
                console.error("Failed to load form data:", err);
            }
        };
        loadFormData();
    }, []);

    // Keep Bootstrap Variables up-to-date with current variables
    useEffect(() => {
        setFormData((prev) => {
            const independentVars = prev.main.IndependentVariables
                ? [...prev.main.IndependentVariables]
                : [];
            const usedVariables = [
                prev.main.GroupingVariable,
                ...independentVars,
                prev.main.SelectionVariable,
            ];
            const updatedVariables = variables
                .filter((v) => !usedVariables.includes(v.name))
                .map((v) => v.name);
            return {
                ...prev,
                bootstrap: { ...prev.bootstrap, Variables: updatedVariables },
            };
        });
    }, [
        formData.main.IndependentVariables,
        formData.main.GroupingVariable,
        formData.main.SelectionVariable,
        variables,
    ]);

    const updateFormData = useCallback(
        <T extends keyof DiscriminantType>(
            section: T,
            field: keyof DiscriminantType[T],
            value: DiscriminantType[T][keyof DiscriminantType[T]] | string | number | boolean | string[] | null
        ) => {
            setFormData((prev) => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value,
                },
            }));
        },
        []
    );

    const resetFormData = useCallback(async () => {
        try {
            await clearFormData("Discriminant");
            setFormData({ ...DiscriminantDefault });
        } catch (err) {
            console.error("Failed to clear form data:", err);
        }
    }, []);

    const executeAnalysis = useCallback(
        async (mainData: DiscriminantMainType) => {
            setIsLoading(true);
            setError(null);

            try {
                const newFormData: DiscriminantType = {
                    ...formData,
                    main: mainData,
                };

                await saveFormData("Discriminant", newFormData);

                const configData = newFormData;

                // DEBUG: Log method config before sending
                console.log("[Discriminant] Method config to send:", configData.method);

                const GroupingVariable = mainData.GroupingVariable
                    ? [mainData.GroupingVariable]
                    : [];
                const IndependentVariables = mainData.IndependentVariables || [];
                const SelectionVariable = mainData.SelectionVariable
                    ? [mainData.SelectionVariable]
                    : [];

                const slicedDataForGrouping = getSlicedData({
                    dataVariables,
                    variables,
                    selectedVariables: GroupingVariable,
                });
                const slicedDataForIndependent = getSlicedData({
                    dataVariables,
                    variables,
                    selectedVariables: IndependentVariables,
                });
                const slicedDataForSelection = getSlicedData({
                    dataVariables,
                    variables,
                    selectedVariables: SelectionVariable,
                });

                const varDefsForGrouping = getVarDefs(variables, GroupingVariable);
                const varDefsForIndependent = getVarDefs(variables, IndependentVariables);
                const varDefsForSelection = getVarDefs(variables, SelectionVariable);

                // Create WebWorker
                const worker = new Worker('/workers/Classify/Discriminant/discriminant.worker.js', { type: 'module' });

                // Send data to worker
                worker.postMessage({
                    group_data: slicedDataForGrouping,
                    independent_data: slicedDataForIndependent,
                    selection_data: slicedDataForSelection,
                    group_data_defs: varDefsForGrouping,
                    independent_data_defs: varDefsForIndependent,
                    selection_data_defs: varDefsForSelection,
                    config_data: configData
                });

                // Handle worker response
                worker.onmessage = async (e) => {
                    const { type, payload, error: workerError } = e.data;

                    if (type === "SUCCESS") {
                        const { formattedResults, log, errors } = payload;

                        console.log("executed", log);
                        console.log("errors", errors);
                        console.log("results", formattedResults);

                        if (errors && errors.length > 0) {
                            console.warn("Analysis warnings:", errors);
                        }

                        await saveDiscriminantResult(formattedResults);
                        setIsLoading(false);
                        worker.terminate();
                    } else {
                        console.error("[Discriminant] Worker Error:", workerError);
                        setError(workerError || "Unknown worker error");
                        setIsLoading(false);
                        worker.terminate();
                    }
                };

                // Handle worker errors
                worker.onerror = (err) => {
                    console.error("[Discriminant] Worker Execution Error:", err);
                    const detail = err.message
                        ? `${err.message} (${err.filename || "unknown"}:${err.lineno || 0}:${err.colno || 0})`
                        : String(err);
                    setError(`Worker Error: ${detail}`);
                    setIsLoading(false);
                    worker.terminate();
                };

            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setError(message);
                console.error("Discriminant analysis failed:", err);
                setIsLoading(false);
            }
        },
        [formData, dataVariables, variables]
    );

    return {
        formData,
        updateFormData,
        executeAnalysis,
        resetFormData,
        isLoading,
        error,
    };
};