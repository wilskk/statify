# Variable Page - Va## Architecture Overviewiable Metadata Management Interface

> **Developer Documentation**: Comprehensive variable metadata management system with bulk editing capabilities, SPSS compatibility, and real-time validation.

## Directory Structure

```
variable/
├── page.tsx                 # Main variable page component
├── loading.tsx             # Suspense loading state for variable operations
└── components/
    └── variableTable/      # Variable metadata table system
        ├── index.tsx              # Main VariableTable component export
        ├── ColumnRenderer.tsx     # Dynamic column rendering system
        ├── DialogManager.tsx      # Edit dialog management
        ├── TableManager.tsx       # Table state coordination
        ├── README.md             # Component documentation
        └── __tests__/            # Jest/RTL component tests
```

## � Architecture Overview

### Component Hierarchy
```typescript
VariablePage
├── VariableTable
│   ├── TableManager (state coordination)
│   ├── ColumnRenderer (dynamic columns)
│   └── DialogManager (edit dialogs)
└── VariableActions (bulk operations, validation)
```

### State Management
```typescript
// Primary stores used
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useDataStore } from '@/stores/useDataStore';

// Variable state structure
interface VariableState {
  variables: Variable[];
  selectedVariables: string[];
  editingVariable: string | null;
  validationErrors: ValidationError[];
  bulkOperationMode: boolean;
}
```

### Data Model
```typescript
// Variable metadata structure
interface Variable {
  id: string;
  name: string;
  label: string;
  type: 'numeric' | 'string' | 'date';
  measure: 'scale' | 'ordinal' | 'nominal';
  decimals?: number;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  values?: ValueLabel[];
  missing?: MissingValue[];
  role?: 'input' | 'target' | 'both' | 'none';
}

// SPSS compatibility
interface SPSSVariable extends Variable {
  format: SPSSFormat;
  columns: number;
  spssType: number;
}
```

## Development Guidelines

### Component Implementation
```typescript
// Standard variable page pattern
export default function VariablePage() {
  const { variables, isLoading } = useVariableStore();
  const [editMode, setEditMode] = useState(false);
  const [selectedVars, setSelectedVars] = useState<string[]>([]);
  
  if (isLoading) {
    return <VariablePageLoading />;
  }
  
  return (
    <div className="variable-page">
      <VariableActions 
        selectedVariables={selectedVars}
        onBulkEdit={handleBulkEdit}
      />
      <VariableTable 
        variables={variables}
        editMode={editMode}
        onSelectionChange={setSelectedVars}
      />
    </div>
  );
}
```

### Validation Strategy
```typescript
// Variable validation rules
const validationRules = {
  name: {
    required: true,
    pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    maxLength: 64,
    unique: true
  },
  label: {
    maxLength: 255,
    optional: true
  },
  type: {
    required: true,
    enum: ['numeric', 'string', 'date']
  },
  measure: {
    required: true,
    enum: ['scale', 'ordinal', 'nominal']
  }
};

// Real-time validation
const validateVariable = (variable: Partial<Variable>) => {
  const errors: ValidationError[] = [];
  
  // Validate each field
  Object.keys(validationRules).forEach(field => {
    const rule = validationRules[field];
    const value = variable[field];
    
    if (rule.required && !value) {
      errors.push({ field, message: `${field} is required` });
    }
    
    // Additional validation logic...
  });
  
  return errors;
};
```

### Performance Optimization
```typescript
// Large variable set handling
const optimizations = {
  virtualizedTable: true,
  memoizedRendering: true,
  debouncedValidation: 300,
  batchUpdates: true
};

// Table virtualization
const tableConfig = {
  estimatedRowHeight: 40,
  bufferSize: 10,
  maxVisibleRows: 50,
  lazyRendering: true
};
```

## Core Components

### VariableTable Component
- **File**: `components/variableTable/index.tsx`
- **Purpose**: Main table interface for variable metadata
- **Features**:
  - Editable cells with real-time validation
  - Column sorting and filtering
  - Bulk selection and operations
  - Keyboard navigation (Excel-like)
  - Undo/redo functionality

