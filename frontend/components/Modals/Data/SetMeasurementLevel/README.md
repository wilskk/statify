# Set Measurement Level Modal - Advanced Variable Type Classification

Modal untuk setting dan managing measurement levels dalam Statify dengan intelligent classification, automated suggestions, dan comprehensive variable type management. Feature ini menyediakan streamlined variable categorization untuk statistical analysis preparation.

## 📁 Component Architecture

```
SetMeasurementLevel/
├── index.tsx                   # Main modal component
├── SetMeasurementLevelUI.tsx   # Main classification interface
├── SetMeasurementLevelTest.tsx # Classification testing
├── types.ts                    # TypeScript type definitions
├── README.md                   # Documentation
│
├── __tests__/                  # Test suite
│   ├── SetMeasurementLevel.test.tsx    # Main component tests
│   ├── useMeasurementLevel.test.ts     # Hook logic tests
│   ├── classificationService.test.ts   # Service function tests
│   └── README.md                       # Test documentation
│
├── hooks/                      # Business logic hooks
│   └── useSetMeasurementLevel.ts       # Core classification logic
│
└── services/                   # Business logic services
    └── classificationService.ts        # Measurement level algorithms
```

## 🎯 Core Functionality

### Measurement Level Types
```typescript
interface MeasurementLevelTypes {
  // Nominal (Categorical without order)
  nominal: {
    definition: 'Qualitative data without inherent order';
    characteristics: ['Categories', 'No mathematical operations', 'Equal/not equal only'];
    examples: ['Gender', 'City', 'Color', 'Marital Status'];
    statisticalOperations: NominalOperations;
  };
  
  // Ordinal (Categorical with order)
  ordinal: {
    definition: 'Qualitative data with meaningful order';
    characteristics: ['Ordered categories', 'Ranking possible', 'No equal intervals'];
    examples: ['Education Level', 'Satisfaction Rating', 'Grade', 'Agreement Scale'];
    statisticalOperations: OrdinalOperations;
  };
  
  // Scale (Continuous/Interval/Ratio)
  scale: {
    definition: 'Quantitative data with equal intervals';
    characteristics: ['Numerical values', 'All mathematical operations', 'Equal intervals'];
    examples: ['Age', 'Income', 'Temperature', 'Weight', 'Score'];
    statisticalOperations: ScaleOperations;
  };
  
  // Unknown (Unclassified)
  unknown: {
    definition: 'Variables with undetermined measurement level';
    characteristics: ['Pending classification', 'Limited analysis options', 'Requires user decision'];
    defaultBehavior: UnknownBehavior;
    classificationPriority: ClassificationPriority;
  };
}
```

### Classification Workflow
```typescript
interface ClassificationWorkflow {
  // Step 1: Variable discovery
  variableDiscovery: {
    scanUnknownVariables: () => UnknownVariable[];
    analyzeVariableProperties: (variable: Variable) => VariableAnalysis;
    generateClassificationSuggestions: (variable: Variable) => ClassificationSuggestion[];
    prioritizeVariables: (variables: Variable[]) => PrioritizedVariable[];
  };
  
  // Step 2: Classification assignment
  classificationAssignment: {
    availableVariables: Variable[];        // Variables with unknown measurement level
    nominalAssignments: Variable[];        // Variables assigned to nominal
    ordinalAssignments: Variable[];        // Variables assigned to ordinal
    scaleAssignments: Variable[];          // Variables assigned to scale
    pendingAssignments: PendingAssignment[]; // Variables pending classification
  };
  
  // Step 3: Validation and suggestions
  validationSuggestions: {
    validateAssignments: () => ValidationResult[];
    generateRecommendations: () => ClassificationRecommendation[];
    detectConflicts: () => ConflictDetection[];
    suggestOptimalClassification: () => OptimalClassification;
  };
  
  // Step 4: Execution and persistence
  executionPersistence: {
    applyClassifications: () => Promise<ClassificationResult>;
    validateChanges: () => ValidationResult;
    updateVariableStore: () => void;
    generateSummaryReport: () => ClassificationSummary;
  };
}
```

## 🤖 Intelligent Classification Engine

