# Sort Variables Modal - Advanced Variable Organization and Column Management

Modal untuk sorting dan organizing variables dalam Statify dengan comprehensive variable attribute sorting, column reordering, dan synchronized data-variable alignment. Feature ini menyediakan powerful variable management capabilities untuk optimal dataset organization.

## 📁 Component Architecture

```
SortVars/
├── index.tsx                   # Main modal component
├── SortVarsUI.tsx             # Main variable sorting interface
├── SortVarsTest.tsx           # Variable sorting testing
├── types.ts                   # TypeScript type definitions
├── README.md                  # Documentation
│
├── __tests__/                 # Test suite
│   ├── SortVars.test.tsx          # Main component tests
│   ├── useSortVariables.test.ts   # Hook logic tests
│   ├── sortVarsService.test.ts    # Service function tests
│   └── README.md                  # Test documentation
│
├── hooks/                     # Business logic hooks
│   └── useSortVariables.ts        # Core variable sorting logic
│
└── services/                  # Business logic services
    └── sortVarsService.ts         # Variable and column reordering algorithms
```

## 🎯 Core Functionality

### Variable Sorting Capabilities
```typescript
interface VariableSortingCapabilities {
  // Attribute-based sorting
  attributeBasedSorting: {
    sortableAttributes: SortableAttribute[];   // Variable properties available for sorting
    attributeTypes: AttributeType[];           // Data types of sortable attributes
    sortingMethods: SortingMethod[];          // Methods for handling different attribute types
    customAttributes: CustomAttribute[];      // User-defined variable attributes
  };
  
  // Multi-criteria sorting
  multiCriteriaSorting: {
    primaryAttribute: SortableAttribute;      // Primary sort criterion
    secondaryAttributes: SortableAttribute[]; // Secondary sort criteria
    tieBreakingRules: TieBreakingRule[];     // Rules for handling equal values
    hierarchicalSorting: HierarchicalSorter; // Multi-level sorting implementation
  };
  
  // Data synchronization
  dataSynchronization: {
    variableColumnAlignment: ColumnAligner;   // Align data columns with variable order
    dataIntegrityMaintenance: IntegrityMaintainer; // Maintain data-variable relationships
    atomicOperations: AtomicOperator;         // Ensure consistency during updates
    rollbackCapability: RollbackManager;     // Undo capability for failed operations
  };
  
  // Advanced sorting features
  advancedSortingFeatures: {
    naturalLanguageSorting: NaturalSorter;    // Human-friendly text sorting
    numericAwareSorting: NumericAwareSorter;  // Number-aware text sorting
    localeSpecificSorting: LocaleSorter;      // Culture-specific sorting rules
    customComparatorSorting: CustomComparatorSorter; // User-defined comparison logic
  };
}
```

### Sortable Variable Attributes
```typescript
interface SortableVariableAttributes {
  // Core variable properties
  coreVariableProperties: {
    name: {
      attribute: 'Variable name identifier';
      sortType: 'alphanumeric';
      caseSensitive: boolean;
      naturalSorting: boolean;
    };
    
    label: {
      attribute: 'Descriptive variable label';
      sortType: 'text';
      localeAware: boolean;
      emptyValueHandling: EmptyValueStrategy;
    };
    
    type: {
      attribute: 'Data type classification';
      sortType: 'categorical';
      customOrder: DataType[];
      priorityRules: TypePriorityRule[];
    };
    
    measure: {
      attribute: 'Measurement level';
      sortType: 'categorical';
      customOrder: MeasurementLevel[];
      hierarchicalOrder: MeasurementHierarchy;
    };
  };
  
  // Extended variable properties
  extendedVariableProperties: {
    columnIndex: {
      attribute: 'Position in dataset';
      sortType: 'numeric';
      sortDirection: 'ascending' | 'descending';
    };
    
    width: {
      attribute: 'Display width in variable view';
      sortType: 'numeric';
      defaultValue: number;
    };
    
    decimals: {
      attribute: 'Number of decimal places';
      sortType: 'numeric';
      applicableTypes: DataType[];
    };
    
    values: {
      attribute: 'Value labels configuration';
      sortType: 'complex';
      sortingCriteria: ValueLabelSortingCriteria;
    };
  };
  
  // Computed variable properties
  computedVariableProperties: {
    uniqueValueCount: {
      attribute: 'Number of unique values';
      sortType: 'numeric';
      computationMethod: UniqueValueCounter;
    };
    
    missingValueCount: {
      attribute: 'Number of missing values';
      sortType: 'numeric';
      computationMethod: MissingValueCounter;
    };
    
    dataQualityScore: {
      attribute: 'Overall data quality metric';
      sortType: 'numeric';
      computationMethod: QualityScoreCalculator;
    };
    
    lastModified: {
      attribute: 'Last modification timestamp';
      sortType: 'datetime';
      computationMethod: TimestampTracker;
    };
  };
  
  // Custom user attributes
  customUserAttributes: {
    userDefinedProperties: Map<string, CustomProperty>;
    dynamicAttributes: DynamicAttribute[];
    conditionalAttributes: ConditionalAttribute[];
    calculatedAttributes: CalculatedAttribute[];
  };
}
```

