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

/** Insert a new row at the given index */
export function insertRow(atIndex: number) {
  addRow(atIndex);
}

/** Transactional insert of a column */
export async function insertColumn(atIndex: number): Promise<void> {
  let committed = false;
  try {
    await dataService.addBulkColumns([atIndex]);
    await addVariable({ columnIndex: atIndex });
    addColumns([atIndex]);
    committed = true;
  } finally {
    if (!committed) {
      deleteColumns([atIndex]);
      const vars = getVariables();
      const rolledBack = vars.map(v =>
        v.columnIndex > atIndex ? { ...v, columnIndex: v.columnIndex - 1 } : v
      );
      await overwriteVariables(rolledBack);
    }
  }
}

/** Remove the specified rows */
export function removeRows(rows: number[]) {
  deleteRows(rows);
}

/** Remove the specified columns transactionally */
export async function removeColumns(startCol: number, count: number): Promise<void> {
  const indices = Array.from({ length: count }, (_, i) => startCol + i);
  await dataService.deleteBulkColumns(indices);
  for (const col of indices) await deleteVariable(col);
  deleteColumns(indices);
}

/** Apply alignment to given columns */
export async function applyAlignment(columns: number[], alignment: VariableAlign): Promise<void> {
  const vars = getVariables();
  for (const col of columns) {
    const v = vars.find(x => x.columnIndex === col);
    if (v && v.align !== alignment) await updateVariable(col, 'align', alignment);
  }
}
