# Sort Cases Modal - Advanced Data Sorting and Ordering

Modal untuk sorting dan ordering cases dalam Statify dengan multi-level sorting, stable sorting algorithms, dan comprehensive sort configuration management. Feature ini menyediakan powerful data organization capabilities untuk optimal data analysis preparation.

## 📁 Component Architecture

```
SortCases/
├── index.tsx                   # Main modal component
├── SortCasesUI.tsx            # Main sorting interface
├── SortCasesTest.tsx          # Sorting testing
├── types.ts                   # TypeScript type definitions
├── README.md                  # Documentation
│
├── __tests__/                 # Test suite
│   ├── SortCases.test.tsx         # Main component tests
│   ├── useSortCases.test.ts       # Hook logic tests
│   ├── sortingService.test.ts     # Service function tests
│   └── README.md                  # Test documentation
│
├── hooks/                     # Business logic hooks
│   └── useSortCases.ts            # Core sorting logic
│
└── services/                  # Business logic services
    └── sortingService.ts          # Sorting algorithms
```

## 🎯 Core Functionality

### Sorting Methods
```typescript
interface SortingMethods {
  // Single-level sorting
  singleLevelSort: {
    purpose: 'Sort data based on single variable';
    complexity: 'O(n log n)';
    stability: 'Stable sort algorithm';
    implementation: SingleLevelSorter;
  };
  
  // Multi-level sorting (Hierarchical)
  multiLevelSort: {
    purpose: 'Sort data with multiple priority levels';
    complexity: 'O(n log n * k) where k is number of sort keys';
    stability: 'Maintains stability across levels';
    implementation: MultiLevelSorter;
  };
  
  // Custom sorting
  customSort: {
    purpose: 'Sort with user-defined comparison logic';
    flexibility: 'High customization potential';
    implementation: CustomSorter;
    useCases: ['Complex data types', 'Business rules', 'Domain-specific ordering'];
  };
  
  // Stable sorting
  stableSort: {
    purpose: 'Preserve original order for equal elements';
    guarantee: 'Order preservation for equal keys';
    implementation: StableSorter;
    importance: 'Critical for multi-level sorting';
  };
}
```

### Sort Configuration
```typescript
interface SortConfiguration {
  // Sort key configuration
  sortKeyConfiguration: {
    sortKeys: SortKey[];                    // Ordered list of sort keys
    primaryKey: SortKey;                   // Primary sort criterion
    secondaryKeys: SortKey[];              // Secondary sort criteria
    keyPriority: KeyPriority[];            // Priority ordering of keys
  };
  
  // Direction configuration
  directionConfiguration: {
    ascending: 'Sort from lowest to highest';
    descending: 'Sort from highest to lowest';
    customOrder: 'User-defined ordering';
    naturalOrder: 'Language-aware ordering';
  };
  
  // Data type handling
  dataTypeHandling: {
    numericSorting: NumericSortingStrategy;
    textualSorting: TextualSortingStrategy;
    dateTimeSorting: DateTimeSortingStrategy;
    categoricalSorting: CategoricalSortingStrategy;
    mixedTypeSorting: MixedTypeSortingStrategy;
  };
  
  // Advanced options
  advancedOptions: {
    nullValueHandling: NullValueStrategy;   // How to handle null/missing values
    caseSensitivity: CaseSensitivityOption; // Case sensitivity for text
    localeAwareness: LocaleAwareComparison; // Locale-specific sorting
    customComparators: CustomComparator[];  // User-defined comparison functions
  };
}
```

## 🔄 Sorting Workflow

### Multi-Level Sorting Process
```typescript
interface MultiLevelSortingProcess {
  // Step 1: Sort key definition
  sortKeyDefinition: {
    availableVariables: Variable[];         // All variables available for sorting
    selectedSortKeys: SortKey[];           // Variables selected as sort keys
    keyPriorityOrder: PriorityOrder;       // Order of sort key importance
    configurationValidation: ValidationResult[]; // Validate sort configuration
  };
  
  // Step 2: Direction specification
  directionSpecification: {
    keyDirections: Map<string, SortDirection>; // Direction for each sort key
    defaultDirection: SortDirection;        // Default direction for new keys
    directionValidation: DirectionValidation; // Validate direction settings
    visualIndicators: DirectionIndicator[]; // UI indicators for sort directions
  };
  
  // Step 3: Sort execution
  sortExecution: {
    sortAlgorithm: SortAlgorithm;          // Selected sorting algorithm
    performanceOptimization: PerformanceOptimizer; // Optimize for large datasets
    progressTracking: ProgressTracker;     // Monitor sorting progress
    resultValidation: ResultValidator;     // Validate sorting results
  };
  
  // Step 4: State integration
  stateIntegration: {
    dataStateUpdate: DataStateUpdater;     // Update application data state
    indexMapping: IndexMappingManager;     // Manage original to sorted index mapping
    historyTracking: SortHistoryTracker;   // Track sorting operations for undo
    changeNotification: ChangeNotifier;    // Notify other components of changes
  };
}
```

