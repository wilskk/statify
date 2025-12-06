# Common Components - Shared Application Components

Direktori `Common/` berisi shared components yang digunakan di berbagai bagian aplikasi Statify. Components ini menyediakan functionality yang bersifat cross-cutting dan reusable di seluruh application ecosystem.

## 📁 Struktur

```
Common/
├── DataTableErrorBoundary.tsx    # Error boundary untuk data table operations
├── iconHelper.tsx                # Icon management dan utility functions
├── ResultNavigationObserver.tsx  # Navigation tracking untuk analysis results
├── TourComponents.tsx            # Guided tour system components
├── VariableListManager.tsx       # Variable list management interface
└── __tests__/                   # Component tests
    ├── TourComponents.test.tsx       # Tour system testing
    └── VariableListManager.test.tsx  # Variable manager testing
```

## 🎯 Component Overview

### Design Philosophy
- **Cross-Cutting Concerns**: Components yang digunakan di multiple features
- **Business Logic Integration**: Deep integration dengan Statify's business requirements
- **Error Resilience**: Robust error handling dan recovery mechanisms
- **User Experience**: Enhanced UX features seperti guided tours dan navigation tracking
- **Data Management**: Specialized utilities untuk statistical data handling

## 🛡️ DataTableErrorBoundary.tsx

### Purpose
Specialized error boundary untuk data table operations dengan statistical data handling.

### Core Features
```typescript
interface DataTableErrorBoundaryFeatures {
  // Error catching
  dataTableErrors: boolean;
  handsontableErrors: boolean;
  statisticalDataErrors: boolean;
  
  // Recovery mechanisms
  gracefulDegradation: boolean;
  dataRestoration: boolean;
  userNotification: boolean;
  
  // Logging & debugging
  errorReporting: boolean;
  stackTraceCapture: boolean;
  contextInformation: boolean;
}
```

### Implementation Pattern
```typescript
interface DataTableErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  timestamp: Date;
  dataContext: DataContext;
}

class DataTableErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      timestamp: new Date(),
      dataContext: {}
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
      timestamp: new Date()
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error dengan data context
    this.logDataTableError(error, errorInfo);
    
    // Report to error tracking service
    this.reportError(error, errorInfo);
    
    // Attempt data recovery
    this.attemptDataRecovery();
  }
}
```

### Error Recovery Strategies
```typescript
interface ErrorRecoveryStrategies {
  // Data recovery
  restoreFromLocalStorage: () => void;
  restoreFromIndexedDB: () => void;
  restoreFromBackup: () => void;
  
  // UI recovery
  resetTableState: () => void;
  clearSelection: () => void;
  reloadData: () => void;
  
  // User communication
  showErrorDialog: () => void;
  showRecoveryOptions: () => void;
  showDataLossWarning: () => void;
}
```

### Usage Examples
```typescript
// Wrapping data table components
<DataTableErrorBoundary
  onError={handleDataTableError}
  recoveryActions={dataRecoveryActions}
  fallbackComponent={DataTableErrorFallback}
>
  <HandsontableWrapper />
  <DataTable />
  <VariableTable />
</DataTableErrorBoundary>

// With custom error handling
<DataTableErrorBoundary
  errorReporting={true}
  autoRecovery={true}
  preserveUserData={true}
>
  <ComplexDataVisualization />
</DataTableErrorBoundary>
```

## 🎨 iconHelper.tsx

### Purpose
Centralized icon management system dengan caching dan performance optimization.

### Core Functionality
```typescript
interface IconHelperAPI {
  // Icon retrieval
  getIcon: (name: IconName, size?: IconSize) => IconElement;
  getIconSVG: (name: IconName) => SVGElement;
  getIconClass: (name: IconName) => string;
  
  // Icon sets
  getStatisticalIcons: () => IconSet;
  getUIIcons: () => IconSet;
  getAnalysisIcons: () => IconSet;
  
  // Dynamic loading
  loadIconSet: (setName: IconSetName) => Promise<IconSet>;
  preloadIcons: (iconNames: IconName[]) => Promise<void>;
  
  // Customization
  registerCustomIcon: (name: string, icon: IconDefinition) => void;
  setIconTheme: (theme: IconTheme) => void;
}
```

