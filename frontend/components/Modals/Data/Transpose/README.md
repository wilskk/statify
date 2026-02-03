# Transpose Data Modal - Advanced Matrix Transposition and Data Restructuring

Modal untuk transposing dan restructuring data dalam Statify dengan comprehensive matrix operations, flexible naming strategies, dan intelligent data type preservation. Feature ini menyediakan powerful data transformation capabilities untuk complex data reshaping needs.

## 📁 Component Architecture

```
Transpose/
├── index.tsx                   # Main modal component
├── TransposeUI.tsx            # Main transposition interface
├── TransposeTest.tsx          # Transposition testing
├── types.ts                   # TypeScript type definitions
├── README.md                  # Documentation
│
├── __tests__/                 # Test suite
│   ├── Transpose.test.tsx         # Main component tests
│   ├── useTranspose.test.ts       # Hook logic tests
│   ├── transposeService.test.ts   # Service function tests
│   └── README.md                  # Test documentation
│
├── hooks/                     # Business logic hooks
│   └── useTranspose.ts            # Core transposition logic
│
└── services/                  # Business logic services
    └── transposeService.ts        # Matrix transposition algorithms
```

## 🎯 Core Functionality

### Transposition Methods
```typescript
interface TranspositionMethods {
  // Complete matrix transpose
  completeMatrixTranspose: {
    purpose: 'Swap all rows and columns in dataset';
    behavior: 'Full matrix transposition with dimension flip';
    useCase: 'Data orientation change, matrix operations';
    implementation: CompleteMatrixTransposer;
  };
  
  // Selective variable transpose
  selectiveVariableTranspose: {
    purpose: 'Transpose selected variables only';
    behavior: 'Partial transposition with variable selection';
    useCase: 'Targeted data restructuring, keeping some variables intact';
    implementation: SelectiveTransposer;
  };
  
  // Named transpose
  namedTranspose: {
    purpose: 'Use variable values as new column names';
    behavior: 'Value-based naming for transposed variables';
    useCase: 'Meaningful column naming, identifier-based transpose';
    implementation: NamedTransposer;
  };
  
  // First row header transpose
  firstRowHeaderTranspose: {
    purpose: 'Use first row values as column headers';
    behavior: 'Header extraction from data values';
    useCase: 'Converting tabular data with embedded headers';
    implementation: HeaderExtractingTransposer;
  };
}
```

### Transposition Configuration
```typescript
interface TranspositionConfiguration {
  // Variable selection
  variableSelection: {
    selectedVariables: Variable[];          // Variables to transpose
    excludedVariables: Variable[];          // Variables to keep as-is
    nameVariable: Variable;                 // Variable providing new column names
    identifierVariables: Variable[];        // Variables to preserve as identifiers
  };
  
  // Naming strategies
  namingStrategies: {
    automaticNaming: AutomaticNamingStrategy;   // Auto-generate column names
    valueBasedNaming: ValueBasedNamingStrategy; // Use variable values as names
    headerRowNaming: HeaderRowNamingStrategy;   // Use first row as headers
    customNamingPattern: CustomNamingPattern;   // User-defined naming pattern
  };
  
  // Data handling options
  dataHandlingOptions: {
    preserveDataTypes: boolean;             // Maintain original data types when possible
    handleMissingValues: MissingValueStrategy; // Strategy for missing values
    aggregateDuplicates: DuplicateAggregationStrategy; // Handle duplicate names
    validateResultStructure: boolean;        // Validate transposed structure
  };
  
  // Advanced options
  advancedOptions: {
    memoryOptimization: MemoryOptimizationStrategy; // Optimize for large datasets
    progressTracking: ProgressTrackingOption;  // Track transposition progress
    parallelProcessing: ParallelProcessingOption; // Use parallel processing
    resultValidation: ResultValidationOption;   // Validate transposition results
  };
}
```

## 🔄 Transposition Workflow

