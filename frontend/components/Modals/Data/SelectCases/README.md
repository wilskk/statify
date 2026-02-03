# Select Cases Modal - Advanced Data Filtering and Case Selection

Modal untuk filtering dan selecting cases dalam Statify dengan comprehensive selection methods, conditional logic evaluation, dan flexible output options. Feature ini menyediakan advanced case selection capabilities untuk data subsetting dan analysis preparation.

## 📁 Component Architecture

```
SelectCases/
├── index.tsx                   # Main modal component
├── SelectCasesUI.tsx           # Main selection interface
├── SelectCasesTest.tsx         # Case selection testing
├── types.ts                    # TypeScript type definitions
├── README.md                   # Documentation
│
├── __tests__/                  # Test suite
│   ├── SelectCases.test.tsx        # Main component tests
│   ├── useSelectCases.test.ts      # Hook logic tests
│   ├── selectionService.test.ts    # Service function tests
│   └── README.md                   # Test documentation
│
├── hooks/                      # Business logic hooks
│   └── useSelectCases.ts           # Core selection logic
│
└── services/                   # Business logic services
    └── selectionService.ts         # Case selection algorithms
```

## 🎯 Core Functionality

### Case Selection Methods
```typescript
interface CaseSelectionMethods {
  // All cases selection
  allCases: {
    purpose: 'Select all cases in dataset';
    behavior: 'Clears all previously applied filters';
    effect: AllCasesEffect;
    implementation: AllCasesSelector;
  };
  
  // Conditional selection
  conditionalSelection: {
    purpose: 'Select cases based on logical conditions';
    expressionLanguage: LogicalExpressionLanguage;
    supportedOperators: ConditionalOperator[];
    conditionEvaluator: ConditionEvaluator;
  };
  
  // Random sampling
  randomSampling: {
    purpose: 'Select random subset of cases';
    samplingMethods: SamplingMethod[];
    probabilityStrategies: ProbabilityStrategy[];
    seedControl: SeedController;
  };
  
  // Range-based selection
  rangeSelection: {
    purpose: 'Select cases based on position/index';
    indexingStrategy: IndexingStrategy;
    rangeValidation: RangeValidator;
    boundaryHandling: BoundaryHandler;
  };
  
  // Filter variable usage
  filterVariableSelection: {
    purpose: 'Use existing variable as filter criteria';
    filterLogic: FilterLogic;
    valueInterpretation: ValueInterpreter;
    filterUpdater: FilterUpdater;
  };
}
```

### Selection Workflow
```typescript
interface SelectionWorkflow {
  // Step 1: Method selection
  methodSelection: {
    selectionMethod: SelectionMethod;        // Selected filtering method
    methodConfiguration: MethodConfig;      // Method-specific settings
    previewGeneration: PreviewGenerator;    // Show selection preview
    validationChecks: ValidationChecker;    // Validate method applicability
  };
  
  // Step 2: Criteria definition
  criteriaDefinition: {
    selectionCriteria: SelectionCriteria;   // Filtering criteria
    conditionalExpression: ConditionalExpression; // Logical conditions
    parameterConfiguration: ParameterConfig; // Method parameters
    validationResults: ValidationResult[];  // Criteria validation
  };
  
  // Step 3: Output configuration
  outputConfiguration: {
    outputAction: OutputAction;             // Filter vs delete action
    filterVariableName: string;             // Name for filter variable
    preservationStrategy: PreservationStrategy; // Data preservation options
    confirmationRequired: boolean;          // Require user confirmation
  };
  
  // Step 4: Execution
  executionPhase: {
    selectionExecution: SelectionExecutor;  // Core selection logic
    progressTracking: ProgressTracker;     // Monitor selection progress
    resultValidation: ResultValidator;     // Validate selection results
    stateIntegration: StateIntegrator;     // Update application state
  };
}
```

## 🔍 Selection Methods Implementation