### Automated Analysis
```typescript
interface AutomatedAnalysis {
  // Data pattern analysis
  dataPatternAnalysis: {
    analyzeDataTypes: (values: any[]) => DataTypeAnalysis;
    detectPatterns: (values: any[]) => PatternDetection;
    calculateStatistics: (values: any[]) => DescriptiveStatistics;
    identifyOutliers: (values: any[]) => OutlierDetection;
  };
  
  // Categorical detection
  categoricalDetection: {
    uniqueValueCount: number;
    uniqueValueRatio: number;
    repeatingPatterns: RepeatingPattern[];
    textualContent: TextualContentAnalysis;
    
    isLikelyCategorical: (
      uniqueCount: number,
      totalCount: number,
      threshold: number
    ) => boolean;
    
    distinguishNominalOrdinal: (
      values: any[]
    ) => { type: 'nominal' | 'ordinal'; confidence: number };
  };
  
  // Numerical assessment
  numericalAssessment: {
    numericConversion: NumericConversionResult;
    continuityAssessment: ContinuityAssessment;
    scaleProperties: ScaleProperties;
    distributionAnalysis: DistributionAnalysis;
    
    assessNumericalNature: (values: any[]) => NumericalNatureResult;
    validateScaleRequirements: (values: any[]) => ScaleValidationResult;
  };
  
  // Intelligent suggestions
  intelligentSuggestions: {
    generateRecommendations: (
      variable: Variable,
      analysis: VariableAnalysis
    ) => ClassificationRecommendation[];
    
    calculateConfidenceScores: (
      variable: Variable,
      possibleTypes: MeasurementLevel[]
    ) => ConfidenceScore[];
    
    considerContextualFactors: (
      variable: Variable,
      datasetContext: DatasetContext
    ) => ContextualFactors;
    
    rankSuggestions: (
      suggestions: ClassificationSuggestion[]
    ) => RankedSuggestion[];
  };
}
```

### Classification Rules Engine
```typescript
interface ClassificationRulesEngine {
  // Rule definitions
  ruleDefinitions: {
    nominalRules: NominalClassificationRule[];
    ordinalRules: OrdinalClassificationRule[];
    scaleRules: ScaleClassificationRule[];
    exclusionRules: ExclusionRule[];
  };
  
  // Nominal classification rules
  nominalClassificationRules: {
    textualDataRule: {
      condition: 'Primarily text-based values';
      weight: 0.8;
      evaluate: (values: any[]) => boolean;
    };
    
    lowUniqueCountRule: {
      condition: 'Low unique value count relative to total';
      threshold: 0.1;
      weight: 0.7;
      evaluate: (values: any[]) => boolean;
    };
    
    irregularPatternRule: {
      condition: 'No discernible order in values';
      weight: 0.6;
      evaluate: (values: any[]) => boolean;
    };
    
    booleanLikeRule: {
      condition: 'Binary or boolean-like values';
      weight: 0.9;
      evaluate: (values: any[]) => boolean;
    };
  };
  
  // Ordinal classification rules
  ordinalClassificationRules: {
    rankedValuesRule: {
      condition: 'Values suggest natural ordering';
      patterns: ['first/second/third', 'low/medium/high', 'poor/good/excellent'];
      weight: 0.9;
      evaluate: (values: any[]) => boolean;
    };
    
    educationLevelRule: {
      condition: 'Educational level indicators';
      patterns: ['elementary', 'high school', 'bachelor', 'master', 'phd'];
      weight: 0.95;
      evaluate: (values: any[]) => boolean;
    };
    
    ratingScaleRule: {
      condition: 'Rating or likert scale patterns';
      patterns: ['strongly disagree', 'disagree', 'neutral', 'agree', 'strongly agree'];
      weight: 0.9;
      evaluate: (values: any[]) => boolean;
    };
    
    orderedNumericRule: {
      condition: 'Small set of ordered numeric values';
      weight: 0.7;
      evaluate: (values: any[]) => boolean;
    };
  };
  
  // Scale classification rules
  scaleClassificationRules: {
    continuousNumericRule: {
      condition: 'Continuous numeric values';
      weight: 0.9;
      evaluate: (values: any[]) => boolean;
    };
    
    highUniqueCountRule: {
      condition: 'High unique value count';
      threshold: 0.8;
      weight: 0.8;
      evaluate: (values: any[]) => boolean;
    };
    
    mathematicalOperationsRule: {
      condition: 'Values suitable for mathematical operations';
      weight: 0.85;
      evaluate: (values: any[]) => boolean;
    };
    
    measurementDataRule: {
      condition: 'Physical or quantitative measurements';
      patterns: ['age', 'weight', 'height', 'income', 'temperature', 'score'];
      weight: 0.9;
      evaluate: (values: any[]) => boolean;
    };
  };
  
  // Rule evaluation engine
  ruleEvaluationEngine: {
    evaluateAllRules: (
      variable: Variable,
      values: any[]
    ) => RuleEvaluationResult[];
    
    calculateOverallScore: (
      results: RuleEvaluationResult[],
      measurementLevel: MeasurementLevel
    ) => OverallScore;
    
    resolveConflicts: (
      conflictingResults: RuleEvaluationResult[]
    ) => ConflictResolution;
    
    generateExplanation: (
      results: RuleEvaluationResult[]
    ) => ClassificationExplanation;
  };
}
```

