# Restructure Data Modal - Advanced Data Transformation and Reshaping

Modal untuk restructuring dan transforming data layouts dalam Statify. Feature ini menyediakan comprehensive data reshaping capabilities termasuk wide-to-long conversion, long-to-wide transformation, dan advanced transpose operations.

## 📁 Component Architecture

```
Restructure/
├── index.tsx                   # Main modal component
├── RestructureUI.tsx           # Main restructuring interface
├── RestructureTest.tsx         # Data transformation testing
├── types.ts                    # TypeScript type definitions
├── README.md                   # Documentation
│
├── __tests__/                  # Test suite
│   ├── Restructure.test.tsx        # Main component tests
│   ├── useRestructure.test.ts      # Hook logic tests
│   ├── restructureService.test.ts  # Service function tests
│   └── README.md                   # Test documentation
│
├── hooks/                      # Business logic hooks
│   └── useRestructure.ts           # Core restructuring logic
│
└── services/                   # Business logic services
    └── restructureService.ts       # Data transformation algorithms
```

## 🎯 Core Functionality

### Data Restructuring Methods
```typescript
interface RestructuringMethods {
  // Variables to Cases (Wide to Long)
  variablesToCases: {
    purpose: 'Convert multiple variables into multiple cases';
    useCase: 'Repeated measures, time series analysis';
    transformation: WideToLongTransformation;
    outputStructure: LongFormat;
  };
  
  // Cases to Variables (Long to Wide)
  casesToVariables: {
    purpose: 'Convert multiple cases into multiple variables';
    useCase: 'Cross-tabulation, summary matrices';
    transformation: LongToWideTransformation;
    outputStructure: WideFormat;
  };
  
  // Transpose (Complete matrix flip)
  transpose: {
    purpose: 'Flip rows and columns completely';
    useCase: 'Matrix operations, data orientation change';
    transformation: TransposeTransformation;
    outputStructure: TransposedFormat;
  };
  
  // Custom restructuring
  customRestructuring: {
    purpose: 'User-defined transformation logic';
    useCase: 'Complex data reshaping requirements';
    transformation: CustomTransformation;
    outputStructure: CustomFormat;
  };
}
```

### Transformation Workflow
```typescript
interface TransformationWorkflow {
  // Step 1: Method selection
  methodSelection: {
    restructureMethod: RestructureMethod;    // Selected transformation method
    methodConfiguration: MethodConfig;      // Method-specific settings
    previewGeneration: PreviewGenerator;    // Show transformation preview
    validationChecks: ValidationChecker;    // Validate method applicability
  };
  
  // Step 2: Variable mapping
  variableMapping: {
    sourceVariables: Variable[];            // Variables to transform
    targetConfiguration: TargetConfig;     // Output variable configuration
    mappingRules: MappingRule[];           // Transformation rules
    indexVariables: IndexVariable[];       // Index/identifier variables
  };
  
  // Step 3: Configuration
  configurationSettings: {
    outputOptions: OutputOptions;          // Output formatting options
    missingValueHandling: MissingValueStrategy; // Missing data handling
    dataTypePreservation: TypePreservation; // Maintain data types
    performanceOptimization: PerformanceConfig; // Large dataset handling
  };
  
  // Step 4: Execution
  executionPhase: {
    transformationExecution: TransformationExecutor; // Core transformation
    progressTracking: ProgressTracker;    // Monitor transformation progress
    resultValidation: ResultValidator;    // Validate transformation results
    stateIntegration: StateIntegrator;    // Update application state
  };
}
```

## 📊 Transformation Methods

