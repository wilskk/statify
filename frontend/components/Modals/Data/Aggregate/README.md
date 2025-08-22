# Aggregate Data Modal - Statistical Grouping and Summarization

Modal untuk aggregating data dengan statistical summary functions across defined groups dalam Statify. Feature ini memungkinkan users untuk create summary statistics, calculate group means, dan perform complex data aggregation operations.

## 📁 Component Architecture

```
Aggregate/
├── index.tsx                    # Main modal component
├── OptionsTab.tsx              # Aggregation options configuration
├── VariablesTab.tsx            # Variable selection interface
├── aggregateUtils.ts           # Utility functions
├── types.ts                    # TypeScript type definitions
├── README.md                   # Documentation
│
├── __tests__/                  # Test suite
│   ├── Aggregate.test.tsx          # Main component tests
│   ├── useAggregateData.test.ts    # Hook logic tests
│   ├── Utils.test.ts               # Utility function tests
│   └── README.md                   # Test documentation
│
├── components/                 # Reusable UI components
├── constants/                  # Configuration constants
│
├── dialogs/                    # Modal dialogs
│   ├── ErrorDialog.tsx            # Error handling dialog
│   ├── FunctionDialog.tsx         # Function selection dialog
│   └── NameLabelDialog.tsx        # Variable naming dialog
│
└── hooks/                      # Business logic hooks
    └── useAggregateData.ts         # Core aggregation logic
```

## 🎯 Core Functionality

### Aggregation Workflow
```typescript
interface AggregationWorkflow {
  // Step 1: Group definition
  groupDefinition: {
    breakVariables: Variable[];      // Variables that define groups
    groupCombinations: GroupCombo[]; // Unique value combinations
    groupHierarchy: GroupLevel[];    // Nested grouping levels
  };
  
  // Step 2: Variable selection
  variableSelection: {
    aggregatedVariables: Variable[];  // Variables to summarize
    functionMapping: FunctionMap[];   // Functions per variable
    outputVariables: OutputVar[];     // Result variable definitions
  };
  
  // Step 3: Calculation execution
  calculationExecution: {
    groupProcessing: GroupProcessor;  // Group-wise calculations
    statisticalFunctions: StatFunc[]; // Available stat functions
    resultGeneration: ResultGen;      // Output data creation
  };
  
  // Step 4: Output integration
  outputIntegration: {
    datasetMerging: DataMerger;      // Merge with original data
    variableCreation: VarCreator;    // Create new variables
    metadataUpdates: MetaUpdater;    // Update variable properties
  };
}
```

## 📊 Statistical Functions

### Summary Statistics Functions
```typescript
interface SummaryStatistics {
  // Central tendency
  centralTendency: {
    mean: (values: number[]) => number;           // Arithmetic mean
    median: (values: number[]) => number;        // Middle value
    mode: (values: any[]) => any;                // Most frequent value
    geometricMean: (values: number[]) => number; // Geometric average
    harmonicMean: (values: number[]) => number;  // Harmonic average
  };
  
  // Variability measures
  variabilityMeasures: {
    standardDeviation: (values: number[]) => number;  // SD
    variance: (values: number[]) => number;           // Variance
    range: (values: number[]) => number;              // Max - Min
    interquartileRange: (values: number[]) => number; // IQR
    coefficientOfVariation: (values: number[]) => number; // CV
  };
  
  // Position statistics
  positionStatistics: {
    minimum: (values: number[]) => number;       // Smallest value
    maximum: (values: number[]) => number;       // Largest value
    first: (values: any[]) => any;               // First occurrence
    last: (values: any[]) => any;                // Last occurrence
    percentile: (values: number[], p: number) => number; // Percentile
  };
  
  // Aggregation functions
  aggregationFunctions: {
    sum: (values: number[]) => number;           // Total sum
    product: (values: number[]) => number;       // Product
    count: (values: any[]) => number;            // Valid count
    countMissing: (values: any[]) => number;     // Missing count
  };
}
```

### Count and Percentage Functions
```typescript
interface CountPercentageFunctions {
  // Count functions (SPSS terminology)
  countFunctions: {
    weightedN: (values: any[], weights?: number[]) => number;        // N
    weightedMissing: (values: any[], weights?: number[]) => number;  // NMISS
    unweightedN: (values: any[]) => number;                         // NU
    unweightedMissing: (values: any[]) => number;                   // NUMISS
  };
  
  // Percentage functions
  percentageFunctions: {
    validPercent: (values: any[]) => number;     // % valid cases
    missingPercent: (values: any[]) => number;   // % missing cases
    totalPercent: (values: any[]) => number;     // % of total
    groupPercent: (values: any[], group: any[]) => number; // % within group
  };
  
  // Fraction functions
  fractionFunctions: {
    validFraction: (values: any[]) => number;    // Fraction valid
    missingFraction: (values: any[]) => number;  // Fraction missing
    groupFraction: (values: any[], group: any[]) => number; // Group fraction
  };
}
```

