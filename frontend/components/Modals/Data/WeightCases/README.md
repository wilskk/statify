# Weight Cases Modal - Advanced Case Weighting and Survey Data Analysis

Modal untuk applying case weights dalam Statify dengan comprehensive weighting strategies, statistical adjustment methods, dan flexible weight management. Feature ini menyediakan powerful survey data analysis capabilities dengan proper statistical weighting implementation.

## 📁 Component Architecture

```
WeightCases/
├── index.tsx                   # Main modal component
├── WeightCasesUI.tsx          # Main weighting interface
├── WeightCasesTest.tsx        # Weighting testing
├── types.ts                   # TypeScript type definitions
├── README.md                  # Documentation
│
├── __tests__/                 # Test suite
│   ├── WeightCases.test.tsx       # Main component tests
│   ├── useWeightCases.test.ts     # Hook logic tests
│   ├── weightingService.test.ts   # Service function tests
│   └── README.md                  # Test documentation
│
├── hooks/                     # Business logic hooks
│   └── useWeightCases.ts          # Core weighting logic
│
└── services/                  # Business logic services
    └── weightingService.ts        # Weight calculation and validation algorithms
```

## 🎯 Core Functionality

### Weighting Methods
```typescript
interface WeightingMethods {
  // Frequency weighting
  frequencyWeighting: {
    purpose: 'Weight cases by frequency values';
    application: 'Survey data, population representation';
    implementation: FrequencyWeighter;
    constraints: ['Non-negative values', 'Numeric variables only'];
  };
  
  // Probability weighting
  probabilityWeighting: {
    purpose: 'Weight cases by selection probability';
    application: 'Complex survey designs, stratified sampling';
    implementation: ProbabilityWeighter;
    constraints: ['Values between 0 and 1', 'Sum constraints'];
  };
  
  // Design weighting
  designWeighting: {
    purpose: 'Weight cases based on sampling design';
    application: 'Multi-stage sampling, cluster sampling';
    implementation: DesignWeighter;
    calculations: DesignWeightCalculator;
  };
  
  // Post-stratification weighting
  postStratificationWeighting: {
    purpose: 'Adjust weights for population alignment';
    application: 'Demographic adjustment, calibration';
    implementation: PostStratificationWeighter;
    calibrationMethods: CalibrationMethod[];
  };
}
```

### Weight Configuration
```typescript
interface WeightConfiguration {
  // Basic weight settings
  basicWeightSettings: {
    weightVariable: Variable;               // Variable containing weight values
    weightType: WeightType;                // Type of weighting applied
    weightValidation: WeightValidator;      // Validation rules for weights
    missingValueHandling: MissingWeightStrategy; // Handle missing weight values
  };
  
  // Advanced weight options
  advancedWeightOptions: {
    weightNormalization: WeightNormalization; // Normalization method
    weightTrimming: WeightTrimming;         // Trimming extreme weights
    weightCalibration: WeightCalibration;   // Calibration to known totals
    varianceEstimation: VarianceEstimation; // Variance estimation method
  };
  
  // Weight quality control
  weightQualityControl: {
    weightDistributionAnalysis: WeightDistributionAnalyzer;
    effectivenessMeasures: EffectivenessMeasure[];
    designEffectCalculation: DesignEffectCalculator;
    weightingEfficiencyMetrics: EfficiencyMetric[];
  };
  
  // Statistical adjustment
  statisticalAdjustment: {
    biasCorrection: BiasCorrector;          // Correction for selection bias
    nonResponseAdjustment: NonResponseAdjuster; // Adjust for non-response
    populationAlignment: PopulationAligner; // Align with population parameters
    calibrationWeighting: CalibrationWeighter; // Calibrate to known margins
  };
}
```

## 📊 Weight Management and Analysis

