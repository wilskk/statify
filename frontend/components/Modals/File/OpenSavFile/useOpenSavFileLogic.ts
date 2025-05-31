import { useState, useEffect, useCallback } from "react";
import { useMobile } from "@/hooks/useMobile";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { Variable, ValueLabel, MissingValuesSpec, MissingRange, spssDateTypes, VariableType } from "@/types/Variable";
import { uploadSavFile } from "@/services/api";
import { spssSecondsToDateString } from "@/lib/spssDateConverter";

export interface UseOpenSavFileLogicProps {
    onClose: () => void;
}

export interface UseOpenSavFileLogicOutput {
    file: File | null;
    isLoading: boolean;
    error: string | null;
    isMobile: boolean;
    isPortrait: boolean;
    handleFileChange: (selectedFile: File | null) => void;
    clearError: () => void;
    handleSubmit: () => Promise<void>;
    handleModalClose: () => void; 
}

// ========================= UTILITIES =========================
// Moved from utils/spssFormatUtils.ts
export const mapSPSSTypeToInterface = (formatType: string): VariableType => {
    const typeMap: { [key: string]: VariableType } = {
        "F": "NUMERIC", "COMMA": "COMMA", "E": "SCIENTIFIC", "DATE": "DATE",
        "ADATE": "ADATE", "EDATE": "EDATE", "SDATE": "SDATE", "JDATE": "JDATE",
        "QYR": "QYR", "MOYR": "MOYR", "WKYR": "WKYR", "DATETIME": "DATETIME",
        "TIME": "TIME", "DTIME": "DTIME", "WKDAY": "WKDAY", "MONTH": "MONTH",
        "DOLLAR": "DOLLAR", "A": "STRING", "CCA": "CCA", "CCB": "CCB",
        "CCC": "CCC", "CCD": "CCD", "CCE": "CCE"
    };
    return typeMap[formatType] || "NUMERIC"; // Default to NUMERIC if unknown
};

