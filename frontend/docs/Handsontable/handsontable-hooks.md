# Handsontable Hooks

## Introduction
Handsontable provides a comprehensive hook system that allows you to tap into various stages of the table's lifecycle and modify its behavior. Hooks are called at specific points during execution, allowing you to add custom functionality.

## Hook Categories

### Lifecycle Hooks
- `afterInit` - Fired after the Handsontable instance is initiated
- `afterLoadData` - Fired after data is loaded into the table
- `afterUpdateSettings` - Fired after updating table settings
- `afterDestroy` - Fired after destroying the Handsontable instance
- `afterPluginsInitialized` - Fired after all plugins are initialized

### Data Modification Hooks
- `afterChange` - Fired after cell values are changed
- `afterSetDataAtCell` - Fired after setting cell data
- `afterCreateRow` - Fired after creating a new row
- `afterCreateCol` - Fired after creating a new column
- `afterRemoveRow` - Fired after removing a row
- `afterRemoveCol` - Fired after removing a column

### Selection Hooks
- `afterSelection` - Fired after selecting cells
- `afterSelectionEnd` - Fired after completing cell selection
- `afterSelectRows` - Fired after selecting rows
- `afterSelectColumns` - Fired after selecting columns
- `afterDeselect` - Fired after deselecting cells

### Rendering Hooks
- `afterRender` - Fired after the table is rendered
- `afterRenderer` - Fired after rendering a cell
- `afterGetCellMeta` - Fired after getting cell metadata
- `afterRefreshDimensions` - Fired after table dimensions are refreshed
- `afterScroll` - Fired after scrolling the table

### Editor Hooks
- `afterBeginEditing` - Fired after opening the cell editor
- `afterValidate` - Fired after cell validation
- `beforeKeyDown` - Fired before processing keyboard input

## Common Hook Parameters

### Data Change Hooks
```javascript
afterChange: function(changes, source) {
  // changes: [[row, prop, oldValue, newValue], ...]
  // source: string indicating the source of change
}
```

### Selection Hooks
```javascript
afterSelection: function(row, column, row2, column2, preventScrolling, selectionLayerLevel) {
  // row, column: Starting coordinates
  // row2, column2: Ending coordinates
  // preventScrolling: Object to control scrolling behavior
  // selectionLayerLevel: Current selection layer
}
```

### Cell Rendering Hooks
```javascript
afterRenderer: function(TD, row, column, prop, value, cellProperties) {
  // TD: The cell's TD element
  // row, column: Cell coordinates
  // prop: Column property name
  // value: Cell value
  // cellProperties: Cell properties object
}
```

## Example Usage

### Basic Hook Registration
```javascript
const hot = new Handsontable(container, {
  data: [...],
  afterChange: function(changes, source) {
    if (source === 'edit') {
      console.log('Cell changed:', changes);
    }
  },
  afterSelection: function(row, column) {
    console.log('Selected cell:', row, column);
  }
});
```

### Using Multiple Hooks
```javascript
const hot = new Handsontable(container, {
  data: [...],
  afterInit() {
    console.log('Table initialized');
  },
  afterRender() {
    console.log('Table rendered');
  },
  afterUpdateSettings() {
    console.log('Settings updated');
  }
});
```

## Best Practices
1. **Performance**: Keep hook callbacks lightweight to maintain table performance
2. **Source Checking**: Always check the `source` parameter in change-related hooks to avoid infinite loops
3. **Cleanup**: Remove custom event listeners in the `afterDestroy` hook
4. **Async Operations**: Handle asynchronous operations carefully within hooks to prevent race conditions
5. **Error Handling**: Implement proper error handling within hooks to prevent uncaught exceptions

## Common Patterns

### Debouncing Expensive Operations
```javascript
let renderDebounce;
const hot = new Handsontable(container, {
  // ... other options ...
  afterChange: function() {
    clearTimeout(renderDebounce);
    renderDebounce = setTimeout(() => {
      // Perform expensive operation
    }, 100);
  }
});
```

### Conditional Cell Styling
```javascript
afterRenderer: function(TD, row, column, prop, value) {
  if (value > 100) {
    TD.style.color = 'red';
  }
}
```

## Plugin-Specific Hooks
Many plugins provide their own hooks. For example:

### Column Sorting
- `afterColumnSort` - Fired after sorting columns
- `beforeColumnSort` - Fired before sorting columns

### Context Menu
- `afterContextMenuShow` - Fired after showing the context menu
- `afterContextMenuHide` - Fired after hiding the context menu

### Undo/Redo
- `afterUndo` - Fired after undoing an action
- `afterRedo` - Fired after redoing an action

## See Also
- [Handsontable Core API](./handsontable-core.md)
- [Handsontable Configuration Options](./handsontable-options.md)
