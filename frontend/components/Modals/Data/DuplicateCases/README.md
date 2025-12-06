# Duplicate Cases Modal - Identify and Manage Duplicate Data Records

Modal untuk identifying dan managing duplicate cases dalam dataset Statify. Feature ini menyediakan advanced duplicate detection algorithms dengan flexible matching criteria dan comprehensive handling options.

## 📁 Component Architecture

```
DuplicateCases/
├── index.tsx                   # Main modal component
├── OptionsTab.tsx              # Duplicate handling options
├── VariableTab.tsx             # Variable selection for matching
├── types.ts                    # TypeScript type definitions
├── README.md                   # Documentation
│
├── __tests__/                  # Test suite
│   ├── index.test.tsx              # Main component tests
│   ├── useDuplicateCases.test.ts   # Hook logic tests
│   ├── duplicateCasesService.test.ts # Service function tests
│   └── README.md                   # Test documentation
│
├── hooks/                      # Business logic hooks
│   ├── useDuplicateCases.ts        # Core duplicate detection logic
│   └── useTourGuide.ts             # Guided tour functionality
│
└── services/                   # Business logic services
    └── duplicateCasesService.ts    # Duplicate detection algorithms
```

## 🎯 Core Functionality

### Duplicate Detection Workflow
```typescript
interface DuplicateDetectionWorkflow {
  // Step 1: Variable selection
  variableSelection: {
    keyVariables: Variable[];           // Variables to compare for duplicates
    identifierVariables: Variable[];   // Variables that identify records
    excludedVariables: Variable[];     // Variables to ignore in comparison
    weightingSystem: VariableWeight[]; // Weight importance of variables
  };
  
  // Step 2: Matching criteria
  matchingCriteria: {
    exactMatch: boolean;               // Exact value matching
    caseInsensitive: boolean;          // Case-insensitive string matching
    fuzzyMatch: FuzzyMatchConfig;      // Fuzzy matching configuration
    toleranceSettings: ToleranceConfig; // Numeric tolerance settings
  };
  
  // Step 3: Detection execution
  detectionExecution: {
    comparisonEngine: ComparisonEngine; // Core comparison logic
    duplicateGroups: DuplicateGroup[];  // Groups of duplicate records
    similarityScores: SimilarityScore[]; // Similarity measurements
    performanceOptimization: OptimizationConfig; // Large dataset handling
  };
  
  // Step 4: Result management
  resultManagement: {
    duplicateVisualization: VisualizationConfig; // Results display
    actionSelection: ActionSelector;    // Choose handling action
    recordMerging: MergeStrategy;      // Merge duplicate records
    recordDeletion: DeletionStrategy;  // Delete duplicate records
  };
}
```

## 🔍 Duplicate Detection System

### Indicator Variable Creation
```typescript
interface DuplicateIndicators {
  // Primary case indicator
  primaryCaseIndicator: {
    variableName: string;              // Default: 'PrimaryLast'
    primaryStrategy: 'first' | 'last'; // Which case to mark as primary
    encoding: {
      primary: 1;                      // Primary case value
      duplicate: 0;                    // Duplicate case value
    };
    description: string;               // Variable label
  };
  
  // Sequential counter
  sequentialCounter: {
    variableName: string;              // Default: 'MatchSequence'
    counterLogic: {
      uniqueCases: 0;                  // Value for unique cases
      duplicateSequence: number[];     // Sequential numbering (1, 2, 3...)
    };
    purpose: 'group identification';   // Counter purpose
    description: string;               // Variable label
  };
  
  // Duplicate group identifier
  groupIdentifier: {
    variableName: string;              // Default: 'DuplicateGroup'
    groupingStrategy: GroupStrategy;   // How to assign group IDs
    idFormat: 'numeric' | 'alphanumeric'; // ID format
    description: string;               // Variable label
  };
}
```

### Matching Logic Implementation
```typescript
interface MatchingLogic {
  // Exact matching
  exactMatching: {
    fullRecordMatch: (record1: DataRow, record2: DataRow, variables: Variable[]) => boolean;
    keyVariableMatch: (record1: DataRow, record2: DataRow, keyVars: Variable[]) => boolean;
    hashBasedMatch: (records: DataRow[], hashFunction: HashFunction) => DuplicateGroup[];
    performanceOptimized: boolean;
  };
  
  // Case sensitivity handling
  caseSensitivity: {
    stringNormalization: (value: string) => string;
    caseInsensitiveMatch: (str1: string, str2: string) => boolean;
    whitespaceHandling: 'trim' | 'normalize' | 'preserve';
    accentHandling: 'normalize' | 'preserve';
  };
  
  // Missing value handling
  missingValueHandling: {
    treatMissingAsEqual: boolean;      // Missing = Missing?
    ignoreMissingInComparison: boolean; // Skip missing values?
    missingValueStrategy: MissingStrategy; // How to handle missing
  };
  
  // Performance optimization
  performanceOptimization: {
    indexingStrategy: IndexStrategy;   // Create lookup indexes
    batchProcessing: BatchConfig;      // Process in batches
    parallelComparison: boolean;       // Use parallel processing
    memoryManagement: MemoryConfig;    // Memory optimization
  };
}
```