### Weight Validation and Quality Control
```typescript
interface WeightValidationQualityControl {
  // Weight value validation
  weightValueValidation: {
    rangeValidation: {
      minimumValue: number;               // Minimum acceptable weight value
      maximumValue: number;               // Maximum acceptable weight value
      validateRange: RangeValidator;      // Range validation function
      handleOutOfRange: OutOfRangeHandler; // Handle values outside valid range
    };
    
    distributionValidation: {
      checkSkewness: SkewnessChecker;     // Check weight distribution skewness
      detectOutliers: OutlierDetector;    // Detect extreme weight values
      assessVariability: VariabilityAssessor; // Assess weight variability
      flagSuspiciousValues: SuspiciousValueFlagger; // Flag potentially problematic weights
    };
    
    logicalValidation: {
      checkConsistency: ConsistencyChecker; // Check weight consistency
      validateSum: SumValidator;          // Validate weight sum constraints
      crossValidateWeights: CrossValidator; // Cross-validate with other variables
      detectAnomalies: AnomalyDetector;   // Detect anomalous weight patterns
    };
  };
  
  // Weight effectiveness assessment
  weightEffectivenessAssessment: {
    designEffect: {
      calculate: (weights: number[]) => number;
      interpretation: DesignEffectInterpreter;
      benchmarks: DesignEffectBenchmark[];
      recommendations: DesignEffectRecommendation[];
    };
    
    effectiveSampleSize: {
      calculate: (weights: number[]) => number;
      comparison: SampleSizeComparator;
      efficiency: EfficiencyCalculator;
      powerAnalysis: PowerAnalyzer;
    };
    
    weightingEfficiency: {
      calculateLoss: (weights: number[]) => number;
      varianceInflation: VarianceInflationCalculator;
      precisionLoss: PrecisionLossCalculator;
      costBenefitAnalysis: CostBenefitAnalyzer;
    };
  };
  
  // Quality metrics
  qualityMetrics: {
    weightVariability: {
      coefficientOfVariation: CVCalculator;
      interquartileRange: IQRCalculator;
      weightSpread: SpreadCalculator;
      stabilityMeasures: StabilityMeasure[];
    };
    
    representativenessMetrics: {
      populationCoverage: CoverageCalculator;
      demographicAlignment: AlignmentCalculator;
      biasReduction: BiasReductionCalculator;
      representativenessIndex: RepresentativenessCalculator;
    };
    
    statisticalProperties: {
      moments: MomentCalculator;
      distributionFit: DistributionFitter;
      normalityTests: NormalityTester;
      stabilityAnalysis: StabilityAnalyzer;
    };
  };
}
```

### Advanced Weighting Techniques
```typescript
interface AdvancedWeightingTechniques {
  // Calibration weighting
  calibrationWeighting: {
    raking: {
      description: 'Iterative proportional fitting for multiple margins';
      implementation: RakingCalibrator;
      convergenceCriteria: ConvergenceCriteria;
      marginConstraints: MarginConstraint[];
    };
    
    linearCalibration: {
      description: 'Linear programming approach to calibration';
      implementation: LinearCalibrator;
      objectiveFunction: ObjectiveFunction;
      constraints: LinearConstraint[];
    };
    
    entropyCalibration: {
      description: 'Minimum entropy approach to weight calibration';
      implementation: EntropyCalibrator;
      entropyMeasure: EntropyMeasure;
      distanceFunction: DistanceFunction;
    };
    
    quadraticCalibration: {
      description: 'Quadratic distance minimization for calibration';
      implementation: QuadraticCalibrator;
      distanceMatrix: DistanceMatrix;
      regularization: RegularizationParameter;
    };
  };
  
  // Propensity score weighting
  propensityScoreWeighting: {
    inverseWeighting: {
      description: 'Inverse probability weighting using propensity scores';
      implementation: IPWCalculator;
      propensityModel: PropensityModel;
      truncationPoints: TruncationPoint[];
    };
    
    stratificationWeighting: {
      description: 'Stratification-based propensity score weighting';
      implementation: StratificationWeighter;
      strataDefinition: StrataDefinition;
      balanceAssessment: BalanceAssessor;
    };
    
    matchingWeights: {
      description: 'Weights derived from propensity score matching';
      implementation: MatchingWeighter;
      matchingAlgorithm: MatchingAlgorithm;
      caliperSize: CaliperSize;
    };
  };
  
  // Non-response adjustment
  nonResponseAdjustment: {
    responseModel: {
      description: 'Model-based non-response adjustment';
      implementation: ResponseModelAdjuster;
      responseModel: ResponseModel;
      predictionAccuracy: PredictionAccuracyAssessor;
    };
    
    classAdjustment: {
      description: 'Adjustment within response homogeneity groups';
      implementation: ClassAdjuster;
      classDefinition: ClassDefinition;
      homogeneityAssessment: HomogeneityAssessor;
    };
    
    weaveAdjustment: {
      description: 'Weighting class estimation and variance estimation';
      implementation: WeaveAdjuster;
      varianceEstimator: VarianceEstimator;
      weightingClassOptimization: WeightingClassOptimizer;
    };
  };
  
  // Robust weighting
  robustWeighting: {
    trimmedWeights: {
      description: 'Trimming extreme weights for robustness';
      implementation: WeightTrimmer;
      trimmingPercentile: TrimmingPercentile;
      alternativeAssignment: AlternativeAssigner;
    };
    
    winsorizdWeights: {
      description: 'Winsorizing extreme weights';
      implementation: WeightWinsorizer;
      winsorizingLimits: WinsorizingLimit[];
      impactAssessment: ImpactAssessor;
    };
    
    adaptiveWeighting: {
      description: 'Adaptive weighting based on data characteristics';
      implementation: AdaptiveWeighter;
      adaptationCriteria: AdaptationCriteria;
      robustnessMetrics: RobustnessMetric[];
    };
  };
}
```

