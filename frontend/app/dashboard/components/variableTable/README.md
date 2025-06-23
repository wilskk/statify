# VariableTable Component

Configurable interface for dataset variable metadata in the Statify Dashboard. Allows editing variable properties (name, type, width, decimals, label, values, missing, column mapping, alignment, measure, role) with inline validation and dialog-driven inputs.

---

## Table of Contents

1. [Overview](#overview)
2. [Features & Algorithms](#features--algorithms)
3. [File Structure](#file-structure)
4. [Detailed Descriptions](#detailed-descriptions)
   - [Constants](#constants)
   - [Table Config](#table-config)
   - [Hooks](#hooks)
   - [Dialogs](#dialogs)
   - [Utilities](#utilities)
5. [Getting Started](#getting-started)
6. [Contribution](#contribution)

---

## Overview

The VariableTable component renders a Handsontable grid for editing variable metadata. It integrates with global stores and uses dialogs for complex fields, triggers validation, and maintains minimum row counts.

---

## Features & Algorithms

### 1. Default Row Count
- **Algorithm**: Ensures at least `DEFAULT_MIN_ROWS` (default 50) are displayed plus one spare row for additions.

### 2. Column Definitions
- Defined in `tableConfig.ts`:
  - `colHeaders`: list of header labels.
  - `columns`: Handsontable settings per column (type, width, dropdown sources).

### 3. Inline Validation & Updates
- **Hooks**: `useVariableTableUpdates` listens to `beforeChange`/`afterChange` events:
  - Validates numeric fields (`width`, `decimals`).
  - Maps column index to variable property via `COLUMN_INDEX_TO_FIELD_MAP`.
  - Persists changes to `useVariableStore`.

### 4. Dialog-Driven Editing
- **Triggers**: Editing `type`, `values`, or `missing` columns opens custom dialogs.
- **Dialogs**: Provided by `useVariableTableDialogs` to manage open/close state and submission.

### 5. Event Handling & Logic
- **Logic Hook**: `useVariableTableLogic` aggregates table settings, dimensions, and integration points.
- **Event Hook**: `useVariableTableEvents` provides cell context menu and hotkey support.

### 6. Performance
- Memoized calculations (`useMemo`, `useCallback`) to minimize re-renders.
- Selective store subscriptions to avoid full-grid updates.

---

## File Structure

```
variableTable/
├── index.tsx                Main component (renders HotTable)
├── VariableTable.css        Styles for grid container
├── constants.ts             Default thresholds and index mappings
├── tableConfig.ts           Column headers and Handsontable settings
├── services/                (optional service functions)
├── hooks/                   Custom React hooks
│   ├── useVariableTableLogic.ts
│   ├── useVariableTableEvents.ts
│   ├── useVariableTableUpdates.ts
│   └── useVariableTableDialogs.ts
├── utils/                   Helper functions
│   ├── validators.ts        Field validation logic
│   └── formatters.ts        Value formatting utilities
└── README.md                This documentation
```

---

## Detailed Descriptions

### Constants

- `DEFAULT_MIN_ROWS` (50): Minimum number of rows displayed.
- `DEFAULT_VARIABLE_TYPE`, `DEFAULT_VARIABLE_WIDTH`, `DEFAULT_VARIABLE_DECIMALS`: Fallback values.
- `COLUMN_INDEX`: Maps field names to column indices.
- `COLUMN_INDEX_TO_FIELD_MAP`: Maps indices to variable property names.
- `DIALOG_TRIGGER_COLUMNS`: Columns that open dialogs.

### Table Config

- `colHeaders`: `['Name','Type','Width','Decimals','Label','Values','Missing','Columns','Align','Measure','Role']`
- `columns`: Settings per column (data index, type, dropdown sources, numeric format).

### Hooks

#### useVariableTableLogic
- Prepares grid settings: data array, dimensions, config.

#### useVariableTableEvents
- Handles context menu actions, keyboard shortcuts, and cell focus.

#### useVariableTableUpdates
- Validates and commits cell edits to store.
- Uses `COLUMN_INDEX_TO_FIELD_MAP` for property mapping.

#### useVariableTableDialogs
- Manages dialog state for complex fields (`type`, `values`, `missing`).
- Provides open/close handlers and submission callbacks.

### Dialogs

Located in `dialog/`:
- Custom React components for selecting variable types, editing value lists, and specifying missing codes.

### Utilities

- `validators.ts`: Ensures numeric and dropdown fields are valid.
- `formatters.ts`: Formats display values (e.g., decimals).

---

## Getting Started

1. Ensure global CSS includes Handsontable styles:
   ```css
   @import 'handsontable/dist/handsontable.full.min.css';
   ```
2. Import and render:
   ```tsx
   import VariableTable from '@/components/pages/dashboard/variableTable';
   <VariableTable />
   ```
3. Customize `DEFAULT_MIN_ROWS` or extend hooks/services as needed.

---

## Contribution

Contributions welcome! Please open issues or PRs following repository guidelines.
