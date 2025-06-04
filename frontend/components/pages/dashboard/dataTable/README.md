# DataTable Component

Comprehensive, configurable data table for the Statify Dashboard, built on Handsontable. Supports dynamic dimensions, custom context menus, data binding, validation, and performance optimizations.

---

## Table of Contents

1. [Overview](#overview)
2. [Features & Algorithms](#features--algorithms)
3. [File Structure](#file-structure)
4. [Detailed Descriptions](#detailed-descriptions)
   - [Hooks](#hooks)
   - [Service Layer](#service-layer)
   - [Utilities](#utilities)
   - [Types](#types)
5. [Getting Started](#getting-started)
6. [Contribution](#contribution)

---

## Overview

The DataTable component renders a spreadsheet-like interface for dataset inspection and manipulation. It integrates with global stores for data and variables, and exposes extension points via hooks and services.

---

## Features & Algorithms

### 1. Dynamic Rows & Columns
- **Algorithm**: Combines data length, highest variable column index, and minimum thresholds (`MIN_ROWS`, `MIN_COLS`) to compute:
  - `actualNumRows` = `data.length`
  - `actualNumCols` = max(highest variable index + 1, first row length)
  - `targetVisualDataRows` = max(`actualNumRows`, `MIN_ROWS`)
  - `targetVisualDataCols` = max(`actualNumCols`, `MIN_COLS`)
  - Final display counts add a spare row/col for user-driven addition.

### 2. Data Binding & Updates
- **Hooks**: `useTableStructure` builds header labels, data matrix, and column config.
- **Updates**: `useTableUpdates` intercepts `beforeChange` and `afterChange` events to validate and persist edits to the global store.

### 3. Context Menu Operations
- Right-click menu for insert/remove rows/columns and alignment.
- **Service**: `contextMenuService` implements pure functions:
  - `insertRow(atIndex)`
  - `insertColumn(atIndex)`
  - `removeRows(start, end)`
  - `removeColumns(start, end)`
  - `applyAlignment(range, alignment)`
- **Config**: `menuConfig` maps menu labels to handler functions and icons.

### 4. Validation & Formatting
- Cell-level validation rules applied via Handsontable validators.
- Formatting utilities in `utils.ts` (e.g., numeric checks, default cell style).

### 5. Performance Optimizations
- Memoized hooks (`useMemo`) to avoid recomputation.
- Minimal re-renders via selective subscription to stores.

---

## File Structure

```
dataTable/
├── index.tsx                Main DataTable component (renders HotTable)
├── HandsontableWrapper.tsx  Default HotTable settings & license key
├── DataTable.css            Styles
├── services/
│   ├── contextMenuService.ts
│   └── menuConfig.ts
├── hooks/
│   ├── useTableDimensions.ts
│   ├── useTableStructure.ts
│   ├── useTableUpdates.ts
│   └── useContextMenuLogic.ts
├── utils/
│   ├── utils.ts
│   └── constants.ts
├── types.ts                 Shared TypeScript interfaces
└── README.md                This documentation
```

---

## Detailed Descriptions

### Hooks

#### useTableDimensions
Calculates both actual and visual dimensions:
1. Read `data` & `variables` from stores.
2. Compute `actualNumRows` and `actualNumCols`.
3. Enforce minimums (`MIN_ROWS`, `MIN_COLS`).
4. Add spare row/column for UX.

#### useTableStructure
- Builds column headers from variable metadata.
- Constructs 2D data array matching visual dimensions.
- Generates column configuration for Handsontable (type, width, renderer).

#### useTableUpdates
- Listens to `beforeChange` for preliminary validation.
- Commits valid changes to `useDataStore` after edit.
- Triggers callbacks for side-effects (e.g., recalculation).

#### useContextMenuLogic
- Aggregates menu items from `menuConfig`.
- Supplies props to HotTable context menu hook.

### Service Layer

#### contextMenuService.ts
Pure functions interacting with global stores:
- `insertRow(index: number): void`
- `insertColumn(index: number): void`
- `removeRows(start: number, end: number): void`
- `removeColumns(start: number, end: number): void`
- `applyAlignment(range: CellRange, alignment: Alignment): void`

#### menuConfig.ts
Defines menu categories and items:
- Labels, icons, disabled logic.
- Maps to handler functions in `contextMenuService`.

### Utilities

#### utils.ts
- Comparison helpers
- Default config generators
- Range parsing

#### constants.ts
- `MIN_ROWS`: Minimum number of rows (default: 5)
- `MIN_COLS`: Minimum number of columns (default: 3)

### Types

Shared interfaces for data, variables, and service function signatures.

---

## Getting Started

1. Ensure global CSS includes:
   ```css
   @import 'handsontable/dist/handsontable.full.min.css';
   ```
2. Import and render:
   ```tsx
   import DataTable from '@/components/pages/dashboard/dataTable';
   <DataTable />
   ```
3. Customize via props or extend hooks/services.

---

## Contribution

Contributions, issues, and feature requests welcome!
Please follow repository guidelines when submitting pull requests.