## 🔧 Hook Implementation

### useWeightCases Hook
```typescript
interface UseWeightCasesHook {
  // Weight configuration state
  weightConfigurationState: {
    availableVariables: Variable[];         // Variables available for weighting
    selectedWeightVariable: Variable;       // Currently selected weight variable
    currentWeightStatus: WeightStatus;      // Current weighting status
    weightValidation: WeightValidationResult; // Validation results
    weightStatistics: WeightStatistics;     // Weight distribution statistics
  };
  
  // Weight variable management
  weightVariableManagement: {
    selectWeightVariable: (variable: Variable) => void;
    clearWeightVariable: () => void;
    validateWeightVariable: (variable: Variable) => ValidationResult;
    getWeightVariableStatistics: (variable: Variable) => WeightStatistics;
  };
  
  // Weight configuration options
  weightConfigurationOptions: {
    weightType: WeightType;
    setWeightType: (type: WeightType) => void;
    normalizationMethod: NormalizationMethod;
    setNormalizationMethod: (method: NormalizationMethod) => void;
    trimmingOptions: TrimmingOptions;
    setTrimmingOptions: (options: TrimmingOptions) => void;
    missingValueHandling: MissingWeightHandling;
    setMissingValueHandling: (handling: MissingWeightHandling) => void;
  };
  
  // Advanced weighting features
  advancedWeightingFeatures: {
    calibrationSettings: CalibrationSettings;
    setCalibrationSettings: (settings: CalibrationSettings) => void;
    qualityControlOptions: QualityControlOptions;
    setQualityControlOptions: (options: QualityControlOptions) => void;
    robustnessOptions: RobustnessOptions;
    setRobustnessOptions: (options: RobustnessOptions) => void;
  };
  
  // Weight analysis and diagnostics
  weightAnalysisDiagnostics: {
    analyzeWeightDistribution: () => WeightDistributionAnalysis;
    calculateDesignEffect: () => DesignEffectAnalysis;
    assessWeightQuality: () => WeightQualityAssessment;
    generateWeightReport: () => WeightReport;
  };
  
  // Weight application
  weightApplication: {
    applyWeights: () => Promise<WeightApplicationResult>;
    removeWeights: () => void;
    testWeightImpact: () => WeightImpactAnalysis;
    validateWeightApplication: () => ApplicationValidationResult;
    weightApplicationProgress: WeightApplicationProgress;
  };
  
  // History and management
  historyManagement: {
    weightingHistory: WeightingOperation[];
    canUndo: boolean;
    canRedo: boolean;
    undoWeighting: () => void;
    redoWeighting: () => void;
    saveWeightConfiguration: (name: string) => void;
    loadWeightConfiguration: (name: string) => void;
    exportWeightResults: (format: ExportFormat) => void;
  };
}
```

