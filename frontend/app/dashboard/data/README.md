# Data Page - Dataset Managem## Architecture Overviewnt Interface

> **Developer Documentation**: Spreadsheet-like data management interface with Handsontable integration for viewing, editing, and manipulating datasets.

## Directory Structure

```
data/
├── page.tsx                 # Main data page component
├── loading.tsx             # Suspense loading state for data operations
└── components/
    ├── Toolbar.tsx         # Data manipulation actions toolbar
    └── dataTable/          # Advanced data table system
        ├── index.tsx                  # Main DataTable component export
        ├── HandsontableWrapper.tsx    # Handsontable React integration
        ├── constants.ts               # Table configuration constants
        ├── DataTable.css             # Custom table styling
        ├── README.md                 # Component documentation
        ├── REFACTOR_NOTES.md         # Development and refactor notes
        ├── TEXT_OVERFLOW_FIX.md      # Specific fix documentation
        ├── __tests__/                # Jest/RTL component tests
        ├── config/                   # Table configuration modules
        ├── hooks/                    # Custom React hooks
        ├── services/                 # Business logic services
        ├── types/                    # TypeScript type definitions
        ├── utils/                    # Utility functions
        └── validators/               # Data validation logic
```

## � Architecture Overview

### Component Hierarchy
```typescript
DataPage
├── Toolbar (actions, view controls)
└── DataTable
    ├── HandsontableWrapper (core table)
    ├── DataTableErrorBoundary (error handling)
    └── TableManager (state coordination)
```

### State Management
```typescript
// Primary stores used
import { useDataStore } from '@/stores/useDataStore';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { useMetaStore } from '@/stores/useMetaStore';

// Table state structure
interface DataTableState {
  data: CellValue[][];
  hotRef: RefObject<HotTable>;
  selectedCells: CellSelection[];
  viewMode: 'numeric' | 'text';
  isEditing: boolean;
}
```

### Performance Architecture
```typescript
// Virtualization and optimization
const tableConfig = {
  virtualization: true,
  maxRows: 1000000,
  maxCols: 500,
  renderAllRows: false,
  preventOverflow: 'horizontal'
};

// Memory management
const optimizations = {
  lazyLoading: true,
  cellCaching: true,
  batchUpdates: true,
  debounceInput: 300
};
```

## Development Guidelines

### Component Implementation
```typescript
// Standard data page component pattern
export default function DataPage() {
  const { data, isLoading } = useDataStore();
  const { hotRef } = useTableRefStore();
  
  if (isLoading) {
    return <DataPageLoading />;
  }
  
  return (
    <div className="data-page">
      <Toolbar />
      <DataTable ref={hotRef} data={data} />
    </div>
  );
}
```

### Error Handling Strategy
```typescript
// Error boundary implementation
<DataTableErrorBoundary>
  <Suspense fallback={<DataTableSkeleton />}>
    <DataTable />
  </Suspense>
</DataTableErrorBoundary>

// Error types handled:
// - Large dataset memory errors
// - Cell validation errors
// - Import/export errors
// - Network connectivity issues
```

### Testing Strategy
```typescript
// Testing utilities for data table
import { createMockDataset } from '@/utils/test-helpers';
import { renderDataTable } from '@/components/dataTable/__tests__/utils';

// Test scenarios:
// - Large dataset rendering
// - Cell editing and validation
// - Import/export operations
// - Keyboard navigation
// - Copy/paste functionality
```

## Core Components

### Toolbar Component
- **File**: `components/Toolbar.tsx`
- **Purpose**: Data manipulation actions and view controls
- **Features**: Import/export, view toggle, selection actions, formatting
- **State Integration**: Direct integration with useDataStore
- **Performance**: Debounced actions, optimized re-renders

### DataTable System
- **Main Component**: `components/dataTable/index.tsx`
- **Integration**: Handsontable React wrapper with custom optimizations
- **Features**: 
  - Virtual scrolling for large datasets
  - In-place cell editing with validation
  - Copy/paste with Excel compatibility
  - Keyboard navigation (Excel-like shortcuts)
  - Column resizing and reordering
  - Cell formatting and data types

