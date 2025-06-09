import { useRef, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable, VariableType } from "@/types/Variable";
import { DEFAULT_VARIABLE_TYPE, DEFAULT_VARIABLE_WIDTH } from '../constants';

// Export these types so they can be imported by other hooks
export type OperationType =
    | 'CREATE_VARIABLE'
    | 'UPDATE_VARIABLE'
    | 'INSERT_VARIABLE'
    | 'DELETE_VARIABLE';

export interface PendingOperation {
    type: OperationType;
    payload: any;
}

export function useVariableTableUpdates() {
    const pendingOperations = useRef<PendingOperation[]>([]);
    const isProcessing = useRef(false);

    const {
        variables,
        addVariable,
        addMultipleVariables,
        updateMultipleFields,
        deleteVariable,
        ensureCompleteVariables,
        insertVariableAt,
        removeVariableAt
    } = useVariableStore();

    const {
        addColumns,
        deleteColumn,
        validateVariableData,
        ensureColumns
    } = useDataStore();

    const processPendingOperations = useCallback(async () => {
        if (isProcessing.current || pendingOperations.current.length === 0) return;

        isProcessing.current = true;

        try {
            // Batch CREATE_VARIABLE operations
            if (pendingOperations.current[0].type === 'CREATE_VARIABLE') {
                const createOps: PendingOperation[] = [];
                while (pendingOperations.current.length > 0 && pendingOperations.current[0].type === 'CREATE_VARIABLE') {
                    createOps.push(pendingOperations.current.shift()!);
                }
                // Merge payloads by row index
                const dataByRow = createOps.reduce((map, op) => {
                    const { row, variableData } = op.payload;
                    if (!map.has(row)) map.set(row, { ...variableData });
                    else Object.assign(map.get(row)!, variableData);
                    return map;
                }, new Map<number, any>());
                const rows = Array.from(dataByRow.keys()).sort((a, b) => a - b);

                // Identify new vs existing variables
                const existingIndices = new Set(variables.map(v => v.columnIndex!));
                const rowsToAdd = rows.filter(r => !existingIndices.has(r));
                const rowsToUpdate = rows.filter(r => existingIndices.has(r));

                // Add new variables
                if (rowsToAdd.length > 0) {
                    const maxRowToAdd = Math.max(...rowsToAdd);
                    // Ensure default variables exist for all preceding columns
                    await ensureCompleteVariables(maxRowToAdd - 1);
                    // Ensure data matrix has sufficient columns
                    await ensureColumns(maxRowToAdd);
                    const newVarsData = rowsToAdd.map(row => ({ ...dataByRow.get(row)!, columnIndex: row }));
                    // Batch add with fallback on collision
                    try {
                        await addMultipleVariables(newVarsData);
                    } catch (error) {
                        console.warn('[processPendingOperations] addMultipleVariables collision, falling back to individual adds', error);
                        for (const varData of newVarsData) {
                            await addVariable(varData);
                        }
                    }
                    // Add corresponding columns in data table
                    await addColumns(rowsToAdd);
                }

                // Update existing variables
                for (const row of rowsToUpdate) {
                    await updateMultipleFields(row, dataByRow.get(row)!);
                }
            }
            // Batch DELETE_VARIABLE operations
            else if (pendingOperations.current[0].type === 'DELETE_VARIABLE') {
                const deleteOps: PendingOperation[] = [];
                while (pendingOperations.current.length > 0 && pendingOperations.current[0].type === 'DELETE_VARIABLE') {
                    deleteOps.push(pendingOperations.current.shift()!);
                }
                const rows = deleteOps.map(op => op.payload.row).sort((a, b) => b - a);
                for (const row of rows) {
                    await removeVariableAt(row);
                }
            } else {
                const operation = pendingOperations.current.shift()!;
                switch (operation.type) {
                    case 'UPDATE_VARIABLE': {
                        const { row, changes } = operation.payload;
                        const variableExists = !!(variables.find(v => v.columnIndex === row));

                        if (variableExists) {
                            await updateMultipleFields(row, changes);
                            const needsValidation = 'type' in changes || 'width' in changes;

                            if (needsValidation) {
                                // Re-fetch the variable after update to ensure we have the latest state for validation
                                const updatedVar = useVariableStore.getState().variables.find(v => v.columnIndex === row);
                                if (updatedVar) {
                                    // Use the potentially updated type/width from changes, fallback to the latest state, then defaults
                                    const typeToValidate = changes.type ?? updatedVar.type ?? DEFAULT_VARIABLE_TYPE;
                                    const widthToValidate = changes.width ?? updatedVar.width ?? DEFAULT_VARIABLE_WIDTH;
                                    await validateVariableData(row, typeToValidate, widthToValidate);
                                } else {
                                     console.warn(`[UPDATE_VARIABLE] Variable at index ${row} disappeared after updateMultipleFields call? Skipping validation.`);
                                }
                            }
                        } else {
                             console.warn(`[UPDATE_VARIABLE] Attempted to update non-existent variable at index ${row}.`);
                        }
                        break;
                    }
                    case 'INSERT_VARIABLE': {
                        const { row } = operation.payload; // 'row' is the index to insert *before*

                        // Delegate insertion to unified store helper
                        await insertVariableAt(row);

                        break;
                    }
                    case 'DELETE_VARIABLE': {
                        const { row } = operation.payload; // 'row' is the index to delete

                        // Delegate removal to unified store helper
                        await removeVariableAt(row);
                        break;
                    }
                    default:
                         console.warn(`[processPendingOperations] Unknown operation type: ${operation.type}`);
                }
            }

        } catch (error) {
            console.error("Error processing operation:", error, pendingOperations.current[0]);
            // Keep the failed operation for inspection? Or remove it? Removing for now.
            // Correctly reference the operation that *would have been* at index 0 if not shifted
            const failedOperation = pendingOperations.current[0]; // Get ref before potential shift
            if(failedOperation) { // Check if it exists (queue might be empty now)
                 pendingOperations.current.shift(); // Remove the failed operation
            }
        } finally {
            isProcessing.current = false;
            if (pendingOperations.current.length > 0) {
                // Use requestAnimationFrame for smoother UI updates, prevents tight loops if errors occur
                requestAnimationFrame(processPendingOperations);
            }
        }
    }, [
        variables,
        addVariable,
        addMultipleVariables,
        updateMultipleFields,
        deleteVariable,
        ensureCompleteVariables,
        addColumns,
        deleteColumn,
        validateVariableData,
        ensureColumns,
        insertVariableAt,
        removeVariableAt
    ]);

    const enqueueOperation = useCallback((operation: PendingOperation) => {
        pendingOperations.current.push(operation);
        if (!isProcessing.current) {
            requestAnimationFrame(processPendingOperations);
        }
    }, [processPendingOperations]); // processPendingOperations is the only dependency needed here

    return { enqueueOperation };
} 