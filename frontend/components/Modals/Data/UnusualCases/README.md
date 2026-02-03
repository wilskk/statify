# Identify Unusual Cases Modal - Advanced Anomaly Detection and Outlier Analysis

Modal untuk identifying dan analyzing unusual cases dalam Statify dengan sophisticated peer group analysis, comprehensive anomaly detection algorithms, dan flexible outlier identification strategies. Feature ini menyediakan powerful data quality assessment dan anomaly detection capabilities.

## 📁 Component Architecture

```
UnusualCases/
├── index.tsx                   # Main modal component
├── UnusualCasesUI.tsx         # Main unusual cases interface
├── UnusualCasesTest.tsx       # Anomaly detection testing
├── types.ts                   # TypeScript type definitions
├── README.md                  # Documentation
│
├── components/                # Tab components
│   ├── VariablesTab.tsx           # Variable selection tab
│   ├── OptionsTab.tsx             # Analysis options tab
│   ├── OutputTab.tsx              # Output configuration tab
│   ├── SaveTab.tsx                # Save results tab
│   └── MissingValuesTab.tsx       # Missing values handling tab
│
├── __tests__/                 # Test suite
│   ├── UnusualCases.test.tsx      # Main component tests
│   ├── useUnusualCases.test.ts    # Hook logic tests
│   ├── anomalyService.test.ts     # Service function tests
│   └── README.md                  # Test documentation
│
├── hooks/                     # Business logic hooks
│   └── useUnusualCases.ts         # Core anomaly detection logic
│
└── services/                  # Business logic services
    └── anomalyDetectionService.ts # Anomaly detection algorithms
```

## 🎯 Core Functionality

### Anomaly Detection Methods
```typescript
interface AnomalyDetectionMethods {
  // Peer group analysis
  peerGroupAnalysis: {
    purpose: 'Group similar cases and identify outliers within groups';
    algorithm: 'Clustering-based anomaly detection';
    methodology: PeerGroupMethodology;
    advantages: ['Context-aware detection', 'Reduces false positives', 'Interpretable results'];
  };
  
  // Statistical outlier detection
  statisticalOutlierDetection: {
    purpose: 'Identify cases based on statistical deviation';
    methods: StatisticalMethod[];
    thresholds: OutlierThreshold[];
    implementation: StatisticalDetector;
  };
  
  // Multivariate anomaly detection
  multivariateAnomalyDetection: {
    purpose: 'Detect anomalies across multiple variables simultaneously';
    techniques: MultivariateDetectionTechnique[];
    correlationAnalysis: CorrelationAnalyzer;
    implementation: MultivariateDetector;
  };
  
  // Machine learning-based detection
  machineLearningDetection: {
    purpose: 'Use ML algorithms for sophisticated anomaly detection';
    algorithms: MLAnomalyAlgorithm[];
    featureEngineering: FeatureEngineer;
    implementation: MLAnomalyDetector;
  };
}
```

