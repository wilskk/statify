import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable } from '@/types/Variable';

// Data store operations
export const addRow = useDataStore.getState().addRow;
export const deleteRows = useDataStore.getState().deleteRows;
export const addColumns = useDataStore.getState().addColumns;
export const deleteColumns = useDataStore.getState().deleteColumns;
export const updateCells = useDataStore.getState().updateCells;

// Variable store operations
export const addVariable = (v: Partial<Variable>) => useVariableStore.getState().addVariable(v);
export const addMultipleVariables = useVariableStore.getState().addMultipleVariables;
export const deleteVariable = useVariableStore.getState().deleteVariable;
export const updateVariable = useVariableStore.getState().updateVariable;
export const ensureCompleteVariables = useVariableStore.getState().ensureCompleteVariables;

// Getter for variables array
export const getVariables = (): Variable[] => useVariableStore.getState().variables;
// Replace entire variables array at once
export const overwriteVariables = (newVariables: Variable[]) => useVariableStore.getState().overwriteVariables(newVariables);
