# Define DateTime Modal - Time Series Variable Creation

Modal untuk defining date/time structures dan creating time-based variables dalam Statify. Feature ini memungkinkan users untuk establish chronological frameworks untuk time-series data analysis dengan automated variable generation.

## 📁 Component Architecture

```
DefineDateTime/
├── index.tsx                   # Main modal component
├── types.ts                    # TypeScript type definitions
├── README.md                   # Documentation
│
├── __tests__/                  # Test suite
│   ├── DefineDateTime.test.tsx     # Main component tests
│   ├── useDefineDateTime.test.ts   # Hook logic tests
│   ├── dateTimeService.test.ts     # Service function tests
│   ├── dateTimeFormatters.test.ts  # Utility function tests
│   └── README.md                   # Test documentation
│
├── hooks/                      # Business logic hooks
│   └── useDefineDateTime.ts        # Core datetime logic
│
├── services/                   # Business logic services
│   └── dateTimeService.ts          # Variable creation service
│
└── utils/                      # Utility functions
    └── dateTimeFormatters.ts       # Date formatting utilities
```

## 🎯 Core Functionality

### DateTime Variable Creation Workflow
```typescript
interface DateTimeWorkflow {
  // Step 1: Format selection
  formatSelection: {
    timeComponents: TimeComponent[];     // Selected components (year, month, day, etc.)
    formatString: string;               // Display format (e.g., "Years, months, days")
    periodicity: TimePeriodicity;       // Data frequency (daily, monthly, etc.)
    startingPoint: StartingPoint;       // First case definition
  };
  
  // Step 2: Variable planning
  variablePlanning: {
    componentVariables: ComponentVar[]; // Individual time component variables
    dateStringVariable: DateStringVar;  // Formatted date display variable
    metadataStorage: MetadataConfig;    // Format configuration storage
    namingConventions: NamingRules;     // Variable naming patterns
  };
  
  // Step 3: Data generation
  dataGeneration: {
    sequentialGeneration: DataSequencer; // Sequential date progression
    sampleDataCreation: SampleCreator;   // First 20 rows population
    carryOverLogic: CarryOverHandler;    // Month->Year progression logic
    boundaryHandling: BoundaryHandler;   // Date range boundaries
  };
  
  // Step 4: Integration
  integration: {
    variableCreation: VariableCreator;  // Add to variable store
    dataPopulation: DataPopulator;      // Update data store
    metadataUpdate: MetadataUpdater;    // Store format configuration
  };
}
```

## 📅 Time Component System

### Available Time Components
```typescript
interface TimeComponents {
  // Temporal hierarchy
  temporalHierarchy: {
    year: {
      variableName: 'YEAR_';
      dataType: 'numeric';
      range: [1900, 2100];
      increment: 1;
    };
    quarter: {
      variableName: 'QUARTER_';
      dataType: 'numeric';
      range: [1, 4];
      carryOver: 'year';
    };
    month: {
      variableName: 'MONTH_';
      dataType: 'numeric';
      range: [1, 12];
      carryOver: 'year';
    };
    week: {
      variableName: 'WEEK_';
      dataType: 'numeric';
      range: [1, 53];
      carryOver: 'year';
    };
    day: {
      variableName: 'DAY_';
      dataType: 'numeric';
      range: [1, 31];
      carryOver: 'month';
    };
    hour: {
      variableName: 'HOUR_';
      dataType: 'numeric';
      range: [0, 23];
      carryOver: 'day';
    };
    minute: {
      variableName: 'MINUTE_';
      dataType: 'numeric';
      range: [0, 59];
      carryOver: 'hour';
    };
    second: {
      variableName: 'SECOND_';
      dataType: 'numeric';
      range: [0, 59];
      carryOver: 'minute';
    };
  };
  
  // Formatted date variable
  dateStringVariable: {
    variableName: 'DATE_';
    dataType: 'string';
    format: 'composite';
    content: 'formatted display string';
  };
}
```

### Time Progression Logic
```typescript
interface TimeProgressionLogic {
  // Carry-over rules
  carryOverRules: {
    month: {
      maxValue: 12;
      carryTo: 'year';
      resetValue: 1;
      incrementCarryTarget: 1;
    };
    day: {
      maxValue: 'daysInMonth';  // Dynamic based on month/year
      carryTo: 'month';
      resetValue: 1;
      incrementCarryTarget: 1;
    };
    hour: {
      maxValue: 23;
      carryTo: 'day';
      resetValue: 0;
      incrementCarryTarget: 1;
    };
    minute: {
      maxValue: 59;
      carryTo: 'hour';
      resetValue: 0;
      incrementCarryTarget: 1;
    };
  };
  
  // Progression calculation
  progressionCalculation: {
    calculateNextPeriod: (current: TimeValues, components: TimeComponent[]) => TimeValues;
    validateDateBoundaries: (timeValues: TimeValues) => ValidationResult;
    handleLeapYears: (year: number, month: number, day: number) => number;
    generateSequence: (start: TimeValues, count: number) => TimeValues[];
  };
}
```

