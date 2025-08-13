# Modal System - Comprehensive Statistical Analysis Interface

Direktori `Modals/` berisi comprehensive modal system untuk semua statistical operations dalam Statify. System ini mengorganisir modal dialogs berdasarkan functional categories dengan architecture yang scalable dan maintainable.

## 📁 Struktur Arsitektur

```
Modals/
├── ModalManager.tsx           # Central modal state management
├── ModalRegistry.tsx          # Modal registration system
├── ModalRenderer.tsx          # Dynamic modal rendering
├── README.md                  # This documentation
├── TESTING.md                 # Testing guidelines
├── __tests__/                 # Core modal system tests
├── types/                     # Global modal type definitions
│
├── Analyze/                   # Statistical Analysis Modals
│   ├── AnalyzeRegistry.tsx        # Analysis modal registry
│   ├── Classify/                  # Classification analysis
│   ├── CompareMeans/             # Mean comparison tests
│   ├── Correlate/                # Correlation analysis
│   ├── Descriptive/              # Descriptive statistics
│   ├── dimension-reduction/      # Factor analysis, PCA
│   ├── general-linear-model/     # GLM analysis
│   ├── NonparametricTests/       # Non-parametric tests
│   └── TimeSeries/               # Time series analysis
│
├── Data/                     # Data Management Modals
│   ├── DataMenu.tsx              # Data operations menu
│   ├── DataRegistry.tsx          # Data modal registry
│   ├── Aggregate/                # Data aggregation
│   ├── DefineDateTime/           # Date/time definition
│   ├── DefineVarProps/          # Variable properties
│   ├── DuplicateCases/          # Case duplication
│   ├── Restructure/             # Data restructuring
│   ├── SelectCases/             # Case selection
│   ├── SetMeasurementLevel/     # Measurement level setting
│   ├── SortCases/               # Case sorting
│   ├── SortVars/                # Variable sorting
│   ├── Transpose/               # Data transposition
│   ├── UnusualCases/            # Outlier detection
│   └── WeightCases/             # Case weighting
│
├── Edit/                     # Editing Operations
│   ├── EditMenu.tsx              # Edit operations menu
│   ├── EditRegistry.tsx          # Edit modal registry
│   ├── Actions/                  # General edit actions
│   ├── FindReplace/             # Find and replace
│   └── GoTo/                    # Navigation operations
│
├── File/                     # File Operations
│   ├── FileMenu.tsx              # File operations menu
│   ├── FileRegistry.tsx          # File modal registry
│   ├── Actions/                  # General file actions
│   ├── ExampleDataset/          # Example dataset loading
│   ├── ExportCsv/               # CSV export
│   ├── ExportExcel/             # Excel export
│   ├── ImportClipboard/         # Clipboard import
│   ├── ImportCsv/               # CSV import
│   ├── ImportExcel/             # Excel import
│   ├── OpenSavFile/             # SPSS file operations
│   └── Print/                   # Print operations
│
├── Graphs/                   # Chart Creation
│   ├── ChartTypes.ts             # Chart type definitions
│   ├── ChartBuilder/            # Interactive chart builder
│   └── LegacyDialogs/           # Legacy chart dialogs
│
├── Regression/               # Regression Analysis
│   ├── CurveEstimation/         # Curve estimation
│   └── Linear/                  # Linear regression
│
└── Transform/                # Data Transformation
    ├── TransformMenu.tsx         # Transform operations menu
    ├── TransformRegistry.ts      # Transform modal registry
    ├── ComputeVariable/         # Variable computation
    ├── recode/                  # Value recoding
    ├── recodeDifferentVariables/ # Multi-variable recoding
    └── recodeSameVariables/     # Single variable recoding
```

## 🎯 Modal System Architecture

### Core Modal Infrastructure

#### ModalManager.tsx
**Purpose**: Central modal state management dan lifecycle control