### Complete Transposition Process
```typescript
interface CompleteTranspositionProcess {
  // Step 1: Configuration setup
  configurationSetup: {
    variableSelection: VariableSelector;     // Select variables for transposition
    namingConfiguration: NamingConfigurator; // Configure naming strategy
    optionConfiguration: OptionConfigurator; // Set transposition options
    validationSetup: ValidationSetup;       // Setup validation rules
  };
  
  // Step 2: Data preparation
  dataPreparation: {
    dataValidation: DataValidator;           // Validate input data structure
    typeAnalysis: TypeAnalyzer;             // Analyze data types
    structureAnalysis: StructureAnalyzer;   // Analyze data structure
    memoryEstimation: MemoryEstimator;      // Estimate memory requirements
  };
  
  // Step 3: Matrix transposition
  matrixTransposition: {
    dimensionCalculation: DimensionCalculator; // Calculate new dimensions
    matrixRotation: MatrixRotator;           // Perform matrix rotation
    dataReorganization: DataReorganizer;     // Reorganize data elements
    progressTracking: ProgressTracker;      // Track transposition progress
  };
  
  // Step 4: Variable reconstruction
  variableReconstruction: {
    newVariableCreation: VariableCreator;    // Create new variable definitions
    nameGeneration: NameGenerator;           // Generate variable names
    typeInference: TypeInferrer;             // Infer new variable types
    metadataPreservation: MetadataPreserver; // Preserve relevant metadata
  };
  
  // Step 5: Result validation
  resultValidation: {
    dimensionValidation: DimensionValidator; // Validate new dimensions
    dataIntegrityCheck: IntegrityChecker;    // Check data integrity
    typeConsistencyCheck: TypeConsistencyChecker; // Verify type consistency
    qualityAssessment: QualityAssessor;      // Assess transposition quality
  };
}
```

### Advanced Transposition Algorithms
```typescript
interface AdvancedTranspositionAlgorithms {
  // Memory-efficient transposition
  memoryEfficientTransposition: {
    chunkedProcessing: {
      description: 'Process large datasets in chunks';
      chunkSize: number;
      implementation: ChunkedTransposer;
      memoryUsage: 'O(chunk_size)';
    };
    
    streamingTransposition: {
      description: 'Stream data during transposition';
      bufferSize: number;
      implementation: StreamingTransposer;
      memoryUsage: 'O(buffer_size)';
    };
    
    temporaryFileUsage: {
      description: 'Use temporary files for very large datasets';
      tempFileStrategy: TempFileStrategy;
      implementation: TempFileTransposer;
      diskSpaceRequirement: 'O(2 * dataset_size)';
    };
  };
  
  // Parallel transposition
  parallelTransposition: {
    threadBasedParallelism: {
      description: 'Use multiple threads for transposition';
      threadCount: number;
      implementation: ThreadParallelTransposer;
      speedup: 'O(thread_count)';
    };
    
    blockBasedParallelism: {
      description: 'Divide matrix into blocks for parallel processing';
      blockSize: [number, number];
      implementation: BlockParallelTransposer;
      coordination: ParallelCoordinator;
    };
    
    pipelineParallelism: {
      description: 'Pipeline different stages of transposition';
      stageCount: number;
      implementation: PipelineTransposer;
      throughput: 'Improved for large datasets';
    };
  };
  
  // Intelligent transposition
  intelligentTransposition: {
    typePreservingTransposition: {
      description: 'Maintain data types during transposition';
      typeAnalyzer: TypeAnalyzer;
      implementation: TypePreservingTransposer;
      preservationAccuracy: 'High';
    };
    
    structureAwareTransposition: {
      description: 'Consider data structure during transposition';
      structureAnalyzer: StructureAnalyzer;
      implementation: StructureAwareTransposer;
      adaptiveProcessing: AdaptiveProcessor;
    };
    
    qualityOptimizedTransposition: {
      description: 'Optimize for result quality';
      qualityMetrics: QualityMetric[];
      implementation: QualityOptimizedTransposer;
      qualityAssurance: QualityAssurer;
    };
  };
}
```

## 🔧 Hook Implementation