### Weighting Service
```typescript
interface WeightingService {
  // Core weighting operations
  coreWeightingOperations: {
    applyFrequencyWeights: (
      data: DataMatrix,
      weightVariable: Variable,
      options: WeightingOptions
    ) => Promise<WeightedDataResult>;
    
    calculateDesignWeights: (
      samplingDesign: SamplingDesign,
      populationParameters: PopulationParameters
    ) => Promise<DesignWeightResult>;
    
    performCalibration: (
      baseWeights: number[],
      calibrationConstraints: CalibrationConstraint[],
      method: CalibrationMethod
    ) => Promise<CalibratedWeightResult>;
    
    adjustForNonResponse: (
      responseIndicators: boolean[],
      auxiliaryVariables: DataMatrix,
      method: NonResponseMethod
    ) => Promise<NonResponseAdjustmentResult>;
  };
  
  // Weight validation and quality control
  weightValidationQualityControl: {
    validateWeightValues: (
      weights: number[],
      validationCriteria: ValidationCriteria
    ) => WeightValidationResult;
    
    assessWeightQuality: (
      weights: number[],
      qualityMetrics: QualityMetric[]
    ) => WeightQualityAssessment;
    
    detectWeightAnomalies: (
      weights: number[],
      detectionMethod: AnomalyDetectionMethod
    ) => WeightAnomalyResult;
    
    optimizeWeightDistribution: (
      weights: number[],
      optimizationCriteria: OptimizationCriteria
    ) => WeightOptimizationResult;
  };
  
  // Statistical calculations with weights
  statisticalCalculationsWithWeights: {
    calculateWeightedMean: (
      values: number[],
      weights: number[]
    ) => WeightedStatistic;
    
    calculateWeightedVariance: (
      values: number[],
      weights: number[],
      method: VarianceEstimationMethod
    ) => WeightedVariance;
    
    calculateWeightedQuantiles: (
      values: number[],
      weights: number[],
      quantiles: number[]
    ) => WeightedQuantile[];
    
    calculateWeightedCorrelation: (
      x: number[],
      y: number[],
      weights: number[]
    ) => WeightedCorrelation;
  };
  
  // Weighting diagnostics
  weightingDiagnostics: {
    calculateDesignEffect: (
      weights: number[]
    ) => DesignEffectCalculation;
    
    calculateEffectiveSampleSize: (
      weights: number[]
    ) => EffectiveSampleSizeCalculation;
    
    assessWeightingEfficiency: (
      weights: number[],
      comparisonWeights?: number[]
    ) => WeightingEfficiencyAssessment;
    
    generateWeightingSummary: (
      weightingOperation: WeightingOperation
    ) => WeightingSummary;
  };
  
  // Advanced weighting techniques
  advancedWeightingTechniques: {
    performRaking: (
      baseWeights: number[],
      marginConstraints: MarginConstraint[],
      convergenceOptions: ConvergenceOptions
    ) => Promise<RakingResult>;
    
    calculatePropensityWeights: (
      treatmentIndicator: boolean[],
      covariates: DataMatrix,
      propensityModel: PropensityModel
    ) => Promise<PropensityWeightResult>;
    
    performEntropyCalibration: (
      baseWeights: number[],
      constraints: CalibrationConstraint[],
      entropyOptions: EntropyOptions
    ) => Promise<EntropyCalibrationResult>;
    
    robustWeightAdjustment: (
      weights: number[],
      robustnessOptions: RobustnessOptions
    ) => RobustWeightResult;
  };
}
```

## 🎨 UI Components

