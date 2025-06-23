# Handsontable Performance Optimization

## Table of Contents
- [Batch Operations](#batch-operations)
- [Rendering Optimization](#rendering-optimization)
- [Bundle Size Optimization](#bundle-size-optimization)
- [Row and Column Optimization](#row-and-column-optimization)
- [Styling and Layout](#styling-and-layout)

## Batch Operations

### Using batch() Method

The `batch()` method allows you to group multiple operations into a single render cycle, significantly improving performance.

```javascript
// Instead of multiple renders:
hot.alter('insert_row_above', 5, 45);
hot.setDataAtCell(1, 1, 'x');

// Use batch() for a single render:
hot.batch(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.setDataAtCell(1, 1, 'x');
  hot.selectCell(0, 0);
});
```

### Suspend/Resume Rendering

For more control, you can manually suspend and resume rendering:

```javascript
// Suspend rendering
hot.suspendRender();

// Perform multiple operations
hot.alter('insert_row_above', 5, 45);
hot.setDataAtCell(1, 1, 'x');

// Resume rendering (must match suspend calls)
hot.resumeRender();
```

## Rendering Optimization

### Virtualization

Enable row and column virtualization to only render visible cells:

```javascript
new Handsontable(container, {
  viewportRowRenderingOffset: 20,  // Render 20 rows before/after visible area
  viewportColumnRenderingOffset: 5  // Render 5 columns before/after visible area
});
```

### Disable Auto-Sizing

Disable auto-sizing for better performance with large datasets:

```javascript
new Handsontable(container, {
  autoRowSize: false,
  autoColumnSize: false,
  // Set fixed sizes instead
  rowHeights: 25,
  colWidths: 100
});
```

## Bundle Size Optimization

### Tree Shaking with ES Modules

Import only the modules you need:

```javascript
import Handsontable from 'handsontable/base';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';
import { registerCellType, DateCellType } from 'handsontable/cellTypes';

// Register only the plugins and cell types you need
registerPlugin(ContextMenu);
registerCellType(DateCellType);
```

### Optimize Moment.js

Reduce Moment.js bundle size by excluding unused locales:

1. In your webpack config:
```javascript
const webpack = require('webpack');

module.exports = {
  // ...
  plugins: [
    new webpack.IgnorePlugin(/\.\/locale$/, /moment$/),
  ],
};
```

2. Explicitly import only needed locales:
```javascript
import moment from 'moment';
import 'moment/locale/en-gb';

// Set the locale
moment.locale('en-gb');
```

## Row and Column Optimization

### Fixed Sizes

Define fixed row heights and column widths:

```javascript
new Handsontable(container, {
  // Fixed column widths
  colWidths: [50, 150, 45],
  
  // Fixed row heights
  rowHeights: [30, 30, 30, 30],
  
  // Or uniform size for all rows/columns
  rowHeights: 25,
  colWidths: 100
});
```

### Virtualization Settings

Optimize virtualization for your use case:

```javascript
new Handsontable(container, {
  // Number of rows to render outside the visible area
  viewportRowRenderingOffset: 20,
  
  // Number of columns to render outside the visible area
  viewportColumnRenderingOffset: 5,
  
  // Disable auto-sizing for better performance
  autoRowSize: false,
  autoColumnSize: false
});
```

## Styling and Layout

### CSS Optimizations

- Avoid complex CSS selectors
- Minimize the use of CSS transitions and animations
- Use CSS transforms instead of top/left for animations
- Keep your CSS specificity low

### Reduce DOM Complexity

- Minimize the number of nested elements in cell renderers
- Use simple cell templates
- Avoid complex DOM manipulations in renderers

## Performance Monitoring

Use browser dev tools to identify performance bottlenecks:

1. **Performance Tab**: Record and analyze runtime performance
2. **Memory Tab**: Check for memory leaks
3. **Coverage Tab**: Identify unused JavaScript and CSS

## Best Practices

1. **Batch Operations**: Always batch multiple operations
2. **Virtualization**: Enable and tune virtualization settings
3. **Selective Imports**: Only import what you need
4. **Fixed Sizes**: Define fixed sizes when possible
5. **Minimize Renders**: Avoid unnecessary renders
6. **Optimize Data**: Keep your data structure flat and simple
7. **Use Latest Version**: Always use the latest version of Handsontable

## Troubleshooting

If you experience performance issues:

1. Check for unnecessary re-renders
2. Verify you're using the latest version
3. Profile your application to find bottlenecks
4. Consider implementing virtual scrolling for very large datasets
5. Check for memory leaks in your application code