### Variables to Cases (Wide to Long)
```typescript
interface VariablesToCasesTransformation {
  // Input configuration
  inputConfiguration: {
    sourceVariables: Variable[];           // Variables to convert to cases
    identifierVariables: Variable[];      // Variables to keep as identifiers
    measurementVariables: Variable[];     // Variables containing measurements
    groupingVariables: Variable[];        // Variables for grouping
  };
  
  // Output configuration
  outputConfiguration: {
    indexVariableName: string;            // Name for index variable
    valueVariableName: string;            // Name for value variable
    indexValueMapping: IndexValueMap[];   // Map original variable names to index values
    preserveOriginalNames: boolean;       // Keep original variable names as values
  };
  
  // Transformation logic
  transformationLogic: {
    createIndexColumn: () => IndexColumn;
    createValueColumn: () => ValueColumn;
    replicateIdentifierRows: () => ReplicatedRows;
    handleMissingValues: (strategy: MissingValueStrategy) => TransformationResult;
  };
  
  // Example transformation
  exampleTransformation: {
    before: {
      data: [
        { SubjectID: 1, Score1: 85, Score2: 90, Score3: 88 },
        { SubjectID: 2, Score1: 92, Score2: 87, Score3: 91 }
      ];
    };
    after: {
      data: [
        { SubjectID: 1, ScoreIndex: 'Score1', ScoreValue: 85 },
        { SubjectID: 1, ScoreIndex: 'Score2', ScoreValue: 90 },
        { SubjectID: 1, ScoreIndex: 'Score3', ScoreValue: 88 },
        { SubjectID: 2, ScoreIndex: 'Score1', ScoreValue: 92 },
        { SubjectID: 2, ScoreIndex: 'Score2', ScoreValue: 87 },
        { SubjectID: 2, ScoreIndex: 'Score3', ScoreValue: 91 }
      ];
    };
  };
}
```

### Cases to Variables (Long to Wide)
```typescript
interface CasesToVariablesTransformation {
  // Input configuration
  inputConfiguration: {
    identifierVariables: Variable[];      // Variables that identify unique entities
    indexVariable: Variable;              // Variable containing category/time identifiers
    valueVariables: Variable[];           // Variables containing values to spread
    sortingVariables: Variable[];         // Variables for ordering
  };
  
  // Output configuration
  outputConfiguration: {
    variableNamingPattern: string;        // Pattern for new variable names
    indexValueSeparator: string;          // Separator between base name and index
    handleDuplicateIndexes: DuplicateStrategy; // How to handle duplicate index values
    aggregationMethod: AggregationMethod; // Method for aggregating duplicate values
  };
  
  // Transformation logic
  transformationLogic: {
    identifyUniqueEntities: () => UniqueEntity[];
    extractIndexValues: () => IndexValue[];
    createVariableMatrix: () => VariableMatrix;
    populateMatrix: () => PopulatedMatrix;
    handleCollisions: (strategy: CollisionStrategy) => TransformationResult;
  };
  
  // Example transformation
  exampleTransformation: {
    before: {
      data: [
        { SubjectID: 1, TimePoint: 'T1', Score: 85, Rating: 4 },
        { SubjectID: 1, TimePoint: 'T2', Score: 90, Rating: 5 },
        { SubjectID: 2, TimePoint: 'T1', Score: 92, Rating: 4 },
        { SubjectID: 2, TimePoint: 'T2', Score: 87, Rating: 3 }
      ];
    };
    after: {
      data: [
        { SubjectID: 1, Score_T1: 85, Score_T2: 90, Rating_T1: 4, Rating_T2: 5 },
        { SubjectID: 2, Score_T1: 92, Score_T2: 87, Rating_T1: 4, Rating_T2: 3 }
      ];
    };
  };
}
```

### Complete Transpose
```typescript
interface TransposeTransformation {
  // Transpose configuration
  transposeConfiguration: {
    useFirstRowAsHeaders: boolean;        // Use first row as variable names
    useFirstColumnAsIndex: boolean;       // Use first column as row identifiers
    preserveDataTypes: boolean;           // Attempt to maintain data types
    handleMixedTypes: MixedTypeStrategy;  // Strategy for mixed data types
  };
  
  // Data handling
  dataHandling: {
    validateTransposability: () => ValidationResult;
    handleNonRectangularData: () => RectangularData;
    preserveMetadata: () => PreservedMetadata;
    generateNewVariableNames: () => VariableName[];
  };
  
  // Transformation logic
  transformationLogic: {
    flipMatrix: (matrix: DataMatrix) => TransposedMatrix;
    updateVariableDefinitions: () => VariableDefinition[];
    reassignDataTypes: () => DataTypeAssignment[];
    validateResult: () => ValidationResult;
  };
  
  // Example transformation
  exampleTransformation: {
    before: {
      data: [
        ['Name', 'Age', 'Score'],
        ['John', 25, 85],
        ['Jane', 30, 92],
        ['Bob', 28, 88]
      ];
    };
    after: {
      data: [
        ['Attribute', 'Record1', 'Record2', 'Record3'],
        ['Name', 'John', 'Jane', 'Bob'],
        ['Age', 25, 30, 28],
        ['Score', 85, 92, 88]
      ];
    };
  };
}
```