### Peer Group Analysis
```typescript
interface PeerGroupAnalysis {
  // Clustering configuration
  clusteringConfiguration: {
    clusteringAlgorithm: ClusteringAlgorithm;   // Algorithm for peer group formation
    numberOfGroups: GroupConfiguration;        // Number of peer groups to create
    distanceMetric: DistanceMetric;            // Metric for measuring similarity
    clusterValidation: ClusterValidation;      // Validation of cluster quality
  };
  
  // Similarity measurement
  similarityMeasurement: {
    euclideanDistance: EuclideanDistanceCalculator;
    manhattanDistance: ManhattanDistanceCalculator;
    mahalanobisDistance: MahalanobisDistanceCalculator;
    cosineDistance: CosineDistanceCalculator;
    customDistance: CustomDistanceCalculator;
  };
  
  // Group formation strategies
  groupFormationStrategies: {
    kMeansClustering: {
      algorithm: 'K-means clustering for peer group formation';
      implementation: KMeansClusterer;
      convergenceCriteria: ConvergenceCriteria;
      initializationMethod: InitializationMethod;
    };
    
    hierarchicalClustering: {
      algorithm: 'Hierarchical clustering for peer groups';
      implementation: HierarchicalClusterer;
      linkageCriteria: LinkageCriteria;
      dendrogramCutoff: DendrogramCutoff;
    };
    
    dbscanClustering: {
      algorithm: 'Density-based clustering for peer groups';
      implementation: DBSCANClusterer;
      densityParameters: DensityParameters;
      noiseHandling: NoiseHandler;
    };
    
    gaussianMixture: {
      algorithm: 'Gaussian mixture model for peer groups';
      implementation: GaussianMixtureClusterer;
      componentSelection: ComponentSelector;
      expectationMaximization: EMAlgorithm;
    };
  };
  
  // Anomaly scoring within groups
  anomalyScoringWithinGroups: {
    localOutlierFactor: {
      description: 'LOF-based scoring within peer groups';
      implementation: LOFCalculator;
      localityParameter: LocalityParameter;
      reachabilityDistance: ReachabilityCalculator;
    };
    
    isolationForest: {
      description: 'Isolation-based scoring within groups';
      implementation: IsolationForestScorer;
      treeParameters: IsolationTreeParameters;
      pathLengthCalculation: PathLengthCalculator;
    };
    
    oneClassSVM: {
      description: 'SVM-based anomaly scoring';
      implementation: OneClassSVMScorer;
      kernelFunction: KernelFunction;
      boundaryOptimization: BoundaryOptimizer;
    };
    
    statisticalScoring: {
      description: 'Statistical deviation-based scoring';
      implementation: StatisticalScorer;
      deviationMetrics: DeviationMetric[];
      probabilityModeling: ProbabilityModeler;
    };
  };
}
```

## 🔍 Advanced Anomaly Detection Algorithms

### Statistical Methods
```typescript
interface StatisticalAnomalyDetection {
  // Univariate outlier detection
  univariateOutlierDetection: {
    zScoreMethod: {
      description: 'Standard score-based outlier detection';
      threshold: number; // Typically 2.5 or 3
      implementation: ZScoreDetector;
      assumptions: ['Normal distribution', 'No extreme skewness'];
    };
    
    modifiedZScore: {
      description: 'Robust z-score using median absolute deviation';
      threshold: number; // Typically 3.5
      implementation: ModifiedZScoreDetector;
      robustness: 'High resistance to extreme outliers';
    };
    
    interquartileRange: {
      description: 'IQR-based outlier detection';
      multiplier: number; // Typically 1.5 or 3
      implementation: IQRDetector;
      applicability: 'Works with any distribution';
    };
    
    grubbsTest: {
      description: 'Statistical test for single outlier';
      significance: number; // Typically 0.05
      implementation: GrubbsTestDetector;
      limitations: 'Assumes normal distribution';
    };
  };
  
  // Multivariate outlier detection
  multivariateOutlierDetection: {
    mahalanobisDistance: {
      description: 'Distance-based multivariate outlier detection';
      implementation: MahalanobisDetector;
      covarianceEstimation: CovarianceEstimator;
      degreeOfFreedom: DegreesOfFreedomCalculator;
    };
    
    hotellingsT2: {
      description: 'Hotelling T² test for multivariate outliers';
      implementation: HotellingT2Detector;
      controlLimits: ControlLimitCalculator;
      statisticalSignificance: SignificanceTest;
    };
    
    minimumCovarianceDeterminant: {
      description: 'Robust covariance-based detection';
      implementation: MCDDetector;
      robustEstimation: RobustCovarianceEstimator;
      contaminationRate: ContaminationRateEstimator;
    };
    
    principalComponentAnalysis: {
      description: 'PCA-based anomaly detection';
      implementation: PCAAnomalyDetector;
      componentSelection: ComponentSelector;
      reconstructionError: ReconstructionErrorCalculator;
    };
  };
  
  // Time series anomaly detection
  timeSeriesAnomalyDetection: {
    seasonalDecomposition: {
      description: 'Seasonal-trend decomposition for anomaly detection';
      implementation: SeasonalDecompositionDetector;
      seasonalityDetection: SeasonalityDetector;
      trendAnalysis: TrendAnalyzer;
    };
    
    changepointDetection: {
      description: 'Statistical changepoint detection';
      implementation: ChangepointDetector;
      changeStatistics: ChangeStatistic[];
      penaltyFunction: PenaltyFunction;
    };
    
    autoregressiveModeling: {
      description: 'AR model-based anomaly detection';
      implementation: ARModelDetector;
      modelSelection: ModelSelector;
      residualAnalysis: ResidualAnalyzer;
    };
  };
}
```

