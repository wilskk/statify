# Components Directory

Direktori `components/` berisi semua reusable UI components dan modal systems yang digunakan di seluruh aplikasi Statify. Directory ini mengorganisir components dalam kategori yang jelas untuk maintainability dan reusability.

## 📁 Struktur

```
components/
├── ui/                     # Base UI components (Shadcn/ui + custom)
├── Common/                 # Shared application components
├── Modals/                 # Comprehensive modal dialog system
│   ├── Analyze/           # Statistical analysis modals
│   ├── Data/              # Data management modals
│   ├── Edit/              # Editing operation modals
│   ├── File/              # File operation modals
│   ├── Graphs/            # Chart creation modals
│   ├── Regression/        # Regression analysis modals
│   ├── Transform/         # Data transformation modals
│   └── types/             # Modal type definitions
├── Output/                # Data visualization components
│   ├── Chart/             # Chart rendering components
│   ├── Editor/            # Output editing components
│   ├── Table/             # Table output components
│   └── text/              # Text output components
├── mode-toggle.tsx        # Dark/light theme toggle
└── theme-provider.tsx     # Theme context provider
```

## 🎯 Component Architecture

### Design Philosophy
- **Atomic Design**: Components organized from atoms → molecules → organisms
- **Modal-Driven Interface**: Extensive modal system untuk complex operations
- **Statistical Focus**: Components designed specifically untuk statistical workflows
- **Consistency**: All components follow unified design tokens
- **Accessibility**: WCAG compliance dengan keyboard navigation
- **Performance**: Optimized dengan React.memo dan strategic lazy loading

### Component Categories

#### 🧩 UI Components (`/ui`)
Foundation components based on Shadcn/ui dengan custom enhancements:

**Core Interface Components:**
- **button.tsx**: Button variants dengan statistical context
- **dialog.tsx**: Modal dialog primitives
- **input.tsx**: Form input components dengan validation
- **table.tsx**: Enhanced table components untuk data display
- **select.tsx**: Dropdown selections untuk analysis options
- **checkbox.tsx**: Multi-selection interfaces
- **radio-group.tsx**: Exclusive selection components

**Specialized UI Components:**
- **handsontable-wrapper.tsx**: Handsontable integration wrapper
- **statifyModal.tsx**: Custom modal component untuk Statify workflows
- **DataLoader.tsx**: Data loading interface component
- **LoadingOverlay.tsx**: Loading state overlays
- **SyncStatus.tsx**: Data synchronization status indicator
- **TourButton.tsx & TourCard.tsx**: Guided tour interface components

**Layout & Navigation:**
- **menubar.tsx**: Application menu bar
- **navigation-menu.tsx**: Primary navigation component
- **breadcrumb.tsx**: Breadcrumb navigation
- **tabs.tsx**: Tabbed interface components
- **accordion.tsx**: Collapsible content sections
- **resizable.tsx**: Resizable panel components

#### 🔧 Common Components (`/Common`)
Application-specific shared components:

**Core Functionality:**
- **DataTableErrorBoundary.tsx**: Specialized error handling untuk data tables
- **iconHelper.tsx**: Icon management dan utility functions
- **ResultNavigationObserver.tsx**: Navigation tracking untuk analysis results
- **TourComponents.tsx**: Comprehensive guided tour system
- **VariableListManager.tsx**: Variable list management component

**Testing Infrastructure:**
- **__tests__/TourComponents.test.tsx**: Tour system testing
- **__tests__/VariableListManager.test.tsx**: Variable management testing

#### 🪟 Modal System (`/Modals`)
Comprehensive modal architecture untuk statistical operations:

**Core Modal Infrastructure:**
```typescript
interface ModalSystemCore {
  // Central management
  modalManager: ModalManagerComponent;
  modalRegistry: ModalRegistrySystem;
  modalRenderer: DynamicModalRenderer;
  
  // Modal categories
  analyzeModals: StatisticalAnalysisModals;
  dataModals: DataManagementModals;
  editModals: EditingOperationModals;
  fileModals: FileOperationModals;
  graphModals: ChartCreationModals;
}
```

**Modal Categories:**

