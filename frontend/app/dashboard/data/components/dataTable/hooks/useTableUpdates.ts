import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable } from '@/types/Variable';
import { toast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import Handsontable from 'handsontable';

/** Handle creation of new variables when data is pasted into spare columns */
async function handleNewColumns(
  updates: Array<{ row: number; col: number; value: string | number }>,
  currentVariables: Variable[],
) {
  const addVariablesAction = useVariableStore.getState().addVariables;

  const actualNumCols = currentVariables.length > 0 ? Math.max(...currentVariables.map(v => v.columnIndex)) + 1 : 0;
  const maxCol = updates.reduce((max, u) => Math.max(max, u.col), -1);

  if (maxCol < actualNumCols) return;

  const newColIndices = Array.from({ length: maxCol - actualNumCols + 1 }, (_, i) => actualNumCols + i);

  // Group updates by new column index
  const updatesByCol: Record<number, any[]> = {};
  updates.forEach(({ col, value }) => {
    if (col >= actualNumCols) {
      (updatesByCol[col] ||= []).push(value);
    }
  });

  // Create one variable definition for each new column, inferring type.
  const newVariableDefinitions = newColIndices.map(colIndex => {
    const vals = updatesByCol[colIndex] || [];
    const isNumericOnly = vals.every(v => {
      if (v === null || String(v).trim() === '') return true; // Treat empty as conforming
      const num = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
      return !isNaN(num);
    });

    const newVar: Partial<Variable> = {
      columnIndex: colIndex,
      type: isNumericOnly ? 'NUMERIC' : 'STRING',
    };
    return newVar;
  });

  try {
    // Pass both the definitions and the data to be applied atomically
    await addVariablesAction(newVariableDefinitions, updates);
  } catch (error) {
    console.error('Failed to add new variables/columns:', error);
    toast({
      variant: "destructive",
      title: "Error Creating Columns",
      description: "Could not add new columns automatically.",
    });
  }
}

/**
 * Custom hook to manage data updates via Handsontable change events.
 * It handles data validation, type enforcement, and state persistence.
 */
export const useTableUpdates = (viewMode: 'numeric' | 'label') => {
    const variables = useVariableStore(state => state.variables);
    const updateCells = useDataStore(state => state.updateCells);
    const updateMultipleFields = useVariableStore(state => state.updateMultipleFields);

    // Debounced version of updateCells for performance
    const debouncedUpdateCells = useCallback(debounce(updateCells, 200), [updateCells]);

    const handleBeforeChange = useCallback(
        (changes: (Handsontable.CellChange | null)[] | null, source: string): void | boolean => {
            if (source === 'loadData' || !changes) {
                return;
            }

            for (const change of changes) {
                if (!change) continue;
                const [, , , newValue] = change;
                const col = change[1] as number;
                const variable = variables.find(v => v.columnIndex === col);
                
                if (variable?.type === 'STRING' && newValue && newValue.length > variable.width) {
                    change[3] = newValue.substring(0, variable.width);
                } else if (variable?.type === 'DATE' && newValue && typeof newValue === 'string') {
                    // Manually parse DD-MM-YYYY to avoid `new Date()` ambiguity.
                    const parts = newValue.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
                    if (parts) {
                        const day = parseInt(parts[1], 10);
                        const month = parseInt(parts[2], 10);
                        const year = parseInt(parts[3], 10);

                        // Validate the parsed date (e.g., checks for Feb 30)
                        const testDate = new Date(year, month - 1, day);
                        if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
                            // If valid, re-format to the consistent DD-MM-YYYY with padding
                            change[3] = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
                        }
                    }
                    // If format is invalid, it will be caught by the validator later.
                }
            }
            return;
        },
        [variables]
    );

    const handleAfterChange = useCallback(
        async (changes: Handsontable.CellChange[] | null, source: string) => {
            if (!changes || source === 'loadData' || source === 'updateData') {
             return;
         }
 
             try {
                 const variableMap = new Map<number, Variable>(variables.map(v => [v.columnIndex, v]));
 
                 const validUpdates = changes
                     .filter((change): change is Handsontable.CellChange => !!change && change[2] !== change[3])
                     .map(([row, col, , newValue]) => {
                         const columnIdx = col as number;
                         let valueToSave = newValue;
 
                         // If in label view, convert the edited label back to its underlying value
                         if (viewMode === 'label') {
                             const variable = variableMap.get(columnIdx);
                             if (variable?.values?.length) {
                                 const match = variable.values.find(v => v.label === newValue);
                                 if (match) {
                                     valueToSave = match.value;
                                 }
                             }
                         }
                         return { row, col: columnIdx, value: valueToSave };
                     });
 
                 if (validUpdates.length === 0) return;
 
                 const actualNumCols = variables.length > 0 ? Math.max(...variables.map(v => v.columnIndex)) + 1 : 0;
                 
                 const updatesForNewCols = validUpdates.filter(u => u.col >= actualNumCols);
                 const updatesForExistingCols = validUpdates.filter(u => u.col < actualNumCols);
 
                 // Handle new column creation and their initial data atomically
                 if (updatesForNewCols.length > 0) {
                     await handleNewColumns(updatesForNewCols, variables);
                 }
 
                 // Handle updates for existing columns
                 if (updatesForExistingCols.length > 0) {
                     debouncedUpdateCells(updatesForExistingCols);
                 }
 
             } catch (error) {
                 console.error("Error processing changes:", error);
                 toast({
                     variant: "destructive",
                     title: "Terjadi Kesalahan",
                     description: "Perubahan Anda tidak dapat disimpan.",
                 });
             }
        },
        [variables, debouncedUpdateCells, viewMode]
    );

     const handleAfterColumnResize = useCallback((newSize: number, col: number) => {
         const variable = variables.find(v => v.columnIndex === col);
         if (variable && variable.columns !== newSize) {
             const newWidth = Math.max(20, newSize); 
             updateMultipleFields(variable.name, { columns: newWidth });
         }
     }, [variables, updateMultipleFields]);

    const handleAfterValidate = (isValid: boolean, value: any, row: number, prop: any) => {};

    return {
        handleBeforeChange,
        handleAfterChange,
        handleAfterColumnResize,
        handleAfterValidate
    };
};
