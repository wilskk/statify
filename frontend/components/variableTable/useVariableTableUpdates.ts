import { useRef, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable, VariableType } from "@/types/Variable";
import { DEFAULT_VARIABLE_TYPE, DEFAULT_VARIABLE_WIDTH } from './constants';

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
        deleteVariable
    } = useVariableStore();

    const {
        addColumn,
        deleteColumn,
        validateVariableData
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
                        const newVarData = { ...variableData, columnIndex: row };
                        await addVariable(newVarData);
                        await addColumn(row);
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
                            const updatedVar = variables.find(v => v.columnIndex === row);
                            if (updatedVar) {
                                const typeToValidate = changes.type ?? updatedVar?.type ?? DEFAULT_VARIABLE_TYPE;
                                const widthToValidate = changes.width ?? updatedVar?.width ?? DEFAULT_VARIABLE_WIDTH;
                                await validateVariableData(row, typeToValidate, widthToValidate);
                            }
                        }
                    }
                    break;
                }
                case 'INSERT_VARIABLE': {
                    const { row } = operation.payload;

                    await addVariable({ columnIndex: row });
                    await addColumn(row);

                    break;
                }
                case 'DELETE_VARIABLE': {
                    const { row } = operation.payload;
                    const variableToDelete = variables.find(v => v.columnIndex === row);
                    if (variableToDelete) {
                        await deleteVariable(row);
                        await deleteColumn(row);
                    }
                    break;
                }
            }

            pendingOperations.current.shift();

        } catch (error) {
            console.error("Error processing operation:", error, pendingOperations.current[0]);
            // Consider whether to keep or remove the failed operation
            pendingOperations.current.shift();
        } finally {
            isProcessing.current = false;
            if (pendingOperations.current.length > 0) {
                // Use requestAnimationFrame for smoother UI updates
                requestAnimationFrame(processPendingOperations);
            }
        }
    }, [
        variables, addVariable, updateMultipleFields, deleteVariable,
        addColumn, deleteColumn, validateVariableData
    ]);

    const enqueueOperation = useCallback((operation: PendingOperation) => {
        pendingOperations.current.push(operation);
        if (!isProcessing.current) {
            requestAnimationFrame(processPendingOperations);
        }
    }, [processPendingOperations]);

    return { enqueueOperation };
} 