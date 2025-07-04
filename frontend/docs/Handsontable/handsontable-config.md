# Handsontable Configuration Options

## Introduction
Handsontable provides a wide range of configuration options to customize the behavior and appearance of your data grid. These options can be set at different levels: globally, per column, per row, or per individual cell.

## Core Configuration

### Data Management
- `data`: Sets the initial data (array of arrays or array of objects)
- `dataSchema`: Defines the structure for new rows
- `dataDotNotation`: Controls dot notation for nested objects (default: `true`)
- `startRows`: Initial number of rows (default: `5`)
- `startCols`: Initial number of columns (default: `5`)
- `minRows`: Minimum number of rows
- `maxRows`: Maximum number of rows
- `minCols`: Minimum number of columns
- `maxCols`: Maximum number of columns

### Layout
- `width`: Table width (pixels, percentage, or `'auto'`)
- `height`: Table height (pixels, percentage, or `'auto'`)
- `rowHeaders`: Enable/disable row headers (default: `false`)
- `colHeaders`: Enable/disable column headers (default: `false`)
- `rowHeaderWidth`: Width of row headers (pixels)
- `colWidths`: Column widths (pixels or array of widths)
- `rowHeights`: Row heights (pixels or array of heights)
- `autoRowSize`: Auto-size rows (default: `undefined`)
- `autoColumnSize`: Auto-size columns (default: `undefined`)

### Styling
- `className`: CSS class(es) for the entire table
- `tableClassName`: CSS class for the table element
- `currentRowClassName`: Class for currently selected rows
- `currentColClassName`: Class for currently selected columns
- `activeHeaderClassName`: Class for active headers (default: `'ht__active_highlight'`)
- `invalidCellClassName`: Class for invalid cells (default: `'htInvalid'`)
- `readOnlyCellClassName`: Class for read-only cells
- `placeholderCellClassName`: Class for empty cells
- `noWordWrapClassName`: Class for non-wrapped cells

## Cell Types

### Common Cell Properties
- `type`: Cell type (text, numeric, date, etc.)
- `readOnly`: Make cells read-only
- `className`: CSS class(es) for cells
- `renderer`: Custom cell renderer function
- `editor`: Custom cell editor
- `validator`: Cell validation function

### Available Cell Types
1. **Text**
   ```javascript
   {
     type: 'text',
     // Optional: trim whitespace
     trimWhitespace: true
   }
   ```

2. **Numeric**
   ```javascript
   {
     type: 'numeric',
     numericFormat: {
       pattern: '0,0.00 $',
       culture: 'en-US'
     }
   }
   ```

3. **Date**
   ```javascript
   {
     type: 'date',
     dateFormat: 'YYYY-MM-DD',
     correctFormat: true,
     defaultDate: null,
     datePickerConfig: {
       // datepicker.js options
     }
   }
   ```

4. **Checkbox**
   ```javascript
   {
     type: 'checkbox',
     checkedTemplate: true,    // Value when checked
     uncheckedTemplate: false  // Value when unchecked
   }
   ```

5. **Dropdown**
   ```javascript
   {
     type: 'dropdown',
     source: ['Option 1', 'Option 2', 'Option 3'],
     strict: true,  // Only allow values from source
     allowInvalid: false
   }
   ```

## Plugins

### Column Sorting
```javascript
columnSorting: {
  initialConfig: {
    column: 0,          // Column index to sort initially
    sortOrder: 'asc'    // 'asc' or 'desc'
  },
  indicator: true,     // Show sort indicator
  headerAction: true,  // Enable/disable header click to sort
  sortEmptyCells: true // Include empty cells in sort
}
```

### Context Menu
```javascript
contextMenu: [
  'row_above',
  'row_below',
  '---------',
  'remove_row',
  '---------',
  'undo',
  'redo'
]
```

### Copy/Paste
```javascript
copyPaste: {
  columnsLimit: 50,      // Max columns to copy
  rowsLimit: 1000,       // Max rows to copy
  pasteMode: 'overwrite', // 'overwrite', 'shift_down', 'shift_right'
  copyColumnHeaders: false,
  copyColumnGroupHeaders: false
}
```

### Filters
```javascript
filters: true
```

### Merge Cells
```javascript
mergeCells: [
  {row: 0, col: 0, rowspan: 2, colspan: 2}
]
```

## Performance Optimization

### Virtual Rendering
- `renderAllRows`: Render all rows (default: `false`)
- `renderAllColumns`: Render all columns (default: `false`)
- `viewportRowRenderingOffset`: Number of rows to render outside viewport (default: `'auto'`)
- `viewportColumnRenderingOffset`: Number of columns to render outside viewport (default: `'auto'`)

### Batch Operations
```javascript
// Batch multiple operations for better performance
hot.batch(() => {
  hot.setDataAtCell(0, 0, 'A1');
  hot.setDataAtCell(0, 1, 'B1');
  hot.setDataAtCell(1, 0, 'A2');
});
```

## Internationalization
- `language`: Language code (e.g., 'en-US', 'pl-PL')
- `locale`: Locale configuration object
- `layoutDirection`: 'ltr' or 'rtl' (default: 'ltr')

## Advanced Configuration

### Nested Headers
```javascript
nestedHeaders: [
  ['A', {label: 'B', colspan: 2}, 'C'],
  ['D', 'E', 'F']
]
```

### Hidden Rows/Columns
```javascript
// Hide rows
hiddenRows: {
  rows: [1, 2, 5],
  indicators: true
}

// Hide columns
hiddenColumns: {
  columns: [0, 2],
  indicators: true
}
```

### Comments
```javascript
comments: {
  displayDelay: 250,  // ms
  readOnly: false,
  style: {
    width: 300,
    height: 100
  }
}
```

## Complete Configuration Example

```javascript
const config = {
  // Core
  data: [],
  width: '100%',
  height: 400,
  rowHeaders: true,
  colHeaders: true,
  
  // Styling
  className: 'my-custom-class',
  
  // Columns
  columns: [
    { type: 'text' },
    { type: 'numeric', format: '0,0.00 $' },
    { type: 'date', dateFormat: 'YYYY-MM-DD' },
    { type: 'dropdown', source: ['Option 1', 'Option 2'] }
  ],
  
  // Plugins
  columnSorting: true,
  filters: true,
  contextMenu: true,
  
  // Performance
  renderAllRows: false,
  viewportRowRenderingOffset: 20,
  
  // Internationalization
  language: 'en-US',
  layoutDirection: 'ltr'
};
```

## Best Practices
1. **Batch Operations**: Use `batch()` for multiple data operations
2. **Virtual Rendering**: Keep `renderAllRows` and `renderAllColumns` as `false` for large datasets
3. **Column Types**: Always specify column types for better performance and user experience
4. **Validation**: Implement proper validation for user input
5. **Performance Monitoring**: Use Chrome DevTools to monitor rendering performance

## See Also
- [Handsontable Core API](./handsontable-core.md)
- [Handsontable Hooks](./handsontable-hooks.md)
