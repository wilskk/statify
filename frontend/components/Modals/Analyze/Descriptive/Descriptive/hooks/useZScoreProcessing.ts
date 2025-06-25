import { useCallback } from 'react';
import type { Variable } from '@/types/Variable';
import { useDataStore, type CellUpdate } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { ZScoreData } from '../types';

interface ZScoreProcessingParams {
    setErrorMsg: (message: string | ((prev: string | null) => string)) => void;
}

/**
 * Hook terisolasi untuk menangani semua logika yang berkaitan dengan
 * pemrosesan dan penyimpanan data Z-score yang diterima dari worker.
 */
export const useZScoreProcessing = ({ setErrorMsg }: ZScoreProcessingParams) => {
    const { updateCells, ensureColumns } = useDataStore();
    const { addMultipleVariables } = useVariableStore();

    const processZScoreData = useCallback(async (zScoreData: ZScoreData | null): Promise<number> => {
        if (!zScoreData) return 0;

        const newVariables: Partial<Variable>[] = [];
        const bulkCellUpdates: CellUpdate[] = [];
        const currentVariables = useVariableStore.getState().variables;
        let nextColumnIndex = currentVariables.length;

        for (const varName in zScoreData) {
            const zData = zScoreData[varName];
            if (!zData) continue;

            if (zData.error) {
                const errorMsg = `Could not create Z-score for '${varName}': ${zData.error}`;
                console.warn(errorMsg);
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                continue;
            }

            if (!zData.scores || !zData.variableInfo) continue;

            const newVarName = zData.variableInfo.name;
            const existingVar = currentVariables.find(v => v.name === newVarName);

            if (existingVar) {
                zData.scores.forEach((zScore, rowIndex) => {
                    if (zScore !== "" && zScore !== null && zScore !== undefined) {
                        bulkCellUpdates.push({ row: rowIndex, col: existingVar.columnIndex, value: zScore });
                    }
                });
            } else {
                const variableInfo: Partial<Variable> = {
                    ...zData.variableInfo,
                    columnIndex: nextColumnIndex,
                    align: "right",
                    role: "input",
                    columns: 64,
                };
                newVariables.push(variableInfo);
                await ensureColumns(nextColumnIndex);

                zData.scores.forEach((zScore, rowIndex) => {
                    if (zScore !== "" && zScore !== null && zScore !== undefined) {
                        bulkCellUpdates.push({ row: rowIndex, col: nextColumnIndex, value: zScore });
                    }
                });
                nextColumnIndex++;
            }
        }

        if (newVariables.length > 0) {
            await addMultipleVariables(newVariables);
        }

        if (bulkCellUpdates.length > 0) {
            await updateCells(bulkCellUpdates);
        }

        return newVariables.length;
    }, [ensureColumns, updateCells, addMultipleVariables, setErrorMsg]);

    return { processZScoreData };
}; 