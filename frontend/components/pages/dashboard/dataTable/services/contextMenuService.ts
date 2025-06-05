import {
  addRow,
  addColumns,
  deleteRows,
  deleteColumns,
  addVariable,
  deleteVariable,
  updateVariable,
  getVariables,
  overwriteVariables,
} from './storeOperations';
import { VariableAlign } from '@/types/Variable';
import dataService from '@/services/data/DataService';

/** Service layer for DataTable context menu operations */
export function insertRow(atIndex: number) {
  addRow(atIndex);
}

/**
 * Transactional insert column: persist data then variable store
 */
export async function insertColumn(atIndex: number): Promise<void> {
  try {
    // 1. Persist data column
    await dataService.addBulkColumns([atIndex]);
    // 2. Shift all existing variables by batch (preserve names)
    const existingVars = getVariables();
    const shiftedVars = existingVars.map(v =>
      v.columnIndex >= atIndex ? { ...v, columnIndex: v.columnIndex + 1 } : v
    );
    await overwriteVariables(shiftedVars);
    // 3. Insert new variable in persistent store
    await addVariable({ columnIndex: atIndex });
    // 4. Update in-memory data store
    addColumns([atIndex]);
  } catch (error) {
    console.error('Error inserting column transactionally:', error);
    // Rollback in-memory data column
    deleteColumns([atIndex]);
    // Rollback variable shifts and restore original state
    const currentVars = getVariables();
    // shift back variables that were shifted
    const rolledBack = currentVars.map(v =>
      v.columnIndex > atIndex ? { ...v, columnIndex: v.columnIndex - 1 } : v
    );
    await overwriteVariables(rolledBack);
    throw error;
  }
}

export function removeRows(rows: number[]) {
  deleteRows(rows);
}

/**
 * Transactional remove columns: persist data and variable store
 */
export async function removeColumns(startCol: number, count: number): Promise<void> {
  try {
    const indices = Array.from({ length: count }, (_, i) => startCol + i);
    // 1. Persist delete columns in data store
    await dataService.deleteBulkColumns(indices);
    // 2. Delete variables in persistent store
    for (const col of indices) {
      await deleteVariable(col);
    }
    // 3. Update in-memory data store
    deleteColumns(indices);
  } catch (error) {
    console.error('Error removing columns transactionally:', error);
    throw error;
  }
}

export async function applyAlignment(columns: number[], alignment: VariableAlign): Promise<void> {
  const vars = getVariables();
  for (const colIndex of columns) {
    const variable = vars.find((v) => v.columnIndex === colIndex);
    if (variable && variable.align !== alignment) {
      await updateVariable(colIndex, 'align', alignment);
    }
  }
}