### WeightCasesUI Component
```typescript
interface WeightCasesUIProps {
  // Variable selection
  variableSelection: {
    availableVariables: Variable[];
    selectedWeightVariable: Variable;
    onWeightVariableSelect: (variable: Variable) => void;
    onWeightVariableClear: () => void;
    variableValidation: VariableValidationResult;
  };
  
  // Weight configuration
  weightConfiguration: {
    weightType: WeightType;
    onWeightTypeChange: (type: WeightType) => void;
    normalizationMethod: NormalizationMethod;
    onNormalizationMethodChange: (method: NormalizationMethod) => void;
    showAdvancedOptions: boolean;
    onToggleAdvancedOptions: () => void;
  };
  
  // Advanced options
  advancedOptions: {
    trimmingOptions: TrimmingOptions;
    onTrimmingOptionsChange: (options: TrimmingOptions) => void;
    calibrationSettings: CalibrationSettings;
    onCalibrationSettingsChange: (settings: CalibrationSettings) => void;
    qualityControlOptions: QualityControlOptions;
    onQualityControlOptionsChange: (options: QualityControlOptions) => void;
  };
  
  // Weight analysis
  weightAnalysis: {
    weightStatistics: WeightStatistics;
    designEffectAnalysis: DesignEffectAnalysis;
    qualityAssessment: WeightQualityAssessment;
    showAnalysis: boolean;
    onToggleAnalysis: () => void;
    onRefreshAnalysis: () => void;
  };
  
  // Preview and validation
  previewValidation: {
    weightPreview: WeightPreview;
    validationResults: ValidationResult[];
    isValidConfiguration: boolean;
    impactAnalysis: WeightImpactAnalysis;
    showPreview: boolean;
    onTogglePreview: () => void;
  };
  
  // Actions
  actions: {
    onApplyWeights: () => void;
    onRemoveWeights: () => void;
    onCancel: () => void;
    onReset: () => void;
    onSaveConfiguration: () => void;
    onLoadConfiguration: (config: WeightConfiguration) => void;
    onExportReport: () => void;
  };
  
  // State indicators
  stateIndicators: {
    currentWeightStatus: WeightStatus;
    isProcessing: boolean;
    applicationProgress: WeightApplicationProgress;
    hasUnsavedChanges: boolean;
    canUndo: boolean;
    canRedo: boolean;
  };
}
```

### WeightCasesTest Component
```typescript
interface WeightCasesTestProps {
  // Test scenarios
  testScenarios: WeightingTestScenario[];
  selectedScenario: WeightingTestScenario;
  onScenarioSelect: (scenario: WeightingTestScenario) => void;
  
  // Test data
  testData: {
    testDatasets: WeightingTestDataset[];
    weightingConfigurations: WeightingConfiguration[];
    expectedResults: ExpectedWeightingResult[];
    actualResults: ActualWeightingResult[];
  };
  
  // Method comparison
  methodComparison: {
    availableMethods: WeightingMethod[];
    selectedMethods: WeightingMethod[];
    onMethodSelect: (methods: WeightingMethod[]) => void;
    comparisonMetrics: WeightingComparisonMetric[];
  };
  
  // Performance evaluation
  performanceEvaluation: {
    effectivenessMetrics: EffectivenessMetric[];
    efficiencyMetrics: EfficiencyMetric[];
    robustnessMetrics: RobustnessMetric[];
    accuracyMetrics: AccuracyMetric[];
  };
  
  // Test execution
  testExecution: {
    onRunTest: () => void;
    onRunAllTests: () => void;
    onRunValidationTest: () => void;
    onRunPerformanceTest: () => void;
    testResults: WeightingTestResult[];
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Weighting functionality testing
describe('WeightCasesModal', () => {
  describe('Weight variable selection', () => {
    it('filters numeric variables correctly');
    it('validates weight variable appropriately');
    it('handles missing weight values correctly');
    it('prevents invalid variable selection');
  });
  
  describe('Weight application', () => {
    it('applies frequency weights correctly');
    it('handles zero and negative weights appropriately');
    it('maintains data integrity during weighting');
    it('updates global weight status correctly');
  });
  
  describe('Weight validation', () => {
    it('validates weight ranges correctly');
    it('detects anomalous weight values');
    it('calculates quality metrics accurately');
    it('provides appropriate warnings');
  });
  
  describe('Advanced weighting', () => {
    it('performs calibration correctly');
    it('applies trimming appropriately');
    it('handles normalization properly');
    it('calculates design effects accurately');
  });
  
  describe('Statistical calculations', () => {
    it('calculates weighted statistics correctly');
    it('handles design effects appropriately');
    it('estimates variances correctly with weights');
    it('maintains statistical properties');
  });
});

// Service testing
describe('weightingService', () => {
  describe('Weight calculations', () => {
    it('calculates weights correctly');
    it('validates weight constraints');
    it('handles edge cases appropriately');
    it('maintains numerical stability');
  });
  
  describe('Quality control', () => {
    it('assesses weight quality correctly');
    it('detects problems appropriately');
    it('provides actionable recommendations');
    it('validates improvement strategies');
  });
});
```

