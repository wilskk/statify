# Data Management Modals - Statistical Data Operations

Direktori `Data/` berisi comprehensive modal system untuk data management operations dalam Statify. Setiap modal menyediakan specialized interface untuk specific data manipulation tasks dengan focus pada statistical workflows dan data integrity.

## 📁 Struktur Arsitektur

```
Data/
├── DataMenu.tsx              # Main data operations menu
├── DataRegistry.tsx          # Data modal registration system
├── index.ts                  # Module exports
├── README.md                 # This documentation
├── types.ts                  # Global data modal types
│
├── Aggregate/                # Data aggregation operations
├── DefineDateTime/           # Date/time variable definition
├── DefineVarProps/          # Variable properties management
├── DuplicateCases/          # Case duplication operations
├── Restructure/             # Data restructuring operations
├── SelectCases/             # Case selection criteria
├── SetMeasurementLevel/     # Measurement level assignment
├── SortCases/               # Case sorting operations
├── SortVars/                # Variable sorting operations
├── Transpose/               # Data transposition
├── UnusualCases/            # Outlier detection and handling
└── WeightCases/             # Case weighting operations
```

## 🎯 Data Operations Overview

### Data Transformation Categories

#### **Case Operations**
- **SelectCases**: Filter cases based on complex criteria
- **SortCases**: Sort cases by multiple variables
- **DuplicateCases**: Create duplicate cases with modifications
- **WeightCases**: Apply weights to cases for analysis

#### **Variable Operations**
- **SortVars**: Reorder variables in dataset
- **DefineVarProps**: Define comprehensive variable properties
- **SetMeasurementLevel**: Set measurement levels for statistical analysis
- **DefineDateTime**: Define date/time variables with proper formats

#### **Data Structure Operations**
- **Aggregate**: Group and summarize data
- **Restructure**: Reshape data between wide and long formats
- **Transpose**: Transpose rows and columns
- **UnusualCases**: Identify and handle outliers

## 📊 Feature Implementation Details

### Aggregate Operations (`Aggregate/`)

**Purpose**: Group data by categorical variables and compute summary statistics

**Architecture**:
```typescript
interface AggregateFeatures {
  // Grouping variables
  groupingVariables: Variable[];
  
  // Summary functions
  summaryFunctions: {
    sum: boolean;
    mean: boolean;
    median: boolean;
    count: boolean;
    stddev: boolean;
    min: boolean;
    max: boolean;
    percentiles: number[];
  };
  
  // Output options
  outputOptions: {
    createNewDataset: boolean;
    replaceCurrentDataset: boolean;
    addToCurrentDataset: boolean;
  };
}
```

**Key Components**:
- `VariablesTab.tsx`: Variable selection interface
- `OptionsTab.tsx`: Aggregation options configuration
- `hooks/useAggregateData.ts`: Core aggregation logic
- `services/`: Data aggregation processing

### Variable Properties (`DefineVarProps/`)

**Purpose**: Comprehensive variable metadata management

**Features**:
```typescript
interface VariablePropertiesFeatures {
  // Basic properties
  variableName: string;
  variableLabel: string;
  variableType: VariableType;
  measurementLevel: MeasurementLevel;
  
  // Display properties
  width: number;
  decimals: number;
  alignment: Alignment;
  
  // Value properties
  valueLabels: ValueLabel[];
  missingValues: MissingValue[];
  
  // Advanced properties
  role: VariableRole;
  customAttributes: CustomAttribute[];
}
```

**Key Components**:
- `PropertiesEditor.tsx`: Main properties editing interface
- `VariablesToScan.tsx`: Variable scanning and detection
- `hooks/usePropertiesEditor.ts`: Property editing logic
- `services/variablePropertiesService.ts`: Property validation and processing

### Date/Time Definition (`DefineDateTime/`)

**Purpose**: Define date/time variables dengan proper parsing dan formatting

**Features**:
```typescript
interface DateTimeDefinitionFeatures {
  // Date/time formats
  dateFormats: DateFormat[];
  timeFormats: TimeFormat[];
  datetimeFormats: DateTimeFormat[];
  
  // Parsing options
  parsingOptions: {
    locale: string;
    timezone: string;
    strictParsing: boolean;
    customFormats: string[];
  };
  
  // Output configuration
  outputConfiguration: {
    outputFormat: DateTimeOutputFormat;
    createComponents: boolean;
    validateDates: boolean;
  };
}
```

