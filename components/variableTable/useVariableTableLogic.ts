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

type OperationType =
    | 'CREATE_VARIABLE'
    | 'UPDATE_VARIABLE'
    | 'INSERT_VARIABLE'
    | 'DELETE_VARIABLE';

interface PendingOperation {
    type: OperationType;
    payload: any;
}

// Mengimpor tipe yang sudah didefinisikan secara eksplisit
import { Variable, ValueLabel, VariableType, VariableAlign, VariableMeasure, VariableRole } from "@/types/Variable";

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
    }, [variables, enqueueOperation]);

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

    const handleTypeSelection = useCallback((type: string, width: number, decimals: number) => {
        if (!selectedCell) return;
        const { row } = selectedCell;
        const variableExists = !!(variables.find(v => v.columnIndex === row));

        // Validasi tipe untuk memastikan sesuai dengan VariableType
        const isValidType = (value: string): value is VariableType => {
            return [
                "NUMERIC", "COMMA", "DOT", "SCIENTIFIC", "DATE", "ADATE", "EDATE",
                "SDATE", "JDATE", "QYR", "MOYR", "WKYR", "DATETIME", "TIME",
                "DTIME", "WKDAY", "MONTH", "DOLLAR", "CCA", "CCB", "CCC",
                "CCD", "CCE", "STRING", "RESTRICTED_NUMERIC"
            ].includes(value);
        };

        // Gunakan tipe default jika tipe tidak valid
        const validType: VariableType = isValidType(type) ? type : DEFAULT_VARIABLE_TYPE;

        const changes: Partial<Variable> = {
            type: validType,
            width,
            decimals
        };

        if (variableExists) {
            enqueueOperation({ type: 'UPDATE_VARIABLE', payload: { row, changes } });
        } else {
            enqueueOperation({ type: 'CREATE_VARIABLE', payload: { row, variableData: changes } });
        }
    }, [selectedCell, variables, enqueueOperation]);

    const handleValuesSelection = useCallback((values: ValueLabel[]) => {
        if (!selectedCell) return;
        const { row } = selectedCell;
        const variableExists = !!(variables.find(v => v.columnIndex === row));
        const changes: Partial<Variable> = { values };

        if (variableExists) {
            enqueueOperation({ type: 'UPDATE_VARIABLE', payload: { row, changes } });
        } else {
            enqueueOperation({ type: 'CREATE_VARIABLE', payload: { row, variableData: changes } });
        }
    }, [selectedCell, variables, enqueueOperation]);

    const handleMissingSelection = useCallback((missing: (number | string)[]) => {
        if (!selectedCell) return;
        const { row } = selectedCell;
        const variableExists = !!(variables.find(v => v.columnIndex === row));
        const changes: Partial<Variable> = { missing };

        if (variableExists) {
            enqueueOperation({ type: 'UPDATE_VARIABLE', payload: { row, changes } });
        } else {
            enqueueOperation({ type: 'CREATE_VARIABLE', payload: { row, variableData: changes } });
        }
    }, [selectedCell, variables, enqueueOperation]);

    const getSelectedVariableName = useCallback((): string => {
        const variable = selectedCell ? variables.find(v => v.columnIndex === selectedCell.row) : null;
        return variable?.name || (selectedCell ? `var${selectedCell.row + 1}` : "");
    }, [selectedCell, variables]);

    const getSelectedVariableValues = useCallback((): ValueLabel[] => {
        const variable = selectedCell ? variables.find(v => v.columnIndex === selectedCell.row) : null;
        return variable?.values || [];
    }, [selectedCell, variables]);

    const getSelectedVariableMissing = useCallback((): (number | string)[] => {
        const variable = selectedCell ? variables.find(v => v.columnIndex === selectedCell.row) : null;
        return variable?.missing || [];
    }, [selectedCell, variables]);

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

    const getCellProperties = useCallback((row: number, col: number): Partial<Handsontable.CellProperties> => {
        const cellProperties: Partial<Handsontable.CellProperties> = {};
        const classNames = [];
        const variable = variables.find(v => v.columnIndex === row);

        if (col === COLUMN_INDEX.TYPE) classNames.push('type-column', 'htDimmed');
        else if (col === COLUMN_INDEX.VALUES) classNames.push('values-column', 'htDimmed');
        else if (col === COLUMN_INDEX.MISSING) classNames.push('missing-column', 'htDimmed');

        if (DIALOG_TRIGGER_COLUMNS.includes(col)) {
            cellProperties.readOnly = true;
            classNames.push('htReadOnly');
        }

        if (variable && variable.align) {
            cellProperties.className = (cellProperties.className || '') + ` ht${variable.align.charAt(0).toUpperCase() + variable.align.slice(1)}`;
        }

        if(classNames.length > 0) {
            cellProperties.className = (cellProperties.className ? cellProperties.className + ' ' : '') + classNames.join(' ');
        }

        return cellProperties;
    }, [variables]);

    const handleBeforeKeyDown = useCallback((event: KeyboardEvent) => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if(!hotInstance) return;

        const isNavigationKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key);
        const isShortcut = (event.metaKey || event.ctrlKey) && ['c', 'v', 'x', 'a'].includes(event.key.toLowerCase());

        if (isNavigationKey || isShortcut) {
            return;
        }

        const selected = hotInstance.getSelectedLast();
        if (selected) {
            const [, col] = selected;
            if (DIALOG_TRIGGER_COLUMNS.includes(col) && event.key.length === 1 && !event.altKey) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }
    }, []);

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
        getCellProperties,
        handleBeforeKeyDown,
        handleBeforeSetRangeEnd,
    };
}