### Machine Learning Methods
```typescript
interface MachineLearningAnomalyDetection {
  // Unsupervised methods
  unsupervisedMethods: {
    isolationForest: {
      description: 'Tree-based anomaly detection';
      parameters: {
        nEstimators: number;
        maxSamples: number;
        contamination: number;
        randomState: number;
      };
      implementation: IsolationForestDetector;
      advantages: ['No assumptions about data distribution', 'Efficient for large datasets'];
    };
    
    localOutlierFactor: {
      description: 'Density-based local anomaly detection';
      parameters: {
        nNeighbors: number;
        algorithm: 'auto' | 'ball_tree' | 'kd_tree' | 'brute';
        leafSize: number;
        metric: DistanceMetric;
      };
      implementation: LOFDetector;
      advantages: ['Captures local density variations', 'Effective for clustered data'];
    };
    
    oneClassSVM: {
      description: 'Support vector machine for anomaly detection';
      parameters: {
        kernel: 'linear' | 'poly' | 'rbf' | 'sigmoid';
        gamma: 'scale' | 'auto' | number;
        nu: number;
        coef0: number;
      };
      implementation: OneClassSVMDetector;
      advantages: ['Works well in high dimensions', 'Flexible decision boundaries'];
    };
    
    ellipticEnvelope: {
      description: 'Robust covariance estimation for outlier detection';
      parameters: {
        storeLocation: boolean;
        assumeCentered: boolean;
        supportFraction: number;
        contamination: number;
      };
      implementation: EllipticEnvelopeDetector;
      advantages: ['Robust to outliers in training', 'Assumes Gaussian distribution'];
    };
  };
  
  // Deep learning methods
  deepLearningMethods: {
    autoencoder: {
      description: 'Neural network-based anomaly detection';
      architecture: AutoencoderArchitecture;
      implementation: AutoencoderAnomalyDetector;
      advantages: ['Can capture complex patterns', 'Unsupervised learning'];
    };
    
    variationalAutoencoder: {
      description: 'Probabilistic autoencoder for anomaly detection';
      architecture: VAEArchitecture;
      implementation: VAEAnomalyDetector;
      advantages: ['Probabilistic framework', 'Handles uncertainty'];
    };
    
    generativeAdversarialNetwork: {
      description: 'GAN-based anomaly detection';
      architecture: GANArchitecture;
      implementation: GANAnomalyDetector;
      advantages: ['Can generate synthetic normal data', 'Sophisticated modeling'];
    };
  };
  
  // Ensemble methods
  ensembleMethods: {
    combinedDetectors: {
      description: 'Ensemble of multiple anomaly detectors';
      votingStrategy: VotingStrategy;
      implementation: EnsembleAnomalyDetector;
      advantages: ['Improved robustness', 'Better generalization'];
    };
    
    stackedDetectors: {
      description: 'Hierarchical ensemble of detectors';
      stackingStrategy: StackingStrategy;
      implementation: StackedAnomalyDetector;
      advantages: ['Learns from detector outputs', 'Adaptive combination'];
    };
  };
}
```

## 🔧 Hook Implementation