**Key Components**:
- `hooks/useDefineDateTime.ts`: Date/time definition logic
- `services/dateTimeService.ts`: Date parsing and validation
- `utils/dateTimeFormatters.ts`: Format detection and conversion

### Case Selection (`SelectCases/`)

**Purpose**: Advanced case filtering dengan complex criteria

**Features**:
```typescript
interface CaseSelectionFeatures {
  // Selection criteria
  selectionCriteria: {
    conditionalExpressions: ConditionalExpression[];
    randomSampling: RandomSamplingOptions;
    rangeBased: RangeBasedSelection;
    filterExpressions: FilterExpression[];
  };
  
  // Logical operators
  logicalOperators: {
    and: boolean;
    or: boolean;
    not: boolean;
    parentheses: boolean;
  };
  
  // Output options
  outputOptions: {
    deleteUnselected: boolean;
    markUnselected: boolean;
    createNewDataset: boolean;
  };
}
```

### Data Restructuring (`Restructure/`)

**Purpose**: Transform data between different structural formats

**Features**:
```typescript
interface RestructureFeatures {
  // Restructure types
  restructureTypes: {
    wideToLong: WideToLongOptions;
    longToWide: LongToWideOptions;
    casesToVariables: CasesToVariablesOptions;
    variablesToCases: VariablesToCasesOptions;
  };
  
  // Configuration
  configuration: {
    keyVariables: Variable[];
    valueVariables: Variable[];
    groupingVariables: Variable[];
    indexVariables: Variable[];
  };
}
```

### Outlier Detection (`UnusualCases/`)

**Purpose**: Identify dan handle statistical outliers

**Features**:
```typescript
interface UnusualCasesFeatures {
  // Detection methods
  detectionMethods: {
    standardizedValues: boolean;
    studentizedDeleted: boolean;
    mahalanobisDistance: boolean;
    cookDistance: boolean;
  };
  
  // Thresholds
  thresholds: {
    standardized: number;
    studentized: number;
    mahalanobis: number;
    cook: number;
  };
  
  // Output options
  outputOptions: {
    listCases: boolean;
    saveProbabilities: boolean;
    saveDistances: boolean;
    createFilterVariable: boolean;
  };
}
```

**Key Components**:
- `VariablesTab.tsx`: Variable selection for outlier detection
- `OptionsTab.tsx`: Detection method configuration
- `OutputTab.tsx`: Output options configuration
- `SaveTab.tsx`: Save options for results
- `MissingValuesTab.tsx`: Missing value handling

## 🔧 Development Architecture

### Feature-Sliced Design Pattern
Setiap data operation mengikuti consistent structure:

```typescript
interface DataModalStructure {
  // Entry point
  'index.tsx': MainModalComponent;
  
  // UI Components
  'components/': {
    'VariablesTab.tsx': VariableSelectionInterface;
    'OptionsTab.tsx': OperationConfiguration;
    'OutputTab.tsx': OutputOptions;
  };
  
  // Business Logic
  'hooks/': {
    'useModalLogic.ts': CoreOperationLogic;
    'useValidation.ts': ValidationLogic;
    'useFormState.ts': FormStateManagement;
  };
  
  // Services
  'services/': {
    'operationService.ts': DataProcessing;
    'validationService.ts': DataValidation;
  };
  
  // Utilities
  'utils/': UtilityFunctions;
  'types.ts': TypeDefinitions;
  '__tests__/': ComprehensiveTests;
  'README.md': FeatureDocumentation;
}
```

### State Management Pattern
```typescript
interface DataModalStatePattern {
  // Form state
  formState: {
    selectedVariables: Variable[];
    operationOptions: OperationOptions;
    outputConfiguration: OutputConfiguration;
    validationState: ValidationState;
  };
  
  // UI state
  uiState: {
    activeTab: TabType;
    isProcessing: boolean;
    previewData: PreviewData;
    errorState: ErrorState;
  };
  
  // Data integration
  dataIntegration: {
    sourceData: Dataset;
    processedData: ProcessedDataset;
    resultData: ResultDataset;
  };
}
```

### Validation System
```typescript
interface DataValidationSystem {
  // Input validation
  inputValidation: {
    variableSelection: VariableSelectionValidator;
    parameterValidation: ParameterValidator;
    dataIntegrity: DataIntegrityValidator;
  };
  
  // Business rules
  businessRules: {
    statisticalRequirements: StatisticalRequirement[];
    dataConstraints: DataConstraint[];
    operationConstraints: OperationConstraint[];
  };
  
  // Error handling
  errorHandling: {
    validationErrors: ValidationError[];
    recoveryStrategies: RecoveryStrategy[];
    userGuidance: UserGuidanceSystem;
  };
}
```