### useTranspose Hook
```typescript
interface UseTransposeHook {
  // Transposition state
  transpositionState: {
    availableVariables: Variable[];         // Variables available for transposition
    selectedVariables: Variable[];          // Variables selected for transposition
    nameVariable: Variable;                 // Variable for naming new columns
    currentConfiguration: TranspositionConfiguration; // Current config
    previewData: TranspositionPreview;      // Preview of transposed data
  };
  
  // Variable management
  variableManagement: {
    selectVariable: (variable: Variable) => void;
    unselectVariable: (variable: Variable) => void;
    setNameVariable: (variable: Variable) => void;
    clearNameVariable: () => void;
    selectAllVariables: () => void;
    clearAllVariables: () => void;
  };
  
  // Configuration management
  configurationManagement: {
    setNamingStrategy: (strategy: NamingStrategy) => void;
    setDataHandlingOption: (option: DataHandlingOption) => void;
    setAdvancedOption: (option: AdvancedOption) => void;
    resetConfiguration: () => void;
    saveConfiguration: (name: string) => void;
    loadConfiguration: (name: string) => void;
  };
  
  // Preview and validation
  previewValidation: {
    generatePreview: () => Promise<TranspositionPreview>;
    validateConfiguration: () => ValidationResult;
    estimateResultSize: () => SizeEstimate;
    checkMemoryRequirements: () => MemoryRequirement;
    analyzePerformanceImpact: () => PerformanceImpact;
  };
  
  // Execution control
  executionControl: {
    executeTransposition: () => Promise<TranspositionResult>;
    cancelTransposition: () => void;
    undoTransposition: () => void;
    redoTransposition: () => void;
    resetToOriginal: () => void;
    transpositionProgress: TranspositionProgress;
  };
  
  // History management
  historyManagement: {
    transpositionHistory: TranspositionOperation[];
    canUndo: boolean;
    canRedo: boolean;
    clearHistory: () => void;
    exportConfiguration: () => ConfigurationExport;
    importConfiguration: (config: ConfigurationImport) => void;
  };
}
```

### Transpose Service
```typescript
interface TransposeService {
  // Core transposition operations
  coreTranspositionOperations: {
    transposeMatrix: (
      data: DataMatrix,
      config: TranspositionConfiguration
    ) => Promise<TranspositionResult>;
    
    selectiveTranspose: (
      data: DataMatrix,
      selectedColumns: number[],
      config: TranspositionConfiguration
    ) => Promise<TranspositionResult>;
    
    namedTranspose: (
      data: DataMatrix,
      nameColumn: number,
      config: TranspositionConfiguration
    ) => Promise<TranspositionResult>;
    
    headerRowTranspose: (
      data: DataMatrix,
      useFirstRowAsHeaders: boolean,
      config: TranspositionConfiguration
    ) => Promise<TranspositionResult>;
  };
  
  // Data structure analysis
  dataStructureAnalysis: {
    analyzeDimensions: (data: DataMatrix) => DimensionAnalysis;
    analyzeDataTypes: (data: DataMatrix) => DataTypeAnalysis;
    estimateMemoryUsage: (data: DataMatrix) => MemoryUsageEstimate;
    assessTranspositionComplexity: (data: DataMatrix) => ComplexityAssessment;
  };
  
  // Naming utilities
  namingUtilities: {
    generateAutomaticNames: (count: number, prefix: string) => string[];
    extractNamesFromColumn: (data: DataMatrix, columnIndex: number) => string[];
    validateVariableNames: (names: string[]) => NameValidationResult;
    sanitizeVariableNames: (names: string[]) => string[];
    handleDuplicateNames: (names: string[], strategy: DuplicateStrategy) => string[];
  };
  
  // Performance optimization
  performanceOptimization: {
    selectOptimalAlgorithm: (
      dataSize: DataSize,
      memoryConstraints: MemoryConstraints
    ) => OptimalAlgorithm;
    
    optimizeForLargeDatasets: (
      data: DataMatrix,
      config: TranspositionConfiguration
    ) => OptimizedConfiguration;
    
    parallelizeTransposition: (
      data: DataMatrix,
      parallelismConfig: ParallelismConfiguration
    ) => Promise<ParallelTranspositionResult>;
    
    streamTransposition: (
      dataStream: DataStream,
      config: TranspositionConfiguration
    ) => Promise<StreamTranspositionResult>;
  };
  
  // Quality assurance
  qualityAssurance: {
    validateTranspositionResult: (
      original: DataMatrix,
      transposed: DataMatrix,
      config: TranspositionConfiguration
    ) => ValidationReport;
    
    checkDataIntegrity: (
      result: TranspositionResult
    ) => IntegrityReport;
    
    assessResultQuality: (
      result: TranspositionResult
    ) => QualityReport;
    
    generateTranspositionSummary: (
      operation: TranspositionOperation
    ) => OperationSummary;
  };
}
```

## 🎨 UI Components

