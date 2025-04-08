import React, { useRef, useMemo, useCallback } from 'react';
import { HotTableClass } from '@handsontable/react';
import Handsontable from 'handsontable';

import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable } from '@/types/Variable';
import { getColumnConfig, getDisplayMatrix, areValuesEqual } from './utils';
import { DEFAULT_MIN_COLUMNS } from './constants';

export const useDataTableLogic = (hotTableRef: React.RefObject<HotTableClass | null>) => {
    const pendingOperations = useRef<Array<{ type: string, payload: any }>>([]);
    const isProcessing = useRef(false);

    const {
        data,
        addRow,
        addColumn,
        deleteRow,
        deleteColumn,
        updateBulkCells,
        ensureMatrixDimensions
    } = useDataStore();

    const {
        variables,
        addVariable,
        deleteVariable,
        updateVariable,
        addMultipleVariables
    } = useVariableStore();

    const calculateColumnCount = () => {
        const columnCountFromData = data[0]?.length || 0;
        const maxVariableIndex = variables.length > 0
            ? Math.max(...variables.map(v => v.columnIndex))
            : -1;
        const variableBasedColumnCount = maxVariableIndex + 1;
        return Math.max(columnCountFromData, variableBasedColumnCount, DEFAULT_MIN_COLUMNS);
    };

    const numColumns = useMemo(calculateColumnCount, [data, variables]);

    const colHeaders = useMemo(() => {
        return Array.from({ length: numColumns }, (_, index) => {
            const variable = variables.find(v => v.columnIndex === index);
            return variable?.name || `var`;
        });
    }, [variables, numColumns]);

    const displayMatrix = useMemo(() => {
        const maxVariableIndex = variables.length > 0
            ? Math.max(...variables.map(v => v.columnIndex))
            : -1;
        const variableCount = maxVariableIndex + 1;
        return getDisplayMatrix(data, variableCount);
    }, [data, variables]);


    const columns = useMemo(() => {
        return Array.from({ length: numColumns }, (_, index) => {
            const variable = variables.find(v => v.columnIndex === index);
            return getColumnConfig(variable);
        });
    }, [variables, numColumns]);

    const processCellUpdates = useCallback(async (updatePayload: {
        changesByColumn: Record<number, Handsontable.CellChange[]>,
        maxModifiedColumn: number,
        maxModifiedRow: number
    }) => {
        const { changesByColumn, maxModifiedColumn, maxModifiedRow } = updatePayload;
        const maxExistingVarIndex = variables.length > 0 ? Math.max(...variables.map(v => v.columnIndex)) : -1;

        await ensureMatrixDimensions(maxModifiedRow + 1, Math.max(maxModifiedColumn, maxExistingVarIndex) + 1);

        const cellUpdates: { row: number; col: number; value: any }[] = [];

        for (const colIndexStr of Object.keys(changesByColumn)) {
            const columnIndex = Number(colIndexStr);
            const columnChanges = changesByColumn[columnIndex];
            const variable = variables.find(v => v.columnIndex === columnIndex) || null;

            for (const change of columnChanges) {
                if (!change) continue;
                const [row, , oldValue, newValue] = change;

                if (areValuesEqual(oldValue, newValue)) continue;

                let processedValue = newValue;

                if (variable) {
                    switch (variable.type) {
                        case 'NUMERIC':
                            if (newValue === '' || newValue === null || newValue === undefined) {
                                processedValue = null;
                            } else if (!isNaN(Number(newValue))) {
                                processedValue = Number(newValue);
                            } else {
                                console.warn(`Invalid numeric value skipped: Row ${row}, Col ${columnIndex}, Value: ${newValue}`);
                                continue;
                            }
                            break;
                        case 'STRING':
                            processedValue = (newValue === null || newValue === undefined) ? '' : String(newValue);
                            break;
                        case 'DATE':
                            processedValue = (newValue === '' || newValue === null || newValue === undefined) ? null : newValue;
                            break;
                        default:
                            processedValue = (newValue === null || newValue === undefined) ? '' : String(newValue);
                    }
                } else {
                    processedValue = (newValue === null || newValue === undefined) ? '' : String(newValue);
                }
                cellUpdates.push({ row, col: columnIndex, value: processedValue });
            }
        }

        if (cellUpdates.length > 0) {
            try {
                await updateBulkCells(cellUpdates);
            } catch (error) {
                console.error('Failed to update bulk cells:', error);
            }
        }
    }, [variables, ensureMatrixDimensions, updateBulkCells]);


    const processPendingOperations = useCallback(async () => {
        if (isProcessing.current || pendingOperations.current.length === 0) return;
        isProcessing.current = true;

        const operation = pendingOperations.current.shift();
        if (!operation) {
            console.error("Shifted operation is undefined");
            isProcessing.current = false;
            return;
        }

        try {
            switch (operation.type) {
                case 'CREATE_VARIABLES_AND_UPDATE':
                    const { newVariables, pendingChanges } = operation.payload;
                    await addMultipleVariables(newVariables);
                    await processCellUpdates(pendingChanges);
                    break;
                case 'UPDATE_CELLS':
                    await processCellUpdates(operation.payload);
                    break;
                default:
                    console.warn(`Unknown operation type: ${operation.type}`);
            }
        } catch (error) {
            console.error('Error processing operation:', error, operation);
        } finally {
            isProcessing.current = false;
            if (pendingOperations.current.length > 0) {
                queueMicrotask(processPendingOperations);
            }
        }
    }, [addMultipleVariables, processCellUpdates]);


    const handleBeforeChange = useCallback((
        changes: (Handsontable.CellChange | null)[],
        source: Handsontable.ChangeSource
    ): boolean | void => {
        if (source === 'loadData' || !changes) {
            return true;
        }

        const validChanges = changes.filter((change): change is Handsontable.CellChange => {
            if (!change) return false;
            const [, , oldValue, newValue] = change;
            return !areValuesEqual(oldValue, newValue);
        });

        if (validChanges.length === 0) {
            return false;
        }

        const changesByColumn: Record<number, Handsontable.CellChange[]> = {};
        let maxModifiedColumn = -1;
        let maxModifiedRow = -1;

        validChanges.forEach((change) => {
            const [row, col] = change;
            if (typeof col !== 'number' || typeof row !== 'number') return;

            maxModifiedColumn = Math.max(maxModifiedColumn, col);
            maxModifiedRow = Math.max(maxModifiedRow, row);

            if (!changesByColumn[col]) {
                changesByColumn[col] = [];
            }
            changesByColumn[col].push(change);
        });

        const cellUpdatePayload = { changesByColumn, maxModifiedColumn, maxModifiedRow };
        const maxExistingVarIndex = variables.length > 0 ? Math.max(...variables.map(v => v.columnIndex)) : -1;
        const newVariablesToCreate: Partial<Variable>[] = [];

        if (maxModifiedColumn > maxExistingVarIndex) {
            for (let columnIndex = maxExistingVarIndex + 1; columnIndex <= maxModifiedColumn; columnIndex++) {
                const columnSpecificChanges = changesByColumn[columnIndex];

                if (columnSpecificChanges && columnSpecificChanges.length > 0) {
                    let inferredType: Variable['type'] = 'STRING';
                    let inferredWidth = 8;
                    const allNumeric = columnSpecificChanges.every(change => {
                        const [, , , newValue] = change;
                        return newValue === '' || newValue === null || newValue === undefined || !isNaN(Number(newValue));
                    });

                    if (allNumeric) {
                        inferredType = 'NUMERIC';
                        inferredWidth = 8;
                    } else {
                        inferredType = 'STRING';
                        let maxLength = 0;
                        columnSpecificChanges.forEach(change => {
                            const [, , , newValue] = change;
                            const stringValue = (newValue === null || newValue === undefined) ? '' : String(newValue);
                            maxLength = Math.max(maxLength, stringValue.length);
                        });
                        inferredWidth = Math.max(maxLength, 1);
                    }
                    newVariablesToCreate.push({ columnIndex, type: inferredType, width: inferredWidth });
                } else {
                    newVariablesToCreate.push({
                        columnIndex: columnIndex,
                        type: 'STRING',
                        width: 8
                    });
                }
            }
        }

        if (newVariablesToCreate.length > 0) {
            pendingOperations.current.push({
                type: 'CREATE_VARIABLES_AND_UPDATE',
                payload: { newVariables: newVariablesToCreate, pendingChanges: cellUpdatePayload }
            });
        } else {
            pendingOperations.current.push({
                type: 'UPDATE_CELLS',
                payload: cellUpdatePayload
            });
        }

        if (!isProcessing.current) {
            queueMicrotask(processPendingOperations);
        }

        return true;
    }, [variables, processPendingOperations]);

    const handleAfterCreateRow = useCallback((index: number, amount: number, source?: Handsontable.ChangeSource) => {
        if (source === 'loadData') return;
        for (let i = 0; i < amount; i++) {
            addRow(index + i);
        }
    }, [addRow]);

    const handleAfterCreateCol = useCallback((index: number, amount: number, source?: Handsontable.ChangeSource) => {
        if (source === 'loadData') return;
        for (let i = 0; i < amount; i++) {
            const insertIndex = index + i;
            addColumn(insertIndex);
            addVariable({
                columnIndex: insertIndex,
                width: 8,
                type: 'STRING'
            });
        }
    }, [addColumn, addVariable]);

    const handleAfterRemoveRow = useCallback((index: number, amount: number, physicalRows: number[], source?: Handsontable.ChangeSource) => {
        if (source === 'loadData') return;
        for (let i = 0; i < amount; i++) {
            deleteRow(index);
        }
    }, [deleteRow]);

    const handleAfterRemoveCol = useCallback((index: number, amount: number, physicalCols: number[], source?: Handsontable.ChangeSource) => {
        if (source === 'loadData') return;
        const indicesToDelete = Array.from({ length: amount }, (_, i) => index + i).sort((a, b) => b - a);
        indicesToDelete.forEach(deleteIndex => {
            deleteColumn(deleteIndex);
            deleteVariable(deleteIndex);
        });
    }, [deleteColumn, deleteVariable]);

    const handleAfterColumnResize = useCallback((newSize: number, column: number, isDoubleClick: boolean) => {
        const variable = variables.find(v => v.columnIndex === column);
        if (variable && variable.width !== newSize) {
            updateVariable(column, 'width', newSize);
        }
    }, [variables, updateVariable]);

    const handleAfterValidate = useCallback((
        isValid: boolean,
        value: any,
        row: number,
        prop: string | number,
        source: Handsontable.ChangeSource
    ) => {
        if (!isValid && source !== 'loadData') {
            console.warn(`Validation failed - Row: ${row}, Col: ${prop}, Value: '${value}', Source: ${source}`);
        }
    }, []);

    const applyAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
        const hotInstance = hotTableRef.current?.hotInstance;
        const selectedRanges = hotInstance?.getSelectedRange();

        if (!hotInstance || !selectedRanges || selectedRanges.length === 0) {
            return;
        }

        const affectedColumns = new Set<number>();
        selectedRanges.forEach(range => {
            const startCol = Math.min(range.from.col, range.to.col);
            const endCol = Math.max(range.from.col, range.to.col);
            for (let col = startCol; col <= endCol; col++) {
                affectedColumns.add(col);
            }
        });

        affectedColumns.forEach(columnIndex => {
            const variable = variables.find(v => v.columnIndex === columnIndex);
            if (variable && variable.align !== alignment) {
                updateVariable(columnIndex, 'align', alignment);
            } else if (!variable) {
                console.warn(`Cannot set alignment for non-existent variable at column ${columnIndex}`);
            }
        });

        hotInstance.render();
    }, [variables, updateVariable, hotTableRef]);

    const contextMenuConfig = useMemo((): Handsontable.GridSettings['contextMenu'] => {
        const isRangeSelected = () => (hotTableRef.current?.hotInstance?.getSelectedRange()?.length ?? 0) > 0;

        return {
            items: {
                row_above: { name: 'Insert row above' },
                row_below: { name: 'Insert row below' },
                col_left: { name: 'Insert column left' },
                col_right: { name: 'Insert column right' },
                sp1: Handsontable.plugins.ContextMenu.SEPARATOR,
                remove_row: { name: 'Remove row(s)' },
                remove_col: { name: 'Remove column(s)' },
                sp2: Handsontable.plugins.ContextMenu.SEPARATOR,
                undo: { name: 'Undo' },
                redo: { name: 'Redo' },
                sp3: Handsontable.plugins.ContextMenu.SEPARATOR,
                alignment: {
                    name: 'Alignment',
                    disabled: () => !isRangeSelected(),
                    submenu: {
                        items: [
                            { key: 'alignment:left', name: 'Left', callback: () => applyAlignment('left') },
                            { key: 'alignment:center', name: 'Center', callback: () => applyAlignment('center') },
                            { key: 'alignment:right', name: 'Right', callback: () => applyAlignment('right') }
                        ]
                    }
                },
                sp4: Handsontable.plugins.ContextMenu.SEPARATOR,
                copy: { name: 'Copy' },
                cut: { name: 'Cut' },
                sp5: Handsontable.plugins.ContextMenu.SEPARATOR,
                clear_custom: {
                    name: 'Clear contents',
                    callback: () => hotTableRef.current?.hotInstance?.emptySelectedCells(),
                    disabled: () => !isRangeSelected()
                },
            }
        };
    }, [applyAlignment, hotTableRef]);


    return {
        displayMatrix,
        colHeaders,
        columns,
        contextMenuConfig,
        handleBeforeChange,
        handleAfterCreateRow,
        handleAfterCreateCol,
        handleAfterRemoveRow,
        handleAfterRemoveCol,
        handleAfterColumnResize,
        handleAfterValidate,
    };
};