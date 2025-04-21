// statify/hooks/useVariableTableLogic.ts
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Handsontable from "handsontable";
import { HotTableClass } from "@handsontable/react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useTableRefStore } from "@/stores/useTableRefStore";
import { transformVariablesToTableData } from './utils';
import {
    DEFAULT_VARIABLE_TYPE,
    DEFAULT_VARIABLE_WIDTH,
    DEFAULT_VARIABLE_DECIMALS,
    COLUMN_INDEX,
    COLUMN_INDEX_TO_FIELD_MAP,
    DIALOG_TRIGGER_COLUMNS
} from './constants';
import { Variable, ValueLabel, VariableType, VariableAlign, VariableMeasure, VariableRole, MissingValuesSpec } from "@/types/Variable";

type OperationType =
    | 'CREATE_VARIABLE'
    | 'UPDATE_VARIABLE'
    | 'INSERT_VARIABLE'
    | 'DELETE_VARIABLE';

interface PendingOperation {
    type: OperationType;
    payload: any;
}


export function useVariableTableLogic() {
    const hotTableRef = useRef<HotTableClass>(null);
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
        ensureMatrixDimensions,
        validateVariableData
    } = useDataStore();

    const { setVariableTableRef } = useTableRefStore();

    const [tableData, setTableData] = useState<(string | number)[][]>([]);
    const [showTypeDialog, setShowTypeDialog] = useState(false);
    const [showValuesDialog, setShowValuesDialog] = useState(false);
    const [showMissingDialog, setShowMissingDialog] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

    const actualVariableCount = useMemo(() => variables.length, [variables]);

    const selectedVariable = useMemo(() => {
        if (!selectedCell) return null;
        return variables.find(v => v.columnIndex === selectedCell.row) ?? null;
    }, [selectedCell, variables]);

    const selectedVariableType = useMemo(() => {
        return selectedVariable?.type || DEFAULT_VARIABLE_TYPE;
    }, [selectedVariable]);

    useEffect(() => {
        setTableData(transformVariablesToTableData(variables));
    }, [variables]);

    useEffect(() => {
        if (hotTableRef.current) {
            setVariableTableRef(hotTableRef as React.RefObject<any>);
        }
        return () => {
            setVariableTableRef(null);
        };
    }, [setVariableTableRef]);

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
                        await addVariable({ ...variableData, columnIndex: row });
                        await ensureMatrixDimensions(0, variables.length + 1);
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
                            const typeToValidate = changes.type ?? updatedVar?.type ?? DEFAULT_VARIABLE_TYPE;
                            const widthToValidate = changes.width ?? updatedVar?.width ?? DEFAULT_VARIABLE_WIDTH;
                            await validateVariableData(row, typeToValidate, widthToValidate);
                        }
                    }
                    break;
                }
                case 'INSERT_VARIABLE': {
                    const { row } = operation.payload;
                    await addVariable({ columnIndex: row });
                    await addColumn(row);
                    await ensureMatrixDimensions(0, variables.length + 1);
                    break;
                }
                case 'DELETE_VARIABLE': {
                    const { row } = operation.payload;
                    await deleteVariable(row);
                    await deleteColumn(row);
                    break;
                }
            }

            pendingOperations.current.shift();

        } catch (error) {
            console.error("Error processing operation:", error, pendingOperations.current[0]);
            pendingOperations.current.shift();
        } finally {
            isProcessing.current = false;
            if (pendingOperations.current.length > 0) {
                requestAnimationFrame(processPendingOperations);
            }
        }
    }, [
        variables, addVariable, updateMultipleFields, deleteVariable,
        addColumn, deleteColumn, ensureMatrixDimensions, validateVariableData
    ]);

    const enqueueOperation = useCallback((operation: PendingOperation) => {
        pendingOperations.current.push(operation);
        if (!isProcessing.current) {
            requestAnimationFrame(processPendingOperations);
        }
    }, [processPendingOperations]);

    const openDialogForCell = useCallback((row: number, col: number) => {
        requestAnimationFrame(() => {
            setSelectedCell({ row, col: col });
            setShowTypeDialog(col === COLUMN_INDEX.TYPE);
            setShowValuesDialog(col === COLUMN_INDEX.VALUES);
            setShowMissingDialog(col === COLUMN_INDEX.MISSING);
        });
    }, []);

    const handleBeforeChange = useCallback((
        changes: (Handsontable.CellChange | null)[],
        source: Handsontable.ChangeSource
    ): void | boolean => {
        if (source === "loadData" || !changes) return;

        const changesByRow: Record<number, Partial<Variable>> = {};
        let shouldPreventDefault = false;

        for (const change of changes) {
            if (!change) continue;
            const [row, prop, oldValue, newValue] = change;
            if (newValue === oldValue) continue;
            if (typeof row !== "number") continue;

            let columnIndex: number | undefined;
            if (typeof prop === 'number') {
                columnIndex = prop;
            } else if (typeof prop === 'string') {
                columnIndex = hotTableRef.current?.hotInstance?.propToCol(prop);
            } else {
                continue;
            }

            if (typeof columnIndex !== 'number') continue;

            if (DIALOG_TRIGGER_COLUMNS.includes(columnIndex)) {
                if (source === 'edit' || source === 'Autofill.fill') {
                    shouldPreventDefault = true;
                }
            } else {
                const field = COLUMN_INDEX_TO_FIELD_MAP[columnIndex] || String(prop);
                if (field && typeof field === 'string') {
                    if (!changesByRow[row]) changesByRow[row] = {};
                    changesByRow[row][field as keyof Variable] = newValue as any;
                }
            }
        }

        if (shouldPreventDefault) {
            const firstChange = changes.find(c => c !== null);
            if (firstChange && typeof firstChange[0] === 'number' && typeof firstChange[1] === 'number') {
                openDialogForCell(firstChange[0], firstChange[1]);
            }
            return false;
        }

        Object.keys(changesByRow).forEach(rowKey => {
            const row = Number(rowKey);
            const rowChanges = changesByRow[row];
            const existingVariable = variables.find(v => v.columnIndex === row);

            if (existingVariable) {
                enqueueOperation({
                    type: 'UPDATE_VARIABLE',
                    payload: { row, changes: rowChanges }
                });
            } else {
                enqueueOperation({
                    type: 'CREATE_VARIABLE',
                    payload: { row, variableData: rowChanges }
                });
            }
        });

        return true;
    }, [variables, enqueueOperation, openDialogForCell]);

    const handleAfterSelectionEnd = useCallback((
        row: number, column: number, row2: number, column2: number, selectionLayerLevel: number
    ) => {
        const isSingleCell = row === row2 && column === column2;
        if (isSingleCell) {
            setSelectedCell({ row, col: column });
            if (DIALOG_TRIGGER_COLUMNS.includes(column)) {
                openDialogForCell(row, column);
            }
        } else {
            setSelectedCell(null);
        }
    }, [openDialogForCell]);

    const handleInsertVariable = useCallback(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const selected = hotInstance.getSelectedLast();
        if (!selected) return;
        const row = selected[0];
        enqueueOperation({
            type: 'INSERT_VARIABLE',
            payload: { row }
        });
    }, [enqueueOperation]);

    const handleDeleteVariable = useCallback(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const selected = hotInstance.getSelectedLast();
        if (!selected) return;
        const row = selected[0];
        enqueueOperation({ type: 'DELETE_VARIABLE', payload: { row } });
    }, [enqueueOperation]);

    const handleTypeSelection = useCallback((type: VariableType, width: number, decimals: number) => {
        if (!selectedCell) return;
        enqueueOperation({
            type: 'UPDATE_VARIABLE',
            payload: { row: selectedCell.row, changes: { type, width, decimals } }
        });
        setShowTypeDialog(false);
    }, [selectedCell, enqueueOperation]);

    const handleValuesSelection = useCallback((values: ValueLabel[]) => {
        if (!selectedCell) return;
        enqueueOperation({
            type: 'UPDATE_VARIABLE',
            payload: { row: selectedCell.row, changes: { values } }
        });
        setShowValuesDialog(false);
    }, [selectedCell, enqueueOperation]);

    const handleMissingSelection = useCallback((missingValues: MissingValuesSpec | null) => {
        if (!selectedCell) return;
        enqueueOperation({
            type: 'UPDATE_VARIABLE',
            payload: { row: selectedCell.row, changes: { missing: missingValues } }
        });
        setShowMissingDialog(false);
    }, [selectedCell, enqueueOperation]);

    const getSelectedVariableName = useCallback((): string => {
        const variable = selectedCell ? variables.find(v => v.columnIndex === selectedCell.row) : null;
        return variable?.name || (selectedCell ? `var${selectedCell.row + 1}` : "");
    }, [selectedCell, variables]);

    const getSelectedVariableValues = useCallback((): ValueLabel[] => {
        return selectedVariable?.values || [];
    }, [selectedVariable]);

    const getSelectedVariableMissing = useCallback((): MissingValuesSpec | null => {
        return selectedVariable?.missing || null;
    }, [selectedVariable]);

    const getSelectedVariableOrDefault = useCallback((key: keyof Variable, defaultValue: any) => {
        const variable = selectedCell ? variables.find(v => v.columnIndex === selectedCell.row) : null;
        return variable?.[key] ?? defaultValue;
    }, [selectedCell, variables]);

    const customContextMenu = useMemo(() => ({
        items: {
            insert_variable: {
                name: 'Insert Variable',
                callback: handleInsertVariable,
            },
            delete_variable: {
                name: 'Delete Variable',
                callback: handleDeleteVariable,
                disabled: () => !hotTableRef.current?.hotInstance?.getSelectedLast() || hotTableRef.current?.hotInstance?.countRows() <= 1
            }
        }
    }), [handleInsertVariable, handleDeleteVariable]);

    const handleBeforeKeyDown = useCallback((event: KeyboardEvent) => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if(!hotInstance) return;

        const isNavigationKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key);
        const isShortcut = (event.metaKey || event.ctrlKey) && ['c', 'v', 'x', 'a'].includes(event.key.toLowerCase());
        const isEditKey = ['Backspace', 'Delete', 'F2'].includes(event.key);

        if (isNavigationKey || isShortcut || isEditKey) {
            return;
        }

        const selected = hotInstance.getSelectedLast();
        if (selected) {
            const [, col] = selected;
            if (DIALOG_TRIGGER_COLUMNS.includes(col) && event.key.length === 1 && !event.altKey) {
                event.preventDefault();
                event.stopImmediatePropagation();
                openDialogForCell(selected[0], selected[1]);
            }
        }
    }, [openDialogForCell]);

    const handleBeforeSetRangeEnd = useCallback((coords: { col: number; row: number }) => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const currentSelectionRange = hotInstance.getSelectedRangeLast();
        if (!currentSelectionRange) return;

        const startCol = currentSelectionRange.from.col;
        if (coords.col !== startCol) {
            coords.col = startCol;
        }
    }, []);

    return {
        hotTableRef,
        tableData,
        actualVariableCount, // <-- Return nilai baru
        showTypeDialog,
        setShowTypeDialog,
        showValuesDialog,
        setShowValuesDialog,
        showMissingDialog,
        setShowMissingDialog,
        selectedVariableType,
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleTypeSelection,
        handleValuesSelection,
        handleMissingSelection,
        getSelectedVariableName,
        getSelectedVariableValues,
        getSelectedVariableMissing,
        getSelectedVariableOrDefault,
        customContextMenu,
        handleBeforeKeyDown,
        handleBeforeSetRangeEnd,
    };
}