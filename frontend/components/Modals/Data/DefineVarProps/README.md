# Define Variable Properties Modal - Comprehensive Variable Metadata Management

Modal untuk defining dan editing variable properties dengan data-driven scanning dalam Statify. Feature ini menyediakan two-step workflow untuk comprehensive variable metadata configuration berdasarkan actual data analysis.

## 📁 Component Architecture

```
DefineVarProps/
├── index.tsx                   # Main modal component (step coordinator)
├── PropertiesEditor.tsx        # Step 2: Property editing interface
├── VariablesToScan.tsx         # Step 1: Variable selection interface
├── types.ts                    # TypeScript type definitions
├── README.md                   # Documentation
│
├── __tests__/                  # Test suite
│   ├── index.test.tsx              # Main component tests
│   ├── PropertiesEditor.test.tsx   # Property editor tests
│   ├── VariablesToScan.test.tsx    # Variable selection tests
│   ├── usePropertiesEditor.test.ts # Property editor hook tests
│   ├── useVariablesToScan.test.ts  # Variable scanning hook tests
│   ├── utils.test.ts               # Utility function tests
│   ├── variablePropertiesService.test.ts # Service tests
│   └── README.md                   # Test documentation
│
├── constants/                  # Configuration constants
│   └── dateSpecs.ts               # Date format specifications
│
├── dialogs/                    # Modal dialogs
│
├── hooks/                      # Business logic hooks
│   ├── useDefineVarProps.ts       # Main workflow orchestration
│   ├── usePropertiesEditor.ts     # Property editing logic
│   └── useVariablesToScan.ts      # Variable scanning logic
│
├── services/                   # Business logic services
│   └── variablePropertiesService.ts # Core property services
│
└── utils/                      # Utility functions
    └── typeFormatters.ts          # Data type formatting utilities
```

## 🎯 Core Functionality

### Two-Step Workflow
```typescript
interface DefineVarPropsWorkflow {
  // Step 1: Variable scanning
  variableScanning: {
    variableSelection: VariableSelector;     // Select variables to analyze
    scanConfiguration: ScanConfig;          // Configure scan parameters
    scanExecution: ScanExecutor;            // Execute data analysis
    scanValidation: ScanValidator;          // Validate scan results
  };
  
  // Step 2: Property editing
  propertyEditing: {
    propertyDisplay: PropertyDisplay;       // Show current properties
    propertyModification: PropertyModifier; // Edit property values
    valueLabeling: ValueLabeler;            // Assign value labels
    missingValueConfig: MissingValueConfig; // Configure missing values
    measurementSuggestion: MeasurementSuggester; // AI-powered suggestions
  };
  
  // Integration
  integration: {
    changeDetection: ChangeDetector;        // Track property changes
    batchUpdates: BatchUpdater;             // Efficient store updates
    validationEngine: ValidationEngine;    // Comprehensive validation
    rollbackSupport: RollbackHandler;      // Undo capabilities
  };
}
```

## 📊 Variable Property System

### Property Categories
```typescript
interface VariableProperties {
  // Basic identification
  identification: {
    name: string;                    // Variable name (unique identifier)
    label: string;                   // Human-readable description
    originalName?: string;           // Track name changes
    aliasNames?: string[];           // Alternative names
  };
  
  // Data characteristics
  dataCharacteristics: {
    dataType: DataType;              // Numeric, String, Date, Boolean
    measurementLevel: MeasurementLevel; // Nominal, Ordinal, Scale
    role: VariableRole;              // Input, Target, Both, None, Partition, Split
    width: number;                   // Display width
    decimals?: number;               // Decimal places (numeric only)
  };
  
  // Value specifications
  valueSpecifications: {
    valueLabels: ValueLabel[];       // Value-to-label mappings
    missingValues: MissingValue[];   // Missing value definitions
    validRange?: Range;              // Valid value range
    customFormat?: Format;           // Custom display format
  };
  
  // Statistical metadata
  statisticalMetadata: {
    uniqueValueCount: number;        // Number of unique values
    missingValueCount: number;       // Number of missing values
    dataQualityScore: number;        // Quality assessment score
    suggestedMeasurement: MeasurementLevel; // AI suggestion
    confidence: number;              // Suggestion confidence
  };
}
```