### Sorting Algorithm Implementation
```typescript
interface SortingAlgorithmImplementation {
  // Core sorting algorithms
  coreSortingAlgorithms: {
    mergeSort: {
      stability: 'Stable';
      timeComplexity: 'O(n log n)';
      spaceComplexity: 'O(n)';
      implementation: MergeSortImplementation;
      bestFor: 'General purpose, stable sorting required';
    };
    
    quickSort: {
      stability: 'Unstable (with stable variant available)';
      timeComplexity: 'O(n log n) average, O(n²) worst';
      spaceComplexity: 'O(log n)';
      implementation: QuickSortImplementation;
      bestFor: 'Fast sorting when stability not required';
    };
    
    timSort: {
      stability: 'Stable';
      timeComplexity: 'O(n log n) worst, O(n) best';
      spaceComplexity: 'O(n)';
      implementation: TimSortImplementation;
      bestFor: 'Real-world data with existing order';
    };
    
    heapSort: {
      stability: 'Unstable';
      timeComplexity: 'O(n log n)';
      spaceComplexity: 'O(1)';
      implementation: HeapSortImplementation;
      bestFor: 'Memory-constrained environments';
    };
  };
  
  // Specialized sorting strategies
  specializedSortingStrategies: {
    radixSort: {
      applicability: 'Integer and fixed-length string data';
      timeComplexity: 'O(d * (n + k))';
      implementation: RadixSortImplementation;
      bestFor: 'Large datasets with integer keys';
    };
    
    countingSort: {
      applicability: 'Small range integer data';
      timeComplexity: 'O(n + k)';
      implementation: CountingSortImplementation;
      bestFor: 'Categorical data with known range';
    };
    
    bucketSort: {
      applicability: 'Uniformly distributed data';
      timeComplexity: 'O(n + k)';
      implementation: BucketSortImplementation;
      bestFor: 'Floating-point data with known distribution';
    };
  };
  
  // Multi-level sorting implementation
  multiLevelSortingImplementation: {
    cascadingSorting: {
      method: 'Sort by each key in reverse priority order';
      stability: 'Requires stable sorting algorithm';
      implementation: CascadingSortImplementation;
      efficiency: 'Multiple O(n log n) operations';
    };
    
    comparatorChaining: {
      method: 'Chain comparators for all sort keys';
      stability: 'Inherits stability from base algorithm';
      implementation: ComparatorChainingImplementation;
      efficiency: 'Single O(n log n) operation with complex comparison';
    };
    
    indexedSorting: {
      method: 'Create composite sort index';
      stability: 'Explicit stability control';
      implementation: IndexedSortImplementation;
      efficiency: 'Optimized for repeated sorts on same data';
    };
  };
}
```

## 🔧 Hook Implementation

### useSortCases Hook
```typescript
interface UseSortCasesHook {
  // Sort configuration state
  sortConfigurationState: {
    availableVariables: Variable[];        // Variables available for sorting
    sortKeys: SortKey[];                   // Current sort key configuration
    sortDirections: Map<string, SortDirection>; // Direction for each sort key
    isValidConfiguration: boolean;         // Whether current config is valid
    configurationErrors: ConfigurationError[]; // Any configuration errors
  };
  
  // Sort key management
  sortKeyManagement: {
    addSortKey: (variable: Variable) => void;
    removeSortKey: (variableId: string) => void;
    reorderSortKey: (variableId: string, newIndex: number) => void;
    moveSortKeyUp: (variableId: string) => void;
    moveSortKeyDown: (variableId: string) => void;
    clearAllSortKeys: () => void;
  };
  
  // Direction management
  directionManagement: {
    setSortDirection: (variableId: string, direction: SortDirection) => void;
    toggleSortDirection: (variableId: string) => void;
    setDefaultDirection: (direction: SortDirection) => void;
    resetDirections: () => void;
  };
  
  // Advanced configuration
  advancedConfiguration: {
    sortingAlgorithm: SortingAlgorithm;
    setSortingAlgorithm: (algorithm: SortingAlgorithm) => void;
    nullValueHandling: NullValueHandling;
    setNullValueHandling: (handling: NullValueHandling) => void;
    caseSensitive: boolean;
    setCaseSensitive: (sensitive: boolean) => void;
    localeSettings: LocaleSettings;
    setLocaleSettings: (locale: LocaleSettings) => void;
  };
  
  // Validation and preview
  validationPreview: {
    validateConfiguration: () => ValidationResult;
    generateSortPreview: () => Promise<SortPreview>;
    estimateSortTime: () => TimeEstimate;
    checkMemoryRequirements: () => MemoryRequirement;
  };
  
  // Execution control
  executionControl: {
    executeSort: () => Promise<SortResult>;
    cancelSort: () => void;
    undoSort: () => void;
    redoSort: () => void;
    resetData: () => void;
    sortProgress: SortProgress;
  };
  
  // History management
  historyManagement: {
    sortHistory: SortOperation[];
    canUndo: boolean;
    canRedo: boolean;
    clearHistory: () => void;
    saveSortConfiguration: (name: string) => void;
    loadSortConfiguration: (name: string) => void;
    savedConfigurations: SavedSortConfiguration[];
  };
}
```

