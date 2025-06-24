import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/stores/useDataStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { handleApiResponse, getApiUrl } from '@/services/api';
import { Variable } from '@/types/Variable';
import { DataRow } from '@/types/Data';
import { parseCSV, parseXLSX, generateDefaultVariables, mapSPSSTypeToInterface, convertSavMissingToSpec } from '@/utils/file-parsers';

export const useExampleDatasetLoader = (onClose: () => void) => {
    const router = useRouter();
    const { setData, resetData } = useDataStore();
    const { setMeta: setProjectMeta, resetMeta: resetProjectMeta } = useMetaStore();
    const { overwriteVariables, resetVariables, setVariables } = useVariableStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDataset = async (filePath: string) => {
        setIsLoading(true);
        setError(null);
        const fileName = filePath.split('/').pop() || 'Untitled Project';
        const fileExtension = filePath.split('.').pop()?.toLowerCase();

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            let parsedData: DataRow[] = [];
            let variables: Variable[] = [];

            if (fileExtension === 'csv') {
                const csvContent = await response.text();
                parsedData = await parseCSV(csvContent);
                if (parsedData.length > 0) variables = generateDefaultVariables(parsedData[0].length);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const arrayBuffer = await response.arrayBuffer();
                parsedData = await parseXLSX(arrayBuffer);
                if (parsedData.length > 0) variables = generateDefaultVariables(parsedData[0].length);
            } else if (fileExtension === 'sav') {
                const savBlob = await response.blob();
                const formData = new FormData();
                formData.append('file', savBlob, fileName);

                await resetData();
                await resetVariables();

                const uploadResponse = await fetch(getApiUrl('sav/upload'), { method: 'POST', body: formData });
                const result = await handleApiResponse(uploadResponse);

                if (!result.rows || !result.meta || !result.meta.sysvars) {
                    throw new Error('Invalid response from backend SAV upload.');
                }

                const { n_cases, n_vars } = result.meta.header;
                const { sysvars } = result.meta;

                variables = sysvars.map((varInfo: any, colIndex: number) => {
                    const variableName = varInfo.name || `VAR${colIndex + 1}`;
                    const formatType = varInfo.printFormat?.typestr;
                    const isString = formatType === "A" || varInfo.type === 1;
                    const valueLabelsObj = result.meta.valueLabels?.find((vl: any) => vl.appliesToNames?.includes(variableName));
                    const valueLabels = valueLabelsObj ? valueLabelsObj.entries.map((entry: any) => ({
                        id: undefined, variableName, value: entry.val, label: entry.label
                    })) : [];
                    const missingSpec = convertSavMissingToSpec(varInfo.missing);

                    return {
                        columnIndex: colIndex,
                        name: variableName,
                        type: mapSPSSTypeToInterface(formatType),
                        width: varInfo.printFormat?.width,
                        decimals: varInfo.printFormat?.nbdec,
                        label: varInfo.label || "",
                        values: valueLabels,
                        missing: missingSpec,
                        columns: 200,
                        align: isString ? "left" : "right",
                        measure: isString ? "nominal" : "scale",
                        role: "input"
                    };
                });

                parsedData = Array(n_cases).fill(0).map((_, rowIndex) => {
                    const rowData = result.rows[rowIndex] || {};
                    return Array(n_vars).fill(0).map((_, colIndex) => {
                        const colName = sysvars[colIndex]?.name;
                        return rowData[colName] !== undefined ? rowData[colName] : "";
                    });
                });
            } else {
                throw new Error(`Unsupported file type: ${fileExtension}`);
            }

            if (fileExtension !== 'sav') {
                await resetData();
                await resetVariables();
            }
            await resetProjectMeta();
            await setProjectMeta({ name: fileName, location: fileName, created: new Date() });
            await setData(parsedData);

            if (fileExtension === 'sav') {
                await overwriteVariables(variables);
            } else {
                await setVariables(variables);
            }

            onClose();
            router.push('/dashboard/data');
        } catch (err: any) {
            setError(err.message || "Failed to load data.");
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, error, loadDataset };
}; 