## 📋 Development Guidelines

### Adding New Weighting Methods
```typescript
// 1. Define weighting method interface
interface NewWeightingMethod extends WeightingMethod {
  id: 'newMethod';
  name: 'New Weighting Method';
  description: 'Description of weighting method';
  type: 'frequency' | 'probability' | 'design' | 'calibration';
  parameters: WeightingMethodParameters;
  constraints: WeightingConstraint[];
}

// 2. Implement weighting logic
const newWeightingImplementation = {
  calculateWeights: (
    data: DataMatrix,
    parameters: WeightingMethodParameters
  ): Promise<WeightingResult> => {
    // Weighting calculation logic
  },
  
  validateParameters: (
    parameters: WeightingMethodParameters
  ): ValidationResult => {
    // Parameter validation
  },
  
  assessQuality: (
    weights: number[],
    data: DataMatrix
  ): QualityAssessment => {
    // Quality assessment logic
  }
};

// 3. Register weighting method
const WEIGHTING_METHODS = {
  ...existingMethods,
  newMethod: newWeightingImplementation
};

// 4. Add comprehensive tests
describe('New Weighting Method', () => {
  it('calculates weights correctly');
  it('validates parameters appropriately');
  it('handles edge cases gracefully');
  it('maintains statistical properties');
});
```

### Survey Data Analysis Guidelines
```typescript
// 1. Design effect monitoring
const monitorDesignEffect = (weights: number[]) => {
  const designEffect = calculateDesignEffect(weights);
  
  if (designEffect > DESIGN_EFFECT_WARNING_THRESHOLD) {
    return {
      warning: true,
      message: 'High design effect detected - consider weight trimming',
      recommendations: ['Trim extreme weights', 'Check for outliers', 'Consider alternative weighting']
    };
  }
  
  return { warning: false };
};

// 2. Effective sample size calculation
const calculateEffectiveSampleSize = (weights: number[]) => {
  const sumWeights = weights.reduce((sum, w) => sum + w, 0);
  const sumSquaredWeights = weights.reduce((sum, w) => sum + w * w, 0);
  
  return (sumWeights * sumWeights) / sumSquaredWeights;
};
```

---

WeightCases modal menyediakan comprehensive case weighting capabilities dengan advanced statistical methods, quality control mechanisms, dan robust weighting techniques untuk proper survey data analysis dan population inference dalam Statify.
        M --> D(closes dialog);
    end

    A --> D;
