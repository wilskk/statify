import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { VariableAlign } from '@/types/Variable';

/** Service layer for DataTable context menu operations */
export function insertRow(
  atIndex: number,
  addRow: (idx: number) => void = useDataStore.getState().addRow
) {
  addRow(atIndex);
}

export function insertColumn(
  atIndex: number,
  addVariable: (v: { columnIndex: number }) => void = useVariableStore.getState().addVariable,
  addColumns: (cols: number[]) => void = useDataStore.getState().addColumns
) {
  addVariable({ columnIndex: atIndex });
  addColumns([atIndex]);
}

export function removeRows(
  rows: number[],
  deleteRows: (rows: number[]) => void = useDataStore.getState().deleteRows
) {
  deleteRows(rows);
}

export function removeColumns(
  startCol: number,
  count: number,
  deleteVariable: (col: number) => void = useVariableStore.getState().deleteVariable,
  deleteColumns: (cols: number[]) => void = useDataStore.getState().deleteColumns
) {
  const colsToDelete: number[] = [];
  for (let i = 0; i < count; i++) {
    const col = startCol + i;
    deleteVariable(col);
    colsToDelete.push(col);
  }
  deleteColumns(colsToDelete);
}

export async function applyAlignment(
  columns: number[],
  alignment: VariableAlign,
  // @ts-ignore: default injector may have wider signature
  updateVariable: (col: number, key: string, value: any) => Promise<any> = useVariableStore.getState().updateVariable,
  getVariables: () => any[] = () => useVariableStore.getState().variables
): Promise<void> {
  for (const colIndex of columns) {
    const variable = getVariables().find(v => v.columnIndex === colIndex);
    if (variable && variable.align !== alignment) {
      await updateVariable(colIndex, 'align', alignment);
    }
  }
}