### useUnusualCases Hook
```typescript
interface UseUnusualCasesHook {
  // Analysis configuration state
  analysisConfigurationState: {
    analysisVariables: Variable[];          // Variables for anomaly analysis
    identifierVariable: Variable;           // Variable for case identification
    availableVariables: Variable[];         // All available variables
    selectedAlgorithm: AnomalyDetectionAlgorithm; // Selected detection algorithm
    algorithmParameters: AlgorithmParameters; // Algorithm-specific parameters
  };
  
  // Detection options
  detectionOptions: {
    identificationCriteria: IdentificationCriteria; // Criteria for flagging cases
    anomalyCutoff: number;                  // Minimum anomaly score threshold
    peerGroupConfiguration: PeerGroupConfig; // Peer group settings
    maxReasons: number;                     // Maximum reasons to report per case
    confidenceLevel: number;                // Statistical confidence level
  };
  
  // Output configuration
  outputConfiguration: {
    generateCaseList: boolean;              // Generate list of unusual cases
    generatePeerGroupNorms: boolean;        // Generate peer group statistics
    generateAnomalyIndices: boolean;        // Generate anomaly index distribution
    generateReasonOccurrence: boolean;      // Generate reason frequency table
    generateProcessingSummary: boolean;     // Generate processing summary
    outputFormat: OutputFormat;            // Format for output generation
  };
  
  // Save options
  saveOptions: {
    saveAnomalyIndex: boolean;              // Save anomaly index as variable
    savePeerGroupMembership: boolean;       // Save peer group information
    saveReasons: boolean;                   // Save anomaly reasons
    replaceExisting: boolean;               // Replace existing variables
    variablePrefix: string;                 // Prefix for new variable names
  };
  
  // Missing value handling
  missingValueHandling: {
    strategy: MissingValueStrategy;         // Strategy for missing values
    imputationMethod: ImputationMethod;     // Method for value imputation
    usePropMissing: boolean;               // Include proportion missing as feature
    listweiseDeletion: boolean;            // Use listwise deletion
  };
  
  // Analysis execution
  analysisExecution: {
    executeAnalysis: () => Promise<AnomalyDetectionResult>;
    cancelAnalysis: () => void;
    validateConfiguration: () => ValidationResult;
    estimateComplexity: () => ComplexityEstimate;
    analysisProgress: AnalysisProgress;
  };
  
  // Results management
  resultsManagement: {
    analysisResults: AnomalyDetectionResult;
    resultsSummary: ResultsSummary;
    saveResults: () => Promise<void>;
    exportResults: (format: ExportFormat) => void;
    clearResults: () => void;
  };
}
```

### Anomaly Detection Service
```typescript
interface AnomalyDetectionService {
  // Core detection algorithms
  coreDetectionAlgorithms: {
    peerGroupAnalysis: (
      data: DataMatrix,
      config: PeerGroupConfig
    ) => Promise<PeerGroupAnalysisResult>;
    
    statisticalOutlierDetection: (
      data: DataMatrix,
      config: StatisticalConfig
    ) => Promise<StatisticalDetectionResult>;
    
    machineLearnigDetection: (
      data: DataMatrix,
      config: MLConfig
    ) => Promise<MLDetectionResult>;
    
    ensembleDetection: (
      data: DataMatrix,
      detectors: AnomalyDetector[],
      config: EnsembleConfig
    ) => Promise<EnsembleDetectionResult>;
  };
  
  // Data preprocessing
  dataPreprocessing: {
    handleMissingValues: (
      data: DataMatrix,
      strategy: MissingValueStrategy
    ) => PreprocessedData;
    
    normalizeFeatures: (
      data: DataMatrix,
      method: NormalizationMethod
    ) => NormalizedData;
    
    detectDataTypes: (data: DataMatrix) => DataTypeAnalysis;
    validateDataQuality: (data: DataMatrix) => DataQualityReport;
  };
  
  // Clustering and peer group formation
  clusteringPeerGroupFormation: {
    kMeansClustering: (
      data: DataMatrix,
      k: number,
      config: KMeansConfig
    ) => ClusteringResult;
    
    hierarchicalClustering: (
      data: DataMatrix,
      config: HierarchicalConfig
    ) => ClusteringResult;
    
    dbscanClustering: (
      data: DataMatrix,
      config: DBSCANConfig
    ) => ClusteringResult;
    
    optimizeClusterCount: (
      data: DataMatrix,
      method: ClusterOptimizationMethod
    ) => OptimalClusterCount;
  };
  
  // Anomaly scoring
  anomalyScoring: {
    calculateLocalOutlierFactor: (
      data: DataMatrix,
      neighbors: number
    ) => LOFScores;
    
    calculateIsolationScore: (
      data: DataMatrix,
      forest: IsolationForest
    ) => IsolationScores;
    
    calculateMahalanobisDistance: (
      data: DataMatrix,
      center: Vector,
      covariance: Matrix
    ) => MahalanobisScores;
    
    calculateStatisticalScores: (
      data: DataMatrix,
      method: StatisticalScoringMethod
    ) => StatisticalScores;
  };
  
  // Result interpretation
  resultInterpretation: {
    identifyUnusualCases: (
      scores: AnomalyScore[],
      criteria: IdentificationCriteria
    ) => UnusualCase[];
    
    generateReasons: (
      cases: UnusualCase[],
      data: DataMatrix,
      maxReasons: number
    ) => CaseReason[];
    
    calculateGroupNorms: (
      data: DataMatrix,
      groupAssignments: GroupAssignment[]
    ) => GroupNorm[];
    
    generateSummaryStatistics: (
      results: AnomalyDetectionResult
    ) => SummaryStatistics;
  };
  
  // Quality assurance
  qualityAssurance: {
    validateDetectionResults: (
      results: AnomalyDetectionResult
    ) => ValidationReport;
    
    assessDetectionQuality: (
      results: AnomalyDetectionResult,
      groundTruth?: GroundTruth
    ) => QualityAssessment;
    
    detectFalsePositives: (
      results: AnomalyDetectionResult,
      data: DataMatrix
    ) => FalsePositiveReport;
    
    optimizeThresholds: (
      scores: AnomalyScore[],
      criteria: OptimizationCriteria
    ) => OptimalThresholds;
  };
}
```