## 🔄 Variable Sorting Workflow

### Complete Sorting Process
```typescript
interface CompleteSortingProcess {
  // Step 1: Attribute selection
  attributeSelection: {
    availableAttributes: SortableAttribute[];  // All sortable variable attributes
    selectedAttribute: SortableAttribute;     // User-selected sort attribute
    attributeValidation: AttributeValidator;  // Validate attribute suitability
    attributePreprocessing: AttributePreprocessor; // Prepare attribute for sorting
  };
  
  // Step 2: Sort configuration
  sortConfiguration: {
    sortDirection: SortDirection;             // Ascending or descending
    sortAlgorithm: VariableSortAlgorithm;    // Algorithm for variable sorting
    tieBreakingStrategy: TieBreakingStrategy; // Handling of equal values
    specialValueHandling: SpecialValueHandler; // Null, undefined, empty handling
  };
  
  // Step 3: Variable reordering
  variableReordering: {
    originalVariableOrder: Variable[];        // Variables before sorting
    sortedVariableOrder: Variable[];         // Variables after sorting
    orderMapping: OrderMapping;              // Mapping from old to new positions
    validationResults: ValidationResult[];   // Validation of new order
  };
  
  // Step 4: Data column synchronization
  dataColumnSynchronization: {
    originalDataStructure: DataStructure;    // Data before column reordering
    reorderedDataStructure: DataStructure;   // Data after column reordering
    columnMapping: ColumnMapping;            // Mapping of column positions
    integrityVerification: IntegrityVerification; // Verify data integrity
  };
  
  // Step 5: State update
  stateUpdate: {
    variableStoreUpdate: VariableStoreUpdater; // Update variable store
    dataStoreUpdate: DataStoreUpdater;        // Update data store
    atomicTransaction: AtomicTransaction;     // Ensure consistency
    rollbackPlan: RollbackPlan;              // Recovery plan if needed
  };
}
```