## 🔧 Hook Implementation

### useSetMeasurementLevel Hook
```typescript
interface UseSetMeasurementLevelHook {
  // Variable state management
  variableState: {
    availableVariables: Variable[];       // Variables with unknown measurement level
    nominalVariables: Variable[];         // Variables classified as nominal
    ordinalVariables: Variable[];         // Variables classified as ordinal
    scaleVariables: Variable[];           // Variables classified as scale
    originalState: OriginalState;         // State before any changes
  };
  
  // Classification suggestions
  classificationSuggestions: {
    suggestions: Map<string, ClassificationSuggestion[]>;
    generateSuggestions: (variable: Variable) => Promise<ClassificationSuggestion[]>;
    applySuggestion: (variableId: string, suggestion: ClassificationSuggestion) => void;
    refreshSuggestions: () => Promise<void>;
  };
  
  // Variable manipulation
  variableManipulation: {
    moveToNominal: (variables: Variable[]) => void;
    moveToOrdinal: (variables: Variable[]) => void;
    moveToScale: (variables: Variable[]) => void;
    moveToAvailable: (variables: Variable[]) => void;
    moveVariable: (variable: Variable, targetLevel: MeasurementLevel) => void;
    bulkMove: (variables: Variable[], targetLevel: MeasurementLevel) => void;
  };
  
  // Batch operations
  batchOperations: {
    selectAll: (sourceList: Variable[]) => void;
    selectNone: () => void;
    applyBulkSuggestions: () => void;
    classifyBySimilarity: (referenceVariable: Variable) => void;
    smartClassification: () => Promise<void>;
  };
  
  // Validation and quality control
  validationQualityControl: {
    validateClassifications: () => ValidationResult[];
    checkConsistency: () => ConsistencyReport;
    detectPotentialIssues: () => PotentialIssue[];
    generateQualityScore: () => QualityScore;
  };
  
  // State management
  stateManagement: {
    hasChanges: boolean;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    reset: () => void;
    saveChanges: () => Promise<void>;
    discardChanges: () => void;
  };
  
  // Analytics and reporting
  analyticsReporting: {
    getClassificationSummary: () => ClassificationSummary;
    generateReport: () => ClassificationReport;
    trackUserActions: (action: UserAction) => void;
    measurePerformance: () => PerformanceMetrics;
  };
}
```