### Data Type System
```typescript
interface DataTypeSystem {
  // Numeric types
  numericTypes: {
    integer: {
      validation: (value: any) => boolean;
      formatting: NumberFormat;
      operations: NumericOperation[];
      constraints: NumericConstraints;
    };
    decimal: {
      precision: number;
      scale: number;
      formatting: DecimalFormat;
      rounding: RoundingRule;
    };
    currency: {
      currencyCode: string;
      symbol: string;
      formatting: CurrencyFormat;
    };
    percentage: {
      multiplier: number;
      formatting: PercentageFormat;
    };
  };
  
  // String types
  stringTypes: {
    text: {
      maxLength?: number;
      encoding: string;
      trimming: boolean;
    };
    categorical: {
      categories: Category[];
      ordered: boolean;
      caseSensitive: boolean;
    };
  };
  
  // Date/time types
  dateTimeTypes: {
    date: {
      format: DateFormat;
      epoch: DateEpoch;
      timezone?: Timezone;
    };
    time: {
      format: TimeFormat;
      precision: TimePrecision;
    };
    datetime: {
      format: DateTimeFormat;
      timezone: Timezone;
    };
  };
  
  // Special types
  specialTypes: {
    boolean: {
      trueValues: string[];
      falseValues: string[];
      nullRepresentation: string;
    };
    custom: {
      validator: CustomValidator;
      formatter: CustomFormatter;
      parser: CustomParser;
    };
  };
}
```

## 🔧 Hook Implementation

### useDefineVarProps Hook (Main Orchestrator)
```typescript
interface UseDefineVarPropsHook {
  // Workflow state
  workflowState: {
    currentStep: 'scanning' | 'editing';
    selectedVariables: Variable[];
    scanConfiguration: ScanConfig;
    scanResults: ScanResult[];
    propertyChanges: PropertyChange[];
  };
  
  // Step management
  stepManagement: {
    proceedToEditing: (variables: Variable[], config: ScanConfig) => Promise<void>;
    returnToScanning: () => void;
    completeWorkflow: () => Promise<void>;
    cancelWorkflow: () => void;
  };
  
  // Data flow
  dataFlow: {
    executeScan: (variables: Variable[], config: ScanConfig) => Promise<ScanResult[]>;
    loadPropertyData: (variable: Variable) => Promise<PropertyData>;
    savePropertyChanges: (changes: PropertyChange[]) => Promise<void>;
    validateWorkflow: () => ValidationResult;
  };
}
```

### useVariablesToScan Hook
```typescript
interface UseVariablesToScanHook {
  // Variable selection
  variableSelection: {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    addVariable: (variable: Variable) => void;
    removeVariable: (variableId: string) => void;
    selectAllVariables: () => void;
    clearSelection: () => void;
  };
  
  // Scan configuration
  scanConfiguration: {
    maxCasesToScan: number;
    maxUniqueValues: number;
    includeFrequencies: boolean;
    detectMissingValues: boolean;
    setMaxCases: (count: number) => void;
    setMaxUniqueValues: (count: number) => void;
    toggleFrequencies: () => void;
    toggleMissingDetection: () => void;
  };
  
  // Validation
  validation: {
    canProceed: boolean;
    validationErrors: ValidationError[];
    validateSelection: () => ValidationResult;
    validateConfiguration: () => ValidationResult;
  };
  
  // Execution
  execution: {
    startScanning: () => Promise<void>;
    scanProgress: number;
    isScanningInProgress: boolean;
    cancelScanning: () => void;
  };
}
```

