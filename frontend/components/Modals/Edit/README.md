# Edit Operations Modals - Text and Navigation Operations

Direktori `Edit/` berisi modal system untuk editing operations dan navigation tasks dalam Statify. Modals ini menyediakan essential editing functionality yang mendukung data manipulation workflows dengan user-friendly interfaces.

## 📁 Struktur Arsitektur

```
Edit/
├── EditMenu.tsx              # Main edit operations menu
├── EditRegistry.tsx          # Edit modal registration system
├── index.ts                  # Module exports
│
├── Actions/                  # General edit actions
│   ├── README.md                # Actions documentation
│   └── useEditMenuActions.ts    # Edit menu action handlers
│
├── FindReplace/              # Find and replace operations
│   ├── index.tsx                # Main find/replace modal
│   ├── README.md               # Find/replace documentation
│   ├── types.ts                # Type definitions
│   ├── __tests__/              # Test files
│   │   └── FindAndReplaceModal.test.tsx
│   ├── components/             # UI components
│   │   ├── FindReplaceContent.tsx   # Main content component
│   │   ├── Tour.tsx                 # Guided tour component
│   │   └── __tests__/
│   │       └── FindReplaceContent.test.tsx
│   └── hooks/                  # Business logic hooks
│       ├── useFindReplaceForm.ts    # Form state management
│       └── __test__/
│           └── useFindReplaceForm.test.ts
│
└── GoTo/                     # Navigation operations
    ├── index.tsx                # Main goto modal
    ├── README.md               # GoTo documentation
    ├── types.ts                # Type definitions
    ├── __tests__/              # Test files
    │   ├── GoToContent.test.tsx
    │   └── index.test.tsx
    ├── components/             # UI components
    │   ├── GoToContent.tsx         # Main content component
    │   └── Tour.tsx                # Guided tour component
    └── hooks/                  # Business logic hooks
        ├── useGoToForm.ts          # Form state management
        └── __test__/
            └── .gitkeep
```

## 🎯 Edit Operations Overview

### Operation Categories

#### **Find and Replace Operations**
- **Text Search**: Advanced text search dalam data cells
- **Pattern Matching**: Regular expression support untuk complex patterns
- **Replacement**: Bulk replacement operations dengan validation
- **Scope Control**: Search scope limitation (selected cells, columns, entire dataset)

#### **Navigation Operations**  
- **Cell Navigation**: Direct navigation to specific cells
- **Row/Column Navigation**: Navigate to specific rows atau columns
- **Data Point Location**: Find specific data points berdasarkan criteria
- **Bookmark System**: Save dan restore navigation positions

#### **General Edit Actions**
- **Undo/Redo**: Edit history management
- **Copy/Paste**: Enhanced clipboard operations
- **Selection Management**: Advanced selection tools
- **Batch Operations**: Bulk editing capabilities

## 🔍 Find and Replace System (`FindReplace/`)

### Core Features
```typescript
interface FindReplaceFeatures {
  // Search capabilities
  searchOptions: {
    textSearch: boolean;
    regexSearch: boolean;
    caseInsensitive: boolean;
    wholeWordOnly: boolean;
    wildcardSupport: boolean;
  };
  
  // Replacement options
  replacementOptions: {
    singleReplace: boolean;
    replaceAll: boolean;
    previewMode: boolean;
    undoSupport: boolean;
  };
  
  // Scope control
  scopeControl: {
    selectedCells: boolean;
    selectedColumns: boolean;
    selectedRows: boolean;
    entireDataset: boolean;
    variableFiltering: boolean;
  };
  
  // Advanced features
  advancedFeatures: {
    patternGroups: boolean;
    conditionalReplace: boolean;
    dataTypeAware: boolean;
    statisticalContext: boolean;
  };
}
```

### Search and Replace Logic
```typescript
interface SearchReplaceLogic {
  // Search configuration
  searchConfig: {
    searchTerm: string;
    searchType: 'text' | 'regex' | 'wildcard';
    caseSensitive: boolean;
    wholeWord: boolean;
    scope: SearchScope;
  };
  
  // Replacement configuration
  replaceConfig: {
    replacementTerm: string;
    replaceType: 'literal' | 'pattern';
    confirmEach: boolean;
    previewChanges: boolean;
  };
  
  // Search results
  searchResults: {
    matches: SearchMatch[];
    totalMatches: number;
    currentMatch: number;
    matchPositions: CellPosition[];
  };
  
  // State management
  stateManagement: {
    searchHistory: string[];
    replaceHistory: string[];
    undoStack: UndoOperation[];
    isSearching: boolean;
    isReplacing: boolean;
  };
}
```