## 🎨 UI Components

### Multi-Tab Interface Components
```typescript
// Variables Tab Component
interface VariablesTabProps {
  availableVariables: Variable[];
  analysisVariables: Variable[];
  identifierVariable: Variable;
  onAnalysisVariablesChange: (variables: Variable[]) => void;
  onIdentifierVariableChange: (variable: Variable) => void;
  validationResults: ValidationResult[];
}

// Options Tab Component
interface OptionsTabProps {
  identificationCriteria: IdentificationCriteria;
  onIdentificationCriteriaChange: (criteria: IdentificationCriteria) => void;
  anomalyCutoff: number;
  onAnomalyCutoffChange: (cutoff: number) => void;
  peerGroupConfig: PeerGroupConfig;
  onPeerGroupConfigChange: (config: PeerGroupConfig) => void;
  maxReasons: number;
  onMaxReasonsChange: (reasons: number) => void;
  algorithmSelection: AnomalyDetectionAlgorithm;
  onAlgorithmSelectionChange: (algorithm: AnomalyDetectionAlgorithm) => void;
}

// Output Tab Component
interface OutputTabProps {
  outputConfiguration: OutputConfiguration;
  onOutputConfigurationChange: (config: OutputConfiguration) => void;
  estimatedOutputSize: OutputSizeEstimate;
  outputPreview: OutputPreview;
  onGeneratePreview: () => void;
}

// Save Tab Component
interface SaveTabProps {
  saveOptions: SaveOptions;
  onSaveOptionsChange: (options: SaveOptions) => void;
  existingVariables: Variable[];
  conflictResolution: ConflictResolution;
  onConflictResolutionChange: (resolution: ConflictResolution) => void;
}

// Missing Values Tab Component
interface MissingValuesTabProps {
  missingValueStrategy: MissingValueStrategy;
  onMissingValueStrategyChange: (strategy: MissingValueStrategy) => void;
  imputationMethod: ImputationMethod;
  onImputationMethodChange: (method: ImputationMethod) => void;
  missingValueStatistics: MissingValueStatistics;
  dataQualityAssessment: DataQualityAssessment;
}
```