```typescript
interface ModalManagerFeatures {
  // State management
  modalStack: Modal[];
  activeModals: Map<string, Modal>;
  modalHistory: ModalHistoryEntry[];
  
  // Modal lifecycle
  openModal: (type: ModalType, props?: ModalProps) => void;
  closeModal: (modalId?: string) => void;
  closeAllModals: () => void;
  
  // Stack management
  pushModal: (modal: Modal) => void;
  popModal: () => void;
  replaceModal: (modal: Modal) => void;
  
  // State persistence
  persistModalState: boolean;
  restoreModalState: () => void;
}
```

#### ModalRegistry.tsx
**Purpose**: Modal registration dan discovery system

```typescript
interface ModalRegistrySystem {
  // Registration
  registerModal: (type: ModalType, component: ModalComponent) => void;
  registerModalGroup: (group: ModalGroup) => void;
  
  // Discovery
  getModal: (type: ModalType) => ModalComponent;
  getModalsByCategory: (category: ModalCategory) => ModalComponent[];
  
  // Validation
  validateModalType: (type: ModalType) => boolean;
  validateModalProps: (type: ModalType, props: ModalProps) => boolean;
  
  // Categories
  categories: {
    analyze: AnalyzeModals;
    data: DataModals;
    edit: EditModals;
    file: FileModals;
    graphs: GraphModals;
    regression: RegressionModals;
    transform: TransformModals;
  };
}
```

#### ModalRenderer.tsx
**Purpose**: Dynamic modal rendering dengan lazy loading

```typescript
interface ModalRenderingSystem {
  // Dynamic rendering
  renderModal: (modal: Modal) => ReactElement;
  
  // Lazy loading
  lazyLoadModal: (type: ModalType) => Promise<ModalComponent>;
  preloadModals: (types: ModalType[]) => Promise<void>;
  
  // Performance
  modalCaching: boolean;
  componentPool: ComponentPool;
  
  // Error handling
  errorBoundary: boolean;
  fallbackComponent: FallbackComponent;
}
```

## 📊 Statistical Analysis Modals (Analyze/)

### Analysis Categories

#### Descriptive Statistics
```typescript
interface DescriptiveModals {
  // Basic descriptives
  'analyze.descriptive.frequencies': FrequenciesModal;
  'analyze.descriptive.descriptives': DescriptivesModal;
  'analyze.descriptive.explore': ExploreModal;
  'analyze.descriptive.crosstabs': CrosstabsModal;
  
  // Configuration
  variableSelection: VariableSelectionPanel;
  statisticsOptions: StatisticsOptionsPanel;
  chartsOptions: ChartsOptionsPanel;
  formatOptions: FormatOptionsPanel;
}
```

#### Compare Means Analysis
```typescript
interface CompareMeansModals {
  // T-tests
  'analyze.compare-means.one-sample-t-test': OneSampleTTestModal;
  'analyze.compare-means.independent-samples-t-test': IndependentSamplesTTestModal;
  'analyze.compare-means.paired-samples-t-test': PairedSamplesTTestModal;
  
  // ANOVA
  'analyze.compare-means.one-way-anova': OneWayAnovaModal;
  
  // Common features
  confidenceIntervals: boolean;
  effectSizeCalculation: boolean;
  assumptionTests: boolean;
  bootstrapping: boolean;
}
```

#### Correlation Analysis
```typescript
interface CorrelationModals {
  // Correlation types
  'analyze.correlate.bivariate': BivariateCorrelationModal;
  'analyze.correlate.partial': PartialCorrelationModal;
  
  // Features
  correlationMatrix: boolean;
  significanceTesting: boolean;
  scatterplotMatrix: boolean;
  correlationCoefficients: CorrelationCoefficient[];
}
```

#### Classification Analysis
```typescript
interface ClassificationModals {
  // Classification methods
  'analyze.classify.discriminant': DiscriminantAnalysisModal;
  'analyze.classify.hierarchical-cluster': HierarchicalClusterModal;
  'analyze.classify.k-means-cluster': KMeansClusterModal;
  'analyze.classify.nearest-neighbor': NearestNeighborModal;
  'analyze.classify.roc-analysis': ROCAnalysisModal;
  'analyze.classify.decision-tree': DecisionTreeModal;
  'analyze.classify.two-step-cluster': TwoStepClusterModal;
  
  // Common features
  validationMethods: ValidationMethod[];
  performanceMetrics: PerformanceMetric[];
  visualizations: ClassificationVisualization[];
}
```