### HandsontableWrapper
```typescript
// Core integration component
interface HandsontableWrapperProps {
  data: CellValue[][];
  viewMode: 'numeric' | 'text';
  onCellChange: (changes: CellChange[]) => void;
  onSelection: (selection: CellSelection) => void;
}

// Key configurations:
// - Custom cell renderers for data types
// - Validation rules for cell inputs
// - Context menu customization
// - Keyboard shortcut handling
```

## Performance Optimizations

### Large Dataset Handling
- **Virtual Scrolling**: Only render visible cells
- **Lazy Loading**: Load data in chunks
- **Memory Management**: Cleanup unused data references
- **Batch Updates**: Group multiple changes for efficiency

### Rendering Optimizations
- **React.memo**: Prevent unnecessary re-renders
- **useCallback**: Stabilize function references
- **useMemo**: Cache expensive calculations
- **Debouncing**: Limit update frequency for user input

### State Optimization
```typescript
// Optimized store subscription
const data = useDataStore(
  (state) => state.data,
  shallow  // Prevent deep equality checks
);

// Selective updates
const updateCell = useDataStore(
  (state) => state.updateCell
);
```

## Testing Guidelines

### Component Testing
```typescript
// Example test structure
describe('DataPage', () => {
  it('renders large dataset efficiently', async () => {
    const largeDataset = createMockDataset(10000, 50);
    render(<DataPage initialData={largeDataset} />);
    
    // Test virtual scrolling
    expect(screen.getByTestId('handsontable')).toBeInTheDocument();
    
    // Test performance
    const renderTime = performance.now();
    // Assert render time < threshold
  });
});
```

### Integration Testing
- **Data Import**: Test CSV/Excel import with various formats
- **Cell Editing**: Test validation rules and data type conversion
- **Export**: Test data export with formatting preservation
- **Performance**: Test with large datasets (stress testing)
  suspenseBoundary: boolean;
  lazyLoading: boolean;
}
```

## 📄 Main Page Component (`page.tsx`)

### Implementation Details
```typescript
export default function DataPage() {
  const { setViewMode } = useTableRefStore();
  
  useEffect(() => {
    setViewMode('numeric');
    return () => setViewMode('numeric');
  }, [setViewMode]);

  return (
    <div className="z-0 h-full w-full" data-testid="data-page">
      <Suspense fallback={<DataTableSkeleton />}>
        <Index />
      </Suspense>
    </div>
  );
}
```

### Key Features
- **View Mode Management**: Sets numeric view mode untuk data display
- **Suspense Integration**: Lazy loading dengan skeleton fallback
- **Test Integration**: Comprehensive test IDs
- **Full Viewport**: Optimized untuk full-screen data viewing

### State Integration
- `useTableRefStore`: Table reference dan view mode management
- Automatic cleanup pada component unmount
- Performance-optimized re-rendering

## 🛠 Toolbar Component (`components/Toolbar.tsx`)

### Purpose
Toolbar menyediakan quick actions dan operations untuk data management.

### Feature Set
```typescript
interface ToolbarFeatures {
  // File operations
  fileActions: ['open', 'save', 'print'];
  
  // Edit operations
  editActions: ['undo', 'redo', 'find', 'replace'];
  
  // Data operations
  dataActions: ['goto', 'transpose', 'variables'];
  