## 🧪 Testing Strategy

### Comprehensive Test Coverage
```typescript
interface DataModalTestStrategy {
  // Unit tests
  unitTests: {
    hookTesting: HookTestStrategy;
    serviceTesting: ServiceTestStrategy;
    utilityTesting: UtilityTestStrategy;
    validatorTesting: ValidatorTestStrategy;
  };
  
  // Integration tests
  integrationTests: {
    dataFlowTesting: DataFlowTestStrategy;
    storeIntegration: StoreIntegrationTest;
    workerIntegration: WorkerIntegrationTest;
  };
  
  // Data tests
  dataTests: {
    dataTransformation: DataTransformationTest;
    dataValidation: DataValidationTest;
    edgeCaseHandling: EdgeCaseTest;
  };
}
```

### Test Coverage per Feature
```typescript
// Aggregate tests
describe('Aggregate Operations', () => {
  describe('Utils', () => {
    it('calculates aggregation functions correctly');
    it('handles grouping logic properly');
    it('validates aggregation parameters');
  });
  
  describe('useAggregateData', () => {
    it('manages aggregation state correctly');
    it('validates variable selection');
    it('processes aggregation requests');
  });
});

// DefineDateTime tests
describe('DateTime Definition', () => {
  describe('dateTimeFormatters', () => {
    it('detects date formats correctly');
    it('parses various date formats');
    it('handles timezone conversions');
  });
  
  describe('dateTimeService', () => {
    it('validates date/time data');
    it('converts between formats');
    it('handles parsing errors gracefully');
  });
});
```

## 📋 Development Guidelines

### Data Modal Development Standards
```typescript
interface DataModalStandards {
  // Architecture compliance
  featureSlicedStructure: boolean;
  consistentNaming: boolean;
  typeDefinitions: boolean;
  
  // Data handling
  dataValidation: boolean;
  errorHandling: boolean;
  previewCapability: boolean;
  undoSupport: boolean;
  
  // Integration requirements
  storeIntegration: boolean;
  workerSupport: boolean;
  progressIndicators: boolean;
  
  // Quality requirements
  testCoverage: number; // >= 85%
  documentation: boolean;
  accessibility: boolean;
}
```

### Best Practices
```typescript
// 1. Data validation pattern
const validateDataOperation = (data: Dataset, options: OperationOptions): ValidationResult => {
  const validators = [
    validateDataIntegrity,
    validateVariableTypes,
    validateStatisticalRequirements,
    validateBusinessRules
  ];
  
  return validators.reduce((result, validator) => {
    return combineValidationResults(result, validator(data, options));
  }, { isValid: true, errors: [] });
};

// 2. Error recovery pattern
const handleDataOperationError = (error: DataOperationError): RecoveryAction => {
  switch (error.type) {
    case 'VALIDATION_ERROR':
      return { type: 'SHOW_VALIDATION_GUIDANCE', guidance: error.guidance };
    case 'DATA_CORRUPTION':
      return { type: 'RESTORE_FROM_BACKUP', backupId: error.backupId };
    case 'MEMORY_ERROR':
      return { type: 'CHUNK_PROCESSING', chunkSize: getOptimalChunkSize() };
    default:
      return { type: 'GRACEFUL_DEGRADATION', fallback: error.fallback };
  }
};

// 3. Performance optimization
const optimizeDataOperation = (operation: DataOperation): OptimizedOperation => {
  return {
    ...operation,
    chunking: operation.dataSize > CHUNK_THRESHOLD,
    workerSupport: operation.complexity > WORKER_THRESHOLD,
    progressTracking: operation.estimatedTime > PROGRESS_THRESHOLD,
    memoryManagement: operation.memoryUsage > MEMORY_THRESHOLD
  };
};
```