#### Dimension Reduction
```typescript
interface DimensionReductionModals {
  // Methods
  'analyze.dimension-reduction.factor': FactorAnalysisModal;
  'analyze.dimension-reduction.correspondence': CorrespondenceAnalysisModal;
  'analyze.dimension-reduction.optimal-scaling': OptimalScalingModal;
  
  // Features
  extractionMethods: ExtractionMethod[];
  rotationMethods: RotationMethod[];
  screenPlots: boolean;
  factorScores: boolean;
}
```

#### General Linear Model
```typescript
interface GeneralLinearModelModals {
  // GLM types
  'analyze.glm.univariate': UnivariateGLMModal;
  'analyze.glm.multivariate': MultivariateGLMModal;
  'analyze.glm.repeated-measures': RepeatedMeasuresModal;
  'analyze.glm.variance-components': VarianceComponentsModal;
  
  // Features
  customContrasts: boolean;
  postHocTests: boolean;
  profilePlots: boolean;
  residualAnalysis: boolean;
}
```

#### Nonparametric Tests
```typescript
interface NonparametricModals {
  // Test types
  'analyze.nonparametric.chi-square': ChiSquareModal;
  'analyze.nonparametric.binomial': BinomialModal;
  'analyze.nonparametric.runs': RunsTestModal;
  'analyze.nonparametric.mann-whitney': MannWhitneyModal;
  'analyze.nonparametric.wilcoxon': WilcoxonModal;
  'analyze.nonparametric.kruskal-wallis': KruskalWallisModal;
  'analyze.nonparametric.friedman': FriedmanModal;
  
  // Features
  exactTests: boolean;
  monteCarloEstimation: boolean;
  tiesHandling: TiesMethod[];
}
```

#### Time Series Analysis
```typescript
interface TimeSeriesModals {
  // Analysis types
  'analyze.time-series.seasonal-decomposition': SeasonalDecompositionModal;
  'analyze.time-series.exponential-smoothing': ExponentialSmoothingModal;
  'analyze.time-series.arima': ARIMAModal;
  'analyze.time-series.spectral-analysis': SpectralAnalysisModal;
  
  // Features
  trendAnalysis: boolean;
  seasonalityDetection: boolean;
  forecasting: boolean;
  stationarityTests: boolean;
}
```

## 💾 Data Management Modals (Data/)

### Data Operations Categories

#### Data Import/Export
```typescript
interface DataIOModals {
  // Import operations
  'data.import.csv': ImportCsvModal;
  'data.import.excel': ImportExcelModal;
  'data.import.spss': ImportSpssModal;
  'data.import.clipboard': ImportClipboardModal;
  
  // Export operations
  'data.export.csv': ExportCsvModal;
  'data.export.excel': ExportExcelModal;
  'data.export.spss': ExportSpssModal;
  
  // Features
  encodingSupport: string[];
  delimiters: string[];
  previewMode: boolean;
  errorHandling: ErrorHandlingStrategy[];
}
```

#### Data Transformation
```typescript
interface DataTransformationModals {
  // Case operations
  'data.select-cases': SelectCasesModal;
  'data.weight-cases': WeightCasesModal;
  'data.duplicate-cases': DuplicateCasesModal;
  'data.sort-cases': SortCasesModal;
  
  // Variable operations
  'data.sort-variables': SortVariablesModal;
  'data.transpose': TransposeModal;
  'data.aggregate': AggregateModal;
  'data.restructure': RestructureModal;
  
  // Features
  conditionalLogic: boolean;
  expressionBuilder: boolean;
  previewResults: boolean;
  undoSupport: boolean;
}
```

#### Variable Definition
```typescript
interface VariableDefinitionModals {
  // Variable properties
  'data.define-variable-properties': DefineVariablePropertiesModal;
  'data.set-measurement-level': SetMeasurementLevelModal;
  'data.define-datetime': DefineDateTimeModal;
  
  // Data quality
  'data.unusual-cases': UnusualCasesModal;
  'data.missing-values': MissingValuesModal;
  
  // Features
  bulkOperations: boolean;
  validationRules: ValidationRule[];
  metadataManagement: boolean;
}
```

