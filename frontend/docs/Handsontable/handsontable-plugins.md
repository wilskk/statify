# Handsontable Plugins

## Introduction

Handsontable provides a variety of plugins that extend the core functionality of the data grid. These plugins can be enabled or disabled based on your specific requirements.

## Available Plugins

| Plugin Name | Description |
|------------|-------------|
| [AutoColumnSize](#autocolumnsize) | Automatically adjusts the column's width to the size of the content. |
| [AutoRowSize](#autorowsize) | Automatically adjusts the row's height to the size of the content. |
| [Autofill](#autofill) | Drag the fill handle to fill cells with data series. |
| [BindRowsWithHeaders](#bindrowswithheaders) | Locks row numbers to headers when scrolling. |
| [CollapsibleColumns](#collapsiblecolumns) | Expand and collapse column groups. |
| [ColumnSorting](#columnsorting) | Sort data in ascending or descending order. |
| [ColumnSummary](#columnsummary) | Display calculations like average, sum, max, min. |
| [Comments](#comments) | Add notes to cells. |
| [ContextMenu](#contextmenu) | Right-click context menu. |
| [CopyPaste](#copypaste) | Copy, cut, and paste data. |
| [CustomBorders](#customborders) | Apply custom borders to cells or ranges. |
| [DragToScroll](#dragtoscroll) | Drag outside viewport to scroll. |
| [DropdownMenu](#dropdownmenu) | Add menu to column headers. |
| [ExportFile](#exportfile) | Export data to CSV. |
| [Filters](#filters) | Filter rows based on criteria. |
| [Formulas](#formulas) | Use Excel-like functions in cells. |
| [HiddenColumns](#hiddencolumns) | Hide specific columns. |
| [HiddenRows](#hiddenrows) | Hide specific rows. |
| [ManualColumnFreeze](#manualcolumnfreeze) | Pin columns to the left. |
| [ManualColumnMove](#manualcolumnmove) | Reorder columns by dragging. |
| [ManualColumnResize](#manualcolumnresize) | Resize columns by dragging. |
| [ManualRowMove](#manualrowmove) | Reorder rows by dragging. |
| [ManualRowResize](#manualrowresize) | Resize rows by dragging. |
| [MergeCells](#mergecells) | Merge cells across rows/columns. |
| [MultiColumnSorting](#multicolumnsorting) | Sort by multiple columns. |
| [NestedHeaders](#nestedheaders) | Create hierarchical column headers. |
| [NestedRows](#nestedrows) | Handle tree/parent-child data. |
| [PersistentState](#persistentstate) | Save state in local storage. |
| [Search](#search) | Search across the table. |
| [TrimRows](#trimrows) | Exclude specific rows from rendering. |
| [UndoRedo](#undoredo) | Undo or redo changes. |

## Plugin Details

### AutoColumnSize
Automatically adjusts column widths based on content.

```javascript
new Handsontable(container, {
  autoColumnSize: true
});
```

### AutoRowSize
Automatically adjusts row heights based on content.

```javascript
new Handsontable(container, {
  autoRowSize: true
});
```

### Autofill
Enables fill handle for data series.

```javascript
new Handsontable(container, {
  fillHandle: true
});
```

### BindRowsWithHeaders
Locks row numbers to headers when scrolling.

```javascript
new Handsontable(container, {
  bindRowsWithHeaders: true
});
```

### CollapsibleColumns
Allows expanding/collapsing column groups.

```javascript
new Handsontable(container, {
  collapsibleColumns: true
});
```

### ColumnSorting
Enables column sorting functionality.

```javascript
new Handsontable(container, {
  columnSorting: true
});
```

### ColumnSummary
Adds summary calculations to columns.

```javascript
new Handsontable(container, {
  colHeaders: true,
  columnSummary: [
    {
      destinationRow: 0,
      destinationColumn: 0,
      type: 'sum',
      forceNumeric: true
    }
  ]
});
```

### Comments
Adds comments to cells.

```javascript
new Handsontable(container, {
  comments: true
});
```

### ContextMenu
Adds right-click context menu.

```javascript
new Handsontable(container, {
  contextMenu: true
});
```

### CopyPaste
Enables copy/paste functionality.

```javascript
new Handsontable(container, {
  copyPaste: true
});
```

### CustomBorders
Allows custom cell borders.

```javascript
new Handsontable(container, {
  customBorders: true
});
```

### DragToScroll
Enables drag-to-scroll functionality.

```javascript
new Handsontable(container, {
  dragToScroll: true
});
```

### DropdownMenu
Adds dropdown menu to column headers.

```javascript
new Handsontable(container, {
  dropdownMenu: true
});
```

### ExportFile
Enables data export to CSV.

```javascript
new Handsontable(container, {
  exportFile: true
});
```

### Filters
Adds filtering capabilities.

```javascript
new Handsontable(container, {
  filters: true
});
```

### Formulas
Enables Excel-like formulas.

```javascript
new Handsontable(container, {
  formulas: true
});
```

### HiddenColumns
Allows hiding specific columns.

```javascript
new Handsontable(container, {
  hiddenColumns: true
});
```

### HiddenRows
Allows hiding specific rows.

```javascript
new Handsontable(container, {
  hiddenRows: true
});
```

### ManualColumnFreeze
Allows freezing columns.

```javascript
new Handsontable(container, {
  manualColumnFreeze: true
});
```

### ManualColumnMove
Enables column reordering by drag and drop.

```javascript
new Handsontable(container, {
  manualColumnMove: true
});
```

### ManualColumnResize
Enables manual column resizing.

```javascript
new Handsontable(container, {
  manualColumnResize: true
});
```

### ManualRowMove
Enables row reordering by drag and drop.

```javascript
new Handsontable(container, {
  manualRowMove: true
});
```

### ManualRowResize
Enables manual row resizing.

```javascript
new Handsontable(container, {
  manualRowResize: true
});
```

### MergeCells
Allows merging cells.

```javascript
new Handsontable(container, {
  mergeCells: true
});
```

### MultiColumnSorting
Enables sorting by multiple columns.

```javascript
new Handsontable(container, {
  multiColumnSorting: true
});
```

### NestedHeaders
Enables hierarchical column headers.

```javascript
new Handsontable(container, {
  nestedHeaders: [
    ['A', { label: 'B', colspan: 2 }, 'C'],
    ['D', 'E', 'F']
  ]
});
```

### NestedRows
Enables tree/parent-child data structures.

```javascript
new Handsontable(container, {
  data: getData(),
  nestedRows: true
});
```

### PersistentState
Saves state in local storage.

```javascript
new Handsontable(container, {
  persistentState: true
});
```

### Search
Adds search functionality.

```javascript
new Handsontable(container, {
  search: true
});
```

### TrimRows
Excludes specific rows from rendering.

```javascript
new Handsontable(container, {
  trimRows: [1, 2, 5]
});
```

### UndoRedo
Adds undo/redo functionality.

```javascript
new Handsontable(container, {
  undo: true
});
```

## Enabling Multiple Plugins

You can enable multiple plugins by combining their configurations:

```javascript
new Handsontable(container, {
  colHeaders: true,
  rowHeaders: true,
  filters: true,
  dropdownMenu: true,
  contextMenu: true,
  manualRowMove: true,
  manualColumnMove: true,
  manualRowResize: true,
  manualColumnResize: true,
  persistentState: true
});
```

## Plugin Dependencies

Some plugins have dependencies on others. For example:
- `NestedHeaders` depends on `ColumnSorting`
- `Filters` depends on `DropdownMenu`

Make sure to include all required plugins in your configuration.