### Integration Patterns
```typescript
// Store integration
const DataModalWithStore = () => {
  const { data, updateData } = useDataStore();
  const { addResult } = useResultStore();
  const { showProgress, hideProgress } = useUIStore();
  
  const handleDataOperation = async (operation: DataOperation) => {
    showProgress('Processing data operation...');
    
    try {
      const result = await processDataOperation(operation);
      updateData(result.data);
      addResult(result.analysis);
    } catch (error) {
      handleOperationError(error);
    } finally {
      hideProgress();
    }
  };
};

// Worker integration
const DataModalWithWorker = () => {
  const { processInWorker } = useWorkerService();
  
  const handleHeavyOperation = async (operation: HeavyDataOperation) => {
    const result = await processInWorker('data-operation-worker', {
      operation,
      data: operation.data,
      options: operation.options
    });
    
    return result;
  };
};
```

---

Data modals menyediakan comprehensive interface untuk statistical data management dengan emphasis pada data integrity, user experience, dan professional workflow support. Setiap modal dirancang untuk handle complex statistical data operations dengan robustness dan reliability.

---

## 🗓️ DefineDateTime
Location: `DefineDateTime/__tests__/`

| File | Focus |
|------|-------|
| `dateTimeService.test.ts` | Service responsible for generating new date/time variables. |
| `dateTimeFormatters.test.ts` | Formatter helpers for date/time patterns. |
| `useDefineDateTime.test.ts` | Hook controlling state & validation. |

_Note_: `DefineDateTime.test.tsx` is a UI test and therefore excluded from this index._

---

## 🏷️ DefineVarProps
Location: `DefineVarProps/__tests__/`

| File | Focus |
|------|-------|
| `variablePropertiesService.test.ts` | Service that persists variable property changes. |
| `useVariablesToScan.test.ts` | Hook for scanning & selecting variables. |
| `usePropertiesEditor.test.ts` | Hook that powers the properties wizard editor. |

---

## 📑 DuplicateCases
Location: `DuplicateCases/__tests__/`

| File | Focus |
|------|-------|
| `duplicateCasesService.test.ts` | Service for detecting & handling duplicates. |
| `useDuplicateCases.test.ts` | Hook that orchestrates duplicate case workflows. |

---

## 🔄 Restructure
Location: `Restructure/__tests__/`

| File | Focus |
|------|-------|
| `restructureService.test.ts` | Core algorithms for restructuring data. |
| `useRestructure.test.ts` | Hook state & validation for restructuring wizard. |

---

## 🎯 SelectCases
Location: `SelectCases/__tests__/`

| File | Focus |
|------|-------|
| `evaluator.test.ts` | Expression evaluator for case selection criteria. |
| `selectors.test.ts` | Helper functions for sample & range selectors. |
| `useSelectCases.test.ts` | Hook that manages selection mode & validation. |

---

## 🧮 SetMeasurementLevel
Location: `SetMeasurementLevel/__tests__/`

| File | Focus |
|------|-------|
| `useSetMeasurementLevel.test.tsx` | Hook logic for editing measurement levels. |

_Note_: While this file ends with `.tsx`, it exercises pure hook logic and is treated as a unit test._

---

## ↕️ SortCases
Location: `SortCases/__tests__/`

| File | Focus |
|------|-------|
| `useSortCases.test.ts` | Sorting algorithm & hook state management. |

---

## 🔠 SortVars
Location: `SortVars/__tests__/`

| File | Focus |
|------|-------|
| `sortVarsService.test.ts` | Service that reorders variables based on given criteria. |
| `useSortVariables.test.ts` | Hook handling variable sorting workflow. |

---

## 🔀 Transpose
Location: `Transpose/__tests__/`

| File | Focus |
|------|-------|
| `transposeService.test.ts` | Core logic for transposing rows ↔ columns. |
| `useTranspose.test.ts` | Hook controlling transpose configuration & validation. |

---

## ⚠️ UnusualCases
Location: `UnusualCases/__tests__/`

| File | Focus |
|------|-------|
| `useUnusualCases.test.ts` | Hook for detecting statistical outliers & unusual cases. |

---

## ⚖️ WeightCases
Location: `WeightCases/__tests__/`

_There are currently no dedicated unit tests for this modal. Only UI tests exist (`index.test.tsx`, `WeightCasesUI.test.tsx`). Consider adding unit tests for weighting calculations & validation logic._

---

### Adding New Unit Tests
1. Place the file under the appropriate modal's `__tests__` directory with a `.test.ts` extension (or `.test.tsx` for logic-heavy hooks).
2. Update the modal-specific README **and** this central index so future contributors can find it quickly.

---

_Last updated: <!-- KEEP THIS COMMENT: the CI tool replaces it with commit SHA & date -->_ 