### Conditional Selection
```typescript
interface ConditionalSelection {
  // Expression parsing
  expressionParsing: {
    lexicalAnalyzer: LexicalAnalyzer;      // Parse expression tokens
    syntaxValidator: SyntaxValidator;      // Validate expression syntax
    semanticAnalyzer: SemanticAnalyzer;   // Analyze expression semantics
    optimizationEngine: OptimizationEngine; // Optimize expression evaluation
  };
  
  // Supported operators
  supportedOperators: {
    comparisonOperators: {
      greaterThan: '>';
      lessThan: '<';
      equalTo: '==';
      notEqualTo: '!=';
      greaterOrEqual: '>=';
      lessOrEqual: '<=';
    };
    
    logicalOperators: {
      and: '&';
      or: '|';
      not: '~';
    };
    
    membershipOperators: {
      in: 'in';
      notIn: 'not in';
      contains: 'contains';
      startsWith: 'starts with';
      endsWith: 'ends with';
    };
    
    patternOperators: {
      like: 'like';
      regex: 'regex';
      glob: 'glob';
    };
  };
  
  // Function support
  functionSupport: {
    mathematicalFunctions: MathFunction[];
    stringFunctions: StringFunction[];
    dateTimeFunctions: DateTimeFunction[];
    statisticalFunctions: StatisticalFunction[];
    customFunctions: CustomFunction[];
  };
  
  // Evaluation engine
  evaluationEngine: {
    evaluateExpression: (
      expression: string,
      context: EvaluationContext
    ) => EvaluationResult;
    
    validateSyntax: (expression: string) => SyntaxValidationResult;
    optimizeExpression: (expression: string) => OptimizedExpression;
    cacheResults: (expression: string, result: EvaluationResult) => void;
  };
  
  // Example expressions
  exampleExpressions: {
    simpleComparison: 'age > 30';
    multipleConditions: 'age > 30 & income >= 50000';
    stringMatching: 'name contains "Smith" | city == "New York"';
    rangeChecking: 'score >= 80 & score <= 100';
    nullChecking: '~isnull(email) & length(email) > 0';
    complexLogic: '(category == "A" | category == "B") & date >= "2023-01-01"';
  };
}
```

### Random Sampling
```typescript
interface RandomSampling {
  // Sampling strategies
  samplingStrategies: {
    approximatePercentage: {
      method: 'Select approximately X% of cases';
      implementation: ApproximatePercentageSampler;
      probabilityDistribution: UniformDistribution;
      expectedVariance: VarianceCalculator;
    };
    
    exactCount: {
      method: 'Select exactly N cases from first M cases';
      implementation: ExactCountSampler;
      selectionAlgorithm: ReservoirSampling;
      stratificationSupport: StratificationEngine;
    };
    
    systematicSampling: {
      method: 'Select every Nth case';
      implementation: SystematicSampler;
      intervalCalculation: IntervalCalculator;
      randomStartPoint: RandomStartGenerator;
    };
    
    stratifiedSampling: {
      method: 'Sample within groups/strata';
      implementation: StratifiedSampler;
      groupIdentification: GroupIdentifier;
      proportionalAllocation: AllocationStrategy;
    };
  };
  
  // Random number generation
  randomNumberGeneration: {
    seedManagement: {
      userDefinedSeed: number;
      automaticSeed: () => number;
      seedValidation: (seed: number) => boolean;
      reproducibilityEnsurance: ReproducibilityManager;
    };
    
    generators: {
      uniformGenerator: UniformRandomGenerator;
      normalGenerator: NormalRandomGenerator;
      customDistribution: CustomDistributionGenerator;
    };
    
    qualityAssurance: {
      randomnessTests: RandomnessTest[];
      distributionValidation: DistributionValidator;
      biasDetection: BiasDetector;
    };
  };
  
  // Sampling validation
  samplingValidation: {
    sampleSizeValidation: (
      populationSize: number,
      requestedSampleSize: number
    ) => ValidationResult;
    
    representativenessCheck: (
      population: DataRow[],
      sample: DataRow[]
    ) => RepresentativenessReport;
    
    balanceVerification: (
      sample: DataRow[],
      stratificationVariable: Variable
    ) => BalanceReport;
  };
}
```