### TransposeUI Component
```typescript
interface TransposeUIProps {
  // Variable selection
  variableSelection: {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    onVariableSelect: (variable: Variable) => void;
    onVariableUnselect: (variable: Variable) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
  };
  
  // Naming configuration
  namingConfiguration: {
    nameVariable: Variable;
    onNameVariableSelect: (variable: Variable) => void;
    onNameVariableClear: () => void;
    namingStrategy: NamingStrategy;
    onNamingStrategyChange: (strategy: NamingStrategy) => void;
    useFirstRowAsHeaders: boolean;
    onUseFirstRowChange: (use: boolean) => void;
  };
  
  // Options configuration
  optionsConfiguration: {
    preserveDataTypes: boolean;
    onPreserveDataTypesChange: (preserve: boolean) => void;
    handleMissingValues: MissingValueStrategy;
    onMissingValueStrategyChange: (strategy: MissingValueStrategy) => void;
    memoryOptimization: boolean;
    onMemoryOptimizationChange: (optimize: boolean) => void;
    showAdvancedOptions: boolean;
    onToggleAdvancedOptions: () => void;
  };
  
  // Preview
  preview: {
    previewData: TranspositionPreview;
    showPreview: boolean;
    onTogglePreview: () => void;
    onGeneratePreview: () => void;
    previewSize: PreviewSize;
    onPreviewSizeChange: (size: PreviewSize) => void;
  };
  
  // Validation
  validation: {
    validationResults: ValidationResult[];
    isValidConfiguration: boolean;
    estimatedResultSize: SizeEstimate;
    memoryRequirements: MemoryRequirement;
    performanceWarnings: PerformanceWarning[];
  };
  
  // Actions
  actions: {
    onTranspose: () => void;
    onCancel: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onSaveConfiguration: () => void;
    onLoadConfiguration: (config: SavedConfiguration) => void;
  };
  
  // State indicators
  stateIndicators: {
    isProcessing: boolean;
    transpositionProgress: TranspositionProgress;
    canUndo: boolean;
    canRedo: boolean;
    hasUnsavedChanges: boolean;
  };
}
```

### TransposeTest Component
```typescript
interface TransposeTestProps {
  // Test scenarios
  testScenarios: TranspositionTestScenario[];
  selectedScenario: TranspositionTestScenario;
  onScenarioSelect: (scenario: TranspositionTestScenario) => void;
  
  // Test data
  testData: {
    originalMatrices: TestMatrix[];
    transpositionConfigs: TranspositionConfiguration[];
    expectedResults: ExpectedTranspositionResult[];
    actualResults: ActualTranspositionResult[];
  };
  
  // Algorithm testing
  algorithmTesting: {
    availableAlgorithms: TranspositionAlgorithm[];
    selectedAlgorithm: TranspositionAlgorithm;
    onAlgorithmSelect: (algorithm: TranspositionAlgorithm) => void;
    algorithmPerformance: AlgorithmPerformanceMetrics[];
  };
  
  // Performance metrics
  performanceMetrics: {
    transpositionTime: TimeMetrics;
    memoryUsage: MemoryMetrics;
    cpuUtilization: CPUMetrics;
    qualityMetrics: QualityMetrics;
  };
  
  // Test execution
  testExecution: {
    onRunTest: () => void;
    onRunAllTests: () => void;
    onRunPerformanceTest: () => void;
    onRunStressTest: () => void;
    testResults: TranspositionTestResult[];
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Transposition functionality testing
describe('TransposeModal', () => {
  describe('Complete matrix transposition', () => {
    it('transposes simple matrices correctly');
    it('handles rectangular matrices properly');
    it('preserves data values during transposition');
    it('maintains data relationships correctly');
  });
  
  describe('Selective transposition', () => {
    it('transposes selected variables only');
    it('preserves non-selected variables');
    it('handles mixed variable types');
    it('maintains proper indexing');
  });
  
  describe('Named transposition', () => {
    it('uses variable values as column names');
    it('handles duplicate names appropriately');
    it('sanitizes invalid names correctly');
    it('preserves original variable relationships');
  });
  
  describe('Header row transposition', () => {
    it('extracts headers from first row');
    it('excludes header row from data');
    it('handles mixed data types in headers');
    it('validates header name uniqueness');
  });
  
  describe('Performance', () => {
    it('handles large matrices efficiently');
    it('optimizes memory usage for large datasets');
    it('provides progress feedback for long operations');
    it('supports cancellation of long operations');
  });
  
  describe('Data integrity', () => {
    it('preserves all data values');
    it('maintains data type consistency');
    it('handles missing values correctly');
    it('validates result dimensions');
  });
});

// Service testing
describe('transposeService', () => {
  describe('Matrix operations', () => {
    it('performs matrix transposition correctly');
    it('handles edge cases gracefully');
    it('optimizes for different matrix sizes');
    it('validates input and output data');
  });
  
  describe('Naming utilities', () => {
    it('generates valid variable names');
    it('handles name conflicts appropriately');
    it('sanitizes invalid characters');
    it('preserves name uniqueness');
  });
});
```