### Classification Service
```typescript
interface ClassificationService {
  // Core analysis methods
  coreAnalysisMethods: {
    analyzeVariable: (variable: Variable) => Promise<VariableAnalysis>;
    generateSuggestions: (variable: Variable) => Promise<ClassificationSuggestion[]>;
    validateClassification: (variable: Variable, level: MeasurementLevel) => ValidationResult;
    optimizeClassifications: (variables: Variable[]) => OptimizationResult;
  };
  
  // Pattern recognition
  patternRecognition: {
    detectTextualPatterns: (values: string[]) => TextualPattern[];
    detectNumericalPatterns: (values: number[]) => NumericalPattern[];
    detectTemporalPatterns: (values: any[]) => TemporalPattern[];
    detectCategoricalPatterns: (values: any[]) => CategoricalPattern[];
  };
  
  // Statistical analysis
  statisticalAnalysis: {
    calculateDescriptiveStats: (values: number[]) => DescriptiveStatistics;
    assessDistribution: (values: number[]) => DistributionAssessment;
    detectOutliers: (values: number[]) => OutlierDetection;
    measureVariability: (values: any[]) => VariabilityMeasures;
  };
  
  // Machine learning features
  machineLearningFeatures: {
    trainClassificationModel: (
      trainingData: TrainingData[]
    ) => Promise<ClassificationModel>;
    
    predictMeasurementLevel: (
      model: ClassificationModel,
      variable: Variable
    ) => Promise<PredictionResult>;
    
    improveModel: (
      model: ClassificationModel,
      feedback: UserFeedback[]
    ) => Promise<ImprovedModel>;
    
    extractFeatures: (variable: Variable) => FeatureVector;
  };
  
  // Quality assurance
  qualityAssurance: {
    validateClassificationConsistency: (
      classifications: VariableClassification[]
    ) => ConsistencyReport;
    
    detectAnomalies: (
      classifications: VariableClassification[]
    ) => AnomalyReport;
    
    generateQualityMetrics: (
      classifications: VariableClassification[]
    ) => QualityMetrics;
    
    recommendImprovements: (
      qualityReport: QualityReport
    ) => ImprovementRecommendation[];
  };
}
```

## 🎨 UI Components

### SetMeasurementLevelUI Component
```typescript
interface SetMeasurementLevelUIProps {
  // Variable lists
  variableLists: {
    available: Variable[];
    nominal: Variable[];
    ordinal: Variable[];
    scale: Variable[];
  };
  
  // Variable selection
  variableSelection: {
    selectedVariables: Set<string>;
    onVariableSelect: (variableId: string, selected: boolean) => void;
    onSelectAll: (listType: ListType) => void;
    onSelectNone: () => void;
  };
  
  // Variable movement
  variableMovement: {
    onMoveToNominal: (variables: Variable[]) => void;
    onMoveToOrdinal: (variables: Variable[]) => void;
    onMoveToScale: (variables: Variable[]) => void;
    onMoveToAvailable: (variables: Variable[]) => void;
    onBulkMove: (variables: Variable[], targetLevel: MeasurementLevel) => void;
  };
  
  // Suggestions
  suggestions: {
    suggestionMap: Map<string, ClassificationSuggestion[]>;
    onApplySuggestion: (variableId: string, suggestion: ClassificationSuggestion) => void;
    onRefreshSuggestions: () => void;
    showSuggestions: boolean;
    onToggleSuggestions: () => void;
  };
  
  // Validation
  validation: {
    validationResults: ValidationResult[];
    qualityScore: QualityScore;
    potentialIssues: PotentialIssue[];
    showValidation: boolean;
  };
  
  // Actions
  actions: {
    onSave: () => void;
    onCancel: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onSmartClassification: () => void;
  };
  
  // State indicators
  stateIndicators: {
    hasChanges: boolean;
    canUndo: boolean;
    canRedo: boolean;
    isProcessing: boolean;
    processingProgress: ProcessingProgress;
  };
}
```

