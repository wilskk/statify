import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';

// Core store operations
export const addRow = useDataStore.getState().addRow;
export const deleteRows = useDataStore.getState().deleteRows;
export const addColumns = useDataStore.getState().addColumns;
export const deleteColumns = useDataStore.getState().deleteColumns;
export const updateCells = useDataStore.getState().updateCells;

// Variable store operations
export const addVariable = useVariableStore.getState().addVariable;
export const addMultipleVariables = useVariableStore.getState().addMultipleVariables;
export const deleteVariable = useVariableStore.getState().deleteVariable;
export const updateVariable = useVariableStore.getState().updateVariable;
export const ensureCompleteVariables = useVariableStore.getState().ensureCompleteVariables;

// Get or replace full variables
export const getVariables = () => useVariableStore.getState().variables;
export const overwriteVariables = useVariableStore.getState().overwriteVariables;