## 🔧 Hook Implementation

### useDuplicateCases Hook
```typescript
interface UseDuplicateCasesHook {
  // Configuration state
  configurationState: {
    selectedVariables: Variable[];     // Variables for matching
    indicatorOptions: IndicatorOptions; // Indicator variable settings
    processingOptions: ProcessingOptions; // Processing configuration
    outputOptions: OutputOptions;      // Output settings
  };
  
  // Variable management
  variableManagement: {
    availableVariables: Variable[];
    addVariable: (variable: Variable) => void;
    removeVariable: (variableId: string) => void;
    reorderVariables: (fromIndex: number, toIndex: number) => void;
    validateVariableSelection: () => ValidationResult;
  };
  
  // Indicator configuration
  indicatorConfiguration: {
    primaryIndicatorName: string;
    sequenceCounterName: string;
    groupIdentifierName: string;
    primaryStrategy: 'first' | 'last';
    setPrimaryIndicatorName: (name: string) => void;
    setSequenceCounterName: (name: string) => void;
    setGroupIdentifierName: (name: string) => void;
    setPrimaryStrategy: (strategy: 'first' | 'last') => void;
  };
  
  // Processing options
  processingOptions: {
    moveDuplicatesToTop: boolean;
    filterDuplicatesAfterProcessing: boolean;
    showFrequencyTables: boolean;
    createBackup: boolean;
    setMoveDuplicatesToTop: (move: boolean) => void;
    setFilterDuplicatesAfterProcessing: (filter: boolean) => void;
    setShowFrequencyTables: (show: boolean) => void;
    setCreateBackup: (backup: boolean) => void;
  };
  
  // Execution
  execution: {
    validateConfiguration: () => ValidationResult;
    executeDuplicateDetection: () => Promise<DuplicateDetectionResult>;
    cancelDetection: () => void;
    resetConfiguration: () => void;
    detectionProgress: DetectionProgress;
    isDetectionRunning: boolean;
  };
}
```

### Duplicate Detection Service
```typescript
interface DuplicateCasesService {
  // Core detection logic
  coreDetection: {
    identifyDuplicates: (
      data: DataRow[],
      variables: Variable[],
      options: DetectionOptions
    ) => Promise<DuplicateDetectionResult>;
    
    groupDuplicateRecords: (
      duplicatePairs: DuplicatePair[]
    ) => DuplicateGroup[];
    
    createIndicatorVariables: (
      duplicateGroups: DuplicateGroup[],
      options: IndicatorOptions
    ) => IndicatorVariable[];
    
    calculateStatistics: (
      duplicateGroups: DuplicateGroup[]
    ) => DuplicateStatistics;
  };
  
  // Data processing
  dataProcessing: {
    reorderData: (
      data: DataRow[],
      duplicateGroups: DuplicateGroup[],
      strategy: ReorderStrategy
    ) => DataRow[];
    
    filterDuplicates: (
      data: DataRow[],
      primaryIndicatorVariable: Variable
    ) => DataRow[];
    
    assignPrimaryFlags: (
      duplicateGroups: DuplicateGroup[],
      strategy: 'first' | 'last'
    ) => PrimaryAssignment[];
    
    createSequenceNumbers: (
      duplicateGroups: DuplicateGroup[]
    ) => SequenceAssignment[];
  };
  
  // Performance optimization
  performanceOptimization: {
    createHashIndex: (
      data: DataRow[],
      variables: Variable[]
    ) => HashIndex;
    
    batchCompareRecords: (
      data: DataRow[],
      variables: Variable[],
      batchSize: number
    ) => Promise<ComparisonResult[]>;
    
    optimizeMemoryUsage: (
      data: DataRow[],
      variables: Variable[]
    ) => OptimizationResult;
  };
  
  // Validation and quality
  validationQuality: {
    validateMatchingVariables: (
      variables: Variable[],
      data: DataRow[]
    ) => ValidationResult;
    
    assessDetectionQuality: (
      result: DuplicateDetectionResult
    ) => QualityAssessment;
    
    generateDetectionReport: (
      result: DuplicateDetectionResult
    ) => DetectionReport;
  };
}
```

## 📊 Result Management