### Icon Categories
```typescript
interface IconCategories {
  // Statistical operations
  statistical: {
    descriptive: 'bar-chart-3';
    correlation: 'trending-up';
    regression: 'line-chart';
    anova: 'layers';
    ttest: 'target';
  };
  
  // Data operations
  data: {
    import: 'download';
    export: 'upload';
    filter: 'filter';
    sort: 'arrow-up-down';
    transform: 'shuffle';
  };
  
  // UI actions
  ui: {
    edit: 'edit-3';
    delete: 'trash-2';
    save: 'save';
    cancel: 'x';
    confirm: 'check';
  };
  
  // Navigation
  navigation: {
    back: 'arrow-left';
    forward: 'arrow-right';
    up: 'arrow-up';
    down: 'arrow-down';
    home: 'home';
  };
}
```

### Performance Features
```typescript
interface IconPerformanceFeatures {
  // Caching
  iconCache: Map<IconName, IconElement>;
  svgCache: Map<IconName, SVGElement>;
  
  // Lazy loading
  lazyLoadSets: boolean;
  preloadCritical: boolean;
  
  // Optimization
  treeShaking: boolean;
  bundleOptimization: boolean;
  compressionEnabled: boolean;
}
```

### Usage Examples
```typescript
// Basic icon usage
import { getIcon } from './iconHelper';

const AnalysisButton = () => (
  <Button>
    {getIcon('bar-chart-3', 'md')}
    Run Analysis
  </Button>
);

// Statistical icon sets
const StatisticalMenu = () => {
  const icons = getStatisticalIcons();
  
  return (
    <Menu>
      <MenuItem icon={icons.descriptive}>Descriptives</MenuItem>
      <MenuItem icon={icons.correlation}>Correlations</MenuItem>
      <MenuItem icon={icons.regression}>Regression</MenuItem>
    </Menu>
  );
};

// Dynamic icon loading
const DynamicIconComponent = ({ analysisType }) => {
  const [icon, setIcon] = useState(null);
  
  useEffect(() => {
    loadIconSet('analysis').then(icons => {
      setIcon(icons[analysisType]);
    });
  }, [analysisType]);
  
  return icon ? <>{icon}</> : <IconSkeleton />;
};
```

## 🧭 ResultNavigationObserver.tsx

### Purpose
Navigation tracking dan state management untuk analysis results dengan breadcrumb generation dan deep linking support.

### Core Features
```typescript
interface ResultNavigationObserverFeatures {
  // Navigation tracking
  routeTracking: boolean;
  breadcrumbGeneration: boolean;
  historyManagement: boolean;
  
  // State synchronization
  urlStateSync: boolean;
  persistentNavigation: boolean;
  crossSessionTracking: boolean;
  
  // Analytics
  navigationAnalytics: boolean;
  userJourneyTracking: boolean;
  performanceMetrics: boolean;
}
```

### Navigation State Management
```typescript
interface NavigationState {
  // Current location
  currentPath: string;
  currentResult: AnalysisResult | null;
  currentCategory: ResultCategory;
  
  // Navigation history
  history: NavigationEntry[];
  breadcrumbs: BreadcrumbItem[];
  
  // User behavior
  visitedResults: Set<string>;
  favoriteResults: Set<string>;
  recentResults: AnalysisResult[];
  
  // Performance tracking
  navigationStartTime: number;
  loadingStates: Map<string, LoadingState>;
}
```

### Observer Pattern Implementation
```typescript
interface NavigationObserver {
  // Event handlers
  onResultEnter: (result: AnalysisResult) => void;
  onResultExit: (result: AnalysisResult) => void;
  onCategoryChange: (category: ResultCategory) => void;
  onBreadcrumbClick: (item: BreadcrumbItem) => void;
  
  // State updates
  updateNavigationState: (state: Partial<NavigationState>) => void;
  syncWithURL: (path: string) => void;
  
  // Analytics
  trackNavigation: (event: NavigationEvent) => void;
  measurePerformance: (metric: PerformanceMetric) => void;
}
```

### Deep Linking Support
```typescript
interface DeepLinkingFeatures {
  // URL generation
  generateResultURL: (result: AnalysisResult) => string;
  generateCategoryURL: (category: ResultCategory) => string;
  
  // URL parsing
  parseResultURL: (url: string) => ResultNavigationParams;
  validateURL: (url: string) => boolean;
  
  // State restoration
  restoreFromURL: (url: string) => Promise<NavigationState>;
  shareableURLs: boolean;
}
```