// ========================= HOOK LOGIC =========================
// Main logic hook
export const useOpenSavFileLogic = ({
    onClose,
}: UseOpenSavFileLogicProps): UseOpenSavFileLogicOutput => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isMobile, isPortrait } = useMobile();
    const { overwriteVariables, resetVariables } = useVariableStore();
    const { setData, resetData } = useDataStore();
    const { setMeta: setProjectMeta } = useMetaStore();

    const handleFileChange = useCallback((selectedFile: File | null) => {
        setFile(selectedFile);
        if (selectedFile && !selectedFile.name.endsWith('.sav')) {
            setError("Invalid file type. Only .sav files are supported.");
            setFile(null); 
        } else if (selectedFile) {
            setError(null); 
        } else {
            setError(null);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleSubmit = async () => {
        if (!file) {
            setError("Please select a .sav file.");
            return;
        }
        if (!file.name.endsWith('.sav')) {
            setError("Invalid file type. Only .sav files are supported.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await resetData();
            await resetVariables();

            const formData = new FormData();
            formData.append("file", file);
            
            const result = await uploadSavFile(formData);

            const metaHeader = result.meta?.header;
            const sysvars = result.meta?.sysvars;
            const valueLabelsData = result.meta?.valueLabels;
            const dataRowsRaw = result.rows;

            if (!metaHeader || !sysvars || !dataRowsRaw) {
                throw new Error("Invalid response structure from backend. Essential metadata or data is missing.");
            }

            const numCases = metaHeader.n_cases;
            const numVars = metaHeader.n_vars;
            
            if (typeof numCases !== 'number' || typeof numVars !== 'number'){
                 throw new Error("Invalid number of cases or variables in metadata.");
            }

            const variables: Variable[] = sysvars.map((varInfo: any, colIndex: number): Variable => {
                const variableName = varInfo.name || `VAR${String(colIndex + 1).padStart(3, '0')}`;
                const formatType = varInfo.printFormat?.typestr || (varInfo.type === 1 ? "A" : "F");
                const isString = formatType === "A";

                const valueLabelsObj = valueLabelsData?.find(
                    (vl: any) => vl.appliesToNames?.includes(variableName)
                );
                const values: ValueLabel[] = valueLabelsObj ?
                    valueLabelsObj.entries.map((entry: any): ValueLabel => ({
                        variableName,
                        value: entry.val,
                        label: entry.label
                    })) : [];

                let missingValueSpec: MissingValuesSpec | null = null;
                const rawMissing = varInfo.missing;
                if (rawMissing !== null && rawMissing !== undefined) {
                    if (typeof rawMissing === 'object' && !Array.isArray(rawMissing) && (rawMissing.hasOwnProperty('min') || rawMissing.hasOwnProperty('max'))) {
                        const range: MissingRange = {};
                        if (rawMissing.min !== undefined && typeof rawMissing.min === 'number') range.min = rawMissing.min;
                        if (rawMissing.max !== undefined && typeof rawMissing.max === 'number') range.max = rawMissing.max;
                        if (Object.keys(range).length > 0) missingValueSpec = { range };
                    } else if (Array.isArray(rawMissing)) {
                        const discreteValues = rawMissing.filter(v => typeof v === 'string' || typeof v === 'number');
                        if (discreteValues.length > 0) missingValueSpec = { discrete: discreteValues };
                    } else if (typeof rawMissing === 'string' || typeof rawMissing === 'number') {
                        missingValueSpec = { discrete: [rawMissing] };
                    }
                }

                return {
                    columnIndex: colIndex,
                    name: variableName,
                    type: mapSPSSTypeToInterface(formatType),
                    width: varInfo.printFormat?.width || (isString ? 80 : 8),
                    decimals: varInfo.printFormat?.nbdec ?? (isString ? 0 : (varInfo.type === 0 ? 2 : 0)),
                    label: varInfo.label || "",
                    values: values,
                    missing: missingValueSpec,
                    columns: varInfo.writeFormat?.width || 12, 
                    align: isString ? "left" : "right",
                    measure: varInfo.measurementLevel?.toLowerCase() || "unknown",
                    role: "input"
                };
            });

            const dataMatrix = Array(numCases).fill(null).map((_, rowIndex) => {
                const rowData = dataRowsRaw[rowIndex] || {};
                return Array(numVars).fill(null).map((_, colIndex) => {
                    const colName = variables[colIndex]?.name;
                    let rawDataValue = (colName && rowData.hasOwnProperty(colName)) ? rowData[colName] : null;
                    
                    const variable = variables[colIndex];
                    if (variable && rawDataValue !== null) {
                        if (spssDateTypes.has(variable.type) && typeof rawDataValue === 'number') {
                            const convertedDate = spssSecondsToDateString(rawDataValue);
                            return convertedDate ?? rawDataValue;
                        }
                        if (variable.type === 'STRING' && typeof rawDataValue !== 'string') {
                            return String(rawDataValue).trim();
                        }
                         if (variable.type !== 'STRING' && typeof rawDataValue === 'string' && rawDataValue.trim() === "") {
                            return null;
                        }
                        if (variable.type !== 'STRING' && typeof rawDataValue === 'string'){
                             const num = parseFloat(rawDataValue);
                             return isNaN(num) ? rawDataValue : num;
                        }
                    }
                    return (typeof rawDataValue === 'string') ? rawDataValue.trim() : rawDataValue;
                });
            });

            await overwriteVariables(variables);
            await setData(dataMatrix);

            await setProjectMeta({
                name: file.name,
                location: "local",
                created: metaHeader.created ? new Date(metaHeader.created) : new Date(),
            });
            
            onClose();

        } catch (err: any) {
            console.error("Error opening .sav file:", err);
            setError(err.message || "An unexpected error occurred while opening the file.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalClose = useCallback(() => {
        onClose();
    }, [onClose]);

    return {
        file,
        isLoading,
        error,
        isMobile,
        isPortrait,
        handleFileChange,
        clearError,
        handleSubmit,
        handleModalClose
    };
}; 