### Sorting Service
```typescript
interface SortingService {
  // Core sorting operations
  coreSortingOperations: {
    singleLevelSort: (
      data: DataRow[],
      sortKey: SortKey,
      options: SortOptions
    ) => Promise<SortResult>;
    
    multiLevelSort: (
      data: DataRow[],
      sortKeys: SortKey[],
      options: SortOptions
    ) => Promise<SortResult>;
    
    stableSort: (
      data: DataRow[],
      compareFn: CompareFunction,
      options: SortOptions
    ) => Promise<SortResult>;
    
    customSort: (
      data: DataRow[],
      customComparator: CustomComparator,
      options: SortOptions
    ) => Promise<SortResult>;
  };
  
  // Comparison functions
  comparisonFunctions: {
    numericComparator: (a: number, b: number) => number;
    stringComparator: (a: string, b: string, caseSensitive?: boolean) => number;
    dateComparator: (a: Date, b: Date) => number;
    categoricalComparator: (a: any, b: any, order: any[]) => number;
    customComparator: (compareFn: CompareFunction) => ComparatorFunction;
    localeAwareComparator: (locale: string) => ComparatorFunction;
  };
  
  // Performance optimization
  performanceOptimization: {
    selectOptimalAlgorithm: (
      dataSize: number,
      dataType: DataType,
      requirements: SortRequirements
    ) => SortingAlgorithm;
    
    optimizeForLargeDatasets: (
      data: DataRow[],
      sortKeys: SortKey[]
    ) => OptimizationStrategy;
    
    chunkProcessing: (
      data: DataRow[],
      chunkSize: number,
      sortKeys: SortKey[]
    ) => Promise<ChunkedSortResult>;
    
    memoryEfficientSort: (
      data: DataRow[],
      sortKeys: SortKey[],
      memoryLimit: number
    ) => Promise<SortResult>;
  };
  
  // Quality assurance
  qualityAssurance: {
    validateSortResult: (
      original: DataRow[],
      sorted: DataRow[],
      sortKeys: SortKey[]
    ) => SortValidationResult;
    
    checkSortStability: (
      original: DataRow[],
      sorted: DataRow[],
      sortKey: SortKey
    ) => StabilityReport;
    
    measureSortQuality: (
      sorted: DataRow[],
      sortKeys: SortKey[]
    ) => QualityMetrics;
    
    generateSortReport: (
      sortResult: SortResult
    ) => SortOperationReport;
  };
}
```

## 🎨 UI Components

### SortCasesUI Component
```typescript
interface SortCasesUIProps {
  // Variable management
  variableManagement: {
    availableVariables: Variable[];
    sortKeys: SortKey[];
    onAddSortKey: (variable: Variable) => void;
    onRemoveSortKey: (variableId: string) => void;
    onReorderSortKeys: (fromIndex: number, toIndex: number) => void;
  };
  
  // Sort configuration
  sortConfiguration: {
    sortDirections: Map<string, SortDirection>;
    onDirectionChange: (variableId: string, direction: SortDirection) => void;
    defaultDirection: SortDirection;
    onDefaultDirectionChange: (direction: SortDirection) => void;
  };
  
  // Advanced options
  advancedOptions: {
    sortingAlgorithm: SortingAlgorithm;
    onAlgorithmChange: (algorithm: SortingAlgorithm) => void;
    nullValueHandling: NullValueHandling;
    onNullHandlingChange: (handling: NullValueHandling) => void;
    caseSensitive: boolean;
    onCaseSensitiveChange: (sensitive: boolean) => void;
    showAdvancedOptions: boolean;
    onToggleAdvancedOptions: () => void;
  };
  
  // Preview and validation
  previewValidation: {
    sortPreview: SortPreview;
    showPreview: boolean;
    onTogglePreview: () => void;
    onGeneratePreview: () => void;
    validationResults: ValidationResult[];
    isValidConfiguration: boolean;
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

### SortCasesTest Component
```typescript
interface SortCasesTestProps {
  // Test scenarios
  testScenarios: TestScenario[];
  selectedScenario: TestScenario;
  onScenarioSelect: (scenario: TestScenario) => void;
  