## 🔧 Hook Implementation

### useRestructure Hook
```typescript
interface UseRestructureHook {
  // Workflow state
  workflowState: {
    currentStep: RestructureStep;
    selectedMethod: RestructureMethod;
    configuration: RestructureConfiguration;
    previewData: PreviewData;
    validationResults: ValidationResult[];
  };
  
  // Method selection
  methodSelection: {
    availableMethods: RestructureMethod[];
    selectMethod: (method: RestructureMethod) => void;
    validateMethodApplicability: (method: RestructureMethod) => ValidationResult;
    getMethodRecommendations: () => MethodRecommendation[];
  };
  
  // Variable configuration
  variableConfiguration: {
    availableVariables: Variable[];
    selectedVariables: SelectedVariables;
    addVariable: (variable: Variable, role: VariableRole) => void;
    removeVariable: (variableId: string) => void;
    configureVariableMapping: (mapping: VariableMapping) => void;
    validateVariableSelection: () => ValidationResult;
  };
  
  // Output configuration
  outputConfiguration: {
    outputOptions: OutputOptions;
    setOutputOptions: (options: OutputOptions) => void;
    namingConventions: NamingConvention[];
    setNamingConvention: (convention: NamingConvention) => void;
    missingValueStrategy: MissingValueStrategy;
    setMissingValueStrategy: (strategy: MissingValueStrategy) => void;
  };
  
  // Preview and validation
  previewValidation: {
    generatePreview: () => Promise<PreviewData>;
    validateConfiguration: () => ValidationResult;
    estimateOutputSize: () => SizeEstimate;
    checkPerformanceImpact: () => PerformanceEstimate;
  };
  
  // Execution
  execution: {
    executeRestructuring: () => Promise<RestructureResult>;
    cancelRestructuring: () => void;
    resetConfiguration: () => void;
    restoreOriginalData: () => void;
    transformationProgress: TransformationProgress;
  };
}
```

### Restructure Service
```typescript
interface RestructureService {
  // Core transformation methods
  coreTransformations: {
    variablesToCases: (
      data: DataRow[],
      config: VariablesToCasesConfig
    ) => Promise<TransformationResult>;
    
    casesToVariables: (
      data: DataRow[],
      config: CasesToVariablesConfig
    ) => Promise<TransformationResult>;
    
    transposeData: (
      data: DataRow[],
      config: TransposeConfig
    ) => Promise<TransformationResult>;
    
    customTransformation: (
      data: DataRow[],
      config: CustomTransformationConfig
    ) => Promise<TransformationResult>;
  };
  
  // Data analysis and validation
  dataAnalysisValidation: {
    analyzeDataStructure: (data: DataRow[]) => DataStructureAnalysis;
    validateTransformationFeasibility: (
      data: DataRow[],
      method: RestructureMethod
    ) => FeasibilityReport;
    estimateTransformationComplexity: (
      data: DataRow[],
      config: RestructureConfiguration
    ) => ComplexityEstimate;
    recommendOptimalMethod: (data: DataRow[]) => MethodRecommendation[];
  };
  
  // Performance optimization
  performanceOptimization: {
    optimizeForLargeDatasets: (
      data: DataRow[],
      config: RestructureConfiguration
    ) => OptimizedConfiguration;
    
    createTransformationPlan: (
      data: DataRow[],
      config: RestructureConfiguration
    ) => TransformationPlan;
    
    executeInChunks: (
      data: DataRow[],
      config: RestructureConfiguration,
      chunkSize: number
    ) => Promise<ChunkedResult[]>;
    
    mergeChunkedResults: (
      chunks: ChunkedResult[]
    ) => TransformationResult;
  };
  
  // Quality assurance
  qualityAssurance: {
    validateTransformationResult: (
      original: DataRow[],
      transformed: DataRow[],
      config: RestructureConfiguration
    ) => QualityReport;
    
    checkDataIntegrity: (
      result: TransformationResult
    ) => IntegrityReport;
    
    generateTransformationSummary: (
      result: TransformationResult
    ) => TransformationSummary;
  };
}
```

## 🎨 UI Components