### Implementation Architecture
```typescript
// useFindReplaceForm.ts - Core logic hook
interface FindReplaceFormHook {
  // Form state
  formState: {
    searchTerm: string;
    replaceTerm: string;
    searchOptions: SearchOptions;
    replaceOptions: ReplaceOptions;
  };
  
  // Search operations
  searchOperations: {
    performSearch: (term: string, options: SearchOptions) => Promise<SearchResult>;
    findNext: () => void;
    findPrevious: () => void;
    findAll: () => SearchMatch[];
  };
  
  // Replace operations
  replaceOperations: {
    replaceNext: () => void;
    replaceAll: () => Promise<ReplaceResult>;
    previewReplace: () => PreviewResult;
    undoReplace: () => void;
  };
  
  // Validation
  validation: {
    validateSearchTerm: (term: string) => ValidationResult;
    validateReplaceTerm: (term: string) => ValidationResult;
    validateScope: (scope: SearchScope) => ValidationResult;
  };
}

// FindReplaceContent.tsx - UI component
interface FindReplaceContentProps {
  searchTerm: string;
  replaceTerm: string;
  searchOptions: SearchOptions;
  onSearchTermChange: (term: string) => void;
  onReplaceTermChange: (term: string) => void;
  onOptionsChange: (options: SearchOptions) => void;
  onSearch: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  searchResults: SearchResult;
  isSearching: boolean;
  isReplacing: boolean;
}
```

### Search Scope Management
```typescript
interface SearchScopeSystem {
  // Scope types
  scopeTypes: {
    entireDataset: EntireDatasetScope;
    selectedCells: SelectedCellsScope;
    selectedVariables: SelectedVariablesScope;
    selectedCases: SelectedCasesScope;
    customRange: CustomRangeScope;
  };
  
  // Scope validation
  scopeValidation: {
    validateSelection: (selection: Selection) => boolean;
    checkPermissions: (scope: Scope) => boolean;
    estimateSearchTime: (scope: Scope) => number;
  };
  
  // Scope optimization
  scopeOptimization: {
    indexedSearch: boolean;
    parallelSearch: boolean;
    chunkProcessing: boolean;
    progressTracking: boolean;
  };
}
```

## 🧭 Navigation System (`GoTo/`)

### Core Features
```typescript
interface GoToFeatures {
  // Navigation types
  navigationTypes: {
    cellNavigation: CellNavigationType;
    rowNavigation: RowNavigationType;
    columnNavigation: ColumnNavigationType;
    dataPointNavigation: DataPointNavigationType;
  };
  
  // Input methods
  inputMethods: {
    directInput: boolean;
    coordinateInput: boolean;
    variableSelection: boolean;
    conditionalNavigation: boolean;
  };
  
  // Navigation history
  navigationHistory: {
    previousPositions: Position[];
    bookmarks: Bookmark[];
    recentNavigations: Navigation[];
    navigationBreadcrumbs: Breadcrumb[];
  };
  
  // Advanced features
  advancedFeatures: {
    fuzzySearch: boolean;
    autoComplete: boolean;
    contextualSuggestions: boolean;
    keyboardShortcuts: boolean;
  };
}
```