### Duplicate Group Structure
```typescript
interface DuplicateGroupStructure {
  // Group identification
  groupIdentification: {
    groupId: string;                   // Unique group identifier
    groupSize: number;                 // Number of records in group
    matchingValues: MatchingValues;    // Values that make records duplicates
    confidence: number;                // Confidence in duplicate detection
  };
  
  // Record details
  recordDetails: {
    records: DataRow[];                // All records in the group
    primaryRecord: DataRow;            // Designated primary record
    duplicateRecords: DataRow[];       // Non-primary records
    recordIndices: number[];           // Original row indices
  };
  
  // Comparison metadata
  comparisonMetadata: {
    matchingVariables: Variable[];     // Variables used for matching
    exactMatches: boolean[];           // Which variables matched exactly
    similarityScores: number[];        // Similarity scores per variable
    overallSimilarity: number;         // Combined similarity score
  };
  
  // Processing flags
  processingFlags: {
    userReviewed: boolean;             // Has user reviewed this group?
    actionTaken: DuplicateAction | null; // What action was taken?
    notes: string;                     // User notes about this group
    locked: boolean;                   // Prevent further changes?
  };
}
```

### Output Configuration
```typescript
interface OutputConfiguration {
  // Frequency tables
  frequencyTables: {
    primaryIndicatorFrequency: FrequencyTable;  // Primary/duplicate counts
    sequenceCounterFrequency: FrequencyTable;   // Sequence number distribution
    groupSizeDistribution: FrequencyTable;      // Distribution of group sizes
    showInOutput: boolean;                      // Display in output window
  };
  
  // Data reorganization
  dataReorganization: {
    moveDuplicatesToTop: boolean;      // Move all duplicates to top
    sortByGroupId: boolean;            // Sort by duplicate group ID
    sortWithinGroups: boolean;         // Sort records within each group
    groupSeparators: boolean;          // Add visual separators between groups
  };
  
  // Filtering options
  filteringOptions: {
    showOnlyDuplicates: boolean;       // Show only duplicate records
    showOnlyPrimary: boolean;          // Show only primary records
    showSpecificGroups: string[];      // Show specific group IDs only
    hideProcessedGroups: boolean;      // Hide groups that were processed
  };
  
  // Export options
  exportOptions: {
    exportDuplicateReport: boolean;    // Export detailed report
    exportGroupSummary: boolean;       // Export group summary
    includeStatistics: boolean;        // Include detection statistics
    reportFormat: 'csv' | 'excel' | 'pdf'; // Report format
  };
}
```

## 🎨 UI Components

### VariableTab Component
```typescript
interface VariableTabProps {
  // Variable selection
  availableVariables: Variable[];
  selectedVariables: Variable[];
  onVariableAdd: (variable: Variable) => void;
  onVariableRemove: (variableId: string) => void;
  onVariableReorder: (fromIndex: number, toIndex: number) => void;
  
  // Selection helpers
  onSelectAll: () => void;
  onClearAll: () => void;
  onSelectByType: (dataType: DataType) => void;
  
  // Variable information
  variableInfo: Map<string, VariableInfo>;
  showVariableDetails: boolean;
  onToggleVariableDetails: () => void;
  
  // Validation
  validationErrors: ValidationError[];
  warnings: Warning[];
  isValid: boolean;
}
```

### OptionsTab Component
```typescript
interface OptionsTabProps {
  // Indicator variable options
  indicatorOptions: {
    createPrimaryIndicator: boolean;
    primaryIndicatorName: string;
    createSequenceCounter: boolean;
    sequenceCounterName: string;
    createGroupIdentifier: boolean;
    groupIdentifierName: string;
    primaryStrategy: 'first' | 'last';
  };
  
  // Processing options
  processingOptions: {
    moveDuplicatesToTop: boolean;
    filterDuplicatesAfterProcessing: boolean;
    showFrequencyTables: boolean;
    createBackupBeforeProcessing: boolean;
    caseSensitiveMatching: boolean;
    ignoreMissingValues: boolean;
  };
  
  // Performance options
  performanceOptions: {
    useIndexing: boolean;
    batchSize: number;
    maxMemoryUsage: number;
    parallelProcessing: boolean;
  };
  
  // Event handlers
  onIndicatorOptionsChange: (options: IndicatorOptions) => void;
  onProcessingOptionsChange: (options: ProcessingOptions) => void;
  onPerformanceOptionsChange: (options: PerformanceOptions) => void;
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Core functionality testing
describe('DuplicateCasesModal', () => {
  describe('Variable selection', () => {
    it('manages variable selection correctly');
    it('validates variable combinations');
    it('handles variable reordering');
    it('shows appropriate warnings');
  });
  
  describe('Duplicate detection', () => {
    it('detects exact duplicates correctly');
    it('handles case sensitivity options');
    it('manages missing values properly');
    it('creates correct indicator variables');
  });
  
  describe('Result processing', () => {
    it('assigns primary flags correctly');
    it('creates sequence numbers properly');
    it('reorders data as requested');
    it('applies filters correctly');
  });
  
  describe('Performance', () => {
    it('handles large datasets efficiently');
    it('uses indexing when appropriate');
    it('manages memory usage');
    it('provides progress feedback');
  });
});

// Service testing
describe('duplicateCasesService', () => {
  describe('Detection algorithms', () => {
    it('identifies duplicates accurately');
    it('groups duplicates correctly');
    it('calculates statistics properly');
    it('handles edge cases');
  });
  
  describe('Data processing', () => {
    it('creates indicator variables correctly');
    it('reorders data properly');
    it('filters data accurately');
    it('maintains data integrity');
  });
});

// Integration testing
describe('Integration tests', () => {
  describe('End-to-end workflows', () => {
    it('completes full duplicate detection workflow');
    it('handles cancellation properly');
    it('recovers from errors gracefully');
    it('maintains consistent state');
  });
});
```