### RestructureUI Component
```typescript
interface RestructureUIProps {
  // Method selection
  availableMethods: RestructureMethod[];
  selectedMethod: RestructureMethod;
  onMethodSelect: (method: RestructureMethod) => void;
  
  // Variable configuration
  variables: {
    available: Variable[];
    selected: SelectedVariables;
    configuration: VariableConfiguration;
  };
  onVariableConfigChange: (config: VariableConfiguration) => void;
  
  // Output options
  outputOptions: OutputOptions;
  onOutputOptionsChange: (options: OutputOptions) => void;
  
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

### RestructureTest Component
```typescript
interface RestructureTestProps {
  // Test configuration
  testScenarios: TestScenario[];
  selectedScenario: TestScenario;
  onScenarioSelect: (scenario: TestScenario) => void;
  
  // Test data
  testData: TestData;
  expectedResults: ExpectedResult[];
  actualResults: ActualResult[];
  
  // Test execution
  onRunTest: () => void;
  onRunAllTests: () => void;
  testResults: TestResult[];
  
  // Validation
  comparisonResults: ComparisonResult[];
  testStatus: TestStatus;
  
  // Performance metrics
  performanceMetrics: PerformanceMetric[];
  memoryUsage: MemoryUsage;
  executionTime: ExecutionTime;
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Transformation testing
describe('RestructureModal', () => {
  describe('Variables to Cases', () => {
    it('converts wide format to long format correctly');
    it('handles missing values appropriately');
    it('preserves identifier variables');
    it('creates correct index and value columns');
  });
  
  describe('Cases to Variables', () => {
    it('converts long format to wide format correctly');
    it('handles duplicate index values');
    it('aggregates values when necessary');
    it('creates appropriate variable names');
  });
  
  describe('Transpose operations', () => {
    it('transposes data matrix correctly');
    it('handles mixed data types');
    it('preserves data integrity');
    it('generates appropriate variable names');
  });
  
  describe('Performance', () => {
    it('handles large datasets efficiently');
    it('provides progress feedback');
    it('optimizes memory usage');
    it('cancels operations cleanly');
  });
});

// Service testing
describe('restructureService', () => {
  describe('Core algorithms', () => {
    it('implements transformation algorithms correctly');
    it('validates input data properly');
    it('handles edge cases gracefully');
    it('maintains data type consistency');
  });
  
  describe('Quality assurance', () => {
    it('validates transformation results');
    it('checks data integrity');
    it('generates accurate summaries');
    it('detects transformation errors');
  });
});
```

## 📋 Development Guidelines

### Adding New Transformation Methods
```typescript
// 1. Define transformation interface
interface NewTransformationMethod extends TransformationMethod {
  id: 'newTransformation';
  name: 'New Transformation';
  description: 'Description of transformation';
  category: TransformationCategory;
  requirements: DataRequirement[];
}

// 2. Implement transformation logic
const newTransformationLogic = {
  validate: (data: DataRow[], config: TransformationConfig): ValidationResult => {
    // Validation logic
  },
  
  transform: (data: DataRow[], config: TransformationConfig): TransformationResult => {
    // Transformation logic
  },
  
  preview: (data: DataRow[], config: TransformationConfig): PreviewData => {
    // Preview logic
  }
};

// 3. Register transformation
const TRANSFORMATION_METHODS = {
  ...existingMethods,
  newTransformation: newTransformationLogic
};

// 4. Add comprehensive tests
describe('New Transformation', () => {
  it('validates requirements correctly');
  it('performs transformation accurately');
  it('generates correct preview');
  it('handles edge cases');
});
```

### Performance Optimization
```typescript
// 1. Chunked processing for large datasets
const processLargeDataset = async (
  data: DataRow[],
  config: RestructureConfiguration
) => {
  const chunkSize = calculateOptimalChunkSize(data.length, config);
  const chunks = chunkData(data, chunkSize);
  
  const results = await Promise.all(
    chunks.map((chunk, index) => 
      processChunk(chunk, config, index)
    )
  );
  
  return mergeChunkedResults(results, config);
};

// 2. Memory-efficient transformations
const memoryEfficientTransformation = (
  data: DataRow[],
  config: RestructureConfiguration
) => {
  // Use streaming processing for very large datasets
  if (data.length > VERY_LARGE_THRESHOLD) {
    return streamingTransformation(data, config);
  }
  
  // Use batch processing for large datasets
  if (data.length > LARGE_THRESHOLD) {
    return batchTransformation(data, config);
  }
  
  // Use standard processing for smaller datasets
  return standardTransformation(data, config);
};
```

---

Restructure modal menyediakan powerful data transformation capabilities dengan comprehensive reshaping methods dan optimized performance untuk complex data structure modifications dalam Statify.

### Transpose All Data

This method performs a simple but complete transposition of the entire dataset, swapping all rows and columns.

-   **Example**: A dataset with 10 rows and 5 columns becomes a dataset with 5 rows and 10 columns.

## 3. Component Architecture

The feature is architecturally divided into several key files to separate concerns:

-   **`index.tsx`**: The main entry point that integrates the UI (`RestructureUI`) with the state management and logic from the `useRestructure` hook.
-   **`RestructureUI.tsx`**: A presentational component responsible for rendering the wizard's tab-based user interface. It is driven entirely by the state and handlers provided by the `useRestructure` hook.
-   **`hooks/useRestructure.ts`**: The logical core of the component. This custom hook manages the wizard's state, including the current step, selected method, variable lists, user-selected options, and input validation. It orchestrates the entire process.
-   **`services/restructureService.ts`**: This is the service layer that contains the pure data transformation logic. It receives the current data, variables, and a configuration object from the hook, performs the restructuring, and returns the new data and variable definitions.
-   **`types.ts`**: Contains all relevant TypeScript interfaces and enums for the feature (`RestructureMethod`, `RestructureConfig`, etc.).

## 4. Wizard Logic and Flow

The wizard guides the user through a three-step process, enforced by tab navigation that is enabled or disabled based on step completion.

### Step 1: Select Restructure Method

The user chooses one of the three restructuring methods detailed above.

### Step 2: Configure Variables

Based on the chosen method, the user configures the variables for the operation using a drag-and-drop interface:

-   **For "Variables to Cases"**:
    -   **Variables to Restructure**: The set of variables (columns) to be converted into rows.
    -   **Index Variables**: Variables that identify the groups of new cases (e.g., a subject ID) and will be repeated for each new row.
-   **For "Cases to Variables"**:
    -   **Variables to Restructure**: The variable whose values will be restructured into the new columns (e.g., `Score`).
    -   **Identifier Variables**: The variable whose unique values will form the new column names (e.g., a `Time` variable with values 1, 2, 3).
-   **For "Transpose All Data"**: This step is skipped as no variable selection is needed.

The `useRestructure` hook includes validation to ensure that the appropriate variables are selected for the chosen method before allowing the user to proceed.

### Step 3: Set Options and Finish

The user configures final, method-specific options before execution:

-   **For "Variables to Cases"**:
    -   `Create count variable`: Adds a column counting non-missing values from the original restructured variables.
    -   `Create index variable`: Adds a column identifying the original variable name for each new case.
-   **For "Cases to Variables"**:
    -   `Drop empty variables`: Removes new columns that contain only missing values after restructuring.

Upon clicking "Finish", the `useRestructure` hook assembles a `RestructureConfig` object and passes it, along with the current data and variable definitions, to the `restructureData` function in `restructureService.ts`. The service returns the transformed data, which is then used to update the global `useDataStore` and `useVariableStore`, effectively replacing the old dataset with the new, restructured one.

## 5. Testing Strategy

The feature's automated tests are organized into three distinct suites to ensure comprehensive coverage.

-   **UI Testing (`__tests__/Restructure.test.tsx`)**: This suite focuses on the `RestructureUI` component, mocking the `useRestructure` hook to test the UI in isolation. It verifies correct rendering, tab state, conditional display of variable lists and options, and the display of validation errors.

-   **Hook Logic Testing (`__tests__/useRestructure.test.ts`)**: This suite tests the core business logic within the `useRestructure` hook. It mocks the service layer and Zustand stores to test state initialization, step navigation (including validation blocking and special flows), and the `handleFinish` logic, ensuring the service is called correctly and the stores are updated.

-   **Service-Level Testing (`__tests__/restructureService.test.ts`)**: This suite performs unit tests on the pure data transformation functions in `restructureService.ts` using mock data. It verifies the correctness of the `wideToLong`, `longToWide`, and `transposeAll` algorithms, including the handling of all associated options.