##### Analyze Modals (`/Analyze`)
Statistical analysis dialog system:
- **Classify/**: Classification analysis modals
- **CompareMeans/**: Mean comparison tests
- **Correlate/**: Correlation analysis dialogs
- **Descriptive/**: Descriptive statistics modals
- **dimension-reduction/**: Factor analysis, PCA modals
- **general-linear-model/**: GLM analysis dialogs
- **NonparametricTests/**: Non-parametric test modals
- **TimeSeries/**: Time series analysis dialogs

##### Data Modals (`/Data`)
Data management operations:
- **DataMenu.tsx**: Main data operations menu
- **Aggregate/**: Data aggregation dialogs
- **DefineDateTime/**: Date/time variable definition
- **DefineVarProps/**: Variable properties definition
- **DuplicateCases/**: Case duplication operations
- **Restructure/**: Data restructuring dialogs
- **SelectCases/**: Case selection criteria
- **SetMeasurementLevel/**: Measurement level assignment
- **SortCases/**: Case sorting operations
- **SortVars/**: Variable sorting operations
- **Transpose/**: Data transposition dialogs
- **UnusualCases/**: Outlier detection modals
- **WeightCases/**: Case weighting operations

##### Edit Modals (`/Edit`)
Editing operation dialogs:
- **EditMenu.tsx**: Main editing operations menu
- **Actions/**: General editing actions
- **FindReplace/**: Find and replace dialogs
- **GoTo/**: Navigation dialogs

##### File Modals (`/File`)
File operation interfaces:
- **FileMenu.tsx**: Main file operations menu
- **Actions/**: General file actions
- **ExampleDataset/**: Example dataset dialogs
- **ExportCsv/**: CSV export dialogs
- **ExportExcel/**: Excel export dialogs
- **ImportClipboard/**: Clipboard import operations
- **ImportCsv/**: CSV import dialogs
- **ImportExcel/**: Excel import dialogs
- **OpenSavFile/**: SPSS file operations
- **Print/**: Print operation dialogs

##### Graph Modals (`/Graphs`)
Chart creation system:
- **ChartTypes.ts**: Chart type definitions
- **ChartBuilder/**: Interactive chart builder
- **LegacyDialogs/**: Legacy chart creation dialogs

##### Specialized Analysis Modals:
- **Regression/**: Regression analysis (Linear, CurveEstimation)
- **Transform/**: Data transformation operations (ComputeVariable, recode)

#### 📊 Output Components (`/Output`)
Data visualization dan results display:

**Chart System (`/Chart`):**
- Advanced charting components
- Interactive chart editors
- Chart export functionality

**Editor System (`/Editor`):**
- Output editing interfaces
- Result modification tools
- Content formatting options

**Table System (`/Table`):**
- Statistical table rendering
- Interactive table components
- Table formatting options

**Text System (`/text`):**
- Text output rendering
- Report generation components
- Text formatting tools

#### 🎨 Theme System
**mode-toggle.tsx**: Dark/light mode switching
**theme-provider.tsx**: Theme context dan management

## � Modal System Architecture

### Modal Management Pattern
```typescript
interface ModalSystemArchitecture {
  // Core management
  modalManager: {
    openModal: (type: ModalType, props?: ModalProps) => void;
    closeModal: (modalId?: string) => void;
    modalStack: Modal[];
    activeModals: Map<string, Modal>;
  };
  
  // Registration system
  modalRegistry: {
    registerModal: (type: ModalType, component: ModalComponent) => void;
    getModal: (type: ModalType) => ModalComponent;
    modalMap: Map<ModalType, ModalComponent>;
  };
  
  // Dynamic rendering
  modalRenderer: {
    renderModal: (modal: Modal) => ReactElement;
    modalContainer: HTMLElement;
    zIndexManagement: ZIndexManager;
  };
}
```

### Modal Categories & Workflow Integration

#### Statistical Analysis Workflow
```typescript
interface AnalysisModalFlow {
  // Descriptive analysis
  descriptives: {
    frequencyTables: FrequencyModal;
    descriptiveStats: DescriptiveModal;
    crosstabs: CrosstabModal;
  };
  
  // Inferential analysis
  compareMeans: {
    tTests: TTestModal;
    anova: ANOVAModal;
    pairedSamples: PairedSamplesModal;
  };
  
  // Advanced analysis
  regression: {
    linear: LinearRegressionModal;
    curveEstimation: CurveEstimationModal;
  };
  
  // Multivariate analysis
  dimensionReduction: {
    factorAnalysis: FactorAnalysisModal;
    pca: PCAModal;
  };
}
```

#### Data Management Workflow
```typescript
interface DataManagementFlow {
  // Data input
  import: {
    csvImport: CSVImportModal;
    excelImport: ExcelImportModal;
    spssImport: SPSSImportModal;
    clipboardImport: ClipboardImportModal;
  };
  
  // Data transformation
  transform: {
    computeVariable: ComputeVariableModal;
    recodeValues: RecodeModal;
    restructureData: RestructureModal;
    aggregateData: AggregateModal;
  };
  
  // Data selection
  selection: {
    selectCases: SelectCasesModal;
    sortCases: SortCasesModal;
    weightCases: WeightCasesModal;
    duplicateCases: DuplicateCasesModal;
  };
  
  // Data export
  export: {
    csvExport: CSVExportModal;
    excelExport: ExcelExportModal;
    spssExport: SPSSExportModal;
  };
}
```

### Registry Pattern Implementation
```typescript
// Modal registration example
const AnalyzeRegistry = {
  // Descriptive statistics
  'analyze.descriptives.frequencies': FrequenciesModal,
  'analyze.descriptives.descriptives': DescriptivesModal,
  'analyze.descriptives.crosstabs': CrosstabsModal,
  
  // Compare means
  'analyze.compare-means.one-sample-t-test': OneSampleTTestModal,
  'analyze.compare-means.independent-samples-t-test': IndependentTTestModal,
  'analyze.compare-means.paired-samples-t-test': PairedTTestModal,
  'analyze.compare-means.one-way-anova': OneWayANOVAModal,
  
  // Correlations
  'analyze.correlate.bivariate': BivariateCorrelationModal,
  'analyze.correlate.partial': PartialCorrelationModal,
  
  // Regression
  'analyze.regression.linear': LinearRegressionModal,
  'analyze.regression.curve-estimation': CurveEstimationModal,
  
  // Nonparametric tests
  'analyze.nonparametric.chi-square': ChiSquareModal,
  'analyze.nonparametric.mann-whitney': MannWhitneyModal,
  'analyze.nonparametric.wilcoxon': WilcoxonModal,
  
  // Time series
  'analyze.time-series.seasonal-decomposition': SeasonalDecompositionModal,
};
```

## 🛠 Component Development Guidelines

### Statistical Component Pattern
```typescript
// StatisticalComponent.tsx
interface StatisticalComponentProps {
  // Data props
  data?: DataSet;
  variables?: Variable[];
  
  // Configuration props
  analysisType: AnalysisType;
  options?: AnalysisOptions;
  
  // Callback props
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onError?: (error: AnalysisError) => void;
  
  // UI props
  title?: string;
  description?: string;
  disabled?: boolean;
}

const StatisticalComponent: React.FC<StatisticalComponentProps> = ({ 
  data,
  variables = [],
  analysisType,
  options = {},
  onAnalysisComplete,
  onError,
  title,
  description,
  disabled = false
}) => {
  // Statistical logic hooks
  const { runAnalysis, isRunning, result, error } = useStatisticalAnalysis({
    data,
    variables,
    analysisType,
    options
  });
  
  // UI state
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>(variables);
  
  // Effect handlers
  useEffect(() => {
    if (result && onAnalysisComplete) {
      onAnalysisComplete(result);
    }
  }, [result, onAnalysisComplete]);
  
  return (
    <div className="statistical-component">
      <VariableSelector
        variables={variables}
        selectedVariables={selectedVariables}
        onSelectionChange={setSelectedVariables}
        analysisType={analysisType}
      />
      
      <AnalysisOptions
        analysisType={analysisType}
        options={options}
        onOptionsChange={setOptions}
      />
      
      <Button
        onClick={runAnalysis}
        disabled={disabled || isRunning}
        loading={isRunning}
      >
        Run Analysis
      </Button>
    </div>
  );
};
```

### Modal Component Pattern
```typescript
// AnalysisModal.tsx
interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisType: AnalysisType;
  initialData?: Partial<AnalysisConfig>;
  onAnalysisSubmit?: (config: AnalysisConfig) => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  analysisType,
  initialData = {},
  onAnalysisSubmit
}) => {
  const [config, setConfig] = useState<AnalysisConfig>({
    ...getDefaultConfig(analysisType),
    ...initialData
  });
  
  const { isValid, errors } = useAnalysisValidation(config, analysisType);
  const { closeModal } = useModalStore();
  
  const handleSubmit = () => {
    if (isValid && onAnalysisSubmit) {
      onAnalysisSubmit(config);
      closeModal();
    }
  };
  
  return (
    <StatifyModal
      isOpen={isOpen}
      onClose={onClose}
      title={getAnalysisTitle(analysisType)}
      size="lg"
    >
      <ModalContent>
        <VariableSelectionPanel
          analysisType={analysisType}
          selectedVariables={config.variables}
          onVariableChange={(variables) => 
            setConfig(prev => ({ ...prev, variables }))
          }
        />
        
        <OptionsPanel
          analysisType={analysisType}
          options={config.options}
          onOptionsChange={(options) =>
            setConfig(prev => ({ ...prev, options }))
          }
        />
      </ModalContent>
      
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!isValid}>
          Run Analysis
        </Button>
      </ModalFooter>
    </StatifyModal>
  );
};
```

## 🎨 UI Component System

### Design Tokens
```typescript
// Consistent spacing, colors, typography
const tokens = {
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
  },
  colors: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    secondary: 'hsl(210 40% 98%)',
    accent: 'hsl(210 40% 96%)',
    destructive: 'hsl(0 84.2% 60.2%)',
  }
};
```

### Component Variants
```typescript
// Button variants example
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## � Specialized Component Patterns

### Statistical Analysis Components
```typescript
// Variable Selection Pattern
interface VariableSelector {
  availableVariables: Variable[];
  selectedVariables: Variable[];
  analysisType: AnalysisType;
  constraintRules: ConstraintRule[];
  onSelectionChange: (variables: Variable[]) => void;
}

// Analysis Options Pattern
interface AnalysisOptionsPanel {
  analysisType: AnalysisType;
  options: AnalysisOptions;
  validationRules: ValidationRule[];
  onOptionsChange: (options: AnalysisOptions) => void;
}

// Results Display Pattern
interface ResultsDisplay {
  analysisResult: AnalysisResult;
  displayMode: 'table' | 'chart' | 'text';
  exportOptions: ExportOption[];
  editingEnabled: boolean;
}
```

### Common Component Integration
```typescript
// TourComponents usage
const ComponentWithTour = () => {
  const { startTour, tourSteps } = useTour('analysis-workflow');
  
  return (
    <div>
      <TourButton
        tourId="analysis-workflow"
        title="Learn Analysis Workflow"
      />
      
      <div data-tour-step="variable-selection">
        <VariableSelector />
      </div>
      
      <div data-tour-step="options-configuration">
        <OptionsPanel />
      </div>
    </div>
  );
};

// DataTableErrorBoundary usage
const DataComponent = () => (
  <DataTableErrorBoundary>
    <ComplexDataTable />
  </DataTableErrorBoundary>
);

// VariableListManager integration
const AnalysisModal = () => {
  const { variables, updateVariable } = useVariableStore();
  
  return (
    <div>
      <VariableListManager
        variables={variables}
        onVariableUpdate={updateVariable}
        filterByMeasurementLevel={true}
      />
    </div>
  );
};
```

### Output Component Patterns
```typescript
// Chart rendering
interface ChartComponent {
  chartType: ChartType;
  data: ChartData;
  config: ChartConfig;
  interactive: boolean;
  exportFormats: ExportFormat[];
}

// Table output
interface TableComponent {
  tableData: StatisticalTable;
  formatting: TableFormatting;
  editableValues: boolean;
  sortableColumns: boolean;
}

// Text output
interface TextComponent {
  content: FormattedText;
  richTextEnabled: boolean;
  exportOptions: TextExportOption[];
}
```

## 🎯 UI Component Categories & Usage

### Form Components
```typescript
// Statistical form patterns
<form className="space-y-6">
  <VariableSelectionField
    label="Dependent Variable"
    variables={numericVariables}
    required
    multiple={false}
  />
  
  <VariableSelectionField
    label="Independent Variables"
    variables={allVariables}
    multiple={true}
    maxSelections={10}
  />
  
  <OptionsGroup title="Analysis Options">
    <Checkbox 
      id="descriptive-stats"
      label="Descriptive statistics"
      defaultChecked
    />
    
    <Select value={method} onValueChange={setMethod}>
      <SelectTrigger>
        <SelectValue placeholder="Select method" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="enter">Enter</SelectItem>
        <SelectItem value="stepwise">Stepwise</SelectItem>
      </SelectContent>
    </Select>
  </OptionsGroup>
</form>
```

### Data Display Components
```typescript
// Enhanced table with statistical features
<EnhancedTable
  data={statisticalData}
  columns={[
    { id: 'variable', header: 'Variable', sortable: true },
    { id: 'mean', header: 'Mean', type: 'numeric', decimals: 3 },
    { id: 'stddev', header: 'Std. Deviation', type: 'numeric' },
    { id: 'significance', header: 'Sig.', type: 'significance' }
  ]}
  pagination={true}
  exportEnabled={true}
  filterEnabled={true}
/>

// Interactive charts
<StatisticalChart
  type="scatterplot"
  data={correlationData}
  config={{
    xAxis: selectedXVariable,
    yAxis: selectedYVariable,
    groupBy: groupingVariable,
    regressionLine: showRegression
  }}
  onPointClick={handlePointSelection}
  exportFormats={['png', 'svg', 'pdf']}
/>
```

### Navigation Components
```typescript
// Analysis navigation
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Analyze</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-3 p-6 md:w-[400px]">
          <NavigationMenuLink asChild>
            <AnalysisMenuItem
              title="Descriptive Statistics"
              description="Frequencies, descriptives, crosstabs"
              href="/analyze/descriptive"
            />
          </NavigationMenuLink>
          {/* More analysis options */}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>