## 🗂 File Operations (File/)

### File Management
```typescript
interface FileOperationModals {
  // File operations
  'file.open': OpenFileModal;
  'file.save': SaveFileModal;
  'file.save-as': SaveAsModal;
  'file.print': PrintModal;
  
  // Data examples
  'file.example-dataset': ExampleDatasetModal;
  
  // Features
  fileFormatSupport: FileFormat[];
  compressionSupport: boolean;
  batchOperations: boolean;
  cloudIntegration: boolean;
}
```

## 🎨 Chart Creation (Graphs/)

### Chart Builder System
```typescript
interface ChartModals {
  // Chart builder
  'graphs.chart-builder': ChartBuilderModal;
  'graphs.legacy-dialogs': LegacyChartModal;
  
  // Chart types
  chartTypes: {
    histogram: HistogramOptions;
    scatterplot: ScatterplotOptions;
    boxplot: BoxplotOptions;
    barChart: BarChartOptions;
    lineChart: LineChartOptions;
    pieChart: PieChartOptions;
  };
  
  // Features
  interactiveBuilder: boolean;
  templateLibrary: boolean;
  customization: ChartCustomization;
  exportOptions: ChartExportOption[];
}
```

## 🔄 Data Transformation (Transform/)

### Transformation Operations
```typescript
interface TransformationModals {
  // Variable computation
  'transform.compute-variable': ComputeVariableModal;
  
  // Recoding operations
  'transform.recode-same-variables': RecodeSameVariablesModal;
  'transform.recode-different-variables': RecodeDifferentVariablesModal;
  
  // Features
  expressionEditor: boolean;
  functionLibrary: FunctionLibrary;
  conditionalTransforms: boolean;
  batchProcessing: boolean;
}
```

## 🏗 Modal Development Architecture

### Feature-Sliced Design Pattern
Setiap modal feature mengikuti structure yang consistent:

```typescript
// Standard modal feature structure
interface ModalFeatureStructure {
  // Entry point
  'index.tsx': MainModalComponent;
  
  // Core logic
  'hooks/': {
    'useModalLogic.ts': CoreBusinessLogic;
    'useValidation.ts': ValidationLogic;
    'useFormState.ts': FormStateManagement;
  };
  
  // Services
  'services/': {
    'modalService.ts': APIIntegration;
    'workerService.ts': WorkerCommunication;
  };
  
  // Components
  'components/': {
    'ModalTabs.tsx': TabComponents;
    'OptionsPanel.tsx': OptionsPanels;
    'PreviewPanel.tsx': PreviewComponents;
  };
  
  // Types & utilities
  'types.ts': TypeDefinitions;
  'utils/': UtilityFunctions;
  '__tests__/': TestFiles;
  'README.md': FeatureDocumentation;
}
```

### State Management Pattern
```typescript
interface ModalStatePattern {
  // Local state
  formState: FormState;
  validationState: ValidationState;
  uiState: UIState;
  
  // Global state integration
  dataStore: DataStoreIntegration;
  resultStore: ResultStoreIntegration;
  modalStore: ModalStoreIntegration;
  
  // Actions
  actions: {
    updateForm: (updates: Partial<FormState>) => void;
    validateForm: () => ValidationResult;
    submitForm: () => Promise<SubmissionResult>;
    resetForm: () => void;
  };
}
```

### Validation System
```typescript
interface ModalValidationSystem {
  // Validation types
  synchronousValidation: SyncValidator[];
  asynchronousValidation: AsyncValidator[];
  crossFieldValidation: CrossFieldValidator[];
  
  // Validation rules
  required: RequiredFieldRule[];
  dataType: DataTypeRule[];
  range: RangeRule[];
  custom: CustomRule[];
  
  // Error handling
  errorDisplay: ErrorDisplayStrategy;
  errorRecovery: ErrorRecoveryStrategy;
  userGuidance: UserGuidanceSystem;
}
```

## 🧪 Testing Strategy