### Advanced Sorting Algorithms
```typescript
interface AdvancedSortingAlgorithms {
  // Natural language sorting
  naturalLanguageSorting: {
    alphanumericSorting: {
      description: 'Sort considering numeric parts in text';
      example: ['item1', 'item2', 'item10'] // Not ['item1', 'item10', 'item2']
      implementation: AlphanumericSorter;
      caseSensitivity: CaseSensitivityOption;
    };
    
    localeAwareSorting: {
      description: 'Sort according to language-specific rules';
      supportedLocales: SupportedLocale[];
      implementation: LocaleAwareSorter;
      collationRules: CollationRule[];
    };
    
    unicodeSorting: {
      description: 'Proper Unicode character sorting';
      normalizationForm: UnicodeNormalizationForm;
      implementation: UnicodeSorter;
      characterClassHandling: CharacterClassHandler;
    };
  };
  
  // Complex attribute sorting
  complexAttributeSorting: {
    valueLabelsBasedSorting: {
      description: 'Sort by value label definitions';
      sortingStrategy: ValueLabelSortStrategy;
      implementation: ValueLabelSorter;
      labelPriorityRules: LabelPriorityRule[];
    };
    
    dataTypeHierarchySorting: {
      description: 'Sort by data type hierarchy';
      typeHierarchy: DataTypeHierarchy;
      implementation: HierarchicalTypeSorter;
      customTypeRules: CustomTypeRule[];
    };
    
    computedPropertySorting: {
      description: 'Sort by calculated variable properties';
      computationMethods: ComputationMethod[];
      implementation: ComputedPropertySorter;
      cachingStrategy: CachingStrategy;
    };
  };
  
  // Performance-optimized sorting
  performanceOptimizedSorting: {
    lazyEvaluation: {
      description: 'Compute sort keys only when needed';
      implementation: LazyEvaluationSorter;
      memoryOptimization: MemoryOptimizer;
    };
    
    batchProcessing: {
      description: 'Process large variable sets in batches';
      batchSize: number;
      implementation: BatchProcessor;
      progressTracking: ProgressTracker;
    };
    
    indexedSorting: {
      description: 'Use pre-computed indices for faster sorting';
      indexBuilding: IndexBuilder;
      implementation: IndexedSorter;
      indexMaintenance: IndexMaintainer;
    };
  };
}
```

## 🔧 Hook Implementation

### useSortVariables Hook
```typescript
interface UseSortVariablesHook {
  // Variable sorting state
  variableSortingState: {
    availableAttributes: SortableAttribute[]; // All sortable variable attributes
    selectedAttribute: SortableAttribute;    // Currently selected sort attribute
    sortDirection: SortDirection;            // Current sort direction
    currentVariableOrder: Variable[];        // Current variable ordering
    originalVariableOrder: Variable[];       // Original variable ordering before sort
  };
  
  // Attribute management
  attributeManagement: {
    selectAttribute: (attribute: SortableAttribute) => void;
    validateAttribute: (attribute: SortableAttribute) => ValidationResult;
    getAttributeMetadata: (attribute: SortableAttribute) => AttributeMetadata;
    refreshAttributes: () => void;
  };
  
  // Sort configuration
  sortConfiguration: {
    sortDirection: SortDirection;
    setSortDirection: (direction: SortDirection) => void;
    tieBreakingStrategy: TieBreakingStrategy;
    setTieBreakingStrategy: (strategy: TieBreakingStrategy) => void;
    sortAlgorithm: VariableSortAlgorithm;
    setSortAlgorithm: (algorithm: VariableSortAlgorithm) => void;
  };
  
  // Advanced options
  advancedOptions: {
    caseSensitive: boolean;
    setCaseSensitive: (sensitive: boolean) => void;
    naturalSorting: boolean;
    setNaturalSorting: (natural: boolean) => void;
    localeSettings: LocaleSettings;
    setLocaleSettings: (locale: LocaleSettings) => void;
    customComparator: CustomComparator;
    setCustomComparator: (comparator: CustomComparator) => void;
  };
  
  // Preview and validation
  previewValidation: {
    generateSortPreview: () => Promise<SortPreview>;
    validateSortConfiguration: () => ValidationResult;
    previewResults: PreviewResult[];
    estimateSortImpact: () => SortImpact;
  };
  
  // Execution control
  executionControl: {
    executeSort: () => Promise<SortResult>;
    cancelSort: () => void;
    undoSort: () => void;
    redoSort: () => void;
    resetToOriginalOrder: () => void;
    sortProgress: SortProgress;
  };
  
  // History management
  historyManagement: {
    sortHistory: VariableSortOperation[];
    canUndo: boolean;
    canRedo: boolean;
    clearHistory: () => void;
    saveSortConfiguration: (name: string) => void;
    loadSortConfiguration: (name: string) => void;
    savedConfigurations: SavedSortConfiguration[];
  };
}
```