  // Test data
  testData: {
    originalData: TestData;
    sortConfigurations: SortConfiguration[];
    expectedResults: ExpectedSortResult[];
    actualResults: ActualSortResult[];
  };
  
  // Algorithm testing
  algorithmTesting: {
    availableAlgorithms: SortingAlgorithm[];
    selectedAlgorithm: SortingAlgorithm;
    onAlgorithmSelect: (algorithm: SortingAlgorithm) => void;
    algorithmPerformance: AlgorithmPerformance[];
  };
  
  // Performance metrics
  performanceMetrics: {
    executionTime: TimeMetrics;
    memoryUsage: MemoryMetrics;
    sortStability: StabilityMetrics;
    accuracyMetrics: AccuracyMetrics;
  };
  
  // Test execution
  testExecution: {
    onRunTest: () => void;
    onRunAllTests: () => void;
    onRunBenchmark: () => void;
    onRunStabilityTest: () => void;
    testResults: TestResult[];
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Sorting functionality testing
describe('SortCasesModal', () => {
  describe('Single-level sorting', () => {
    it('sorts numeric data correctly in ascending order');
    it('sorts numeric data correctly in descending order');
    it('sorts text data with case sensitivity options');
    it('handles null values according to specified strategy');
  });
  
  describe('Multi-level sorting', () => {
    it('performs hierarchical sorting correctly');
    it('maintains sort key priority order');
    it('preserves stability across sort levels');
    it('handles complex sort configurations');
  });
  
  describe('Sort stability', () => {
    it('maintains original order for equal elements');
    it('preserves stability in multi-level sorts');
    it('validates stability guarantees');
  });
  
  describe('Performance', () => {
    it('handles large datasets efficiently');
    it('optimizes algorithm selection based on data characteristics');
    it('provides progress feedback for long operations');
    it('manages memory usage effectively');
  });
  
  describe('Data type handling', () => {
    it('sorts different data types correctly');
    it('handles mixed data types appropriately');
    it('applies locale-aware sorting for text');
    it('processes dates and times correctly');
  });
});

// Service testing
describe('sortingService', () => {
  describe('Sorting algorithms', () => {
    it('implements merge sort correctly');
    it('implements quick sort correctly');
    it('maintains stability requirements');
    it('optimizes algorithm selection');
  });
  
  describe('Comparison functions', () => {
    it('compares numeric values correctly');
    it('handles string comparison with locale awareness');
    it('processes date comparisons accurately');
    it('supports custom comparison logic');
  });
});
```

## 📋 Development Guidelines

### Adding New Sorting Algorithms
```typescript
// 1. Define algorithm interface
interface NewSortingAlgorithm extends SortingAlgorithm {
  id: 'newAlgorithm';
  name: 'New Sorting Algorithm';
  description: 'Description of algorithm characteristics';
  stability: 'stable' | 'unstable';
  timeComplexity: string;
  spaceComplexity: string;
  bestFor: string[];
}

// 2. Implement algorithm logic
const newAlgorithmImplementation = {
  sort: <T>(
    array: T[],
    compareFn: CompareFunction<T>,
    options: SortOptions
  ): SortResult<T> => {
    // Algorithm implementation
  },
  
  validate: (data: any[]): ValidationResult => {
    // Validation logic
  },
  
  estimatePerformance: (dataSize: number): PerformanceEstimate => {
    // Performance estimation
  }
};

// 3. Register algorithm
const SORTING_ALGORITHMS = {
  ...existingAlgorithms,
  newAlgorithm: newAlgorithmImplementation
};

// 4. Add comprehensive tests
describe('New Sorting Algorithm', () => {
  it('sorts data correctly');
  it('maintains stability requirements');
  it('handles edge cases appropriately');
  it('performs within expected time complexity');
});
```

### Performance Optimization Guidelines
```typescript
// 1. Algorithm selection optimization
const selectOptimalAlgorithm = (
  dataCharacteristics: DataCharacteristics
) => {
  if (dataCharacteristics.size < SMALL_DATASET_THRESHOLD) {
    return 'insertionSort'; // Good for small datasets
  }
  
  if (dataCharacteristics.isPartiallyOrdered) {
    return 'timSort'; // Excellent for real-world data
  }
  
  if (dataCharacteristics.stabilityRequired) {
    return 'mergeSort'; // Guaranteed stable
  }
  
  return 'quickSort'; // Fast general-purpose algorithm
};

// 2. Memory usage optimization
const optimizeMemoryUsage = (
  dataSize: number,
  availableMemory: number
) => {
  const estimatedMemoryNeeded = dataSize * MEMORY_PER_ELEMENT;
  
  if (estimatedMemoryNeeded > availableMemory) {
    return {
      useExternalSort: true,
      chunkSize: Math.floor(availableMemory / MEMORY_PER_ELEMENT),
      temporaryStorage: true
    };
  }
  
  return {
    useInMemorySort: true,
    algorithm: 'mergeSort'
  };
};
```

---

SortCases modal menyediakan comprehensive data sorting capabilities dengan multi-level hierarchical sorting, stable algorithms, dan performance optimization untuk efficient data organization dalam Statify.

```
/SortCases
├── 📂 hooks/
│   └── 📄 useSortCases.ts    // Mengelola semua state & logika
├── 📄 index.tsx              // Titik masuk & perakit (Orchestrator)
├── 📄 README.md              // Dokumen ini
├── 📄 SortCasesUI.tsx        // Komponen UI (Presentational)
└── 📄 types.ts              // Definisi tipe TypeScript
```

-   **`index.tsx` (Orchestrator)**:
    -   Bertanggung jawab untuk merakit fitur.
    -   Memanggil *hook* `useSortCases` untuk mendapatkan state dan *handler*.
    -   Merender `SortCasesUI` dan meneruskan *props* yang diperlukan.

-   **`useSortCases.ts` (Hook Logika)**:
    -   Mengelola state untuk daftar variabel yang tersedia dan variabel yang dipilih untuk pengurutan (`sortByConfigs`).
    -   Menyimpan konfigurasi pengurutan untuk setiap variabel (termasuk arah pengurutan).
    -   Menyediakan *handler* untuk memindahkan variabel, mengubah urutan, dan mengubah arah pengurutan.
    -   Memanggil `sortData` dari `useDataStore` saat pengguna mengonfirmasi tindakan.

-   **`SortCasesUI.tsx` (Komponen UI)**:
    -   Komponen presentasi murni yang menerima semua data dan *handler* dari `index.tsx`.
    -   Menggunakan `VariableListManager` untuk menampilkan daftar variabel.
    -   Merender kontrol tambahan (misalnya, tombol radio untuk arah pengurutan) saat sebuah variabel dalam daftar "Sort By" dipilih.
    -   Tidak mengandung logika bisnis apa pun.

-   **`types.ts` (Definisi Tipe)**:
    -   Mendefinisikan *interface* seperti `SortVariableConfig` (untuk menyimpan variabel dan arah pengurutannya).
    -   Mendefinisikan *props* untuk `SortCasesModal` dan `SortCasesUI`, memastikan keamanan tipe.

## Alur Kerja

1.  **Inisialisasi**:
    -   Pengguna membuka modal "Sort Cases".
    -   `useSortCases` mengambil semua variabel dari `useVariableStore` dan menampilkannya di daftar "Available".

2.  **Interaksi Pengguna**:
    -   Pengguna memindahkan satu atau lebih variabel dari daftar "Available" ke daftar "Sort By".
    -   Untuk setiap variabel yang dipindahkan, konfigurasi default (misalnya, `ascending`) diterapkan.
    -   Pengguna dapat memilih variabel di daftar "Sort By" untuk mengubah arah pengurutannya (naik/turun) atau mengubah posisinya dalam antrian prioritas.

3.  **Penyimpanan**:
    -   Pengguna mengklik "OK".
    -   *Handler* `handleOk` di dalam *hook* dipanggil.
    -   Fungsi ini melakukan iterasi melalui `sortByConfigs` sesuai urutannya.
    -   Untuk setiap konfigurasi, ia memanggil `sortData` dari `useDataStore` dengan `columnIndex` dan `direction` yang sesuai.
    -   `useDataStore` memperbarui state datanya, dan perubahan ini secara otomatis tercermin di seluruh aplikasi.
    -   Modal ditutup. 