### UnusualCasesTest Component
```typescript
interface UnusualCasesTestProps {
  // Test scenarios
  testScenarios: AnomalyDetectionTestScenario[];
  selectedScenario: AnomalyDetectionTestScenario;
  onScenarioSelect: (scenario: AnomalyDetectionTestScenario) => void;
  
  // Test data
  testData: {
    syntheticDatasets: SyntheticDataset[];
    realWorldDatasets: RealWorldDataset[];
    groundTruthLabels: GroundTruthLabel[];
    benchmarkResults: BenchmarkResult[];
  };
  
  // Algorithm comparison
  algorithmComparison: {
    availableAlgorithms: AnomalyDetectionAlgorithm[];
    selectedAlgorithms: AnomalyDetectionAlgorithm[];
    onAlgorithmSelect: (algorithms: AnomalyDetectionAlgorithm[]) => void;
    comparisonMetrics: ComparisonMetric[];
  };
  
  // Performance evaluation
  performanceEvaluation: {
    precisionRecallCurves: PRCurve[];
    rocCurves: ROCCurve[];
    detectionAccuracy: AccuracyMetrics;
    computationalPerformance: ComputationalMetrics;
  };
  
  // Test execution
  testExecution: {
    onRunTest: () => void;
    onRunAllTests: () => void;
    onRunBenchmark: () => void;
    onRunPerformanceEvaluation: () => void;
    testResults: AnomalyDetectionTestResult[];
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Anomaly detection functionality testing
describe('UnusualCasesModal', () => {
  describe('Peer group analysis', () => {
    it('forms appropriate peer groups');
    it('calculates group norms correctly');
    it('identifies outliers within groups');
    it('handles different cluster configurations');
  });
  
  describe('Statistical outlier detection', () => {
    it('detects univariate outliers correctly');
    it('identifies multivariate anomalies');
    it('applies appropriate statistical thresholds');
    it('handles different data distributions');
  });
  
  describe('Machine learning detection', () => {
    it('trains anomaly detection models correctly');
    it('scores anomalies appropriately');
    it('handles high-dimensional data');
    it('provides interpretable results');
  });
  
  describe('Missing value handling', () => {
    it('applies different imputation strategies');
    it('handles missing value patterns');
    it('maintains data integrity during processing');
    it('provides appropriate warnings');
  });
  
  describe('Result generation', () => {
    it('generates comprehensive anomaly reports');
    it('provides detailed case reasons');
    it('calculates appropriate summary statistics');
    it('exports results in various formats');
  });
  
  describe('Performance', () => {
    it('handles large datasets efficiently');
    it('optimizes algorithm selection');
    it('provides progress feedback');
    it('manages memory usage effectively');
  });
});

// Service testing
describe('anomalyDetectionService', () => {
  describe('Detection algorithms', () => {
    it('implements detection algorithms correctly');
    it('validates algorithm parameters');
    it('handles edge cases appropriately');
    it('provides consistent results');
  });
  
  describe('Quality assurance', () => {
    it('validates detection results');
    it('assesses result quality');
    it('detects potential issues');
    it('optimizes detection parameters');
  });
});
```

## 📋 Development Guidelines

### Adding New Anomaly Detection Algorithms
```typescript
// 1. Define algorithm interface
interface NewAnomalyDetectionAlgorithm extends AnomalyDetectionAlgorithm {
  id: 'newAlgorithm';
  name: 'New Anomaly Detection Algorithm';
  description: 'Description of algorithm characteristics';
  type: 'statistical' | 'ml' | 'ensemble';
  parameters: AlgorithmParameters;
  capabilities: AlgorithmCapabilities;
}

// 2. Implement algorithm logic
const newAlgorithmImplementation = {
  detect: (
    data: DataMatrix,
    parameters: AlgorithmParameters
  ): Promise<AnomalyDetectionResult> => {
    // Algorithm implementation
  },
  
  validate: (
    data: DataMatrix,
    parameters: AlgorithmParameters
  ): ValidationResult => {
    // Parameter validation
  },
  
  optimize: (
    data: DataMatrix,
    criteria: OptimizationCriteria
  ): OptimalParameters => {
    // Parameter optimization
  }
};

// 3. Register algorithm
const ANOMALY_DETECTION_ALGORITHMS = {
  ...existingAlgorithms,
  newAlgorithm: newAlgorithmImplementation
};

// 4. Add comprehensive tests
describe('New Anomaly Detection Algorithm', () => {
  it('detects anomalies correctly');
  it('handles various data types');
  it('provides interpretable results');
  it('performs within expected complexity bounds');
});
```