```typescript
// VariableTable implementation
interface VariableTableProps {
  variables: Variable[];
  editMode: boolean;
  selectedVariables: string[];
  onVariableUpdate: (id: string, updates: Partial<Variable>) => void;
  onSelectionChange: (selectedIds: string[]) => void;
}

// Key features:
// - Optimistic updates with rollback
// - Cell-level validation feedback
// - Context menu for row operations
// - Drag and drop for reordering
```

### ColumnRenderer Component
- **File**: `components/variableTable/ColumnRenderer.tsx`
- **Purpose**: Dynamic column rendering based on data types
- **Features**:
  - Type-specific cell renderers
  - Custom input components (dropdowns, number inputs)
  - Validation indicator display
  - Formatting preview

```typescript
// Column renderer types
interface ColumnConfig {
  field: keyof Variable;
  header: string;
  editable: boolean;
  validator?: (value: any) => ValidationResult;
  renderer?: CellRenderer;
  editor?: CellEditor;
}

// Supported cell types:
// - Text input with validation
// - Dropdown for categorical values
// - Number input with min/max
// - Checkbox for boolean values
// - Custom value labels editor
```

### DialogManager Component
- **File**: `components/variableTable/DialogManager.tsx`
- **Purpose**: Modal dialogs for complex variable editing
- **Features**:
  - Value labels editor
  - Missing values configuration
  - Bulk property editing
  - Variable type conversion wizard

```typescript
// Dialog types supported
type DialogType = 
  | 'editValueLabels'
  | 'editMissingValues'
  | 'bulkEdit'
  | 'typeConversion'
  | 'variableInfo';

// Dialog state management
interface DialogState {
  activeDialog: DialogType | null;
  dialogData: any;
  isSubmitting: boolean;
  validationErrors: ValidationError[];
}
```

## Data Synchronization

### Variable-Data Synchronization
```typescript
// Sync variable changes with data store
const syncVariableWithData = (variable: Variable, oldVariable?: Variable) => {
  const dataStore = useDataStore.getState();
  
  // Handle name changes
  if (oldVariable && variable.name !== oldVariable.name) {
    dataStore.renameColumn(oldVariable.name, variable.name);
  }
  
  // Handle type changes
  if (oldVariable && variable.type !== oldVariable.type) {
    dataStore.convertColumnType(variable.name, variable.type);
  }
  
  // Update metadata
  dataStore.updateColumnMetadata(variable.name, {
    label: variable.label,
    measure: variable.measure,
    decimals: variable.decimals
  });
};
```

### SPSS Compatibility
```typescript
// SPSS import/export compatibility
const spssCompatibility = {
  // Map SPSS types to internal types
  mapSPSSType: (spssType: number) => {
    switch (spssType) {
      case 0: return 'numeric';
      case 1: return 'string';
      case 2: return 'date';
      default: return 'string';
    }
  },
  
  // Export to SPSS format
  exportToSPSS: (variables: Variable[]) => {
    return variables.map(variable => ({
      ...variable,
      spssType: mapToSPSSType(variable.type),
      format: generateSPSSFormat(variable),
      columns: calculateSPSSColumns(variable)
    }));
  }
};
```

## Performance Optimizations

### Large Variable Set Handling
```typescript
// Virtual table for large variable sets
const virtualTableConfig = {
  estimatedRowHeight: 40,
  bufferRows: 20,
  maxRenderedRows: 100,
  scrollDebounce: 16
};

// Optimized rendering
const renderOptimizations = {
  useMemo: ['sortedVariables', 'filteredVariables'],
  useCallback: ['handleVariableUpdate', 'handleSelectionChange'],
  React.memo: ['VariableRow', 'ColumnHeader']
};
```