// Result navigation with breadcrumbs
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard/result">Results</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Linear Regression Analysis</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

## � State Management dalam Components

### Local Component State
```typescript
// Statistical component with local state
const AnalysisComponent = () => {
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({});
  const [isRunning, setIsRunning] = useState(false);
  
  // Derived state
  const isReadyToAnalyze = useMemo(() => 
    selectedVariables.length > 0 && !isRunning, 
    [selectedVariables, isRunning]
  );
  
  return (
    <div>
      <VariableSelector 
        variables={selectedVariables}
        onChange={setSelectedVariables}
      />
      <AnalysisOptionsPanel
        options={analysisOptions}
        onChange={setAnalysisOptions}
      />
      <Button disabled={!isReadyToAnalyze}>
        Run Analysis
      </Button>
    </div>
  );
};
```

### Global State Integration
```typescript
// Integration with Zustand stores
const ModalAwareComponent = () => {
  // Data stores
  const { data, variables } = useDataStore();
  const { results, addResult } = useResultStore();
  
  // UI stores
  const { openModal, closeModal } = useModalStore();
  const { viewMode } = useTableRefStore();
  
  // Modal integration
  const handleOpenAnalysis = (analysisType: AnalysisType) => {
    openModal(`analyze.${analysisType}`, {
      availableVariables: variables,
      currentData: data
    });
  };
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

## ♿ Accessibility & User Experience

### ARIA Support
```typescript
// Statistical component dengan accessibility
<div role="region" aria-labelledby="analysis-title">
  <h2 id="analysis-title">Statistical Analysis</h2>
  
  <fieldset>
    <legend>Variable Selection</legend>
    <div role="listbox" aria-multiselectable="true">
      {variables.map(variable => (
        <div
          key={variable.id}
          role="option"
          aria-selected={selectedVariables.includes(variable)}
          onClick={() => toggleVariable(variable)}
        >
          {variable.label}
        </div>
      ))}
    </div>
  </fieldset>
  
  <button
    type="button"
    aria-describedby="analysis-help"
    disabled={!canRunAnalysis}
  >
    Run Analysis
  </button>
  <div id="analysis-help" className="sr-only">
    Select at least one variable to run analysis
  </div>