  // View options
  viewOptions: ['columns', 'search'];
}
```

### Implementation Highlights
- **Modal Integration**: Connected ke modal system untuk complex operations
- **Icon-based Interface**: Lucide icons dengan tooltips
- **Responsive Design**: Adaptive layout untuk different screen sizes
- **State Synchronization**: Real-time sync dengan global stores

### Action Categories

#### File Operations
- **Open**: `FolderOpen` - Import new datasets
- **Save**: `Save` - Export current dataset
- **Print**: `Printer` - Print-optimized output

#### Edit Operations
- **Undo/Redo**: `Undo`/`Redo` - Edit history management
- **Find/Replace**: `Search` - Data search dan replacement
- **Go To**: `Locate` - Navigate to specific cells

#### Data Operations
- **Variables**: `Variable` - Variable metadata management
- **Transpose**: `ArrowRightLeft` - Data transformation
- **Columns**: `Columns` - Column operations

## 📊 DataTable System (`components/dataTable/`)

### Architecture Overview
DataTable adalah komponen complex yang menggabungkan Handsontable dengan custom business logic untuk data manipulation yang powerful.

### Core Components

#### Main Component (`index.tsx`)
**Purpose**: Entry point dan orchestration layer

**Key Features**:
```typescript
interface DataTableCore {
  // Handsontable integration
  hotTableRef: RefObject<HotTableRef>;
  
  // Performance optimization
  memoizedWrapper: React.MemoExoticComponent;
  
  // Hook integration
  dataTableLogic: DataTableLogicHook;
  columnSizing: ColumnSizingHook;
  
  // Store integration
  tableRefStore: TableRefStore;
  variableStore: VariableStore;
  metaStore: MetaStore;
}
```

#### HandsontableWrapper (`HandsontableWrapper.tsx`)
**Purpose**: Handsontable configuration dan event handling

**Features**:
- **Module Registration**: All Handsontable modules
- **Event Binding**: beforeChange, afterChange, afterColumnResize
- **Performance**: Memoized untuk prevent unnecessary re-renders
- **CSS Integration**: Custom styling dengan DataTable.css

### Hook System (`hooks/`)

#### useDataTableLogic
**Purpose**: Core business logic untuk data operations

**Responsibilities**:
- Data transformation
- Event handling coordination
- Store synchronization
- Error management

#### useColumnConfigs
**Purpose**: Column configuration management

**Features**:
- Dynamic column definitions
- Type-based formatting
- Validation rules
- Display options

#### useColumnHeaders
**Purpose**: Header generation dan management

**Features**:
- Dynamic header creation
- Variable name mapping
- Responsive headers
- Sorting indicators

#### useColumnSizing
**Purpose**: Column width management

**Features**:
- Auto-sizing algorithms
- User resize handling
- Responsive width calculations
- Performance optimization

#### useContextMenuLogic
**Purpose**: Right-click context menu operations

**Features**:
- Menu item generation
- Action handlers
- Permission checking
- Custom menu items

#### useDisplayData
**Purpose**: Data formatting untuk display

**Features**:
- Type-based formatting
- Null value handling
- Performance optimization
- Memory management

#### useTableDimensions
**Purpose**: Table size calculations

**Features**:
- Dynamic row/column counts
- Minimum size enforcement
- Performance thresholds
- Virtual scrolling support

#### useTableLayout
**Purpose**: Layout configuration

**Features**:
- Grid layout management
- Responsive design
- Header positioning
- Scroll synchronization

#### useTableUpdates
**Purpose**: Data persistence dan synchronization

**Features**:
- Real-time updates
- Batch operations
- Conflict resolution
- Error handling

### Services (`services/`)

#### menuConfig.ts
**Purpose**: Context menu configuration

**Structure**:
```typescript
interface MenuConfig {
  items: MenuItem[];
  permissions: PermissionMap;
  handlers: HandlerMap;
  shortcuts: ShortcutMap;
}