## 🔧 Hook Implementation

### useAggregateData Hook
```typescript
interface UseAggregateDataHook {
  // State management
  state: {
    breakVariables: Variable[];
    aggregatedVariables: AggregatedVariable[];
    selectedFunctions: AggregationFunction[];
    outputOptions: OutputOptions;
    validationErrors: ValidationError[];
  };
  
  // Variable management
  variableManagement: {
    addBreakVariable: (variable: Variable) => void;
    removeBreakVariable: (variableId: string) => void;
    addAggregatedVariable: (variable: Variable, functions: AggregationFunction[]) => void;
    removeAggregatedVariable: (variableId: string) => void;
    updateFunctions: (variableId: string, functions: AggregationFunction[]) => void;
  };
  
  // Function configuration
  functionConfiguration: {
    availableFunctions: AggregationFunction[];
    getFunctionsForVariable: (variable: Variable) => AggregationFunction[];
    validateFunctionSelection: (variable: Variable, functions: AggregationFunction[]) => ValidationResult;
    configureFunctionParameters: (func: AggregationFunction, params: any) => void;
  };
  
  // Output configuration
  outputConfiguration: {
    generateOutputVariableNames: () => string[];
    validateOutputNames: (names: string[]) => ValidationResult;
    configureOutputDataset: (options: OutputOptions) => void;
    previewOutput: () => Promise<PreviewResult>;
  };
  
  // Execution
  execution: {
    validateConfiguration: () => ValidationResult;
    executeAggregation: () => Promise<AggregationResult>;
    cancelAggregation: () => void;
    resetConfiguration: () => void;
  };
}
```

### Core Aggregation Logic
```typescript
interface AggregationLogic {
  // Group processing
  groupProcessing: {
    createGroups: (data: DataRow[], breakVars: Variable[]) => GroupMap;
    processGroup: (group: DataRow[], functions: AggregationFunction[]) => GroupResult;
    mergeGroups: (groups: GroupResult[]) => AggregationResult;
    handleMissingValues: (group: DataRow[], strategy: MissingValueStrategy) => DataRow[];
  };
  
  // Function execution
  functionExecution: {
    executeFunction: (func: AggregationFunction, values: any[]) => any;
    validateFunction: (func: AggregationFunction, variable: Variable) => boolean;
    optimizeExecution: (functions: AggregationFunction[]) => ExecutionPlan;
    handleErrors: (error: Error, context: ExecutionContext) => ErrorResult;
  };
  
  // Result generation
  resultGeneration: {
    formatResults: (rawResults: RawResult[], format: OutputFormat) => FormattedResult[];
    createOutputVariables: (results: FormattedResult[]) => Variable[];
    updateDataset: (originalData: DataRow[], results: FormattedResult[]) => DataRow[];
    generateMetadata: (results: FormattedResult[]) => VariableMetadata[];
  };
}
```

## 📋 Component Structure

### VariablesTab Component
```typescript
interface VariablesTabProps {
  // Break variables section
  breakVariables: Variable[];
  onBreakVariableAdd: (variable: Variable) => void;
  onBreakVariableRemove: (variableId: string) => void;
  
  // Aggregated variables section
  aggregatedVariables: AggregatedVariable[];
  onAggregatedVariableAdd: (variable: Variable) => void;
  onAggregatedVariableRemove: (variableId: string) => void;
  onFunctionsUpdate: (variableId: string, functions: AggregationFunction[]) => void;
  
  // Available variables
  availableVariables: Variable[];
  variableFilter: string;
  onVariableFilterChange: (filter: string) => void;
  
  // Validation
  validationErrors: ValidationError[];
  isValid: boolean;
}
```