### usePropertiesEditor Hook
```typescript
interface UsePropertiesEditorHook {
  // Editor state
  editorState: {
    currentVariable: Variable | null;
    variableProperties: VariableProperties;
    uniqueValues: UniqueValueData[];
    valueLabels: ValueLabel[];
    missingValues: MissingValue[];
    hasChanges: boolean;
  };
  
  // Variable navigation
  variableNavigation: {
    scannedVariables: Variable[];
    selectVariable: (variable: Variable) => Promise<void>;
    previousVariable: () => void;
    nextVariable: () => void;
    currentIndex: number;
    totalCount: number;
  };
  
  // Property editing
  propertyEditing: {
    updateName: (name: string) => void;
    updateLabel: (label: string) => void;
    updateDataType: (type: DataType) => void;
    updateMeasurementLevel: (level: MeasurementLevel) => void;
    updateRole: (role: VariableRole) => void;
    updateFormat: (format: Format) => void;
  };
  
  // Value label management
  valueLabelManagement: {
    addValueLabel: (value: any, label: string) => void;
    updateValueLabel: (value: any, label: string) => void;
    removeValueLabel: (value: any) => void;
    setMissingValue: (value: any, isMissing: boolean) => void;
    clearAllLabels: () => void;
    autoGenerateLabels: () => void;
  };
  
  // AI assistance
  aiAssistance: {
    suggestMeasurementLevel: () => Promise<MeasurementSuggestion>;
    suggestDataType: () => Promise<DataTypeSuggestion>;
    suggestValueLabels: () => Promise<ValueLabelSuggestion[]>;
    applySuggestion: (suggestion: AISuggestion) => void;
  };
  
  // Validation and saving
  validationSaving: {
    validateProperties: () => ValidationResult;
    hasUnsavedChanges: boolean;
    saveChanges: () => Promise<void>;
    discardChanges: () => void;
    resetToOriginal: () => void;
  };
}
```

## 📊 Data Analysis Services

### Variable Properties Service
```typescript
interface VariablePropertiesService {
  // Data scanning
  dataScanning: {
    scanVariableData: (
      variable: Variable,
      data: DataRow[],
      options: ScanOptions
    ) => Promise<ScanResult>;
    getUniqueValuesWithCounts: (
      variable: Variable,
      data: DataRow[],
      maxValues: number
    ) => Promise<UniqueValueData[]>;
    detectMissingValues: (
      variable: Variable,
      data: DataRow[]
    ) => Promise<MissingValue[]>;
    analyzeDataQuality: (
      variable: Variable,
      data: DataRow[]
    ) => Promise<DataQualityReport>;
  };
  
  // Measurement level suggestions
  measurementSuggestions: {
    suggestMeasurementLevel: (
      variable: Variable,
      uniqueValues: UniqueValueData[]
    ) => Promise<MeasurementSuggestion>;
    calculateConfidence: (
      suggestion: MeasurementLevel,
      evidence: AnalysisEvidence
    ) => number;
    generateExplanation: (
      suggestion: MeasurementLevel,
      evidence: AnalysisEvidence
    ) => string;
  };
  
  // Property validation
  propertyValidation: {
    validateVariableName: (name: string, existingNames: string[]) => ValidationResult;
    validateValueLabels: (labels: ValueLabel[], dataType: DataType) => ValidationResult;
    validateMissingValues: (values: MissingValue[], dataType: DataType) => ValidationResult;
    validatePropertyCombination: (properties: VariableProperties) => ValidationResult;
  };
  
  // Change management
  changeManagement: {
    detectPropertyChanges: (
      original: VariableProperties,
      current: VariableProperties
    ) => PropertyChange[];
    applyPropertyChanges: (
      variable: Variable,
      changes: PropertyChange[]
    ) => Promise<Variable>;
    batchUpdateProperties: (
      changes: Map<string, PropertyChange[]>
    ) => Promise<void>;
    rollbackChanges: (
      changes: PropertyChange[]
    ) => Promise<void>;
  };
}
```

### AI-Powered Analysis
```typescript
interface AIAnalysisEngine {
  // Measurement level detection
  measurementDetection: {
    analyzeNumericData: (values: number[]) => MeasurementAnalysis;
    analyzeTextData: (values: string[]) => MeasurementAnalysis;
    analyzeCategoricalData: (values: any[]) => MeasurementAnalysis;
    combineEvidence: (analyses: MeasurementAnalysis[]) => MeasurementSuggestion;
  };
  
  // Data type inference
  dataTypeInference: {
    inferFromValues: (values: any[]) => DataTypeInference;
    inferFromPatterns: (values: string[]) => DataTypeInference;
    validateInference: (inference: DataTypeInference, values: any[]) => boolean;
    scoreConfidence: (inference: DataTypeInference) => number;
  };
  
  // Value label suggestions
  valueLabelSuggestions: {
    detectCommonPatterns: (values: any[]) => LabelPattern[];
    suggestLabelsFromPatterns: (patterns: LabelPattern[]) => ValueLabelSuggestion[];
    rankSuggestions: (suggestions: ValueLabelSuggestion[]) => ValueLabelSuggestion[];
    generateExplanations: (suggestions: ValueLabelSuggestion[]) => string[];
  };
  
  // Missing value detection
  missingValueDetection: {
    detectCommonMissingPatterns: (values: any[]) => MissingPattern[];
    suggestMissingValues: (patterns: MissingPattern[]) => MissingValue[];
    validateMissingValues: (suggested: MissingValue[], actual: any[]) => ValidationResult;
  };
}
```