## 🔧 Hook Implementation

### useDefineDateTime Hook
```typescript
interface UseDefineDateTimeHook {
  // State management
  state: {
    selectedComponents: TimeComponent[];
    startingValues: TimeValues;
    formatString: string;
    previewData: PreviewRow[];
    validationErrors: ValidationError[];
  };
  
  // Component selection
  componentSelection: {
    availableFormats: DateTimeFormat[];
    selectFormat: (format: DateTimeFormat) => void;
    customizeComponents: (components: TimeComponent[]) => void;
    validateSelection: () => ValidationResult;
  };
  
  // Starting point configuration
  startingPointConfig: {
    setStartingYear: (year: number) => void;
    setStartingMonth: (month: number) => void;
    setStartingDay: (day: number) => void;
    setStartingHour: (hour: number) => void;
    setStartingMinute: (minute: number) => void;
    validateStartingPoint: () => ValidationResult;
  };
  
  // Preview generation
  previewGeneration: {
    generatePreview: () => PreviewRow[];
    updatePreview: () => void;
    previewCount: number;
    showPreview: boolean;
  };
  
  // Execution
  execution: {
    createDateTimeVariables: () => Promise<CreationResult>;
    validateConfiguration: () => ValidationResult;
    resetConfiguration: () => void;
    cancelCreation: () => void;
  };
}
```

### Date Time Service
```typescript
interface DateTimeService {
  // Variable preparation
  variablePreparation: {
    prepareComponentVariables: (components: TimeComponent[]) => VariableDefinition[];
    prepareDateStringVariable: (format: string) => VariableDefinition;
    validateVariableNames: (variables: VariableDefinition[], existing: Variable[]) => ValidationResult;
    generateUniqueNames: (variables: VariableDefinition[], existing: Variable[]) => VariableDefinition[];
  };
  
  // Data generation
  dataGeneration: {
    generateSequentialData: (
      components: TimeComponent[],
      startingValues: TimeValues,
      rowCount: number
    ) => CellUpdate[];
    generateDateStrings: (
      timeValues: TimeValues[],
      format: string
    ) => string[];
    populateSampleRows: (
      variables: VariableDefinition[],
      data: any[][],
      rowCount: number
    ) => CellUpdate[];
  };
  
  // Metadata management
  metadataManagement: {
    createFormatMetadata: (format: DateTimeFormat, components: TimeComponent[]) => FormatMetadata;
    storeConfiguration: (metadata: FormatMetadata) => void;
    retrieveConfiguration: () => FormatMetadata | null;
    validateConfiguration: (metadata: FormatMetadata) => ValidationResult;
  };
}
```

## 📊 Date Format Examples

### Example Configurations
```typescript
interface DateFormatExamples {
  // Years and months
  yearsMonths: {
    components: ['year', 'month'];
    variables: ['YEAR_', 'MONTH_', 'DATE_'];
    sampleData: [
      { YEAR_: 2024, MONTH_: 1, DATE_: '2024 Jan' },
      { YEAR_: 2024, MONTH_: 2, DATE_: '2024 Feb' },
      { YEAR_: 2024, MONTH_: 3, DATE_: '2024 Mar' }
    ];
    carryOverExample: 'Month 12 → Month 1, Year + 1';
  };
  
  // Days, hours, minutes
  daysHoursMinutes: {
    components: ['day', 'hour', 'minute'];
    variables: ['DAY_', 'HOUR_', 'MINUTE_', 'DATE_'];
    sampleData: [
      { DAY_: 1, HOUR_: 0, MINUTE_: 0, DATE_: 'Day 1, 00:00' },
      { DAY_: 1, HOUR_: 0, MINUTE_: 1, DATE_: 'Day 1, 00:01' },
      { DAY_: 1, HOUR_: 0, MINUTE_: 2, DATE_: 'Day 1, 00:02' }
    ];
    carryOverExample: 'Minute 59 → Minute 0, Hour + 1';
  };
  
  // Weeks and days
  weeksDays: {
    components: ['week', 'day'];
    variables: ['WEEK_', 'DAY_', 'DATE_'];
    sampleData: [
      { WEEK_: 1, DAY_: 1, DATE_: 'Week 1, Day 1' },
      { WEEK_: 1, DAY_: 2, DATE_: 'Week 1, Day 2' },
      { WEEK_: 1, DAY_: 7, DATE_: 'Week 1, Day 7' }
    ];
    carryOverExample: 'Day 7 → Day 1, Week + 1';
  };
}
```

