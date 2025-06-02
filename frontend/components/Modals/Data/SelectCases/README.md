# Select Cases Implementation

This folder contains the implementation of SPSS-style "Select Cases" functionality for filtering data based on various criteria.

## Structure

- `services/`: Contains core logic for selecting cases
  - `evaluator.ts`: Logic for evaluating condition expressions
  - `selectors.ts`: Functions for different types of case selection
  - `index.ts`: Exports all services

- `hooks/`: React hooks
  - `useSelectCases.ts`: Original hook for the SelectCases UI component
  - `useSelectCasesLogic.ts`: Hook that provides case selection functionality

- `dialogs/`: UI dialogs for different selection methods
  - `SelectCasesIfCondition.tsx`: Dialog for condition-based filtering
  - `SelectCasesRandomSample.tsx`: Dialog for random sampling
  - `SelectCasesRange.tsx`: Dialog for range-based selection

## How to Use

### In the SelectCases Component

Update the `handleConfirm` method in the existing `useSelectCases.ts` hook:

```tsx
import { useSelectCasesLogic } from "./hooks/useSelectCasesLogic";

const {
  applyConditionFilter,
  applyRandomSampleFilter,
  applyRangeFilter,
  applyVariableFilter,
  selectAllCases,
  deleteUnselectedCases,
  error,
  clearError
} = useSelectCasesLogic();

const handleConfirm = async () => {
  let success = false;
  
  if (selectOption === "all") {
    success = await selectAllCases();
  } else if (selectOption === "condition") {
    success = await applyConditionFilter(conditionExpression);
  } else if (selectOption === "random") {
    success = await applyRandomSampleFilter(randomSampleConfig);
  } else if (selectOption === "time") {
    success = await applyRangeFilter(rangeConfig);
  } else if (selectOption === "variable") {
    success = await applyVariableFilter(filterVariable);
  }
  
  if (success && outputOption === "delete") {
    await deleteUnselectedCases();
  }
  
  if (success) {
    closeModal();
  }
};
```

### Direct Usage of Services

```tsx
import { 
  selectByCondition, 
  selectRandomSample,
  type RandomSampleConfig 
} from "./services";
import { Variable } from "@/types/Variable";

// Example data and variables
const data = [ /* your data rows */ ];
const variables = [ /* your variables */ ];

// Using condition selector
const selectedIndices = selectByCondition(data, variables, "age > 25");

// Using random sample selector
const config: RandomSampleConfig = {
  sampleType: "approximate",
  percentage: 10
};
const randomSampleIndices = selectRandomSample(data, config);
```

## Available Functions

### Condition Filtering

- `applyConditionFilter(expression: string): Promise<boolean>`
  - Applies a filter based on a logical expression
  - Example: `"age > 25 & gender == 'F'"`
  - Supports comparison operators: `>`, `<`, `>=`, `<=`, `==`, `!=`
  - Supports logical operators: `&` (AND), `|` (OR), `~` (NOT)

### Random Sampling

- `applyRandomSampleFilter(config: RandomSampleConfig): Promise<boolean>`
  - Selects a random sample of cases
  - Config options:
    - `sampleType`: "approximate" (percentage) or "exact" (count)
    - `percentage`: For approximate sampling, percentage of cases to select
    - `exactCount`: For exact sampling, number of cases to select
    - `fromFirstCount`: For exact sampling, select from first n cases

### Range Selection

- `applyRangeFilter(range: RangeConfig): Promise<boolean>`
  - Selects cases based on their position in the dataset
  - Range options:
    - `firstCase`: Starting case (1-based index)
    - `lastCase`: Ending case (1-based index)

### Variable-Based Filtering

- `applyVariableFilter(filterVar: Variable): Promise<boolean>`
  - Selects cases where a specific variable has non-zero/non-empty values

### Other Operations

- `selectAllCases(): Promise<boolean>` - Selects all cases
- `deleteUnselectedCases(): Promise<boolean>` - Deletes cases that aren't selected

## Supported Functions in Expressions

The expression evaluator supports many functions including:

### Math Functions
- `ABS(x)` - Absolute value
- `SQRT(x)` - Square root
- `ROUND(x)` - Round to nearest integer
- `MAX(x, y, ...)` - Maximum value
- `MIN(x, y, ...)` - Minimum value
- `SUM(x, y, ...)` - Sum of values
- `POW(x, y)` - Power

### Statistical Functions
- `MEAN(x, y, ...)` - Average of values
- `MISSING(var)` - Check if a variable is missing

### Text Functions
- `CONCAT(str1, str2)` - Concatenate strings
- `LENGTH(text)` - Get length of text
- `LOWER(text)` - Convert to lowercase
- `UPPER(text)` - Convert to uppercase 