### Navigation Logic
```typescript
interface NavigationLogic {
  // Position management
  positionManagement: {
    currentPosition: CellPosition;
    targetPosition: CellPosition;
    validPositions: CellPosition[];
    navigationPath: NavigationPath;
  };
  
  // Navigation operations
  navigationOperations: {
    goToCell: (position: CellPosition) => Promise<NavigationResult>;
    goToRow: (rowIndex: number) => Promise<NavigationResult>;
    goToColumn: (columnIndex: number) => Promise<NavigationResult>;
    goToVariable: (variableName: string) => Promise<NavigationResult>;
  };
  
  // Search integration
  searchIntegration: {
    searchAndNavigate: (criteria: SearchCriteria) => Promise<NavigationResult>;
    navigateToMatch: (matchIndex: number) => Promise<NavigationResult>;
    bookmarkPosition: (position: CellPosition) => Bookmark;
  };
  
  // Validation
  validation: {
    validatePosition: (position: CellPosition) => ValidationResult;
    checkBounds: (position: CellPosition) => boolean;
    validatePermissions: (position: CellPosition) => boolean;
  };
}

// useGoToForm.ts - Core navigation hook
interface GoToFormHook {
  // Form state
  formState: {
    targetCell: string;
    targetRow: number;
    targetColumn: number;
    searchCriteria: SearchCriteria;
  };
  
  // Navigation actions
  navigationActions: {
    navigateToCell: (cellRef: string) => Promise<void>;
    navigateToPosition: (row: number, col: number) => Promise<void>;
    navigateToVariable: (variableName: string) => Promise<void>;
    navigateToValue: (value: any, variable?: string) => Promise<void>;
  };
  
  // History management
  historyManagement: {
    addToHistory: (position: Position) => void;
    navigateBack: () => void;
    navigateForward: () => void;
    clearHistory: () => void;
  };
  
  // Validation
  validation: {
    validateInput: (input: string) => ValidationResult;
    checkAccessibility: (position: Position) => boolean;
    suggestCorrections: (input: string) => string[];
  };
}
```

### Position Reference System
```typescript
interface PositionReferenceSystem {
  // Reference formats
  referenceFormats: {
    cellReference: string; // "A1", "B5", etc.
    coordinateReference: string; // "(1,1)", "(5,3)", etc.
    variableReference: string; // "age[5]", "income[10]", etc.
    namedReference: string; // "bookmark1", "outlier_position", etc.
  };
  
  // Conversion utilities
  conversionUtilities: {
    cellRefToCoordinates: (cellRef: string) => Coordinates;
    coordinatesToCellRef: (coords: Coordinates) => string;
    variableRefToPosition: (varRef: string) => Position;
    namedRefToPosition: (namedRef: string) => Position;
  };
  
  // Validation
  referenceValidation: {
    validateCellRef: (cellRef: string) => boolean;
    validateCoordinates: (coords: Coordinates) => boolean;
    validateVariableRef: (varRef: string) => boolean;
    validateNamedRef: (namedRef: string) => boolean;
  };
}
```

## ⚙️ General Edit Actions (`Actions/`)

### Edit Menu Actions
```typescript
interface EditMenuActions {
  // Clipboard operations
  clipboardOperations: {
    copy: (selection: Selection) => Promise<void>;
    cut: (selection: Selection) => Promise<void>;
    paste: (position: Position, data: ClipboardData) => Promise<void>;
    pasteSpecial: (position: Position, options: PasteOptions) => Promise<void>;
  };
  
  // Selection operations
  selectionOperations: {
    selectAll: () => void;
    selectRow: (rowIndex: number) => void;
    selectColumn: (columnIndex: number) => void;
    selectRange: (startPos: Position, endPos: Position) => void;
    invertSelection: () => void;
    clearSelection: () => void;
  };
  
  // Undo/Redo operations
  undoRedoOperations: {
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    getUndoStack: () => UndoOperation[];
    getRedoStack: () => RedoOperation[];
    clearHistory: () => void;
  };
  
  // Batch operations
  batchOperations: {
    batchEdit: (operations: EditOperation[]) => Promise<BatchResult>;
    batchDelete: (positions: Position[]) => Promise<void>;
    batchInsert: (data: InsertData[]) => Promise<void>;
  };
}

// useEditMenuActions.ts implementation
interface EditMenuActionsHook {
  // Action handlers
  actionHandlers: {
    handleCopy: () => Promise<void>;
    handleCut: () => Promise<void>;
    handlePaste: () => Promise<void>;
    handleUndo: () => Promise<void>;
    handleRedo: () => Promise<void>;
    handleSelectAll: () => void;
    handleDelete: () => Promise<void>;
  };
  
  // State management
  stateManagement: {
    canUndo: boolean;
    canRedo: boolean;
    hasSelection: boolean;
    clipboardData: ClipboardData | null;
    operationInProgress: boolean;
  };
  
  // Integration
  integration: {
    dataStoreIntegration: DataStoreIntegration;
    modalStoreIntegration: ModalStoreIntegration;
    undoRedoService: UndoRedoService;
  };
}
```

## 🧪 Testing Strategy