interface MenuItem {
  key: string;
  name: string;
  icon?: string;
  submenu?: MenuItem[];
  separator?: boolean;
  disabled?: (context: MenuContext) => boolean;
}
```

### Utilities (`utils/`)

#### utils.ts
**Purpose**: Data processing utilities

**Functions**:
- Data type detection
- Format conversion
- Validation helpers
- Performance utilities

### Types (`types/`)
**Purpose**: TypeScript type definitions untuk DataTable ecosystem

### Validators (`validators/`)
**Purpose**: Data validation rules dan functions

## 🎨 Styling (`DataTable.css`)

### Design System
- **Grid Styling**: Custom Handsontable theme
- **Color Scheme**: Consistent dengan design system
- **Responsive Behavior**: Mobile-friendly adaptations
- **Performance**: Optimized CSS untuk large tables

### Key Style Categories
- **Cell Styling**: Border, padding, typography
- **Header Styling**: Background, fonts, borders
- **Selection Styling**: Highlight colors, focus states
- **Scrollbar Styling**: Custom scrollbar design

## ⚡ Performance Optimizations

### Rendering Performance
- **React.memo**: Prevent unnecessary re-renders
- **Suspense Boundaries**: Lazy loading dengan fallbacks
- **Virtual Scrolling**: Handle large datasets
- **Batch Updates**: Group state changes

### Memory Management
- **Component Cleanup**: Proper useEffect cleanup
- **Store Optimization**: Selective state subscriptions
- **Data Virtualization**: Efficient data structures
- **Garbage Collection**: Memory leak prevention

### Loading Strategies
- **Progressive Loading**: Incremental data loading
- **Skeleton States**: Meaningful loading indicators
- **Code Splitting**: Route-based splitting
- **Asset Optimization**: CSS dan JS optimization

## 🧪 Testing Strategy

### Component Tests (`__tests__/`)
- **Rendering Tests**: Component mounting dan unmounting
- **Interaction Tests**: User interactions dan events
- **Store Integration**: State management testing
- **Performance Tests**: Load testing dengan large datasets

### Test Coverage Areas
```typescript
interface TestCoverage {
  // Component tests
  componentRendering: boolean;
  userInteractions: boolean;
  
  // Integration tests
  storeIntegration: boolean;
  modalIntegration: boolean;
  
  // Performance tests
  loadTesting: boolean;
  memoryUsage: boolean;
  
  // Edge cases
  errorHandling: boolean;
  boundaryConditions: boolean;
}
```

## 🔧 Configuration

### Constants (`constants.ts`)
**Purpose**: Centralized configuration values

**Categories**:
- Table dimensions
- Performance thresholds
- UI constants
- Default values

### Config System (`config/`)
**Purpose**: Complex configuration objects

**Features**:
- Column definitions
- Validation rules
- Menu configurations
- Theme settings

## 📱 Responsive Design

### Breakpoint Strategy
```typescript
const responsiveFeatures = {
  mobile: {
    columnCollapse: true,
    touchGestures: true,
    simplifiedMenus: true,
  },
  tablet: {
    horizontalScroll: true,
    contextMenus: true,
    multiSelect: true,
  },
  desktop: {
    fullFeatures: true,
    keyboardShortcuts: true,
    advancedMenus: true,
  },
};
```

### Touch Support
- **Gesture Recognition**: Swipe, pinch, tap
- **Touch-Friendly**: Larger touch targets
- **Mobile Menus**: Simplified context menus
- **Scrolling**: Smooth touch scrolling

## 🔒 Data Security

### Input Validation
- **Type Checking**: Runtime type validation
- **Sanitization**: XSS prevention
- **Range Validation**: Numeric bounds checking
- **Format Validation**: Data format verification

### Data Integrity
- **Change Tracking**: Audit trail
- **Undo/Redo**: Change history
- **Conflict Resolution**: Concurrent edit handling
- **Error Recovery**: Graceful error handling

## 📋 Development Guidelines

### Adding New Features
1. **Hook-First**: Implement logic dalam custom hooks
2. **Type Safety**: Define TypeScript interfaces
3. **Testing**: Add comprehensive tests
4. **Documentation**: Update README dan comments

### Performance Considerations
- **Memoization**: Use React.memo appropriately
- **State Updates**: Batch related updates
- **Event Handling**: Debounce expensive operations
- **Memory**: Monitor memory usage

### Code Organization
- **Separation of Concerns**: Logic, UI, dan data terpisah
- **Reusability**: Extract common patterns
- **Maintainability**: Clear naming dan structure
- **Scalability**: Design untuk future growth

---

Data page menyediakan interface yang powerful dan user-friendly untuk data management dengan emphasis pada performance, usability, dan extensibility.