</div>
```

### Keyboard Navigation
```typescript
// Enhanced keyboard support
const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(items[focusedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedIndex(0);
        break;
    }
  }, [items, focusedIndex, onSelect]);
  
  return { focusedIndex, handleKeyDown };
};
```

## 🧪 Component Testing Strategy

### Statistical Component Testing
```typescript
// Analysis component testing
describe('AnalysisModal', () => {
  it('validates variable selection requirements', () => {
    render(<AnalysisModal analysisType="linear-regression" />);
    
    const runButton = screen.getByText('Run Analysis');
    expect(runButton).toBeDisabled();
    
    // Select dependent variable
    fireEvent.click(screen.getByText('Select dependent variable'));
    fireEvent.click(screen.getByText('Income'));
    
    // Select independent variable
    fireEvent.click(screen.getByText('Select independent variables'));
    fireEvent.click(screen.getByText('Education'));
    
    expect(runButton).toBeEnabled();
  });
  
  it('handles analysis submission correctly', async () => {
    const onSubmit = jest.fn();
    render(
      <AnalysisModal 
        analysisType="descriptives"
        onAnalysisSubmit={onSubmit}
      />
    );
    
    // Configure analysis
    fireEvent.click(screen.getByText('Age'));
    fireEvent.click(screen.getByText('Income'));
    
    // Submit analysis
    fireEvent.click(screen.getByText('Run Analysis'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.arrayContaining(['Age', 'Income']),
          analysisType: 'descriptives'
        })
      );
    });
  });
});
```

### Modal System Testing
```typescript
// Modal integration testing
describe('ModalSystem', () => {
  it('handles modal registration and rendering', () => {
    const { openModal } = useModalStore.getState();
    
    render(<ModalRenderer />);
    
    act(() => {
      openModal('analyze.descriptives', { variables: testVariables });
    });
    
    expect(screen.getByText('Descriptive Statistics')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  
  it('manages modal stack correctly', () => {
    const { openModal, closeModal } = useModalStore.getState();
    
    render(<ModalRenderer />);
    
    // Open first modal
    act(() => {
      openModal('analyze.descriptives');
    });
    
    // Open second modal
    act(() => {
      openModal('data.import-csv');
    });
    
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
    
    // Close top modal
    act(() => {
      closeModal();
    });
    
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
});
```

## 📋 Best Practices & Guidelines

### Component Architecture Principles
```typescript
// 1. Single Responsibility
const VariableSelector = ({ variables, onSelect }) => {
  // Only handles variable selection logic
};

// 2. Composition over Inheritance
const AnalysisDialog = ({ children, analysisType }) => (
  <Dialog>
    <DialogHeader>
      <DialogTitle>{getAnalysisTitle(analysisType)}</DialogTitle>
    </DialogHeader>
    <DialogContent>
      {children}
    </DialogContent>
  </Dialog>
);

// 3. Consistent Props Interface
interface ComponentProps {
  // Data props first
  data?: DataType;
  
  // Configuration props
  options?: OptionsType;
  
  // Event handlers
  onAction?: (data: ActionData) => void;
  
  // UI props last
  className?: string;
  disabled?: boolean;
}
```

### File Organization Standards
```
ComponentName/
├── index.ts                    # Public exports
├── ComponentName.tsx           # Main component
├── ComponentName.test.tsx      # Unit tests
├── ComponentName.stories.tsx   # Storybook stories (if applicable)
├── hooks/                      # Component-specific hooks
│   ├── useComponentLogic.ts
│   └── useComponentState.ts
├── utils/                      # Component utilities
│   └── componentHelpers.ts
├── types/                      # Component types
│   └── ComponentTypes.ts
└── __tests__/                  # Additional test files
    └── integration.test.tsx
```

### Code Quality Standards
```typescript
// 1. TypeScript strict mode
interface StrictComponentProps {
  requiredProp: string;
  optionalProp?: number;
  callbackProp: (data: CallbackData) => void;
}

// 2. Error boundaries
const ComponentWithErrorBoundary = () => (
  <ErrorBoundary fallback={<ComponentErrorFallback />}>
    <StatisticalComponent />
  </ErrorBoundary>
);

// 3. Performance optimization
const OptimizedComponent = React.memo<ComponentProps>(({ data, options }) => {
  const memoizedValue = useMemo(() => 
    expensiveCalculation(data), [data]
  );
  
  const memoizedCallback = useCallback((value: string) => {
    // Handle callback
  }, []);
  
  return <div>{/* Component content */}</div>;
});

// 4. Accessibility compliance
const AccessibleComponent = () => (
  <div role="region" aria-labelledby="section-title">
    <h2 id="section-title">Statistical Analysis</h2>
    <button
      type="button"
      aria-describedby="help-text"
      onClick={handleAction}
    >
      Run Analysis
    </button>
    <div id="help-text" className="sr-only">
      This will run the selected statistical analysis
    </div>
  </div>
);
```

---

Direktori `components/` adalah foundation komprehensif untuk UI dalam Statify, dengan emphasis khusus pada statistical workflows, modal-driven interactions, dan user experience yang optimal untuk data analysis tasks.
