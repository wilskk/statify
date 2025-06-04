import Handsontable from 'handsontable';
import { VariableAlign } from '@/types/Variable';

export interface ContextMenuHandlers {
  insertRow: (above: boolean) => void;
  insertColumn: (left: boolean) => void;
  removeRow: () => void;
  removeColumn: () => void;
  applyAlignment: (alignment: VariableAlign) => void;
  isRangeSelected: () => boolean;
}

/**
 * Returns a Handsontable context menu configuration based on provided handlers.
 */
export function getContextMenuConfig(
  handlers: ContextMenuHandlers
): Handsontable.GridSettings['contextMenu'] {
  const { insertRow, insertColumn, removeRow, removeColumn, applyAlignment, isRangeSelected } = handlers;
  return {
    items: {
      row_above: { name: 'Insert row above', callback: () => insertRow(true), disabled: () => !isRangeSelected() },
      row_below: { name: 'Insert row below', callback: () => insertRow(false), disabled: () => !isRangeSelected() },
      col_left: { name: 'Insert column left', callback: () => insertColumn(true), disabled: () => !isRangeSelected() },
      col_right: { name: 'Insert column right', callback: () => insertColumn(false), disabled: () => !isRangeSelected() },
      sp1: Handsontable.plugins.ContextMenu.SEPARATOR,
      remove_row: { name: 'Remove row(s)', callback: removeRow, disabled: () => !isRangeSelected() },
      remove_col: { name: 'Remove column(s)', callback: removeColumn, disabled: () => !isRangeSelected() },
      sp2: Handsontable.plugins.ContextMenu.SEPARATOR,
      copy: { name: 'Copy', disabled: () => !isRangeSelected() },
      cut: { name: 'Cut', disabled: () => !isRangeSelected() },
      sp3: Handsontable.plugins.ContextMenu.SEPARATOR,
      alignment: {
        name: 'Alignment',
        disabled: () => !isRangeSelected(),
        submenu: {
          items: [
            { key: 'alignment:left', name: 'Left', callback: () => applyAlignment('left') },
            { key: 'alignment:center', name: 'Center', callback: () => applyAlignment('center') },
            { key: 'alignment:right', name: 'Right', callback: () => applyAlignment('right') },
          ],
        },
      },
    },
  };
}