## 🎨 UI Components

### VariablesToScan Component
```typescript
interface VariablesToScanProps {
  // Variable lists
  availableVariables: Variable[];
  selectedVariables: Variable[];
  onVariableAdd: (variable: Variable) => void;
  onVariableRemove: (variableId: string) => void;
  
  // Scan configuration
  scanConfig: ScanConfig;
  onScanConfigChange: (config: ScanConfig) => void;
  
  // Performance settings
  maxCasesToScan: number;
  maxUniqueValues: number;
  onMaxCasesChange: (count: number) => void;
  onMaxUniqueValuesChange: (count: number) => void;
  
  // Progress and validation
  validationErrors: ValidationError[];
  canProceed: boolean;
  onProceed: () => void;
}
```

### PropertiesEditor Component
```typescript
interface PropertiesEditorProps {
  // Variable context
  scannedVariables: Variable[];
  currentVariable: Variable;
  onVariableSelect: (variable: Variable) => void;
  
  // Property editing
  properties: VariableProperties;
  onPropertyChange: (property: string, value: any) => void;
  
  // Value labels
  uniqueValues: UniqueValueData[];
  valueLabels: ValueLabel[];
  onValueLabelChange: (value: any, label: string) => void;
  onMissingValueToggle: (value: any, isMissing: boolean) => void;
  
  // AI assistance
  measurementSuggestion: MeasurementSuggestion | null;
  onSuggestMeasurement: () => void;
  onApplySuggestion: () => void;
  
  // Actions
  hasChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Workflow testing
describe('DefineVarPropsModal', () => {
  describe('Step workflow', () => {
    it('starts with variable selection step');
    it('transitions to property editing step');
    it('maintains state between steps');
    it('handles step cancellation');
  });
  
  describe('Variable scanning', () => {
    it('scans selected variables');
    it('respects scan limits');
    it('handles scan errors');
    it('validates scan configuration');
  });
  
  describe('Property editing', () => {
    it('loads variable properties');
    it('updates properties correctly');
    it('manages value labels');
    it('handles missing values');
  });
  
  describe('AI suggestions', () => {
    it('suggests measurement levels');
    it('provides confidence scores');
    it('explains suggestions');
    it('applies suggestions correctly');
  });
});

// Service testing
describe('variablePropertiesService', () => {
  describe('Data scanning', () => {
    it('scans variable data correctly');
    it('counts unique values accurately');
    it('detects missing values');
    it('analyzes data quality');
  });
  
  describe('Measurement suggestions', () => {
    it('suggests correct measurement levels');
    it('calculates confidence properly');
    it('handles edge cases');
  });
  
  describe('Change management', () => {
    it('detects property changes');
    it('applies changes efficiently');
    it('handles batch updates');
    it('supports rollback');
  });
});
```

## 📋 Development Guidelines

### Adding New Property Types
```typescript
// 1. Define property interface
interface NewPropertyType extends VariableProperty {
  type: 'newProperty';
  value: NewPropertyValue;
  validation: PropertyValidation;
  editor: PropertyEditor;
}

// 2. Implement property logic
const newPropertyLogic = {
  validate: (value: NewPropertyValue): ValidationResult => {
    // Validation logic
  },
  format: (value: NewPropertyValue): string => {
    // Formatting logic
  },
  parse: (input: string): NewPropertyValue => {
    // Parsing logic
  }
};

// 3. Add to property registry
const PROPERTY_TYPES = {
  ...existingTypes,
  newProperty: newPropertyLogic
};

// 4. Create UI component
const NewPropertyEditor: React.FC<NewPropertyEditorProps> = (props) => {
  // Editor implementation
};
```