### Sort Variables Service
```typescript
interface SortVariablesService {
  // Core sorting operations
  coreSortingOperations: {
    sortVariablesByAttribute: (
      variables: Variable[],
      attribute: SortableAttribute,
      direction: SortDirection,
      options: SortOptions
    ) => Promise<VariableSortResult>;
    
    sortDataColumns: (
      data: DataRow[],
      originalVariableOrder: Variable[],
      newVariableOrder: Variable[]
    ) => Promise<DataColumnReorderResult>;
    
    synchronizeVariableDataOrder: (
      variables: Variable[],
      data: DataRow[]
    ) => Promise<SynchronizationResult>;
    
    validateSortIntegrity: (
      originalState: DataState,
      sortedState: DataState
    ) => IntegrityValidationResult;
  };
  
  // Attribute value extraction
  attributeValueExtraction: {
    extractAttributeValue: (
      variable: Variable,
      attribute: SortableAttribute
    ) => AttributeValue;
    
    preprocessAttributeValues: (
      values: AttributeValue[],
      attribute: SortableAttribute
    ) => PreprocessedValue[];
    
    handleSpecialValues: (
      value: AttributeValue,
      strategy: SpecialValueStrategy
    ) => ProcessedValue;
    
    computeDynamicAttributes: (
      variable: Variable,
      data: DataRow[]
    ) => ComputedAttributeValue[];
  };
  
  // Comparison and ordering
  comparisonOrdering: {
    createAttributeComparator: (
      attribute: SortableAttribute,
      options: ComparatorOptions
    ) => ComparatorFunction;
    
    naturalLanguageComparator: (
      a: string,
      b: string,
      options: NaturalSortOptions
    ) => number;
    
    hierarchicalComparator: (
      a: any,
      b: any,
      hierarchy: SortHierarchy
    ) => number;
    
    customComparator: (
      compareFn: CustomComparatorFunction
    ) => ComparatorFunction;
  };
  
  // Performance optimization
  performanceOptimization: {
    optimizeSortingStrategy: (
      variableCount: number,
      attribute: SortableAttribute
    ) => OptimalSortStrategy;
    
    batchProcessLargeVariableSets: (
      variables: Variable[],
      batchSize: number
    ) => Promise<BatchProcessResult>;
    
    cacheAttributeValues: (
      variables: Variable[],
      attributes: SortableAttribute[]
    ) => AttributeValueCache;
    
    parallelizeColumnReordering: (
      data: DataRow[],
      mapping: ColumnMapping
    ) => Promise<ParallelReorderResult>;
  };
  
  // Quality assurance
  qualityAssurance: {
    validateVariableOrder: (
      originalVariables: Variable[],
      sortedVariables: Variable[]
    ) => OrderValidationResult;
    
    verifyDataColumnAlignment: (
      variables: Variable[],
      data: DataRow[]
    ) => AlignmentValidationResult;
    
    detectSortingAnomalies: (
      sortResult: VariableSortResult
    ) => AnomalyDetectionResult;
    
    generateSortQualityReport: (
      sortOperation: VariableSortOperation
    ) => QualityReport;
  };
}
```

## 🎨 UI Components