### State Optimization
```typescript
// Optimized store subscriptions
const variables = useVariableStore(
  (state) => state.variables,
  shallow // Prevent deep equality checks
);

// Batch updates for bulk operations
const batchUpdate = useVariableStore(
  (state) => state.batchUpdateVariables
);

// Debounced validation
const debouncedValidate = useDebouncedCallback(
  validateVariable,
  300
);
```

## Testing Guidelines

### Component Testing
```typescript
// Variable table testing
describe('VariableTable', () => {
  it('renders variable list correctly', () => {
    const mockVariables = createMockVariables(10);
    render(<VariableTable variables={mockVariables} />);
    
    expect(screen.getAllByRole('row')).toHaveLength(11); // 10 + header
    expect(screen.getByText('Variable Name')).toBeInTheDocument();
  });
  
  it('validates variable name uniqueness', async () => {
    const variables = [
      { id: '1', name: 'var1', type: 'numeric' },
      { id: '2', name: 'var2', type: 'string' }
    ];
    
    render(<VariableTable variables={variables} editMode={true} />);
    
    // Try to change var2 name to var1
    const nameCell = screen.getByDisplayValue('var2');
    fireEvent.change(nameCell, { target: { value: 'var1' } });
    
    await waitFor(() => {
      expect(screen.getByText(/name must be unique/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Testing
```typescript
// Variable-data synchronization testing
describe('Variable-Data Sync', () => {
  it('syncs variable name changes with data columns', async () => {
    const { variableStore, dataStore } = setupStores();
    
    // Change variable name
    variableStore.updateVariable('var1', { name: 'newVar1' });
    
    // Check if data column was renamed
    await waitFor(() => {
      const columns = dataStore.getColumns();
      expect(columns).toContain('newVar1');
      expect(columns).not.toContain('var1');
    });
  });
});
```

### Performance Testing
```typescript
// Large variable set performance
describe('Variable Performance', () => {
  it('handles 1000+ variables efficiently', async () => {
    const largeVariableSet = createMockVariables(1000);
    const startTime = performance.now();
    
    render(<VariableTable variables={largeVariableSet} />);
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(500); // 500ms limit
  });
});
```

## Bulk Operations

### Bulk Editing Features
```typescript
// Bulk operation types
type BulkOperation = 
  | 'updateMeasure'
  | 'updateType'
  | 'updateAlignment'
  | 'addValueLabels'
  | 'clearMissing'
  | 'setDecimals';

// Bulk operation implementation
const handleBulkOperation = (
  operation: BulkOperation,
  selectedVariables: string[],
  value: any
) => {
  const updates = selectedVariables.map(id => ({
    id,
    updates: { [operation]: value }
  }));
  
  batchUpdateVariables(updates);
};
```

### Validation for Bulk Operations
```typescript
// Validate bulk operations before applying
const validateBulkOperation = (
  operation: BulkOperation,
  variables: Variable[],
  value: any
): ValidationResult => {
  switch (operation) {
    case 'updateType':
      // Check if type conversion is safe
      return validateTypeConversion(variables, value);
    
    case 'updateMeasure':
      // Check if measure is compatible with data
      return validateMeasureCompatibility(variables, value);
    
    default:
      return { valid: true };
  }
};
```

### Implementation Details
```typescript
export default function VariablePage() {
  const { setViewMode } = useTableRefStore();
  
  useEffect(() => {
    setViewMode('text');
    return () => setViewMode('numeric');
  }, [setViewMode]);

  return (
    <div className="z-0 h-full w-full" data-testid="variable-page">
      <Suspense fallback={<VariableTableSkeleton />}>
        <Index />
      </Suspense>
    </div>
  );
}
```

### Key Features
- **View Mode Management**: Sets text view mode untuk variable metadata
- **Automatic Cleanup**: Resets ke numeric mode pada unmount
- **Suspense Integration**: Performance-optimized loading
- **Test Support**: Comprehensive test identifiers

### State Synchronization
- `useTableRefStore`: View mode coordination dengan data page
- Lifecycle management untuk consistent state
- Performance optimization untuk view transitions

## 📊 VariableTable System (`components/variableTable/`)

### Architecture Overview
VariableTable system menyediakan spreadsheet-like interface untuk variable metadata editing dengan dialog-based detailed editing.

## 🗂 Main Component (`index.tsx`)

### Core Implementation
```typescript
interface VariableTableCore {
  // Table management
  tableManager: TableManagerHook;
  columnRenderer: ColumnRendererComponent;
  