### Range Selection
```typescript
interface RangeSelection {
  // Index-based selection
  indexBasedSelection: {
    indexingStrategy: 'one-based' | 'zero-based';
    rangeSpecification: {
      startCase: number;
      endCase: number;
      stepSize: number;
      reverseOrder: boolean;
    };
    
    boundaryHandling: {
      handleNegativeIndices: (index: number) => number;
      handleOutOfBounds: (index: number, maxIndex: number) => number;
      validateRange: (start: number, end: number) => ValidationResult;
    };
    
    rangeExpansion: {
      expandIncompleteRange: (
        start?: number,
        end?: number,
        dataSize: number
      ) => CompleteRange;
      
      optimizeRangeSelection: (range: Range) => OptimizedRange;
      validateRangeFeasibility: (range: Range) => FeasibilityResult;
    };
  };
  
  // Time-based selection
  timeBasedSelection: {
    timeRangeSpecification: {
      startTime: Date;
      endTime: Date;
      timeZone: string;
      dateFormat: string;
    };
    
    timeIndexMapping: {
      mapTimeToIndex: (time: Date, data: DataRow[]) => number;
      mapIndexToTime: (index: number, data: DataRow[]) => Date;
      validateTimeColumn: (column: Variable) => ValidationResult;
    };
    
    intervalSelection: {
      selectByInterval: (
        interval: TimeInterval,
        data: DataRow[]
      ) => SelectedCases;
      
      handleTimeGaps: (gaps: TimeGap[]) => GapHandlingStrategy;
      validateTemporalContinuity: (data: DataRow[]) => ContinuityReport;
    };
  };
  
  // Advanced range features
  advancedRangeFeatures: {
    multipleRanges: {
      combineRanges: (ranges: Range[]) => CombinedRange;
      validateRangeOverlap: (ranges: Range[]) => OverlapReport;
      optimizeRangeCombination: (ranges: Range[]) => OptimizedRanges;
    };
    
    conditionalRanges: {
      applyConditionToRange: (
        range: Range,
        condition: Condition
      ) => ConditionalRange;
      
      dynamicRangeAdjustment: (
        range: Range,
        data: DataRow[]
      ) => AdjustedRange;
    };
  };
}
```

### Filter Variable Usage
```typescript
interface FilterVariableUsage {
  // Filter variable selection
  filterVariableSelection: {
    availableVariables: Variable[];
    selectFilterVariable: (variable: Variable) => void;
    validateFilterVariable: (variable: Variable) => ValidationResult;
    createNewFilterVariable: (name: string) => FilterVariable;
  };
  
  // Value interpretation
  valueInterpretation: {
    truthyValues: TruthyValue[];           // Values considered "true"
    falsyValues: FalsyValue[];             // Values considered "false"
    missingValueHandling: MissingValueStrategy; // How to handle missing values
    customInterpretation: CustomInterpreter; // Custom value interpretation
  };
  
  // Filter logic
  filterLogic: {
    applyFilter: (
      data: DataRow[],
      filterVariable: Variable
    ) => FilteredData;
    
    updateFilterVariable: (
      filterVariable: Variable,
      selectedCases: CaseSelection
    ) => UpdatedFilterVariable;
    
    combineFilters: (
      filters: FilterVariable[]
    ) => CombinedFilter;
    
    invertFilter: (filter: FilterVariable) => InvertedFilter;
  };
  
  // Filter management
  filterManagement: {
    activeFilters: ActiveFilter[];
    createFilter: (name: string, logic: FilterLogic) => Filter;
    removeFilter: (filterId: string) => void;
    temporaryFilter: (logic: FilterLogic) => TemporaryFilter;
    persistentFilter: (logic: FilterLogic) => PersistentFilter;
  };
}
```

## 🔧 Hook Implementation