### OptionsTab Component
```typescript
interface OptionsTabProps {
  // Output options
  outputOptions: {
    addToExistingDataset: boolean;
    createNewDataset: boolean;
    datasetName: string;
    replaceExistingFile: boolean;
  };
  
  // Function options
  functionOptions: {
    includeStatisticsForSplitFileGroups: boolean;
    sortedFile: boolean;
    breakVariablesSorted: boolean;
  };
  
  // Missing value handling
  missingValueOptions: {
    excludeListwise: boolean;
    excludePairwise: boolean;
    includeUserMissing: boolean;
  };
  
  // Event handlers
  onOutputOptionsChange: (options: OutputOptions) => void;
  onFunctionOptionsChange: (options: FunctionOptions) => void;
  onMissingValueOptionsChange: (options: MissingValueOptions) => void;
}
```

## 🎨 Dialog Components

### FunctionDialog
```typescript
interface FunctionDialogProps {
  // Context
  variable: Variable;
  currentFunctions: AggregationFunction[];
  availableFunctions: AggregationFunction[];
  
  // Configuration
  functionCategories: FunctionCategory[];
  functionDescriptions: Map<string, string>;
  functionParameters: Map<string, Parameter[]>;
  
  // State management
  selectedFunctions: AggregationFunction[];
  onFunctionsChange: (functions: AggregationFunction[]) => void;
  onParameterChange: (functionId: string, paramId: string, value: any) => void;
  
  // Modal control
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
```

### NameLabelDialog
```typescript
interface NameLabelDialogProps {
  // Variable configuration
  originalVariable: Variable;
  aggregationFunction: AggregationFunction;
  suggestedName: string;
  
  // Name/label editing
  variableName: string;
  variableLabel: string;
  onNameChange: (name: string) => void;
  onLabelChange: (label: string) => void;
  
  // Validation
  nameValidation: ValidationResult;
  labelValidation: ValidationResult;
  
  // Modal control
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Component testing
describe('AggregateModal', () => {
  describe('Variables tab', () => {
    it('adds and removes break variables');
    it('adds and removes aggregated variables');
    it('opens function selection dialog');
    it('validates variable selection');
  });
  
  describe('Options tab', () => {
    it('configures output options');
    it('sets missing value handling');
    it('validates configuration');
  });
  
  describe('Integration', () => {
    it('executes aggregation workflow');
    it('handles errors gracefully');
    it('updates dataset correctly');
  });
});

// Hook testing
describe('useAggregateData', () => {
  describe('State management', () => {
    it('manages break variables');
    it('manages aggregated variables');
    it('tracks validation state');
  });
  
  describe('Function execution', () => {
    it('executes statistical functions');
    it('handles missing values');
    it('generates correct results');
  });
});

// Utility testing
describe('aggregateUtils', () => {
  describe('Statistical functions', () => {
    it('calculates mean correctly');
    it('calculates median correctly');
    it('handles edge cases');
  });
  
  describe('Group processing', () => {
    it('creates groups correctly');
    it('processes groups efficiently');
    it('merges results properly');
  });
});
```

## 📋 Development Guidelines

### Adding New Aggregation Functions
```typescript
// 1. Define function interface
interface NewAggregationFunction extends AggregationFunction {
  id: 'newFunction';
  name: 'New Function';
  category: 'summary' | 'position' | 'count' | 'percentage';
  parameters?: Parameter[];
  applicableTypes: DataType[];
}

// 2. Implement calculation logic
const calculateNewFunction = (values: any[], params?: any): any => {
  // Implementation logic
  return result;
};

// 3. Add to function registry
const AGGREGATION_FUNCTIONS = {
  ...existingFunctions,
  newFunction: {
    calculate: calculateNewFunction,
    validate: validateNewFunction,
    describe: describeNewFunction
  }
};

// 4. Add tests
describe('New Function', () => {
  it('calculates correctly');
  it('handles edge cases');
  it('validates parameters');
});
```

### Performance Optimization
```typescript
// 1. Group processing optimization
const optimizeGroupProcessing = (data: DataRow[], breakVars: Variable[]) => {
  // Use Map for O(1) group lookup
  const groupMap = new Map<string, DataRow[]>();
  
  // Single pass through data
  for (const row of data) {
    const groupKey = createGroupKey(row, breakVars);
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey)!.push(row);
  }
  
  return groupMap;
};

// 2. Function execution optimization
const optimizeFunctionExecution = (functions: AggregationFunction[]) => {
  // Batch compatible functions
  const compatibleBatches = groupCompatibleFunctions(functions);
  
  // Execute in optimized order
  return compatibleBatches.map(batch => 
    executeFunctionBatch(batch)
  );
};
```

---

Aggregate modal menyediakan powerful statistical aggregation capabilities dengan comprehensive function library dan optimized performance untuk large datasets dalam Statify.
  - **Above**: Percentage of cases above a specified value
  - **Below**: Percentage of cases below a specified value
  - **Inside**: Percentage of cases between two specified values
  - **Outside**: Percentage of cases outside a range of specified values