## 📋 Development Guidelines

### Adding New Transposition Algorithms
```typescript
// 1. Define algorithm interface
interface NewTranspositionAlgorithm extends TranspositionAlgorithm {
  id: 'newAlgorithm';
  name: 'New Transposition Algorithm';
  description: 'Description of algorithm characteristics';
  memoryComplexity: string;
  timeComplexity: string;
  bestFor: DataCharacteristics[];
}

// 2. Implement algorithm logic
const newAlgorithmImplementation = {
  transpose: (
    data: DataMatrix,
    config: TranspositionConfiguration
  ): Promise<TranspositionResult> => {
    // Algorithm implementation
  },
  
  validate: (data: DataMatrix): ValidationResult => {
    // Validation logic
  },
  
  estimatePerformance: (
    dataSize: DataSize
  ): PerformanceEstimate => {
    // Performance estimation
  }
};

// 3. Register algorithm
const TRANSPOSITION_ALGORITHMS = {
  ...existingAlgorithms,
  newAlgorithm: newAlgorithmImplementation
};

// 4. Add comprehensive tests
describe('New Transposition Algorithm', () => {
  it('transposes data correctly');
  it('handles edge cases appropriately');
  it('performs within expected complexity bounds');
  it('maintains data integrity');
});
```

### Performance Optimization Guidelines
```typescript
// 1. Memory optimization
const optimizeMemoryUsage = (
  dataSize: DataSize,
  availableMemory: number
) => {
  const estimatedMemory = dataSize.rows * dataSize.columns * MEMORY_PER_CELL;
  
  if (estimatedMemory > availableMemory * 0.8) {
    return {
      useChunkedProcessing: true,
      chunkSize: calculateOptimalChunkSize(availableMemory),
      enableTemporaryFiles: true
    };
  }
  
  return {
    useInMemoryProcessing: true,
    enableParallelProcessing: true
  };
};

// 2. Algorithm selection
const selectOptimalAlgorithm = (
  dataCharacteristics: DataCharacteristics
) => {
  if (dataCharacteristics.isSparse) {
    return 'sparseMatrixTransposer';
  }
  
  if (dataCharacteristics.isVeryLarge) {
    return 'streamingTransposer';
  }
  
  if (dataCharacteristics.isSquare) {
    return 'inPlaceTransposer';
  }
  
  return 'standardTransposer';
};
```

---

Transpose modal menyediakan comprehensive matrix transposition capabilities dengan advanced algorithms, intelligent naming strategies, dan performance optimization untuk complex data restructuring tasks dalam Statify.

```
/Transpose
├── 📂 hooks/
│   └── 📄 useTranspose.ts       // Mengelola state & logika UI.
├── 📂 services/
│   └── 📄 transposeService.ts  // Logika bisnis inti untuk transposisi data.
├── 📄 index.tsx                 // Titik masuk & perakit (Orchestrator).
├── 📄 README.md                 // Dokumen ini.
├── 📄 TransposeUI.tsx           // Komponen UI (Presentational).
└── 📄 types.ts                 // Definisi tipe TypeScript.
```

-   **`index.tsx` (Orchestrator)**: Hanya bertindak sebagai perakit. Ia memanggil *hook* `useTranspose` dan menyambungkan propertinya ke komponen `TransposeUI`.
-   **`TransposeUI.tsx` (Komponen UI)**: Komponen "bodoh" yang bertanggung jawab untuk menampilkan semua elemen antarmuka pengguna, termasuk daftar variabel dan tombol.
-   **`hooks/useTranspose.ts` (Hook Logika)**: Mengelola state UI (seperti variabel mana yang tersedia, dipilih, dan untuk penamaan) dan menangani interaksi pengguna, mendelegasikan pemrosesan data ke *service*.
-   **`services/transposeService.ts` (Service)**: Berisi fungsi murni `transposeDataService` yang melakukan semua pekerjaan berat: mengambil data, variabel yang dipilih, dan variabel penamaan, lalu mengembalikan dataset dan daftar variabel baru yang sudah ditransposisi.
-   **`types.ts` (Definisi Tipe)**: Mengekspor semua tipe dan *props* yang diperlukan untuk memastikan keamanan tipe di seluruh fitur.

