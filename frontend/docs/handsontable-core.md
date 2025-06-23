# Handsontable Core API

## Introduction
Handsontable Core provides a powerful API for interacting with the Handsontable grid. This document covers the core methods and properties available in the Handsontable instance.

## Core Methods

### Data Manipulation
- `loadData(data, [source])` - Replaces the grid's data with a new dataset
- `getData([row], [column], [row2], [column2])` - Gets data from the grid
- `setDataAtCell(row, column, value, [source])` - Sets a value at specific cell
- `getDataAtCell(row, column)` - Gets value from specific cell
- `populateFromArray(row, column, input, [endRow], [endCol], [source], [method])` - Populates cells with 2D array

### Selection
- `selectCell(row, column, [endRow], [endCol], [scrollToCell], [changeFocus])` - Selects cell
- `getSelected()` - Gets indexes of selected cells
- `getSelectedLast()` - Gets last selected range
- `deselectCell()` - Deselects current selection

### Dimensions
- `getColWidth(column)` - Gets column width
- `getRowHeight(row)` - Gets row height
- `countCols()` - Gets total number of visible columns
- `countRows()` - Gets total number of visible rows

### Hooks
- `addHook(key, callback, [orderIndex])` - Adds hook listener
- `removeHook(key)` - Removes hook listener
- `runHooks(key, [p1], [p2], [p3], [p4], [p5], [p6])` - Runs hook callbacks

### Plugins
- `getPlugin(pluginName)` - Gets plugin instance
- `updateSettings(settings, [init])` - Updates settings

### Utilities
- `destroy()` - Destroys Handsontable instance
- `render()` - Rerenders the table
- `updateData(data)` - Updates data without resetting states
- `validateCells([validCallback])` - Validates all cells

## Properties
- `isDestroyed` - Indicates if instance is destroyed
- `rootElement` - Root DOM element
- `rootDocument` - Reference to document
- `rootWindow` - Reference to window

## Events
Handsontable provides numerous events through the hook system. Some commonly used events:
- `afterChange` - After cell value is changed
- `afterSelection` - After cell selection changes
- `beforeDestroy` - Before instance is destroyed
- `afterRender` - After table is rendered
- `afterCreateRow` - After row is created
- `afterRemoveRow` - After row is removed

## Example Usage
```javascript
// Initialize Handsontable
const hot = new Handsontable(container, {
  data: [[1, 2, 3], [4, 5, 6]],
  rowHeaders: true,
  colHeaders: true
});

// Get data
const data = hot.getData();

// Set data
hot.setDataAtCell(0, 0, 'New Value');

// Add hook
hot.addHook('afterChange', (changes, source) => {
  console.log('Data changed:', changes);
});
```

## Notes
- Methods that modify data trigger change events
- Most methods accept visual indexes
- Some methods have corresponding plugin-specific versions
- Always clean up hooks when destroying instances