### useSelectCases Hook
```typescript
interface UseSelectCasesHook {
  // Selection state
  selectionState: {
    currentMethod: SelectionMethod;
    selectionCriteria: SelectionCriteria;
    selectedCases: SelectedCase[];
    previewData: PreviewData;
    validationResults: ValidationResult[];
  };
  
  // Method management
  methodManagement: {
    availableMethods: SelectionMethod[];
    selectMethod: (method: SelectionMethod) => void;
    getMethodConfiguration: (method: SelectionMethod) => MethodConfiguration;
    validateMethodApplicability: (method: SelectionMethod) => ValidationResult;
  };
  
  // Criteria configuration
  criteriaConfiguration: {
    criteria: SelectionCriteria;
    setCriteria: (criteria: SelectionCriteria) => void;
    validateCriteria: () => ValidationResult;
    optimizeCriteria: () => OptimizedCriteria;
    expressionBuilder: ExpressionBuilder;
  };
  
  // Expression handling (for conditional selection)
  expressionHandling: {
    currentExpression: string;
    setExpression: (expression: string) => void;
    validateExpression: (expression: string) => ExpressionValidationResult;
    parseExpression: (expression: string) => ParsedExpression;
    evaluateExpression: (expression: string) => EvaluationResult;
    expressionHistory: ExpressionHistory[];
  };
  
  // Random sampling configuration
  randomSamplingConfig: {
    samplingMethod: SamplingMethod;
    sampleSize: number;
    samplePercentage: number;
    randomSeed: number;
    stratificationVariable: Variable;
    setSamplingMethod: (method: SamplingMethod) => void;
    configureSampling: (config: SamplingConfiguration) => void;
  };
  
  // Range selection configuration
  rangeSelectionConfig: {
    startCase: number;
    endCase: number;
    stepSize: number;
    timeRange: TimeRange;
    setRange: (start: number, end: number) => void;
    validateRange: () => RangeValidationResult;
  };
  
  // Output configuration
  outputConfiguration: {
    outputAction: OutputAction;           // 'filter' | 'delete'
    filterVariableName: string;
    createBackup: boolean;
    confirmDestructiveAction: boolean;
    setOutputAction: (action: OutputAction) => void;
    setFilterVariableName: (name: string) => void;
  };
  
  // Preview and validation
  previewValidation: {
    generatePreview: () => Promise<PreviewData>;
    validateSelection: () => ValidationResult;
    estimateResultSize: () => SizeEstimate;
    calculateSelectionStatistics: () => SelectionStatistics;
  };
  
  // Execution
  execution: {
    executeSelection: () => Promise<SelectionResult>;
    cancelSelection: () => void;
    resetSelection: () => void;
    undoLastSelection: () => void;
    selectionProgress: SelectionProgress;
  };
}
```

### Selection Service
```typescript
interface SelectionService {
  // Core selection methods
  coreSelectionMethods: {
    selectAllCases: (data: DataRow[]) => SelectionResult;
    
    selectByCondition: (
      data: DataRow[],
      condition: string,
      variables: Variable[]
    ) => Promise<SelectionResult>;
    
    selectRandomSample: (
      data: DataRow[],
      config: SamplingConfiguration
    ) => Promise<SelectionResult>;
    
    selectByRange: (
      data: DataRow[],
      range: RangeConfiguration
    ) => SelectionResult;
    
    selectByFilterVariable: (
      data: DataRow[],
      filterVariable: Variable
    ) => SelectionResult;
  };
  
  // Expression evaluation
  expressionEvaluation: {
    parseExpression: (expression: string) => ParsedExpression;
    validateExpression: (expression: string, variables: Variable[]) => ValidationResult;
    optimizeExpression: (expression: string) => OptimizedExpression;
    evaluateForRow: (expression: ParsedExpression, row: DataRow) => boolean;
    batchEvaluate: (expression: ParsedExpression, data: DataRow[]) => boolean[];
  };
  
  // Sampling algorithms
  samplingAlgorithms: {
    uniformRandomSampling: (
      data: DataRow[],
      sampleSize: number,
      seed?: number
    ) => DataRow[];
    
    stratifiedSampling: (
      data: DataRow[],
      stratificationVariable: Variable,
      sampleSize: number,
      seed?: number
    ) => DataRow[];
    
    systematicSampling: (
      data: DataRow[],
      interval: number,
      startIndex?: number
    ) => DataRow[];
    
    reservoirSampling: (
      data: DataRow[],
      sampleSize: number,
      seed?: number
    ) => DataRow[];
  };
  
  // Quality assurance
  qualityAssurance: {
    validateSelectionResult: (
      original: DataRow[],
      selected: DataRow[],
      criteria: SelectionCriteria
    ) => QualityReport;
    
    calculateSelectionStatistics: (
      original: DataRow[],
      selected: DataRow[]
    ) => SelectionStatistics;
    
    generateSelectionSummary: (
      result: SelectionResult
    ) => SelectionSummary;
    
    detectSelectionBias: (
      original: DataRow[],
      selected: DataRow[],
      variables: Variable[]
    ) => BiasReport;
  };
}
```

## 🎨 UI Components

