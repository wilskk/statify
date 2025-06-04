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
        updateMultipleFields,
        deleteVariable,
        ensureCompleteVariables
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
            const operation = pendingOperations.current[0];

            switch (operation.type) {
                case 'CREATE_VARIABLE': {
                    const { row, variableData } = operation.payload;
                    const existingVar = variables.find(v => v.columnIndex === row);

                    if (!existingVar) {
                        // Find the maximum current columnIndex *before* potential gap filling
                        const maxIndexBefore = variables.reduce((max, v) => Math.max(max, v.columnIndex ?? -1), -1);

                        // --- Optimized Gap Filling ---
                        if (row > maxIndexBefore + 1) {
                            const gapEndIndex = row - 1;
                            console.log(`Filling gap efficiently up to index: ${gapEndIndex}`);
                            // Ensure variable metadata exists for the gap
                            await ensureCompleteVariables(gapEndIndex);
                            // Ensure data columns exist for the gap
                            await ensureColumns(gapEndIndex);
                        }
                        // --- End Optimized Gap Filling ---

                        // Proceed to create the *originally requested* variable metadata and data column
                        console.log(`Creating target variable at index: ${row}`);
                        const newVarData = { ...variableData, columnIndex: row };
                        // addVariable handles insertion vs append logic within the store
                        await addVariable(newVarData);
                        // addColumns handles adding the corresponding data column
                        await addColumns([row]);

                    } else {
                        console.log(`Variable already exists at index: ${row}. Skipping creation.`);
                        // If variable exists, perhaps we should update instead?
                        // For now, we skip, aligning with previous logic. If an update is needed,
                        // the 'UPDATE_VARIABLE' operation should be enqueued instead.
                    }
                    break;
                }
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

                    // addVariable handles the insertion logic (shifting indices)
                    await addVariable({ columnIndex: row });
                    // addColumns handles inserting the data column at the same index
                    await addColumns([row]);

                    break;
                }
                case 'DELETE_VARIABLE': {
                    const { row } = operation.payload; // 'row' is the index to delete
                    const variableToDelete = variables.find(v => v.columnIndex === row);
                    if (variableToDelete) {
                        // deleteVariable handles deletion and re-indexing in the store
                        await deleteVariable(row);
                        // deleteColumn handles deleting the data column and potential re-indexing issues
                        await deleteColumn(row);
                    } else {
                        console.warn(`[DELETE_VARIABLE] Attempted to delete non-existent variable at index ${row}.`);
                    }
                    break;
                }
                default:
                     console.warn(`[processPendingOperations] Unknown operation type: ${operation.type}`);
            }

            pendingOperations.current.shift();

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
        variables, // Need current variables to find maxIndex and check existence
        addVariable,
        updateMultipleFields,
        deleteVariable,
        ensureCompleteVariables,
        addColumns,
        deleteColumn,
        validateVariableData,
        ensureColumns
    ]);

    const enqueueOperation = useCallback((operation: PendingOperation) => {
        pendingOperations.current.push(operation);
        if (!isProcessing.current) {
            requestAnimationFrame(processPendingOperations);
        }
    }, [processPendingOperations]); // processPendingOperations is the only dependency needed here

    return { enqueueOperation };
} 