### SortVarsUI Component
```typescript
interface SortVarsUIProps {
  // Attribute selection
  attributeSelection: {
    availableAttributes: SortableAttribute[];
    selectedAttribute: SortableAttribute;
    onAttributeSelect: (attribute: SortableAttribute) => void;
    attributeMetadata: Map<string, AttributeMetadata>;
  };
  
  // Sort configuration
  sortConfiguration: {
    sortDirection: SortDirection;
    onDirectionChange: (direction: SortDirection) => void;
    tieBreakingStrategy: TieBreakingStrategy;
    onTieBreakingChange: (strategy: TieBreakingStrategy) => void;
    sortAlgorithm: VariableSortAlgorithm;
    onAlgorithmChange: (algorithm: VariableSortAlgorithm) => void;
  };
  
  // Advanced options
  advancedOptions: {
    caseSensitive: boolean;
    onCaseSensitiveChange: (sensitive: boolean) => void;
    naturalSorting: boolean;
    onNaturalSortingChange: (natural: boolean) => void;
    localeSettings: LocaleSettings;
    onLocaleChange: (locale: LocaleSettings) => void;
    showAdvancedOptions: boolean;
    onToggleAdvancedOptions: () => void;
  };
  
  // Preview
  preview: {
    sortPreview: SortPreview;
    showPreview: boolean;
    onTogglePreview: () => void;
    onGeneratePreview: () => void;
    previewSize: number;
  };
  
  // Validation
  validation: {
    validationResults: ValidationResult[];
    isValidConfiguration: boolean;
    sortImpact: SortImpact;
    showValidation: boolean;
  };
  
  // Actions
  actions: {
    onSort: () => void;
    onCancel: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onSaveConfiguration: () => void;
    onLoadConfiguration: (config: SavedSortConfiguration) => void;
  };
  
  // State indicators
  stateIndicators: {
    isProcessing: boolean;
    sortProgress: SortProgress;
    canUndo: boolean;
    canRedo: boolean;
    hasUnsavedChanges: boolean;
  };
}
```

### SortVarsTest Component
```typescript
interface SortVarsTestProps {
  // Test scenarios
  testScenarios: VariableSortTestScenario[];
  selectedScenario: VariableSortTestScenario;
  onScenarioSelect: (scenario: VariableSortTestScenario) => void;
  
  // Test data
  testData: {
    testVariables: TestVariable[];
    testDataSets: TestDataSet[];
    expectedResults: ExpectedSortResult[];
    actualResults: ActualSortResult[];
  };
  
  // Algorithm testing
  algorithmTesting: {
    availableAlgorithms: VariableSortAlgorithm[];
    selectedAlgorithm: VariableSortAlgorithm;
    onAlgorithmSelect: (algorithm: VariableSortAlgorithm) => void;
    algorithmPerformance: AlgorithmPerformance[];
  };
  
  // Performance metrics
  performanceMetrics: {
    sortingTime: TimeMetrics;
    memoryUsage: MemoryMetrics;
    columnReorderingTime: TimeMetrics;
    integrityValidationTime: TimeMetrics;
  };
  
  // Test execution
  testExecution: {
    onRunTest: () => void;
    onRunAllTests: () => void;
    onRunPerformanceTest: () => void;
    onRunIntegrityTest: () => void;
    testResults: VariableSortTestResult[];
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Variable sorting testing
describe('SortVarsModal', () => {
  describe('Attribute-based sorting', () => {
    it('sorts variables by name correctly');
    it('sorts variables by type with proper ordering');
    it('sorts variables by measurement level hierarchically');
    it('handles computed attributes appropriately');
  });
  
  describe('Data column synchronization', () => {
    it('reorders data columns to match variable order');
    it('maintains data-variable relationship integrity');
    it('handles missing or extra columns gracefully');
    it('preserves data values during reordering');
  });
  
  describe('Advanced sorting features', () => {
    it('performs natural language sorting correctly');
    it('applies locale-specific sorting rules');
    it('handles Unicode characters properly');
    it('supports custom comparison logic');
  });
  
  describe('Performance', () => {
    it('handles large numbers of variables efficiently');
    it('optimizes column reordering for large datasets');
    it('provides progress feedback for long operations');
    it('manages memory usage effectively');
  });
  
  describe('State management', () => {
    it('updates variable store atomically');
    it('maintains undo/redo history correctly');
    it('handles concurrent modifications gracefully');
    it('preserves state consistency across operations');
  });
});

// Service testing
describe('sortVarsService', () => {
  describe('Variable sorting algorithms', () => {
    it('implements attribute-based sorting correctly');
    it('handles special values appropriately');
    it('maintains sort stability when required');
    it('optimizes performance for different data types');
  });
  
  describe('Column reordering', () => {
    it('maps column positions correctly');
    it('preserves data integrity during reordering');
    it('handles edge cases gracefully');
    it('validates results accurately');
  });
});
```