### Usage Examples
```typescript
// Basic navigation observation
<ResultNavigationObserver
  onNavigationChange={handleNavigationChange}
  enableBreadcrumbs={true}
  enableDeepLinking={true}
>
  <ResultsPage />
</ResultNavigationObserver>

// With analytics tracking
<ResultNavigationObserver
  analytics={{
    trackUserJourney: true,
    measurePerformance: true,
    reportToGA: true
  }}
  persistNavigation={true}
>
  <AnalysisWorkflow />
</ResultNavigationObserver>

// Custom navigation handler
const useResultNavigation = () => {
  const observer = useNavigationObserver();
  
  const navigateToResult = useCallback((resultId: string) => {
    observer.trackNavigation({
      type: 'result-navigation',
      resultId,
      timestamp: Date.now()
    });
    
    observer.updateNavigationState({
      currentResult: getResultById(resultId),
      visitedResults: new Set([...observer.state.visitedResults, resultId])
    });
  }, [observer]);
  
  return { navigateToResult, navigationState: observer.state };
};
```

## 🎓 TourComponents.tsx

### Purpose
Comprehensive guided tour system untuk onboarding users dan introducing new features.

### Component Architecture
```typescript
interface TourSystemArchitecture {
  // Core components
  tourProvider: TourProviderComponent;
  tourButton: TourButtonComponent;
  tourCard: TourCardComponent;
  tourHighlight: TourHighlightComponent;
  
  // Tour management
  tourRegistry: TourRegistrySystem;
  tourState: TourStateManager;
  tourNavigation: TourNavigationController;
  
  // Customization
  tourThemes: TourThemeSystem;
  tourTemplates: TourTemplateLibrary;
}
```

### Tour Configuration System
```typescript
interface TourConfiguration {
  // Tour metadata
  id: string;
  title: string;
  description: string;
  category: TourCategory;
  
  // Tour steps
  steps: TourStep[];
  totalSteps: number;
  estimatedDuration: number;
  
  // Behavior
  autoStart: boolean;
  skippable: boolean;
  pausable: boolean;
  restartable: boolean;
  
  // Targeting
  targetUsers: UserSegment[];
  prerequisites: string[];
  featureFlags: string[];
  
  // Analytics
  trackCompletion: boolean;
  trackDropoff: boolean;
  collectFeedback: boolean;
}

interface TourStep {
  // Step identification
  id: string;
  order: number;
  
  // Content
  title: string;
  content: React.ReactNode;
  media?: MediaContent;
  
  // Targeting
  selector: string;
  position: PopoverPosition;
  highlightElement: boolean;
  
  // Interaction
  allowInteraction: boolean;
  waitForAction: boolean;
  nextTrigger: NextTrigger;
  
  // Validation
  validationFn?: () => boolean;
  skipCondition?: () => boolean;
}
```

### Built-in Tour Categories
```typescript
interface TourCategories {
  // Onboarding tours
  onboarding: {
    'first-time-user': FirstTimeUserTour;
    'data-import-basics': DataImportTour;
    'analysis-introduction': AnalysisIntroTour;
  };
  
  // Feature tours
  features: {
    'advanced-analysis': AdvancedAnalysisTour;
    'data-transformation': DataTransformTour;
    'result-export': ResultExportTour;
  };
  
  // Workflow tours
  workflows: {
    'complete-analysis-workflow': CompleteWorkflowTour;
    'data-cleaning-process': DataCleaningTour;
    'report-generation': ReportGenerationTour;
  };
  
  // Update tours
  updates: {
    'new-features': NewFeaturesTour;
    'ui-changes': UIChangesTour;
    'performance-improvements': PerformanceTour;
  };
}
```

### Tour State Management
```typescript
interface TourStateManager {
  // Current state
  activeTour: Tour | null;
  currentStep: number;
  tourProgress: TourProgress;
  
  // User state
  completedTours: Set<string>;
  skippedTours: Set<string>;
  tourPreferences: TourPreferences;
  
  // Session state
  sessionTours: Tour[];
  autoStartQueue: Tour[];
  
  // Actions
  startTour: (tourId: string) => void;
  pauseTour: () => void;
  resumeTour: () => void;
  skipTour: () => void;
  completeTour: () => void;
  
  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepNumber: number) => void;
}
```

### Usage Examples
```typescript
// Basic tour button
<TourButton
  tourId="data-import-basics"
  title="Learn Data Import"
  variant="primary"
  autoStart={false}
/>

// Tour card component
<TourCard
  tour={analysisWorkflowTour}
  showProgress={true}
  allowSkip={true}
  onComplete={handleTourComplete}
/>

// Tour provider wrapper
<TourProvider
  tours={applicationTours}
  autoStartConditions={{
    firstVisit: 'first-time-user',
    featureUnlocked: 'advanced-analysis'
  }}
  analytics={tourAnalytics}
>
  <Application />
</TourProvider>

// Custom tour hook
const useAnalysisTour = () => {
  const { startTour, tourState } = useTour();
  
  const startAnalysisWorkflow = useCallback(() => {
    startTour('complete-analysis-workflow', {
      context: {
        analysisType: 'descriptive',
        dataLoaded: true
      }
    });
  }, [startTour]);
  
  return {
    startAnalysisWorkflow,
    isAnalysisTourActive: tourState.activeTour?.id === 'complete-analysis-workflow'
  };
};
```