- **Fractions**: Similar to percentages but expressed as proportions (0-1 instead of 0-100)
- **Counts**: Simple counting of cases meeting criteria

### Additional Options

#### Options for Very Large Datasets

- **File is already sorted on break variable(s)**: Skip the sorting step when data is already ordered by break variables. *(Note: This option is available in the UI but not yet implemented in the aggregation logic.)*
- **Sort file before aggregating**: Sort data by break variables before aggregating (improves performance). *(Note: This option is available in the UI but not yet implemented in the aggregation logic.)*

## Algorithm Details

The aggregation algorithm works as follows:

1. **Grouping**:
   - Data is grouped by unique combinations of values in the break variables
   - Each unique combination forms a distinct group

2. **Function Application**:
   - For each aggregated variable, the specified function is applied to all values within each group
   - Results are calculated and stored in new variables

3. **Result Generation**:
   - New variables are created for each aggregated variable with its associated function.
   - By default, these new variables are added to the *active dataset*. The aggregated value is then broadcast to all cases belonging to the same break group.
   - Functionality to create a new dataset containing one case per break group is planned for a future release.

## Usage Examples

### Calculating Group Averages

To find average scores by group:
1. Select "Gender" and "Class" as break variables
2. Add "Score" to aggregated variables
3. Choose "Mean" as the aggregation function
4. Click OK to process
5. Results will show the average score for each Gender-Class combination

### Finding Maximum Values Per Group

To find maximum income by department:
1. Select "Department" as break variable
2. Add "Income" to aggregated variables
3. Choose "Maximum" as the aggregation function
4. Click OK to process
5. Results will show the highest income in each department

### Counting Cases Per Group

To count people by region and age category:
1. Select "Region" and "AgeGroup" as break variables
2. Choose any variable for aggregation
3. Apply the "Weighted" (N) function
4. Click OK to process
5. Results will show counts for each Region-AgeGroup combination

## Notes

- The aggregation process creates new variables in your dataset, one for each aggregation function applied.
- Variable names are automatically generated based on the original variable and function (e.g., "income_mean").
- When using multiple break variables, grouping happens based on all combinations of these variables.
- For optimal performance with large datasets, consider using the sorting options.

## Implementation Details

The Aggregate Data feature is implemented with a focus on flexibility and performance:

1. **User Interface**:
   - The UI is divided into tabs: Variables and Options
   - The Variables tab allows selection of break variables and specification of aggregation variables with functions
   - The Options tab provides settings for handling large datasets

2. **Data Processing Flow**:
   - When the user clicks "OK", the specified break variables group the data
   - Aggregation functions are applied to the target variables within each group
   - New variables are created with appropriate naming conventions
   - Results are displayed in the dataset view

3. **Function Processing**:
   - Each aggregation function has specialized logic for different data types and edge cases
   - Missing value handling is consistent with statistical practices
   - Calculations maintain numerical precision where appropriate

4. **Performance Optimization**:
   - Efficient grouping algorithms minimize memory usage
   - Options for pre-sorted data improve performance for very large datasets
   - Background processing prevents UI freezes during computation

## Sample Test Data

To test the Aggregate Data feature, you can use the following sample dataset that includes different variable types and potential groupings:

```
ID,Department,Gender,Age,Salary,Performance
1,Sales,M,34,65000,4.2
2,Sales,F,29,62000,4.5
3,Marketing,M,45,70000,3.8
4,Marketing,F,39,68000,4.0
5,Sales,M,27,58000,3.9
6,IT,M,33,72000,4.3
7,IT,F,31,71000,4.4
8,Marketing,M,52,75000,3.7
9,Sales,F,36,63000,4.1
10,IT,M,41,78000,4.6
```

### Test Scenarios

1. **Department Summary**:
   - Break Variable: Department
   - Aggregated Variables: Salary (Mean), Performance (Mean)
   - Expected Result: Average salary and performance for each department

2. **Department-Gender Analysis**:
   - Break Variables: Department, Gender
   - Aggregated Variables: Salary (Mean), Count (N)
   - Expected Result: Average salary and count of employees for each department-gender combination

3. **Age-Based Statistics**:
   - Break Variable: Department
   - Aggregated Variables: Age (Min), Age (Max), Age (Mean)
   - Expected Result: Min, max and average age for each department

These examples demonstrate how to use the Aggregate Data feature for different analysis needs and validate the results. 