### Carry-Over Logic Implementation
```typescript
interface CarryOverImplementation {
  // Progression calculator
  progressionCalculator: {
    calculateNext: (current: TimeValues, components: TimeComponent[]) => TimeValues;
    handleCarryOver: (component: TimeComponent, value: number, timeValues: TimeValues) => TimeValues;
    validateBounds: (component: TimeComponent, value: number, context: TimeValues) => boolean;
    resetDependentComponents: (carryComponent: TimeComponent, timeValues: TimeValues) => TimeValues;
  };
  
  // Specific carry-over handlers
  carryOverHandlers: {
    monthToYear: (month: number, year: number) => { month: number; year: number };
    dayToMonth: (day: number, month: number, year: number) => { day: number; month: number; year: number };
    hourToDay: (hour: number, day: number) => { hour: number; day: number };
    minuteToHour: (minute: number, hour: number) => { minute: number; hour: number };
    secondToMinute: (second: number, minute: number) => { second: number; minute: number };
  };
  
  // Boundary validation
  boundaryValidation: {
    validateDateExists: (year: number, month: number, day: number) => boolean;
    getDaysInMonth: (year: number, month: number) => number;
    isLeapYear: (year: number) => boolean;
    validateTimeRange: (hour: number, minute: number, second: number) => boolean;
  };
}
```

## 🎨 UI Components

### Format Selection Interface
```typescript
interface FormatSelectionUI {
  // Predefined formats
  predefinedFormats: {
    displayFormats: DateTimeFormat[];
    formatDescriptions: Map<string, string>;
    examplePreviews: Map<string, string[]>;
    popularFormats: string[];
  };
  
  // Custom format builder
  customFormatBuilder: {
    availableComponents: TimeComponent[];
    selectedComponents: TimeComponent[];
    componentSelector: ComponentSelector;
    formatPreview: FormatPreview;
  };
  
  // Starting point configuration
  startingPointConfig: {
    yearInput: NumberInput;
    monthSelector: DropdownSelector;
    dayInput: NumberInput;
    hourInput: NumberInput;
    minuteInput: NumberInput;
    secondInput: NumberInput;
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Component testing
describe('DefineDateTimeModal', () => {
  describe('Format selection', () => {
    it('displays available formats');
    it('updates components on format selection');
    it('validates format selection');
    it('shows preview data');
  });
  
  describe('Starting point configuration', () => {
    it('accepts starting values');
    it('validates date boundaries');
    it('handles leap years correctly');
    it('updates preview on changes');
  });
  
  describe('Variable creation', () => {
    it('creates component variables');
    it('creates date string variable');
    it('populates sample data');
    it('updates metadata');
  });
});

// Service testing
describe('dateTimeService', () => {
  describe('Variable preparation', () => {
    it('prepares component variables correctly');
    it('generates unique variable names');
    it('validates against existing variables');
  });
  
  describe('Data generation', () => {
    it('generates sequential data correctly');
    it('handles carry-over logic properly');
    it('formats date strings correctly');
    it('respects date boundaries');
  });
});

// Utility testing
describe('dateTimeFormatters', () => {
  describe('Format parsing', () => {
    it('parses format strings correctly');
    it('extracts components properly');
    it('validates format syntax');
  });
  
  describe('Date formatting', () => {
    it('formats dates correctly');
    it('handles different locales');
    it('manages missing components');
  });
});
```

## 📋 Development Guidelines

### Adding New Time Components
```typescript
// 1. Define component specification
interface NewTimeComponent extends TimeComponent {
  id: 'custom_component';
  name: 'Custom Component';
  variableName: 'CUSTOM_';
  dataType: 'numeric' | 'string';
  range: [minValue, maxValue];
  carryOver?: 'parent_component';
  increment: number;
}

// 2. Implement progression logic
const handleCustomComponentCarryOver = (
  value: number,
  timeValues: TimeValues
): TimeValues => {
  if (value > maxValue) {
    return {
      ...timeValues,
      custom_component: minValue,
      parent_component: timeValues.parent_component + 1
    };
  }
  return { ...timeValues, custom_component: value };
};

// 3. Add formatting support
const formatCustomComponent = (value: number): string => {
  return `Custom ${value}`;
};

// 4. Register component
const TIME_COMPONENTS = {
  ...existingComponents,
  custom_component: {
    handler: handleCustomComponentCarryOver,
    formatter: formatCustomComponent,
    validator: validateCustomComponent
  }
};
```