## 📊 VariableListManager.tsx

### Purpose
Comprehensive variable list management interface dengan filtering, sorting, grouping, dan bulk operations untuk statistical analysis workflows.

### Core Features
```typescript
interface VariableListManagerFeatures {
  // Display & organization
  listView: boolean;
  gridView: boolean;
  groupingByType: boolean;
  alphabeticalSorting: boolean;
  
  // Filtering
  typeFilter: boolean;
  measureLevelFilter: boolean;
  searchFilter: boolean;
  customFilters: boolean;
  
  // Selection
  singleSelection: boolean;
  multipleSelection: boolean;
  selectAll: boolean;
  contextualSelection: boolean;
  
  // Operations
  bulkOperations: boolean;
  dragAndDrop: boolean;
  quickEdit: boolean;
  propertyInspection: boolean;
}
```

### Variable Management Interface
```typescript
interface VariableManagerInterface {
  // Variable data
  variables: Variable[];
  selectedVariables: Variable[];
  filteredVariables: Variable[];
  
  // Filters
  typeFilter: VariableType[];
  measureFilter: MeasurementLevel[];
  searchTerm: string;
  customFilters: FilterCriteria[];
  
  // Sorting
  sortBy: SortCriteria;
  sortOrder: 'asc' | 'desc';
  groupBy: GroupCriteria;
  
  // Selection management
  selectionMode: SelectionMode;
  selectionConstraints: SelectionConstraint[];
  
  // Actions
  selectVariable: (variable: Variable) => void;
  selectVariables: (variables: Variable[]) => void;
  clearSelection: () => void;
  filterVariables: (criteria: FilterCriteria) => void;
  sortVariables: (criteria: SortCriteria) => void;
  groupVariables: (criteria: GroupCriteria) => void;
}
```

### Selection Patterns
```typescript
interface SelectionPatterns {
  // Analysis-specific selection
  analysisConstraints: {
    linearRegression: {
      dependentVariable: { count: 1, types: ['numeric'] };
      independentVariables: { count: [1, 10], types: ['numeric', 'ordinal'] };
    };
    
    anova: {
      dependentVariable: { count: 1, types: ['numeric'] };
      factor: { count: 1, types: ['nominal', 'ordinal'] };
    };
    
    correlation: {
      variables: { count: [2, 20], types: ['numeric'] };
    };
  };
  
  // UI interaction patterns
  interactionModes: {
    clickToSelect: boolean;
    doubleClickToAdd: boolean;
    dragToReorder: boolean;
    rightClickMenu: boolean;
  };
  
  // Validation
  selectionValidation: {
    realTimeValidation: boolean;
    errorHighlighting: boolean;
    suggestionSystem: boolean;
  };
}
```

### Advanced Features
```typescript
interface AdvancedVariableFeatures {
  // Smart suggestions
  smartSuggestions: {
    suggestSimilarVariables: boolean;
    suggestComplementaryVariables: boolean;
    analysisBasedSuggestions: boolean;
  };
  
  // Bulk operations
  bulkOperations: {
    bulkTypeChange: boolean;
    bulkMeasureChange: boolean;
    bulkDelete: boolean;
    bulkExport: boolean;
  };
  
  // Data insights
  dataInsights: {
    showStatistics: boolean;
    showDistribution: boolean;
    showMissingValues: boolean;
    showOutliers: boolean;
  };
  
  // Integration
  integrationFeatures: {
    analyzeModalIntegration: boolean;
    dataTableSync: boolean;
    resultHistoryIntegration: boolean;
  };
}
```

### Usage Examples
```typescript
// Basic variable list manager
<VariableListManager
  variables={variables}
  onSelectionChange={handleVariableSelection}
  selectionMode="multiple"
  showFilters={true}
  enableGrouping={true}
/>

// Analysis-specific configuration
<VariableListManager
  variables={variables}
  analysisType="linear-regression"
  constraintRules={linearRegressionConstraints}
  showSuggestions={true}
  onSelectionChange={handleAnalysisVariables}
/>

// Advanced features enabled
<VariableListManager
  variables={variables}
  features={{
    smartSuggestions: true,
    bulkOperations: true,
    dataInsights: true,
    realTimeValidation: true
  }}
  customFilters={customVariableFilters}
  onBulkOperation={handleBulkOperation}
/>

// Integration with analysis workflow
const AnalysisWorkflow = () => {
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('descriptive');
  
  return (
    <div className="analysis-workflow">
      <AnalysisTypeSelector
        value={analysisType}
        onChange={setAnalysisType}
      />
      
      <VariableListManager
        variables={variables}
        analysisType={analysisType}
        selectedVariables={selectedVariables}
        onSelectionChange={setSelectedVariables}
        validationRules={getValidationRules(analysisType)}
      />
      
      <AnalysisOptions
        analysisType={analysisType}
        variables={selectedVariables}
      />
    </div>
  );
};
```