  // Dialog system
  dialogManager: DialogManagerComponent;
  editDialog: boolean;
  
  // Data integration
  variableStore: VariableStore;
  metaStore: MetaStore;
  
  // Performance
  memoizedComponents: MemoizedComponent[];
  optimizedUpdates: boolean;
}
```

### Key Features

#### Table Display
- **Dynamic Columns**: Auto-generated columns berdasarkan variable properties
- **Inline Editing**: Quick editing untuk basic properties
- **Row Selection**: Multi-selection untuk bulk operations
- **Sort/Filter**: Advanced table operations

#### Dialog Integration
- **Edit Dialog**: Detailed editing interface
- **Modal Management**: Centralized modal state
- **Form Validation**: Real-time validation
- **Change Tracking**: Dirty state management

#### Performance Optimization
- **React.memo**: Prevent unnecessary re-renders
- **Selective Updates**: Targeted state updates
- **Virtualization**: Handle large variable lists
- **Debounced Input**: Optimized user input handling

### State Management
```typescript
interface VariableTableState {
  // Table state
  selectedRows: number[];
  sortConfig: SortConfig;
  filterConfig: FilterConfig;
  
  // Dialog state
  editDialogOpen: boolean;
  editingVariable: Variable | null;
  
  // Form state
  formData: VariableFormData;
  isDirty: boolean;
  validationErrors: ValidationError[];
}
```

## 🎨 Column Renderer (`ColumnRenderer.tsx`)

### Purpose
Dynamic column generation dan rendering untuk variable properties.

### Column Types
```typescript
interface ColumnTypes {
  // Core properties
  name: TextColumn;
  label: TextColumn;
  type: SelectColumn;
  measure: SelectColumn;
  
  // Extended properties
  width: NumberColumn;
  decimals: NumberColumn;
  alignment: SelectColumn;
  
  // Value properties
  values: ArrayColumn;
  missing: ArrayColumn;
  
  // Actions
  actions: ActionsColumn;
}
```

### Rendering Strategy
- **Type-Based Rendering**: Different renderers untuk different property types
- **Conditional Display**: Show/hide columns based on context
- **Custom Formatters**: Property-specific formatting
- **Interactive Elements**: Inline editors dan action buttons

### Column Configuration
```typescript
interface ColumnConfig {
  key: string;
  header: string;
  width: number;
  sortable: boolean;
  filterable: boolean;
  editable: boolean;
  renderer: ColumnRenderer;
  validator?: Validator;
}
```

## 📝 Dialog Manager (`DialogManager.tsx`)

### Purpose
Centralized management untuk edit dialogs dan modal interactions.

### Dialog Types
```typescript
interface DialogTypes {
  // Variable editing
  editVariable: VariableEditDialog;
  
  // Bulk operations
  bulkEdit: BulkEditDialog;
  
  // Property management
  valueLabels: ValueLabelsDialog;
  missingValues: MissingValuesDialog;
  
  // Confirmation dialogs
  deleteConfirm: ConfirmDialog;
  discardChanges: ConfirmDialog;
}
```

### Dialog Lifecycle
```typescript
interface DialogLifecycle {
  // Opening
  openDialog: (type: DialogType, data?: any) => void;
  
  // State management
  updateDialogData: (data: Partial<DialogData>) => void;
  validateForm: () => ValidationResult;
  