### Test Coverage per Feature
```typescript
// Find/Replace testing
describe('FindReplaceModal', () => {
  describe('Search functionality', () => {
    it('performs text search correctly');
    it('handles regex patterns');
    it('respects case sensitivity options');
    it('searches within selected scope');
  });
  
  describe('Replace functionality', () => {
    it('replaces single matches');
    it('replaces all matches');
    it('previews replacements');
    it('supports undo operations');
  });
  
  describe('useFindReplaceForm hook', () => {
    it('manages form state correctly');
    it('validates search terms');
    it('handles search operations');
    it('manages replacement operations');
  });
});

// GoTo testing
describe('GoToModal', () => {
  describe('Navigation functionality', () => {
    it('navigates to cell references');
    it('navigates to coordinates');
    it('handles invalid positions');
    it('maintains navigation history');
  });
  
  describe('useGoToForm hook', () => {
    it('validates input formats');
    it('performs navigation operations');
    it('manages history correctly');
    it('handles errors gracefully');
  });
});

// Edit actions testing
describe('EditMenuActions', () => {
  describe('Clipboard operations', () => {
    it('copies selected data');
    it('cuts selected data');
    it('pastes clipboard data');
    it('handles paste special options');
  });
  
  describe('Undo/Redo operations', () => {
    it('undoes edit operations');
    it('redoes undone operations');
    it('maintains operation history');
    it('clears history when needed');
  });
});
```

### Integration Testing
```typescript
interface EditModalIntegrationTests {
  // Cross-modal integration
  crossModalIntegration: {
    findReplaceWithDataModals: boolean;
    navigationWithAnalysisModals: boolean;
    editActionsWithAllModals: boolean;
  };
  
  // Store integration
  storeIntegration: {
    dataStoreSync: boolean;
    modalStateSync: boolean;
    undoRedoIntegration: boolean;
  };
  
  // User workflow testing
  userWorkflowTesting: {
    searchReplaceWorkflow: boolean;
    navigationWorkflow: boolean;
    editingWorkflow: boolean;
  };
}
```

## 📋 Development Guidelines

### Edit Modal Development Standards
```typescript
interface EditModalStandards {
  // Architecture
  featureSlicedStructure: boolean;
  consistentNaming: boolean;
  typeDefinitions: boolean;
  
  // Functionality
  undoSupport: boolean;
  validationImplemented: boolean;
  errorHandling: boolean;
  progressIndicators: boolean;
  
  // User experience
  keyboardShortcuts: boolean;
  accessibilityCompliance: boolean;
  responsiveDesign: boolean;
  contextualHelp: boolean;
  
  // Quality
  testCoverage: number; // >= 80%
  documentation: boolean;
  performanceOptimization: boolean;
}
```

### Best Practices
```typescript
// 1. Undo/Redo pattern
const useUndoableOperation = (operation: Operation) => {
  const { addToUndoStack } = useUndoRedoService();
  
  const executeOperation = async (params: OperationParams) => {
    const undoData = captureUndoData(params);
    
    try {
      const result = await operation(params);
      addToUndoStack({
        operation: 'reverse-operation',
        data: undoData,
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      // Don't add to undo stack if operation failed
      throw error;
    }
  };
  
  return { executeOperation };
};

// 2. Validation pattern
const useInputValidation = (validationRules: ValidationRule[]) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  const validateInput = (value: any): ValidationResult => {
    const newErrors = validationRules
      .map(rule => rule.validate(value))
      .filter(result => !result.isValid);
      
    setErrors(newErrors);
    return { isValid: newErrors.length === 0, errors: newErrors };
  };
  
  return { validateInput, errors, isValid: errors.length === 0 };
};

// 3. Keyboard navigation pattern
const useKeyboardNavigation = (navigationHandlers: NavigationHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, shiftKey } = event;
      
      if (ctrlKey && key === 'f') {
        event.preventDefault();
        navigationHandlers.openFindReplace();
      } else if (ctrlKey && key === 'g') {
        event.preventDefault();
        navigationHandlers.openGoTo();
      } else if (ctrlKey && key === 'z') {
        event.preventDefault();
        navigationHandlers.undo();
      } else if (ctrlKey && shiftKey && key === 'Z') {
        event.preventDefault();
        navigationHandlers.redo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigationHandlers]);
};
```

---

Edit operations modals menyediakan essential editing functionality dengan emphasis pada user productivity, data integrity, dan seamless integration dengan statistical workflows dalam Statify.