### Performance Optimization Guidelines
```typescript
// 1. Algorithm selection optimization
const selectOptimalAlgorithm = (
  dataCharacteristics: DataCharacteristics,
  requirements: DetectionRequirements
) => {
  if (dataCharacteristics.hasClusteredStructure) {
    return 'localOutlierFactor';
  }
  
  if (dataCharacteristics.isHighDimensional) {
    return 'isolationForest';
  }
  
  if (requirements.requiresInterpretability) {
    return 'statisticalDetection';
  }
  
  return 'ensembleDetection';
};

// 2. Memory and computation optimization
const optimizeDetectionPerformance = (
  dataSize: DataSize,
  algorithmType: AlgorithmType
) => {
  if (dataSize.rows > LARGE_DATASET_THRESHOLD) {
    return {
      useSampling: true,
      sampleSize: calculateOptimalSampleSize(dataSize),
      enableParallelProcessing: true,
      chunkProcessing: true
    };
  }
  
  return {
    useFullDataset: true,
    enableCaching: true
  };
};
```

---

UnusualCases modal menyediakan comprehensive anomaly detection capabilities dengan sophisticated peer group analysis, advanced statistical methods, dan machine learning algorithms untuk robust outlier identification dan data quality assessment dalam Statify.

### 2.5. Missing Values Tab (`MissingValuesTab.tsx`)

This tab defines how to handle missing data in the analysis variables.

-   **Exclude Missing Values**: The default option, which performs listwise deletion.
-   **Include Missing Values**: Imputes missing values (mean for scale, a separate category for nominal/ordinal).
-   **Use Proportion Missing**: An option to create a new feature based on the proportion of missing values per case and include it in the analysis.

## 3. Architecture and Data Flow

The feature's logic is primarily encapsulated in the `useUnusualCases` hook, promoting a clear separation of concerns between UI and business logic.

### 3.1. Core Components

-   **`IdentifyUnusualCases/index.tsx`**: The main dialog component. It manages the tabbed layout, state via the `useUnusualCases` hook, and renders the appropriate tab component (`VariablesTab`, `OptionsTab`, etc.). It also integrates the `useTourGuide` hook for the guided tour.
-   **`hooks/useUnusualCases.ts`**: The central hook managing the feature's entire state, including variable lists, all configuration options across the tabs, and the `handleConfirm` and `handleReset` actions. It interacts with `useVariableStore` to read initial variables and `addVariables` to save new ones.
-   **`services/unusualCasesService.ts`**: A pure function responsible for preparing the definitions of new variables based on the user's selections in the "Save" tab. It does not contain state or side effects.

### 3.2. Data Flow

The process from user interaction to result is as follows:

```mermaid
graph TD
    subgraph User Interaction
        A[User opens dialog] --> B{Configure Tabs};
        B -- Variables --> C[Select Analysis/Identifier Vars];
        B -- Options --> D[Set Identification Criteria];
        B -- Save --> E[Choose Variables to Save];
        G[User clicks OK]
        C & D & E --> G;
    end

    subgraph Frontend Logic
        H(IdentifyUnusualCases.tsx) -- manages --> I(Tabs UI);
        H -- uses --> J(useUnusualCases.ts);
        J -- "gets initial vars" --> K(Zustand: useVariableStore);
        G --> L{handleConfirm in useUnusualCases};
        L -- "validates input" --> L;
        L --> M[prepareNewUnusualCasesVariables service];
        M --> N[Get new var definitions];
        N --> L;
        L -- "(placeholder for worker)" --> O[Run Analysis];
        L -- "add new vars" --> K;
        L --> P[Display output (placeholder)];
        P --> Q[Close Dialog];
    end

    A --> H;
```