  // Closing
  closeDialog: (save?: boolean) => void;
  discardChanges: () => void;
}
```

### Form Management
- **Dynamic Forms**: Form generation based on variable type
- **Real-time Validation**: Instant feedback
- **Auto-save**: Optional automatic saving
- **Change Detection**: Dirty state tracking

## 🔧 Table Manager (`TableManager.tsx`)

### Purpose
State management dan business logic untuk variable table operations.

### Core Responsibilities
```typescript
interface TableManagerCore {
  // Data management
  loadVariables: () => Promise<Variable[]>;
  updateVariable: (id: string, updates: Partial<Variable>) => Promise<void>;
  deleteVariable: (id: string) => Promise<void>;
  
  // Selection management
  handleRowSelection: (selectedRows: number[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Sorting & filtering
  applySorting: (config: SortConfig) => void;
  applyFiltering: (config: FilterConfig) => void;
  
  // Bulk operations
  bulkUpdate: (updates: BulkUpdateData) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}
```

### State Synchronization
- **Store Integration**: Real-time sync dengan global stores
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Graceful error recovery
- **Conflict Resolution**: Handle concurrent edits

### Performance Features
- **Lazy Loading**: Load variables on demand
- **Pagination**: Handle large variable lists
- **Caching**: Cache frequently accessed data
- **Debouncing**: Optimize API calls

## 📱 Variable Properties Management

### Core Properties
```typescript
interface VariableProperties {
  // Basic properties
  name: string;           // Variable identifier
  label: string;          // Display label
  type: VariableType;     // Numeric, String, Date
  measure: MeasureType;   // Scale, Ordinal, Nominal
  
  // Display properties
  width: number;          // Column width
  decimals: number;       // Decimal places
  alignment: Alignment;   // Left, Center, Right
  
  // Value properties
  values: ValueLabel[];   // Value labels
  missing: MissingValue[]; // Missing value definitions
  
  // Computed properties
  role: VariableRole;     // Input, Target, Both, None
  level: MeasurementLevel; // Measurement level
}
```

### Property Categories

#### Basic Properties
- **Name**: Unique identifier (immutable after creation)
- **Label**: User-friendly display name
- **Type**: Data type classification
- **Measure**: Statistical measurement level

#### Display Properties
- **Width**: Column display width dalam pixels
- **Decimals**: Decimal places untuk numeric display
- **Alignment**: Text alignment dalam cells

#### Value Management
- **Value Labels**: Mapping dari numeric values ke descriptive labels
- **Missing Values**: Definition dari missing value patterns
- **Valid Ranges**: Acceptable value ranges

#### Advanced Properties
- **Role**: Variable role dalam analysis
- **Level**: Measurement level untuk statistical operations
- **Custom Attributes**: User-defined properties

## 🎯 Editing Workflows

### Inline Editing
```typescript
interface InlineEditing {
  // Quick edits
  doubleClickEdit: boolean;
  tabNavigation: boolean;
  enterConfirm: boolean;
  escapeCancel: boolean;
  
  // Validation
  realTimeValidation: boolean;
  errorHighlighting: boolean;
  
  // Performance
  debouncedSave: number; // milliseconds
  batchUpdates: boolean;
}
```

### Dialog Editing
```typescript
interface DialogEditing {
  // Comprehensive editing
  fullPropertyAccess: boolean;
  advancedValidation: boolean;
  previewChanges: boolean;
  
  // Workflow
  saveAndNext: boolean;
  saveAndClose: boolean;
  discardChanges: boolean;
  
  // Bulk operations
  multiVariableEdit: boolean;
  templateApplication: boolean;
}
```

### Validation System
```typescript
interface ValidationRules {
  // Name validation
  nameUniqueness: boolean;
  nameFormat: RegExp;
  
  // Type consistency
  typeCompatibility: boolean;
  dataIntegrity: boolean;
  
  // Value validation
  valueRanges: boolean;
  missingValueLogic: boolean;
  
  // Cross-variable validation
  relationshipConstraints: boolean;
  dependencyChecks: boolean;
}
```

## ⚡ Performance Optimizations

### Rendering Performance
```typescript
interface RenderingOptimizations {
  // React optimizations
  memoizedComponents: boolean;
  useCallback: boolean;
  useMemo: boolean;
  
  // Table optimizations
  virtualScrolling: boolean;
  lazyRowRendering: boolean;
  columnVirtualization: boolean;
  
  // Update optimizations
  batchedUpdates: boolean;
  debouncedInput: boolean;
  optimisticUI: boolean;
}
```

### Memory Management
- **Component Cleanup**: Proper useEffect cleanup
- **Event Listener Management**: Add/remove listeners appropriately
- **State Optimization**: Minimal state structure
- **Garbage Collection**: Prevent memory leaks

### API Optimization
- **Request Batching**: Group related API calls
- **Caching Strategy**: Cache frequently accessed data
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Graceful API error handling

## 🧪 Testing Strategy

### Component Tests (`__tests__/`)
```typescript
interface TestCategories {
  // Rendering tests
  componentMount: boolean;
  propRender: boolean;
  conditionalRender: boolean;
  
  // Interaction tests
  userInput: boolean;
  buttonClicks: boolean;
  keyboardNavigation: boolean;
  
  // State tests
  stateUpdates: boolean;
  storeIntegration: boolean;
  
  // Dialog tests
  dialogOpen: boolean;
  dialogClose: boolean;
  formValidation: boolean;
  
  // Performance tests
  largeDatasets: boolean;
  memoryUsage: boolean;
}
```

### Test Coverage Areas
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Complete workflow testing
- **Performance Tests**: Load dan stress testing

## 🎨 Styling & UI

### Design Principles
```typescript
interface DesignPrinciples {
  // Consistency
  uniformSpacing: boolean;
  consistentColors: boolean;
  standardComponents: boolean;
  
  // Usability
  clearHierarchy: boolean;
  intuitivePlacement: boolean;
  accessibleDesign: boolean;
  
  // Performance
  efficientCSS: boolean;
  responsiveDesign: boolean;
  touchFriendly: boolean;
}
```

### Component Styling
- **Table Styling**: Consistent dengan DataTable design
- **Dialog Styling**: Modal design system
- **Form Styling**: Unified form components
- **Button Styling**: Action button consistency

## 🔒 Data Integrity

### Validation Strategy
```typescript
interface DataIntegrity {
  // Client-side validation
  realTimeValidation: boolean;
  formValidation: boolean;
  typeChecking: boolean;
  
  // Server-side validation
  apiValidation: boolean;
  constraintChecking: boolean;
  
  // Data consistency
  crossVariableChecks: boolean;
  referentialIntegrity: boolean;
}
```

### Error Handling
- **Validation Errors**: User-friendly error messages
- **API Errors**: Graceful error recovery
- **Network Errors**: Offline capability
- **Conflict Resolution**: Concurrent edit handling

## 📋 Development Guidelines

### Code Organization
```typescript
interface CodeOrganization {
  // Component structure
  singleResponsibility: boolean;
  composableComponents: boolean;
  reusableLogic: boolean;
  
  // State management
  centralizedState: boolean;
  immutableUpdates: boolean;
  predictableState: boolean;
  
  // Type safety
  strictTypeScript: boolean;
  comprehensiveTypes: boolean;
  runtimeValidation: boolean;
}
```

### Adding New Features
1. **Component Design**: Follow existing patterns
2. **State Integration**: Use established stores
3. **Validation**: Implement comprehensive validation
4. **Testing**: Add appropriate test coverage
5. **Documentation**: Update README dan comments

### Performance Guidelines
- **Memoization**: Use React.memo judiciously
- **State Updates**: Batch related updates
- **API Calls**: Minimize dan optimize requests
- **Memory Management**: Monitor memory usage

---

Variable page menyediakan comprehensive interface untuk variable metadata management dengan emphasis pada usability, data integrity, dan performance optimization.