### SelectCasesUI Component
```typescript
interface SelectCasesUIProps {
  // Method selection
  availableMethods: SelectionMethod[];
  selectedMethod: SelectionMethod;
  onMethodSelect: (method: SelectionMethod) => void;
  
  // Criteria configuration
  selectionCriteria: SelectionCriteria;
  onCriteriaChange: (criteria: SelectionCriteria) => void;
  
  // Expression builder (for conditional selection)
  expressionBuilder: {
    expression: string;
    onExpressionChange: (expression: string) => void;
    availableVariables: Variable[];
    availableFunctions: Function[];
    expressionValidation: ExpressionValidationResult;
  };
  
  // Sampling configuration
  samplingConfig: {
    method: SamplingMethod;
    parameters: SamplingParameters;
    onConfigChange: (config: SamplingConfiguration) => void;
  };
  
  // Range configuration
  rangeConfig: {
    startCase: number;
    endCase: number;
    onRangeChange: (start: number, end: number) => void;
  };
  
  // Output configuration
  outputConfig: {
    action: OutputAction;
    filterVariableName: string;
    onConfigChange: (config: OutputConfiguration) => void;
  };
  
  // Preview
  previewData: PreviewData;
  showPreview: boolean;
  onTogglePreview: () => void;
  onGeneratePreview: () => void;
  
  // Validation
  validationResults: ValidationResult[];
  isConfigurationValid: boolean;
  
  // Actions
  onExecute: () => void;
  onCancel: () => void;
  onReset: () => void;
  
  // Progress
  isExecuting: boolean;
  executionProgress: ExecutionProgress;
}
```

### SelectCasesTest Component
```typescript
interface SelectCasesTestProps {
  // Test scenarios
  testScenarios: TestScenario[];
  selectedScenario: TestScenario;
  onScenarioSelect: (scenario: TestScenario) => void;
  
  // Test data
  testData: TestData;
  expectedSelections: ExpectedSelection[];
  actualSelections: ActualSelection[];
  
  // Test execution
  onRunTest: () => void;
  onRunAllTests: () => void;
  testResults: TestResult[];
  
  // Validation
  selectionAccuracy: SelectionAccuracy;
  performanceMetrics: PerformanceMetric[];
  
  // Expression testing
  expressionTests: {
    testExpressions: TestExpression[];
    evaluationResults: EvaluationResult[];
    syntaxValidation: SyntaxValidationResult[];
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Selection testing
describe('SelectCasesModal', () => {
  describe('Conditional selection', () => {
    it('evaluates simple conditions correctly');
    it('handles complex logical expressions');
    it('validates expression syntax');
    it('optimizes expression evaluation');
  });
  
  describe('Random sampling', () => {
    it('generates random samples with correct size');
    it('ensures reproducibility with seeds');
    it('handles stratified sampling correctly');
    it('validates sampling quality');
  });
  
  describe('Range selection', () => {
    it('selects correct case ranges');
    it('handles boundary conditions');
    it('validates range parameters');
    it('supports time-based ranges');
  });
  
  describe('Filter variable usage', () => {
    it('interprets filter values correctly');
    it('creates and updates filter variables');
    it('combines multiple filters');
    it('handles missing values appropriately');
  });
  
  describe('Performance', () => {
    it('handles large datasets efficiently');
    it('provides progress feedback');
    it('optimizes expression evaluation');
    it('manages memory usage effectively');
  });
});

// Service testing
describe('selectionService', () => {
  describe('Expression evaluation', () => {
    it('parses expressions correctly');
    it('evaluates expressions accurately');
    it('handles edge cases gracefully');
    it('optimizes complex expressions');
  });
  
  describe('Sampling algorithms', () => {
    it('implements sampling methods correctly');
    it('maintains statistical properties');
    it('ensures randomness quality');
    it('handles edge cases');
  });
});
```

## 📋 Development Guidelines

### Adding New Selection Methods
```typescript
// 1. Define selection method interface
interface NewSelectionMethod extends SelectionMethod {
  id: 'newSelection';
  name: 'New Selection Method';
  description: 'Description of selection method';
  category: SelectionCategory;
  requirements: DataRequirement[];
}

// 2. Implement selection logic
const newSelectionLogic = {
  validate: (data: DataRow[], config: SelectionConfig): ValidationResult => {
    // Validation logic
  },
  
  select: (data: DataRow[], config: SelectionConfig): SelectionResult => {
    // Selection logic
  },
  
  preview: (data: DataRow[], config: SelectionConfig): PreviewData => {
    // Preview logic
  }
};

// 3. Register selection method
const SELECTION_METHODS = {
  ...existingMethods,
  newSelection: newSelectionLogic
};

// 4. Add comprehensive tests
describe('New Selection Method', () => {
  it('validates requirements correctly');
  it('performs selection accurately');
  it('generates correct preview');
  it('handles edge cases');
});
```