```

1.  **Initialization**: `WeightCasesModal` mounts and initializes the `useWeightCases` hook, passing the full variable list from `useVariableStore` and the current weight from `useMetaStore`.
2.  **Rendering**: The `WeightCasesUI` component renders the dialog with the available variables and the currently selected weight variable (if any).
3.  **Selection**: The user moves a numeric variable into the "Weight cases by" target list. This action calls `handleMoveVariable` in the hook, which updates the local state, triggering a re-render.
4.  **Confirmation**: The user clicks "OK". This calls the `handleSave` function from the hook, which in turn calls the `onSave` callback (`handleSaveMeta`) that was passed down from `WeightCasesModal`.
5.  **Global State Update**: `handleSaveMeta` updates the global state in `useMetaStore` with the name of the new weighting variable (or an empty string if none is selected).
6.  **Cleanup**: The `onClose` function is called, and the dialog is unmounted.

## 4. Testing Strategy

The feature is tested at both the UI and hook level to ensure reliability.

### 4.1. Hook Logic Testing (`__tests__/useWeightCases.test.ts`)

This is the most critical test suite, as it covers the core business logic.

-   **Initialization**: Verifies that the hook correctly initializes its state, filtering for only numeric variables and correctly setting a pre-selected weight if one exists in the initial state.
-   **State Manipulation**:
    -   Tests moving a variable from the "available" list to the "frequency" list.
    -   Tests the "swap" logic, where moving a new variable to the frequency list correctly moves the old one back to the available list.
-   **Saving & Resetting**: Ensures `handleSave` provides the correct variable name (or an empty string) and that `handleReset` properly reverts the state.
-   **Error Handling**: Confirms that trying to weight by a non-numeric variable correctly triggers an error state.

### 4.2. UI Component Testing (`__tests__/WeightCasesUI.test.tsx`)

This suite tests the `WeightCasesUI` component in isolation.

-   **Rendering**: Verifies that the component renders the initial state correctly, including the "Current Status" text.
-   **User Interactions**: Simulates user clicks on the `OK`, `Reset`, and `Cancel` buttons and asserts that the corresponding handler functions are called.
-   **State Display**: Checks that the UI correctly displays the weighting status when a variable is selected.
-   **Error Handling**: Confirms that the error dialog is rendered when `errorDialogOpen` is true.

```
/WeightCases
├── 📂 hooks/
│   └── 📄 useWeightCases.ts  // Mengelola state & logika UI.
├── 📄 index.tsx              // Titik masuk & perakit (Orchestrator).
├── 📄 README.md              // Dokumen ini.
└── 📄 types.ts              // Definisi tipe TypeScript.
```

-   **`index.tsx` (Orchestrator & UI)**: Karena UI untuk fitur ini cukup sederhana, komponen UI (`WeightCasesContent`) dan perakit (`WeightCasesModal`) digabungkan dalam satu file, namun tetap dengan pemisahan logis. Perakit memanggil *hook* dan menyalurkan *props* ke komponen UI.
-   **`hooks/useWeightCases.ts` (Hook Logika)**: Jantung dari fitur ini. Ia mengelola semua state (variabel yang tersedia, variabel pembobot), menangani interaksi pengguna (memindahkan variabel), dan berkomunikasi dengan `useMetaStore` untuk menyimpan atau menghapus konfigurasi pembobotan.
-   **`types.ts` (Definisi Tipe)**: Mendefinisikan `WeightCasesModalProps` dan `WeightCasesUIProps` (yang diturunkan dari *return type* `useWeightCases`) untuk memastikan keamanan tipe.

## Alur Kerja

1.  **Inisialisasi**: `useWeightCases` diinisialisasi, mengambil daftar variabel dari `useVariableStore` dan status pembobotan saat ini dari `useMetaStore`.
2.  **Seleksi Variabel**: Pengguna menyeret variabel numerik yang valid ke dalam kotak "Weight cases by".
3.  **Konfirmasi**:
    -   Pengguna mengklik "OK".
    -   Fungsi `handleSave` dari *hook* dipanggil.
    -   Nama variabel pembobot disimpan ke dalam `useMetaStore` melalui `setMeta({ weight: 'nama_variabel' })`.
    -   Dialog ditutup.
4.  **Reset/Hapus Pembobotan**:
    -   Pengguna menghapus variabel dari kotak atau mengklik "Reset".
    -   `handleSave` dipanggil (jika OK diklik setelah menghapus) atau `handleReset` dipanggil.
    -   `setMeta({ weight: '' })` dipanggil, menghapus konfigurasi pembobotan dari state global. 