// components/Modals/File/fileActions.ts
import { useModal } from "@/hooks/useModal";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import {useResultStore} from "@/stores/useResultStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { useRouter } from 'next/navigation';

export type FileActionType =
    | "New"
    | "Save"
    | "SaveAs"
    | "Exit";

interface FileActionPayload {
    actionType: FileActionType;
    data?: any;
}

export const useFileActions = () => {
    const { openModal } = useModal();
    const router = useRouter();

    const handleAction = async ({ actionType, data }: FileActionPayload) => {
        switch (actionType) {
            case "New":
                await useDataStore.getState().resetData();
                await useVariableStore.getState().resetVariables();
                await useMetaStore.getState().resetMeta();
                useResultStore.getState().clearAll();
                console.log("New session started. Data, variables, and metadata reset.");
                break;
            case "Save":
                // Explicitly save the current state of all relevant stores
                try {
                    console.log("Explicit save action triggered.");
                    // Assuming existence of explicit save functions in stores
                    await useMetaStore.getState().saveMeta();
                    await useVariableStore.getState().saveVariables();
                    await useDataStore.getState().saveData();
                    console.log("All stores saved successfully.");
                    // Add user feedback (e.g., toast notification)
                } catch (error) {
                    console.error("Error during explicit save action:", error);
                    alert("An error occurred while saving data. Please check the console.");
                }
                break;
            case "SaveAs":
                const dataMatrix = useDataStore.getState().data;
                const variablesStore = useVariableStore.getState().variables;

                const actualRowCount = dataMatrix.reduce((max, row, index) => {
                    return row.some(cell => String(cell).trim() !== "") ? index + 1 : max;
                }, 0);

                const actualColCount = dataMatrix.reduce((max, row) => {
                    const lastFilledIndex = row.reduce((last: number, cell, index) => {
                        return String(cell).trim() !== "" ? index : last;
                    }, -1);
                    return Math.max(max, lastFilledIndex + 1);
                }, 0);

                const trimmedDataMatrix = dataMatrix
                    .slice(0, actualRowCount)
                    .map(row => row.slice(0, actualColCount));

                const filteredVariables = variablesStore.filter(
                    variable =>
                        String(variable.name).trim() !== "" ||
                        (variable.label && String(variable.label).trim() !== "")
                );

                const sanitizeVariableName = (name: string) => {
                    let sanitized = name.trim();

                    if (!/^[a-zA-Z]/.test(sanitized)) {
                        sanitized = "V" + sanitized;
                    }

                    sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, "_");

                    if (sanitized.length > 64) {
                        sanitized = sanitized.substring(0, 64);
                    }

                    return sanitized;
                };

                const transformedVariables = filteredVariables.map(variable => {
                    const name = sanitizeVariableName(variable.name || `VAR${variable.columnIndex}`);

                    const valueLabels = Array.isArray(variable.values) ?
                        variable.values.map(vl => ({
                            value: vl.value,
                            label: vl.label || ""
                        })) : [];

                    return {
                        name,
                        label: variable.label || "",
                        type: variable.type,
                        width: variable.width,
                        decimal: variable.decimals,
                        alignment: variable.align.toLowerCase(),
                        measure: variable.measure.toLowerCase(),
                        columns: variable.columns,
                        valueLabels
                    };
                });

                const transformedData = trimmedDataMatrix.map(row => {
                    const record: Record<string, any> = {};
                    filteredVariables.forEach(variable => {
                        if (variable.columnIndex !== undefined && variable.columnIndex < actualColCount) {
                            const name = sanitizeVariableName(variable.name || `VAR${variable.columnIndex}`);
                            record[name] = row[variable.columnIndex];
                        }
                    });
                    return record;
                });

                try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                    const response = await fetch(`${backendUrl}/sav/create`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ data: transformedData, variables: transformedVariables }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(errorText || "Gagal membuat file .sav");
                    }

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "data.sav";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error(`Error during ${actionType} action:`, error);
                    alert(`Terjadi kesalahan saat menyimpan file .sav (${actionType}). Error: ${error instanceof Error ? error.message : String(error)}`);
                }
                break;

            case "Exit":
                try {
                    await useDataStore.getState().resetData();
                    await useVariableStore.getState().resetVariables();
                    await useMetaStore.getState().resetMeta();
                    await useResultStore.getState().clearAll();
                    console.log("Exiting application. All data cleared.");
                    router.push('/');
                } catch (error) {
                    console.error("Error during Exit action while resetting stores:", error);
                    alert("An error occurred while clearing data before exiting. Please try again.");
                }
                break;
            default:
                console.warn("Unknown file action:", actionType);
        }
    };

    return { handleAction };
};