### Performance Optimization
```typescript
// 1. Efficient data generation
const optimizeDataGeneration = (
  components: TimeComponent[],
  rowCount: number
) => {
  // Pre-calculate progression patterns
  const progressionPattern = calculateProgressionPattern(components);
  
  // Batch generate data
  const data = new Array(rowCount);
  for (let i = 0; i < rowCount; i++) {
    data[i] = applyProgressionPattern(progressionPattern, i);
  }
  
  return data;
};

// 2. Memory-efficient updates
const batchUpdateCells = (
  updates: CellUpdate[],
  batchSize: number = 1000
) => {
  const batches = chunk(updates, batchSize);
  
  return batches.reduce(async (promise, batch) => {
    await promise;
    return updateCellsBatch(batch);
  }, Promise.resolve());
};
```

---

DefineDateTime modal menyediakan comprehensive time series variable creation dengan automated progression logic dan flexible formatting options untuk temporal data analysis dalam Statify.

-   **User Selection**: `Years, months`
-   **First Case Input**: `Year: 2022`, `Month: 11`
-   **Resulting New Variables**:
    -   `YEAR_` (Numeric, Label: 'YEAR, not periodic')
    -   `MONTH_` (Numeric, Label: 'MONTH, period 12')
    -   `DATE_` (String, Label: 'Date. Format: YYYY-MM')
-   **Generated Data**:

| Case | YEAR_ | MONTH_ | DATE_ |
| :--- | :---- | :----- | :------ |
| 1 | 2022 | 11 | `2022-11` |
| 2 | 2022 | 12 | `2022-12` |
| 3 | 2023 | 1 | `2023-01` |
| 4 | 2023 | 2 | `2023-02` |

### Example 2: Weeks and Work Days

This example demonstrates periodicity with a 5-day work week.

-   **User Selection**: `Weeks, work days(5)`
-   **First Case Input**: `Week: 51`, `Work day: 4`
-   **Resulting New Variables**:
    -   `WEEK_` (Numeric, Label: 'WEEK, not periodic')
    -   `WORK DAY_` (Numeric, Label: 'WORK DAY, period 5')
    -   `DATE_` (String, Label: 'Date. Format: WW-D')
-   **Generated Data**:

| Case | WEEK_ | WORK DAY_ | DATE_ |
| :--- | :---- | :-------- | :------ |
| 1 | 51 | 4 | `W51 4` |
| 2 | 51 | 5 | `W51 5` |
| 3 | 52 | 1 | `W52 1` |
| 4 | 52 | 2 | `W52 2` |

### Example 3: Days and Time

This example demonstrates carry-over across multiple time units (minute → hour → day).

-   **User Selection**: `Days, hours, minutes`
-   **First Case Input**: `Day: 364`, `Hour: 23`, `Minute: 58`
-   **Resulting New Variables**:
    -   `DAY_` (Numeric, Label: 'DAY, not periodic')
    -   `HOUR_` (Numeric, Label: 'HOUR, period 24')
    -   `MINUTE_` (Numeric, Label: 'MINUTE, period 60')
    -   `DATE_` (String, Label: 'Date. Format: DD HH:MM')
-   **Generated Data**:

| Case | DAY_ | HOUR_ | MINUTE_ | DATE_ |
| :--- | :--- | :---- | :------ | :------------ |
| 1 | 364 | 23 | 58 | `364 23:58` |
| 2 | 364 | 23 | 59 | `364 23:59` |
| 3 | 365 | 0 | 0 | `365 00:00` |
| 4 | 365 | 0 | 1 | `365 00:01` |

## 5. Implemented Features

The following list contains all currently supported formats that can be selected in the "Cases Are" list. Each option generates the corresponding time component variables and a formatted `DATE_` variable.

-   `Years`
-   `Years, quarters`
-   `Years, months`
-   `Years, quarters, months`
-   `Days`
-   `Weeks, days`
-   `Weeks, work days(5)`
-   `Weeks, work days(6)`
-   `Hours`
-   `Days, hours`
-   `Days, work hour(8)`
-   `Weeks, days, hours`
-   `Weeks, work days, hours`
-   `Minutes`
-   `Hours, minutes`
-   `Days, hours, minutes`
-   `Seconds`
-   `Minutes, seconds`
-   `Hours, minutes, seconds`
-   `Not dated` (Clears any existing date definition)

## 6. Future Enhancements (Not Implemented)

The following features are planned for future releases to enhance time-series capabilities:

-   **Date Parsing**: Ability to parse date/time information from existing string variables to create the component numeric variables.
-   **Custom Cycles**: Allow users to define custom periodicities for components (e.g., a 4-day work week or a custom fiscal year).
-   **Irregular Time Series**: Support for datasets where the time interval between cases is not constant.
-   **Date-based Functions**: Integration with other features to allow for date-based calculations (e.g., `DATE_DIFF`, `DATE_ADD`). 