## Alur Kerja

1.  **Inisialisasi**: `useTranspose` mengambil daftar variabel saat ini dari `useVariableStore`.
2.  **Interaksi Pengguna**: Pengguna menyeret variabel ke dalam daftar "Variable(s)" dan (opsional) ke daftar "Name Variable".
3.  **Eksekusi**:
    -   Pengguna mengklik "OK".
    -   `handleOk` di dalam `useTranspose` dipanggil.
    -   Ia memanggil `transposeDataService`, memberikan data saat ini dan variabel yang dipilih pengguna.
    -   *Service* melakukan transposisi, membuat variabel `case_lbl`, dan membuat nama variabel baru.
    -   Hasilnya (data baru dan variabel baru) dikembalikan ke *hook*.
4.  **Pembaruan State**: *Hook* `useTranspose` memperbarui `useDataStore` dan `useVariableStore` dengan data dan variabel baru.
5.  **Selesai**: Modal ditutup.

## Usage Examples

### Simple Transposition

To convert a wide format dataset to long format:
1. Select all variables to transpose
2. Do not specify a name variable
3. Disable "Create Variable Names from First Row"
4. Click OK to process
5. The resulting dataset will have rows and columns switched

### Using Variable Values as Names

To transpose data with meaningful variable names:
1. Select the variables to transpose
2. Select an identifier variable as the "Name Variable"
3. Enable "Keep Original Variable as ID Variable" if needed
4. Click OK to process
5. The resulting dataset will use values from the name variable as the names of the new variables

### Headers from First Row

To use first row values as variable names:
1. Select the variables to transpose
2. Enable "Create Variable Names from First Row of Data"
3. Click OK to process
4. The resulting dataset will use the first row values as column names, and that row will be excluded from the data

## Notes

- Transposing a dataset can dramatically change its structure and may require additional data preparation before or after the operation.
- Variable types are preserved when possible, but some type conversions may occur if the transposed values are not compatible with the original type.
- Large datasets may take longer to transpose, as the operation requires reorganizing all data.
- If the resulting column names would contain invalid characters, they will be automatically modified to comply with variable naming rules.

## Implementation Details

The Transpose feature is implemented with a focus on flexibility and data integrity:

1. **User Interface**:
   - The UI provides clear selection of variables to transpose
   - Options for naming control help users get the desired output structure
   - Preview capability helps visualize the transformation

2. **Data Processing Flow**:
   - When the user clicks "OK", the selected variables are identified
   - Name sources are determined based on user selections
   - The data matrix is rotated in memory
   - New variables are created with appropriate names and types
   - The transposed data is written to the dataset

3. **Data Type Handling**:
   - Variable types are preserved when possible
   - Mixed types in a column are handled by conversion to the most appropriate common type
   - Missing values are preserved through the transposition process

## Sample Test Data

To test the Transpose feature, you can use the following sample dataset:

```
ID,Year,Q1,Q2,Q3,Q4
1,2020,10,15,20,25
2,2021,12,18,22,28
3,2022,14,21,24,30
```

### Test Scenarios

1. **Basic Transposition**:
   - Variables to Transpose: Q1, Q2, Q3, Q4
   - Expected Result: A dataset with rows for each quarter and columns for each year

2. **Using Year as Names**:
   - Variables to Transpose: Q1, Q2, Q3, Q4
   - Name Variable: Year
   - Expected Result: A dataset with rows for each quarter and columns named by year values

3. **Keeping ID Variable**:
   - Variables to Transpose: Year, Q1, Q2, Q3, Q4
   - Name Variable: ID
   - Keep Original Variable as ID: Checked
   - Expected Result: A dataset with ID as the first column, and transposed data with row names from the ID values

4. **First Row as Variable Names**:
   - Variables to Transpose: All
   - Create Variable Names from First Row: Checked
   - Expected Result: A dataset using the values from the first row as column names

These examples demonstrate how to use the Transpose Data feature for different data restructuring needs and validate the expected outcomes. 