## 🧪 Testing Strategy

### Component Testing Coverage
```typescript
interface TestingCoverage {
  // Unit tests
  componentRendering: boolean;
  propHandling: boolean;
  stateManagement: boolean;
  eventHandling: boolean;
  
  // Integration tests
  storeIntegration: boolean;
  modalIntegration: boolean;
  routingIntegration: boolean;
  
  // User interaction tests
  userJourneyTests: boolean;
  accessibilityTests: boolean;
  performanceTests: boolean;
  
  // Error scenarios
  errorBoundaryTests: boolean;
  recoveryTests: boolean;
  edgeCaseTests: boolean;
}
```

### Test Examples
```typescript
// TourComponents testing
describe('TourComponents', () => {
  it('renders tour button correctly', () => {
    render(<TourButton tourId="test-tour" title="Test Tour" />);
    expect(screen.getByText('Test Tour')).toBeInTheDocument();
  });
  
  it('starts tour when clicked', () => {
    const onTourStart = jest.fn();
    render(<TourButton onTourStart={onTourStart} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onTourStart).toHaveBeenCalled();
  });
});

// VariableListManager testing
describe('VariableListManager', () => {
  it('filters variables by type', () => {
    render(<VariableListManager variables={testVariables} />);
    
    fireEvent.click(screen.getByText('Numeric Only'));
    
    const displayedVariables = screen.getAllByTestId('variable-item');
    expect(displayedVariables).toHaveLength(numericVariables.length);
  });
  
  it('handles multi-selection correctly', () => {
    const onSelectionChange = jest.fn();
    render(
      <VariableListManager
        variables={testVariables}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />
    );
    
    fireEvent.click(screen.getByText('Variable 1'));
    fireEvent.click(screen.getByText('Variable 2'));
    
    expect(onSelectionChange).toHaveBeenCalledWith([variable1, variable2]);
  });
});
```

## 📋 Development Guidelines

### Component Development Standards
```typescript
// 1. Consistent props interface
interface CommonComponentProps {
  // Core functionality props
  data?: ComponentData;
  config?: ComponentConfig;
  
  // Event handlers
  onAction?: (action: ActionData) => void;
  onError?: (error: Error) => void;
  
  // UI customization
  className?: string;
  variant?: ComponentVariant;
  size?: ComponentSize;
  
  // Feature flags
  features?: FeatureFlags;
  disabled?: boolean;
}

// 2. Error handling pattern
const CommonComponent: React.FC<Props> = (props) => {
  try {
    // Component logic
    return <div>{/* Component content */}</div>;
  } catch (error) {
    // Handle component-level errors
    props.onError?.(error);
    return <ErrorFallback error={error} />;
  }
};

// 3. Performance optimization
const OptimizedCommonComponent = React.memo<Props>(
  ({ data, config, onAction }) => {
    const memoizedData = useMemo(() => 
      processData(data), [data]
    );
    
    const memoizedCallback = useCallback((action) => {
      onAction?.(action);
    }, [onAction]);
    
    return <div>{/* Optimized content */}</div>;
  }
);
```

### Integration Patterns
```typescript
// Store integration
const StoreIntegratedComponent = () => {
  const { data, actions } = useDataStore();
  const { tourState, tourActions } = useTourStore();
  
  return (
    <CommonComponent
      data={data}
      onAction={actions.handleAction}
      tourConfig={tourState.config}
    />
  );
};

// Modal integration
const ModalIntegratedComponent = () => {
  const { openModal } = useModalStore();
  
  const handleAdvancedAction = () => {
    openModal('advanced-configuration', {
      context: 'common-component',
      data: componentData
    });
  };
  
  return (
    <CommonComponent
      onAdvancedAction={handleAdvancedAction}
    />
  );
};
```

---

Direktori `Common/` menyediakan essential shared components yang mendukung core functionality aplikasi Statify dengan emphasis pada error resilience, user experience, dan statistical workflow support.