### Expression Language Extension
```typescript
// 1. Define new function
interface NewFunction extends ExpressionFunction {
  name: 'newFunction';
  signature: FunctionSignature;
  category: 'mathematical' | 'string' | 'datetime' | 'statistical';
  implementation: FunctionImplementation;
}

// 2. Implement function logic
const newFunctionImplementation: FunctionImplementation = {
  evaluate: (args: any[], context: EvaluationContext): any => {
    // Function implementation
  },
  
  validate: (args: any[]): ValidationResult => {
    // Argument validation
  }
};

// 3. Register function
const EXPRESSION_FUNCTIONS = {
  ...existingFunctions,
  newFunction: newFunctionImplementation
};

// 4. Update documentation and tests
describe('Expression Functions', () => {
  describe('newFunction', () => {
    it('calculates correct results');
    it('validates arguments properly');
    it('handles edge cases');
  });
});
```

---

SelectCases modal menyediakan powerful case selection capabilities dengan comprehensive filtering methods, advanced expression evaluation, dan flexible output options untuk precise data subsetting dalam Statify.
- **Membuat Sampel Acak**: Untuk membuat sampel acak 10%, pilih "Random sample", lalu "Approximately", dan masukkan "10".
- **Memilih Rentang**: Untuk memilih kasus 100 hingga 500, pilih "Based on... range", lalu masukkan "100" di "First Case" dan "500" di "Last Case".

## 5. Rencana Pengembangan (Belum Diimplementasikan)
- **Seleksi Berdasarkan Waktu**: Kemampuan untuk memilih rentang berdasarkan variabel tanggal/waktu yang sebenarnya, bukan hanya nomor kasus.
- **Simpan & Muat Ekspresi**: Opsi untuk menyimpan ekspresi filter yang kompleks untuk digunakan kembali nanti.
- **Umpan Balik Visual**: Memberikan highlight visual secara *real-time* pada baris data yang akan dipilih saat ekspresi sedang dibuat.
- **Grup Fungsi Kustom**: Memungkinkan pengguna untuk menyimpan dan menggunakan kembali gabungan fungsi logika yang sering digunakan.

## 6. Detail Implementasi & Sintaksis

### Arsitektur
Fitur ini diimplementasikan dengan beberapa komponen:
- **`index.tsx`**: Antarmuka utama yang mengelola state melalui hook `useSelectCases`.
- **`dialogs/`**: Berisi sub-dialog untuk setiap metode seleksi (`IfCondition`, `RandomSample`, `Range`).
- **`hooks/useSelectCases.ts`**: Mengandung logika bisnis utama, mengelola state, dan berinteraksi dengan store (Zustand).
- **`services/`**:
    - **`evaluator.ts`**: Mesin inti yang mem-parsing dan mengevaluasi ekspresi kondisional.
    - **`selectors.ts`**: Berisi fungsi-fungsi murni untuk melakukan berbagai jenis seleksi data (berdasarkan kondisi, rentang, dll).

### Sintaksis Ekspresi Kondisi

#### Operator Perbandingan
- `==` Sama dengan (untuk angka dan teks)
- `!=` Tidak sama dengan
- `>` Lebih besar dari
- `<` Kurang dari
- `>=` Lebih besar dari atau sama dengan
- `<=` Kurang dari atau sama dengan

#### Operator Logika
- `&` AND (kedua kondisi harus benar)
- `|` OR (salah satu kondisi harus benar)
- `~` NOT (membalikkan kondisi)

#### Contoh Fungsi yang Didukung
- **Matematika**: `ABS()`, `SQRT()`, `ROUND()`, `MAX()`, `MIN()`, `SUM()`
- **Teks**: `CONCAT()`, `LENGTH()`, `LOWER()`, `UPPER()`, `TRIM()`
- **Statistik**: `MEAN()`, `MEDIAN()`, `SD()`, `COUNT()`
- **Lainnya**: `MISSING()` (untuk memeriksa nilai yang hilang)

#### Contoh Ekspresi
```
# Perbandingan dasar
age > 30
region == "North"

# Menggabungkan kondisi
age > 30 & income >= 50000
gender == "F" | age < 25
~(region == "North")

# Menggunakan fungsi
SQRT(income) > 250
LOWER(gender) == "f"
~MISSING(income)
```

</rewritten_file>