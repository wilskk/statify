# Variable Page - Variable Metadata Management Interface

Direktori `variable/` berisi interface untuk mengelola metadata variabel dalam dataset. Page ini menyediakan comprehensive tools untuk editing variable properties, labels, dan characteristics dengan focused editing experience.

## 📁 Struktur

```
variable/
├── page.tsx                 # Main variable page component
├── loading.tsx             # Loading state untuk variable page
└── components/
    └── variableTable/      # Variable metadata table system
        ├── index.tsx           # Main VariableTable component
        ├── ColumnRenderer.tsx  # Dynamic column rendering
        ├── DialogManager.tsx   # Edit dialog management
        ├── TableManager.tsx    # Table state management
        ├── README.md          # Component documentation
        └── __tests__/         # Component tests
```

## 🎯 Page Overview

### Primary Purpose
Variable page menyediakan interface untuk:
- **Metadata Editing**: Edit variable properties (name, label, measure, type)
- **Bulk Operations**: Multi-variable editing dengan efficient workflows
- **Data Validation**: Ensure metadata consistency dan integrity
- **Property Management**: Comprehensive variable characteristic management

### Technical Architecture
```typescript
interface VariablePage {
  // Core components
  variableTable: VariableTableComponent;
  
  // State management
  viewMode: 'text' | 'numeric';
  editMode: boolean;
  
  // Dialog system
  editDialog: boolean;
  dialogManager: DialogManagerComponent;
  
  // Performance
  suspenseBoundary: boolean;
  optimizedRendering: boolean;
}
```

## 📄 Main Page Component (`page.tsx`)

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