1.  **Initialization**: The `IdentifyUnusualCases` component mounts, and the `useUnusualCases` hook initializes its state, populating the "Available Variables" list from the global `useVariableStore`.
2.  **Configuration**: The user navigates through the tabs and configures the analysis by moving variables and setting options. All state changes are managed within the `useUnusualCases` hook.
3.  **Execution**: The user clicks "OK", triggering `handleConfirm` in the hook.
4.  **Validation**: `handleConfirm` first validates that at least one analysis variable has been selected.
5.  **Preparation**: The hook calls `prepareNewUnusualCasesVariables` from the service to get the definitions of any new variables to be created.
6.  **Analysis (Placeholder)**: The current implementation is a placeholder. In a complete implementation, the hook would delegate the core analysis (peer grouping, anomaly index calculation) to a web worker to avoid blocking the UI.
7.  **State Update**: The hook calls `addVariables` from `useVariableStore` to add the new variables to the dataset.
8.  **Output (Placeholder)**: The results would be sent to the main output viewer.
9.  **Cleanup**: The dialog closes.

## 4. Testing Strategy

The feature is tested at multiple levels to ensure correctness and stability.

#### 4.1. Main Component Testing (`__tests__/index.test.tsx`)

This suite tests the main `IdentifyUnusualCases` dialog component. It focuses on the overall structure, tab navigation, and connections to its underlying hooks, while mocking the content of each tab.

-   **Rendering**: Verifies that the dialog renders with the correct title and that all tab triggers are present.
-   **Tab Navigation**: Ensures that the "Variables" tab is visible by default and that clicking another tab trigger correctly switches the visible content.
-   **Action Buttons**: Confirms that clicking "Cancel" calls `onClose`, "Reset" calls `handleReset`, and "OK" triggers the confirmation logic.

#### 4.2. UI Component Testing (`__tests__/OptionsTab.test.tsx`)

This suite tests the `OptionsTab` component in isolation, verifying its controls and state interactions.

-   **Rendering**: Checks that all form controls are rendered with their correct default values.
-   **State Changes**: Verifies that state-setting functions are called when the corresponding input values change.
-   **Conditional Disabling**: Ensures that input fields are correctly enabled or disabled based on user selections (e.g., the "Cutoff" input is disabled when its checkbox is unchecked).

#### 4.3. Core Logic Hook Testing (`__tests__/useUnusualCases.test.ts`)

This suite tests the primary business logic contained within the `useUnusualCases` custom hook, mocking `useVariableStore` to provide a consistent test environment.

-   **Initialization**: Verifies that the hook correctly initializes its state, loading variables from the store.
-   **Variable Movement**: Tests moving variables between the "available", "analysis", and "identifier" lists.
-   **Reset Functionality**: Confirms that the `handleReset` function correctly reverts all state slices back to their initial default values.
-   **Confirmation Logic**: Checks that `handleConfirm` validates input correctly and calls `addVariables` from the store when new variables are meant to be saved.
-
-## Sample Test Data
-
-To test the Identify Unusual Cases feature, you can use the following sample dataset:
-
-```
-ID,Age,Income,Education,Expenses,Savings
-1,35,65000,16,45000,15000
-2,42,72000,18,48000,20000
-3,28,58000,16,40000,12000
-4,39,68000,14,47000,18000
-5,45,75000,16,52000,22000
-6,31,62000,12,43000,15000
-7,36,67000,16,46000,18000
-8,29,59000,14,42000,13000
-9,33,64000,16,44000,16000
-10,27,30000,12,45000,5000
-```
-
-### Test Scenarios
-
-1. **Basic Anomaly Detection**:
-   - Analysis Variables: Age, Income, Education, Expenses, Savings
-   - Expected Result: Case #10 should be flagged as unusual due to its anomalous combination of low income, high expenses, and low savings
-
-2. **Financial Patterns Analysis**:
-   - Analysis Variables: Income, Expenses, Savings
-   - Expected Result: Cases with unusual ratios of income to expenses or savings should be highlighted
-
-3. **Specific Peer Group Analysis**:
-   - Analysis Variables: Age, Education, Income
-   - Set fixed number of peer groups: 2
-   - Expected Result: Cases should be divided into roughly two education/age/income groups, with unusual cases in each group identified
-
-These examples demonstrate how to use the Identify Unusual Cases feature for different analytical needs and validate the expected outcomes.

</rewritten_file>