## 📋 Development Guidelines

### Adding New Sortable Attributes
```typescript
// 1. Define new attribute interface
interface NewSortableAttribute extends SortableAttribute {
  id: 'newAttribute';
  name: 'New Sortable Attribute';
  description: 'Description of attribute';
  type: 'string' | 'number' | 'boolean' | 'date' | 'complex';
  extractionMethod: AttributeExtractionMethod;
  comparisonMethod: AttributeComparisonMethod;
}

// 2. Implement extraction logic
const extractNewAttribute = (variable: Variable): AttributeValue => {
  // Attribute extraction logic
};

// 3. Implement comparison logic
const compareNewAttribute = (
  a: AttributeValue,
  b: AttributeValue,
  options: ComparisonOptions
): number => {
  // Comparison logic
};

// 4. Register attribute
const SORTABLE_ATTRIBUTES = {
  ...existingAttributes,
  newAttribute: {
    extract: extractNewAttribute,
    compare: compareNewAttribute,
    metadata: newAttributeMetadata
  }
};

// 5. Add comprehensive tests
describe('New Sortable Attribute', () => {
  it('extracts attribute values correctly');
  it('compares values appropriately');
  it('handles edge cases gracefully');
  it('maintains sort stability');
});
```

### Performance Optimization Guidelines
```typescript
// 1. Large variable set optimization
const optimizeForLargeVariableSets = (variableCount: number) => {
  if (variableCount > LARGE_VARIABLE_THRESHOLD) {
    return {
      useLazyEvaluation: true,
      batchSize: calculateOptimalBatchSize(variableCount),
      enableCaching: true,
      useIndexedSorting: true
    };
  }
  
  return {
    useStandardSorting: true,
    enableBasicCaching: false
  };
};

// 2. Column reordering optimization
const optimizeColumnReordering = (
  dataSize: number,
  columnCount: number
) => {
  const estimatedComplexity = dataSize * columnCount;
  
  if (estimatedComplexity > COMPLEX_REORDER_THRESHOLD) {
    return {
      useParallelProcessing: true,
      chunkSize: calculateOptimalChunkSize(dataSize),
      enableProgressTracking: true
    };
  }
  
  return {
    useSequentialProcessing: true,
    enableProgressTracking: false
  };
};
```

---

SortVars modal menyediakan comprehensive variable organization capabilities dengan attribute-based sorting, synchronized data column management, dan advanced sorting algorithms untuk optimal dataset structure management dalam Statify.
    -   The `overwriteAll` function from `useVariableStore` is called with both the new variable list and the new data array, atomically updating the application's state.
    -   The modal is closed, and the user sees the newly sorted variable view and data view.

## 5. Testing Strategy

The feature is tested across three layers to ensure correctness and robustness.

-   **UI Component Test (`__tests__/SortVarsUI.test.tsx`)**:
    -   Tests the `SortVarsUI` component in isolation by mocking its props.
    -   Verifies that the component renders the list of columns and sort options correctly.
    -   Simulates user clicks to ensure that the correct handler functions (`handleSelectColumn`, `setSortOrder`, `handleOk`, etc.) are called.
    -   Checks that the UI correctly reflects the state passed in via props (e.g., highlighting the selected column).

-   **Hook Test (`__tests__/useSortVariables.test.tsx`)**:
    -   Tests the business logic in the `useSortVariables` hook.
    -   Mocks dependencies like the Zustand stores and the `sortVarsService`.
    -   Verifies that the variable sorting logic is correct for different attributes and directions, including handling of null/undefined values.
    -   Ensures `sortDataColumns` is called with the correct arguments and that the stores are updated with the results.
    -   Tests the reset functionality.

-   **Service Test (`__tests__/sortVarsService.test.ts`)**:
    -   Unit tests the pure `sortDataColumns` function.
    -   Asserts that data columns are reordered correctly based on a provided mapping of old-to-new variable order.
    -   Tests edge cases like empty datasets and incomplete variable mappings to ensure the function is robust.
