import Handsontable from 'handsontable';
import { VariableAlign } from '@/types/Variable';

export interface ContextMenuHandlers {
  insertRow: (above: boolean) => void;
  insertColumn: (left: boolean) => void;
  removeRow: () => void;
  removeColumn: () => void;
  applyAlignment: (alignment: VariableAlign) => void;
  clearColumn: () => void;
  isRangeSelected: () => boolean;
}

/**
 * Returns a Handsontable context menu configuration based on provided handlers.
 */
export function getContextMenuConfig(
  handlers: ContextMenuHandlers
): Handsontable.GridSettings['contextMenu'] {
  const { insertRow, insertColumn, removeRow, removeColumn, applyAlignment, clearColumn, isRangeSelected } = handlers;
  const SEP = Handsontable.plugins.ContextMenu.SEPARATOR;
  return {
    items: {
      // Row operations
      row_above: { name: 'Insert row above', callback: () => insertRow(true), disabled: () => !isRangeSelected() },
      row_below: { name: 'Insert row below', callback: () => insertRow(false), disabled: () => !isRangeSelected() },
      remove_row: { name: 'Remove row(s)', callback: removeRow, disabled: () => !isRangeSelected() },
      sp1: SEP,
      // Column operations
      col_left: { name: 'Insert column left', callback: () => insertColumn(true), disabled: () => !isRangeSelected() },
      col_right: { name: 'Insert column right', callback: () => insertColumn(false), disabled: () => !isRangeSelected() },
      remove_col: { name: 'Remove column(s)', callback: removeColumn, disabled: () => !isRangeSelected() },
      sp2: SEP,
      // Clipboard operations
      copy: { name: 'Copy', disabled: () => !isRangeSelected() },
      cut: { name: 'Cut', disabled: () => !isRangeSelected() },
      sp3: SEP,
      // Alignment
      alignment: {
        name: 'Alignment', disabled: () => !isRangeSelected(), submenu: {
          items: [
            { key: 'alignment:left', name: 'Left', callback: () => applyAlignment('left') },
            { key: 'alignment:center', name: 'Center', callback: () => applyAlignment('center') },
            { key: 'alignment:right', name: 'Right', callback: () => applyAlignment('right') },
          ],
        },
      },
      sp4: SEP,
      // Clear contents
      clear_contents: { name: 'Clear contents', callback: clearColumn, disabled: () => !isRangeSelected() },
    },
  };
}