### Modal Testing Categories
```typescript
interface ModalTestingStrategy {
  // Unit tests
  hookTesting: HookTestStrategy;
  serviceTesting: ServiceTestStrategy;
  utilityTesting: UtilityTestStrategy;
  
  // Integration tests
  modalIntegration: ModalIntegrationTest;
  storeIntegration: StoreIntegrationTest;
  workerIntegration: WorkerIntegrationTest;
  
  // E2E tests
  userWorkflows: WorkflowTest[];
  crossModalWorkflows: CrossModalTest[];
  
  // Performance tests
  loadTesting: LoadTestStrategy;
  memoryTesting: MemoryTestStrategy;
}
```

### Test Examples
```typescript
// Modal logic testing
describe('AnalysisModalLogic', () => {
  it('validates variable selection requirements', () => {
    const { result } = renderHook(() => useAnalysisLogic());
    
    act(() => {
      result.current.selectVariables(['var1', 'var2']);
    });
    
    expect(result.current.isValid).toBe(true);
  });
  
  it('handles analysis submission', async () => {
    const mockService = jest.fn().mockResolvedValue(mockResult);
    const { result } = renderHook(() => useAnalysisLogic({ service: mockService }));
    
    await act(async () => {
      await result.current.submitAnalysis();
    });
    
    expect(mockService).toHaveBeenCalledWith(expectedConfig);
  });
});

// Modal integration testing
describe('ModalSystem Integration', () => {
  it('handles modal stack management', () => {
    render(<ModalRenderer />);
    
    act(() => {
      modalStore.openModal('analyze.descriptives');
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    act(() => {
      modalStore.openModal('analyze.frequencies');
    });
    
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
  });
});
```

## 📋 Development Guidelines

### Modal Development Checklist
```typescript
interface ModalDevelopmentChecklist {
  // Architecture
  featureSlicedStructure: boolean;
  consistentNaming: boolean;
  properTypeDefinitions: boolean;
  
  // Functionality
  validationImplemented: boolean;
  errorHandlingImplemented: boolean;
  loadingStatesImplemented: boolean;
  
  // Integration
  storeIntegration: boolean;
  workerIntegration: boolean;
  routingIntegration: boolean;
  
  // Quality
  unitTestsCoverage: number; // >= 80%
  integrationTests: boolean;
  documentation: boolean;
  
  // Performance
  lazyLoading: boolean;
  memoization: boolean;
  virtualScrolling: boolean; // for large lists
  
  // Accessibility
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  focusManagement: boolean;
}
```

### Best Practices
```typescript
// 1. Consistent modal props interface
interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<ModalData>;
  onSubmit?: (data: ModalData) => void;
  onCancel?: () => void;
}

// 2. Error boundary pattern
const ModalWithErrorBoundary = ({ children }) => (
  <ModalErrorBoundary>
    {children}
  </ModalErrorBoundary>
);

// 3. Performance optimization
const OptimizedModal = React.memo(({ isOpen, ...props }) => {
  // Only render when open
  if (!isOpen) return null;
  
  return <ModalContent {...props} />;
});

// 4. Accessibility compliance
const AccessibleModal = ({ isOpen, onClose, title, children }) => (
  <Dialog
    open={isOpen}
    onClose={onClose}
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <DialogTitle id="modal-title">{title}</DialogTitle>
    <DialogContent id="modal-description">
      {children}
    </DialogContent>
  </Dialog>
);
```

### Code Quality Standards
```typescript
// Type safety
interface StrictModalConfiguration {
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
  defaultValues: DefaultValues;
}

// Error handling
const robustModalHandler = async (operation: () => Promise<void>) => {
  try {
    await operation();
  } catch (error) {
    handleModalError(error);
    showUserFriendlyMessage(error);
  }
};

// Performance monitoring
const performanceOptimizedModal = () => {
  const startTime = performance.now();
  
  useEffect(() => {
    const endTime = performance.now();
    trackModalPerformance('modal-load-time', endTime - startTime);
  }, []);
};
```

---

Direktori `Modals/` menyediakan comprehensive statistical analysis interface dengan architecture yang scalable, maintainable, dan user-friendly. Setiap modal category dirancang untuk mendukung specific workflows dalam statistical analysis dengan consistency dan professional quality.