### SetMeasurementLevelTest Component
```typescript
interface SetMeasurementLevelTestProps {
  // Test scenarios
  testScenarios: TestScenario[];
  selectedScenario: TestScenario;
  onScenarioSelect: (scenario: TestScenario) => void;
  
  // Test data
  testData: {
    variables: TestVariable[];
    expectedClassifications: ExpectedClassification[];
    actualClassifications: ActualClassification[];
  };
  
  // Test execution
  testExecution: {
    onRunTest: () => void;
    onRunAllTests: () => void;
    onRunBenchmark: () => void;
    testResults: TestResult[];
  };
  
  // Performance metrics
  performanceMetrics: {
    classificationAccuracy: AccuracyMetrics;
    processingTime: TimeMetrics;
    memoryUsage: MemoryMetrics;
    userSatisfaction: SatisfactionMetrics;
  };
  
  // Algorithm testing
  algorithmTesting: {
    testPatternRecognition: () => void;
    testRuleEngine: () => void;
    testMachineLearning: () => void;
    algorithmComparison: AlgorithmComparison;
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Classification testing
describe('SetMeasurementLevelModal', () => {
  describe('Automatic classification', () => {
    it('correctly identifies nominal variables');
    it('distinguishes ordinal from nominal');
    it('recognizes scale variables');
    it('handles ambiguous cases appropriately');
  });
  
  describe('Pattern recognition', () => {
    it('detects textual patterns for nominal');
    it('identifies ordered patterns for ordinal');
    it('recognizes numerical patterns for scale');
    it('handles mixed data types');
  });
  
  describe('User interaction', () => {
    it('moves variables between categories correctly');
    it('applies suggestions accurately');
    it('validates user classifications');
    it('maintains state consistency');
  });
  
  describe('Quality assurance', () => {
    it('detects classification inconsistencies');
    it('provides helpful suggestions');
    it('validates final classifications');
    it('generates quality reports');
  });
  
  describe('Performance', () => {
    it('handles large numbers of variables efficiently');
    it('provides real-time feedback');
    it('optimizes suggestion generation');
    it('manages memory usage effectively');
  });
});

// Service testing
describe('classificationService', () => {
  describe('Analysis algorithms', () => {
    it('analyzes variable properties correctly');
    it('generates accurate suggestions');
    it('validates classifications properly');
    it('optimizes classification decisions');
  });
  
  describe('Pattern recognition', () => {
    it('detects patterns accurately');
    it('handles edge cases gracefully');
    it('provides confidence scores');
    it('explains recognition logic');
  });
});
```

## 📋 Development Guidelines

### Adding New Classification Rules
```typescript
// 1. Define new rule interface
interface NewClassificationRule extends ClassificationRule {
  id: 'newRule';
  name: 'New Classification Rule';
  description: 'Description of classification rule';
  targetLevel: MeasurementLevel;
  weight: number;
  conditions: RuleCondition[];
}

// 2. Implement rule logic
const newRuleImplementation = {
  evaluate: (variable: Variable, values: any[]): RuleEvaluationResult => {
    // Rule evaluation logic
  },
  
  getConfidence: (variable: Variable, values: any[]): number => {
    // Confidence calculation
  },
  
  explain: (variable: Variable, values: any[]): string => {
    // Explanation of rule application
  }
};

// 3. Register rule
const CLASSIFICATION_RULES = {
  ...existingRules,
  newRule: newRuleImplementation
};

// 4. Add comprehensive tests
describe('New Classification Rule', () => {
  it('evaluates conditions correctly');
  it('provides accurate confidence scores');
  it('handles edge cases appropriately');
  it('generates clear explanations');
});
```

### Enhancing Suggestion Algorithm
```typescript
// 1. Define enhancement interface
interface SuggestionAlgorithmEnhancement {
  enhancementType: 'pattern' | 'ml' | 'context' | 'user_feedback';
  implementation: EnhancementImplementation;
  validationMethod: ValidationMethod;
  performanceMetrics: PerformanceMetric[];
}

// 2. Implement enhancement logic
const enhancementImplementation: EnhancementImplementation = {
  enhance: (
    currentSuggestions: ClassificationSuggestion[],
    context: EnhancementContext
  ): EnhancedSuggestion[] => {
    // Enhancement logic
  },
  
  validate: (
    enhancedSuggestions: EnhancedSuggestion[]
  ): ValidationResult => {
    // Validation logic
  }
};

// 3. Integration with existing system
const SUGGESTION_ENHANCEMENTS = {
  ...existingEnhancements,
  newEnhancement: enhancementImplementation
};

// 4. Performance testing
describe('Suggestion Algorithm Enhancement', () => {
  it('improves suggestion accuracy');
  it('maintains or improves performance');
  it('handles diverse data types');
  it('provides explainable recommendations');
});
```

---

SetMeasurementLevel modal menyediakan intelligent variable classification system dengan automated analysis, pattern recognition, dan comprehensive measurement level assignment untuk optimal statistical analysis preparation dalam Statify.
-   **`SetMeasurementLevelUI.tsx`**: Komponen presentasi yang murni menampilkan UI. Menggunakan komponen `VariableListManager` untuk menangani logika perpindahan variabel.