## 📋 Development Guidelines

### Performance Optimization
```typescript
// 1. Efficient duplicate detection
const optimizedDuplicateDetection = (
  data: DataRow[],
  variables: Variable[]
) => {
  // Create hash index for faster lookups
  const hashIndex = createHashIndex(data, variables);
  
  // Use batch processing for large datasets
  if (data.length > LARGE_DATASET_THRESHOLD) {
    return batchProcessDuplicates(data, variables, hashIndex);
  }
  
  // Standard processing for smaller datasets
  return standardProcessDuplicates(data, variables, hashIndex);
};

// 2. Memory management
const memoryEfficientProcessing = (data: DataRow[]) => {
  // Process data in chunks to avoid memory overflow
  const chunkSize = calculateOptimalChunkSize(data.length);
  const chunks = chunkArray(data, chunkSize);
  
  return chunks.reduce((accumulator, chunk) => {
    const chunkResult = processDuplicatesChunk(chunk);
    return mergeResults(accumulator, chunkResult);
  }, initialResult);
};
```

### Configuration Validation
```typescript
// Comprehensive validation
const validateDuplicateDetectionConfig = (
  variables: Variable[],
  options: DetectionOptions
): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Validate variable selection
  if (variables.length === 0) {
    errors.push({
      type: 'variable_selection',
      message: 'At least one variable must be selected for matching'
    });
  }
  
  // Validate indicator variable names
  if (options.createPrimaryIndicator && !isValidVariableName(options.primaryIndicatorName)) {
    errors.push({
      type: 'variable_name',
      message: 'Primary indicator variable name is invalid'
    });
  }
  
  // Validate performance settings
  if (options.batchSize < 1 || options.batchSize > MAX_BATCH_SIZE) {
    errors.push({
      type: 'performance',
      message: 'Batch size must be between 1 and ' + MAX_BATCH_SIZE
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: generateWarnings(variables, options)
  };
};
```

---

DuplicateCases modal menyediakan sophisticated duplicate detection capabilities dengan efficient algorithms dan comprehensive management options untuk maintaining data quality dalam Statify.
3.  Klik OK.
> Hasil: Tampilan data akan langsung diperbarui dan hanya menunjukkan baris-baris yang unik/primer.

## 4. Rencana Pengembangan (Belum Diimplementasikan)

Fitur-fitur berikut direncanakan untuk rilis mendatang:
- **Pencocokan Fuzzy (Fuzzy Matching)**: Kemampuan untuk mengidentifikasi duplikat yang "mirip" tetapi tidak identik (misalnya, "Jhon Smith" vs "John Smith").
- **Aturan Pemilihan Primer Kustom**: Memungkinkan pengguna mendefinisikan aturan yang lebih kompleks untuk memilih kasus primer (misalnya, berdasarkan baris dengan data paling lengkap).
- **Antarmuka Review Duplikat**: Sebuah UI khusus untuk meninjau grup duplikat secara berdampingan dan secara manual memilih kasus primer atau menggabungkan data.
- **Laporan Kontribusi Variabel**: Ringkasan yang menunjukkan variabel mana yang paling sering menyebabkan sebuah kasus dianggap duplikat.

## 5. Detail Implementasi

Fitur ini menggunakan Web Worker (`duplicateCases.worker.js`) untuk melakukan pemrosesan data di latar belakang, mencegah UI menjadi tidak responsif. Alur prosesnya adalah sebagai berikut: UI mengumpulkan konfigurasi dari pengguna, mengirimkannya ke worker, worker mengidentifikasi grup duplikat, mengurutkannya jika perlu, menandai kasus primer, dan mengembalikan hasilnya. Thread utama kemudian memperbarui state aplikasi dengan membuat variabel baru dan mengisi nilainya.
Untuk data uji, lihat file `dummy_duplicate_cases.csv`.