### Performance Optimization
```typescript
// 1. Efficient data scanning
const optimizeDataScanning = (
  variables: Variable[],
  data: DataRow[],
  config: ScanConfig
) => {
  // Use worker for large datasets
  if (data.length > LARGE_DATASET_THRESHOLD) {
    return scanWithWorker(variables, data, config);
  }
  
  // Batch process variables
  return scanInBatches(variables, data, config);
};

// 2. Memoized suggestions
const useMemoizedSuggestions = (
  variable: Variable,
  uniqueValues: UniqueValueData[]
) => {
  return useMemo(() => {
    return suggestMeasurementLevel(variable, uniqueValues);
  }, [variable.id, uniqueValues.length]);
};
```

---

DefineVarProps modal menyediakan comprehensive variable metadata management dengan AI-powered suggestions dan efficient two-step workflow untuk data quality enhancement dalam Statify.
-   **`PropertiesEditor.tsx`**: The UI component for the second step, containing the detailed variable editor with a Handsontable grid for value labels.
-   **`hooks/useDefineVarProps.ts`**: A simple hook that manages the state for the main component (`index.tsx`), including the current step and the data passed between steps.
-   **`hooks/useVariablesToScan.ts`**: Manages the state and logic for the `VariablesToScan` component, including variable lists and limit settings.
-   **`hooks/usePropertiesEditor.ts`**: The central orchestrator for the `PropertiesEditor`. It manages the state of the currently selected variable, UI interactions (like dropdowns), and coordinates calls to the service layer.
-   **`services/variablePropertiesService.ts`**: Contains the core, non-UI business logic.
    -   It exposes functions to scan the data (`getUniqueValuesWithCounts`), analyze it (`suggestMeasurementLevel`), and save changes (`saveVariableProperties`).
    -   These functions interact with the global data stores (`useDataStore`, `useVariableStore`) but are decoupled from the React component lifecycle, making them pure and testable.
-   **`utils/typeFormatters.ts`**: Contains pure helper functions for formatting text for the UI.
-   **`constants/dateSpecs.ts`**: Holds constant definitions, specifically the detailed specifications for various date formats (`DATE_FORMAT_SPECS`).
-   **`types.ts`**: Defines all TypeScript interfaces specific to this feature.

## 4. Testing Strategy

The testing strategy is categorized into component tests, hook tests, and service tests to ensure comprehensive coverage.

### Component Tests

-   **`index.test.tsx`**: Tests the main `DefineVariableProps` component to ensure it correctly renders `VariablesToScan` initially and switches to `PropertiesEditor` after the first step is completed.
-   **`VariablesToScan.test.tsx`**: Mocks the `useVariablesToScan` hook to test the `VariablesToScan` component's UI and interactions in isolation. Verifies that UI controls trigger the corresponding mocked functions.
-   **`PropertiesEditor.test.tsx`**: Mocks the `usePropertiesEditor` hook to test the `PropertiesEditor` component. It simulates user actions like selecting variables, editing fields, and clicking buttons to confirm that the correct hook functions are called.

### Hook Tests

-   **`useVariablesToScan.test.ts`**: Tests the business logic within the `useVariablesToScan` hook. It mocks the `useVariableStore` and tests moving variables between lists, reordering, and validating the `onContinue` action.
-   **`usePropertiesEditor.test.ts`**: Tests the complex state management inside the `usePropertiesEditor` hook. It mocks the service layer to test state initialization, variable selection logic, property updates, and the `handleSave` function logic.

### Service Tests

-   **`variablePropertiesService.test.ts`**: Performs unit tests on the core business logic functions, which are decoupled from the UI. It mocks the data stores to provide a controlled environment.
    -   **`getUniqueValuesWithCounts`**: Tests that the function correctly scans data, respects limits, and returns accurate unique value counts.
    -   **`suggestMeasurementLevel`**: Tests the suggestion algorithm against various data scenarios (numeric, string, binary, etc.) to ensure it returns the appropriate measurement level.
    -   **`saveVariableProperties`**: Tests that the function correctly identifies modified variables and calls the store's update function with the correct payload.
