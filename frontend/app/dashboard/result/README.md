# Result Page - Analysis Results Display Interface

> **Developer Documentation**: Comprehensive results visualization system with hierarchical navigation, interactive charts, and multi-format export capabilities.

## Directory Structure

```
result/
├── page.tsx                 # Main result page component
├── loading.tsx             # Suspense loading state for result operations
└── components/
    ├── ResultOutput.tsx     # Main results display and rendering
    └── Sidebar.tsx         # Hierarchical results navigation
```

## Architecture Overview

### Component Hierarchy
```typescript
ResultPage
├── Sidebar (navigation tree, breadcrumbs)
└── ResultOutput
    ├── ChartRenderer (D3.js, Chart.js integration)
    ├── TableRenderer (tabular results display)
    ├── TextRenderer (statistical text output)
    └── ExportActions (multi-format export)
```

### State Management
```typescript
// Primary stores used
import { useResultStore } from '@/stores/useResultStore';
import { useTimeSeriesStore } from '@/stores/useTimeSeriesStore';
import { useModalStore } from '@/stores/useModalStore';

// Result state structure
interface ResultState {
  results: AnalysisResult[];
  selectedResult: string | null;
  navigationTree: NavigationNode[];
  viewMode: 'chart' | 'table' | 'text';
  exportFormat: 'png' | 'pdf' | 'csv' | 'excel';
}
```

### Navigation Architecture
```typescript
// Hierarchical result navigation
interface NavigationNode {
  id: string;
  type: 'analysis' | 'table' | 'chart';
  title: string;
  children?: NavigationNode[];
  metadata: ResultMetadata;
}

// Navigation state management
const navigationState = {
  expandedNodes: Set<string>;
  selectedNode: string | null;
  breadcrumb: BreadcrumbItem[];
  searchQuery: string;
};
```

## Development Guidelines

### Component Implementation
```typescript
// Standard result page pattern
export default function ResultPage() {
  const { results, selectedResult } = useResultStore();
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  
  return (
    <div className="result-page grid grid-cols-[300px,1fr]">
      <Sidebar 
        results={results}
        onSelectResult={setSelectedResult}
      />
      <ResultOutput 
        result={selectedResult}
        viewMode={viewMode}
      />
    </div>
  );
}
```

### Chart Rendering Strategy
```typescript
// Chart rendering with D3.js integration
import { ChartBuilder } from '@/utils/chartBuilder';

interface ChartRendererProps {
  data: ChartData;
  type: ChartType;
  options: ChartOptions;
}

// Supported chart types:
// - Histogram, Box Plot, Scatter Plot
// - Bar Chart, Line Chart, Area Chart
// - Heatmap, Correlation Matrix
// - Time Series, Regression Plots
```

### Performance Optimizations
```typescript
// Large result set handling
const optimizations = {
  virtualizedNavigation: true,
  lazyChartRendering: true,
  progressiveDataLoading: true,
  memoizedCalculations: true
};

// Chart rendering optimization
const chartConfig = {
  maxDataPoints: 10000,
  samplingThreshold: 5000,
  renderingEngine: 'canvas', // vs 'svg'
  animationDuration: 300
};
```

## Core Components

### ResultOutput Component
- **File**: `components/ResultOutput.tsx`
- **Purpose**: Primary results display with multi-format rendering
- **Features**: 
  - Dynamic chart rendering (D3.js, Chart.js)
  - Table display with sorting and filtering
  - Statistical text formatting
  - Export functionality (PNG, PDF, CSV, Excel)
  - Print optimization

```typescript
// ResultOutput implementation
interface ResultOutputProps {
  result: AnalysisResult | null;
  viewMode: 'chart' | 'table' | 'text';
  exportOptions: ExportOptions;
}

// Key features:
// - Lazy rendering for performance
// - Error boundaries for chart failures
// - Responsive design for mobile
// - Accessibility (ARIA labels, keyboard navigation)
```

### Sidebar Component
- **File**: `components/Sidebar.tsx`
- **Purpose**: Hierarchical navigation and result organization
- **Features**:
  - Tree navigation with expand/collapse
  - Search and filtering
  - Breadcrumb navigation
  - Result metadata display
  - Quick actions (export, share, delete)

```typescript
// Sidebar navigation structure
interface SidebarProps {
  results: AnalysisResult[];
  selectedResult: string | null;
  onSelectResult: (id: string) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

// Navigation features:
// - Virtualized tree for large result sets
// - Keyboard navigation (arrow keys, enter)
// - Context menu for result actions
// - Drag and drop for organization
```

## Chart Rendering System

### Chart Types Supported
```typescript
// Chart type definitions
type ChartType = 
  | 'histogram' | 'boxplot' | 'scatter'
  | 'bar' | 'line' | 'area'
  | 'heatmap' | 'correlation'
  | 'timeseries' | 'regression'
  | 'violin' | 'density';

// Chart rendering pipeline
const chartPipeline = {
  dataPreprocessing: preprocessChartData,
  chartGeneration: generateChart,
  interactivity: addInteractions,
  responsiveness: makeResponsive,
  accessibility: addA11yFeatures
};
```

### D3.js Integration
```typescript
// Custom D3 chart builder
import { ChartBuilder } from '@/utils/chartBuilder';

const chartBuilder = new ChartBuilder()
  .setData(resultData)
  .setType('histogram')
  .setDimensions({ width: 800, height: 600 })
  .setInteractive(true)
  .setResponsive(true)
  .build();

// Features:
// - Responsive design with container queries
// - Interactive tooltips and zooming
// - Animation support with performance optimization
// - Accessibility compliance (WCAG 2.1)
```

## Performance Optimizations

### Large Result Set Handling
```typescript
// Virtual scrolling for navigation
const virtualizedNavigation = {
  itemHeight: 32,
  bufferSize: 10,
  windowSize: 20,
  preloadItems: 5
};

// Progressive loading strategy
const loadingStrategy = {
  initialBatch: 50,
  incrementalBatch: 25,
  lazyThreshold: 1000,
  cacheStrategy: 'LRU'
};
```

### Chart Performance
```typescript
// Chart rendering optimization
const chartOptimization = {
  dataPointLimit: 10000,
  samplingAlgorithm: 'LTTB', // Largest Triangle Three Buckets
  canvasRendering: true,
  webWorkerCalculations: true,
  memoizedTransformations: true
};

// Memory management
const memoryManagement = {
  chartCache: new Map(),
  maxCacheSize: 20,
  cleanupInterval: 300000, // 5 minutes
  weakReferences: true
};
```

## Export System

### Multi-Format Export
```typescript
// Export capabilities
interface ExportOptions {
  format: 'png' | 'pdf' | 'svg' | 'csv' | 'excel' | 'json';
  quality: 'low' | 'medium' | 'high';
  dimensions?: { width: number; height: number };
  includeData?: boolean;
  includeMetadata?: boolean;
}

// Export implementations:
// - PNG/SVG: Canvas/SVG to image conversion
// - PDF: jsPDF with chart embedding
// - CSV/Excel: Structured data export
// - JSON: Full result object serialization
```

### Export Performance
```typescript
// Optimized export handling
const exportOptimization = {
  backgroundProcessing: true,
  progressIndicator: true,
  batchExport: true,
  compressionOptions: {
    png: { quality: 0.9 },
    pdf: { compression: 'high' }
  }
};
```

## Testing Guidelines

### Component Testing
```typescript
// Result page testing strategy
describe('ResultPage', () => {
  it('renders navigation tree correctly', () => {
    const mockResults = createMockResultSet();
    render(<ResultPage results={mockResults} />);
    
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(screen.getAllByRole('treeitem')).toHaveLength(mockResults.length);
  });
  
  it('handles chart rendering errors gracefully', async () => {
    const invalidData = createInvalidChartData();
    render(<ResultOutput data={invalidData} type="histogram" />);
    
    await waitFor(() => {
      expect(screen.getByText(/error rendering chart/i)).toBeInTheDocument();
    });
  });
});
```

### Performance Testing
```typescript
// Performance benchmarks
describe('Result Performance', () => {
  it('renders large result sets within time limit', async () => {
    const largeResultSet = createLargeResultSet(1000);
    const startTime = performance.now();
    
    render(<ResultPage results={largeResultSet} />);
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // 1 second limit
  });
});
```

### Integration Testing
- **Chart Export**: Test all export formats with various chart types
- **Navigation**: Test tree navigation with large hierarchies
- **Search**: Test result filtering and search functionality
- **Accessibility**: Test keyboard navigation and screen reader compatibility
  const { setViewMode } = useTableRefStore();
  
  useEffect(() => {
    setViewMode('numeric');
    return () => setViewMode('numeric');
  }, [setViewMode]);

  return (
    <div className="z-0 h-full w-full" data-testid="result-page">
      <Suspense fallback={<ResultPageSkeleton />}>
        <Index />
      </Suspense>
    </div>
  );
}
```

### Key Features
- **View Mode Management**: Maintains numeric view mode untuk hasil display
- **Consistent State**: View mode persistence across navigation
- **Suspense Integration**: Performance-optimized loading states
- **Test Coverage**: Comprehensive test identifiers

### Layout Structure
```typescript
interface ResultPageLayout {
  // Two-panel layout
  sidebar: {
    width: '300px';
    position: 'fixed-left';
    scrollable: true;
  };
  
  main: {
    marginLeft: '300px';
    fullHeight: true;
    overflowScroll: true;
  };
}
```

## 🗂 Sidebar Component (`components/Sidebar.tsx`)

### Purpose
Navigation dan management interface untuk analysis results dengan hierarchical structure.

### Core Features
```typescript
interface SidebarFeatures {
  // Navigation
  resultTree: TreeNavigation;
  searchFunction: SearchInterface;
  filterOptions: FilterInterface;
  
  // Management
  resultActions: ActionMenu;
  exportOptions: ExportInterface;
  deleteActions: DeleteInterface;
  
  // Organization
  categoryGrouping: GroupingInterface;
  recentResults: RecentInterface;
  favoriteResults: FavoriteInterface;
}
```

### Tree Navigation System
```typescript
interface TreeNavigationSystem {
  // Hierarchical structure
  nodes: TreeNode[];
  expandedNodes: Set<string>;
  selectedNode: string | null;
  
  // Node types
  category: CategoryNode;
  analysis: AnalysisNode;
  result: ResultNode;
  
  // Interactions
  expand: (nodeId: string) => void;
  collapse: (nodeId: string) => void;
  select: (nodeId: string) => void;
  
  // State management
  persistState: boolean;
  autoExpand: boolean;
}
```

### Action Management
```typescript
interface SidebarActions {
  // Result operations
  viewResult: (id: string) => void;
  editResult: (id: string) => void;
  deleteResult: (id: string) => Promise<void>;
  
  // Export operations
  exportPDF: (id: string) => void;
  exportHTML: (id: string) => void;
  exportImage: (id: string) => void;
  
  // Organization
  createFolder: (name: string) => void;
  moveResult: (resultId: string, folderId: string) => void;
  
  // Bulk operations
  selectMultiple: boolean;
  bulkExport: (ids: string[]) => void;
  bulkDelete: (ids: string[]) => Promise<void>;
}
```

### Search & Filter System
```typescript
interface SearchFilterSystem {
  // Search functionality
  searchTerm: string;
  searchResults: SearchResult[];
  searchHistory: string[];
  
  // Filter options
  analysisType: AnalysisTypeFilter;
  dateRange: DateRangeFilter;
  resultStatus: StatusFilter;
  
  // Advanced search
  complexQueries: boolean;
  savedSearches: SavedSearch[];
  
  // Performance
  debouncedSearch: number;
  indexedSearch: boolean;
}
```

### State Integration
- **useResultStore**: Result data management
- **useModalStore**: Modal interactions
- **Local State**: Navigation dan UI state
- **URL Synchronization**: Deep linking support

## 📊 ResultOutput Component (`components/ResultOutput.tsx`)

### Purpose
Main display component untuk rendering analysis results dalam various formats.

### Core Architecture
```typescript
interface ResultOutputArchitecture {
  // Result rendering
  resultRenderer: ResultRenderer;
  outputFormatter: OutputFormatter;
  
  // Display modes
  tableView: TableViewRenderer;
  chartView: ChartViewRenderer;
  textView: TextViewRenderer;
  
  // Interaction
  editingMode: boolean;
  exportActions: ExportActions;
  
  // Performance
  virtualizedRendering: boolean;
  lazyImageLoading: boolean;
}
```

### Display Capabilities
```typescript
interface DisplayCapabilities {
  // Content types
  statisticalTables: TableRenderer;
  chartGraphics: ChartRenderer;
  textOutput: TextRenderer;
  mixedContent: MixedRenderer;
  
  // Interactive features
  sortableTables: boolean;
  zoomableCharts: boolean;
  editableContent: boolean;
  
  // Export options
  pdfExport: boolean;
  imageExport: boolean;
  dataExport: boolean;
  htmlExport: boolean;
}
```

### Result Types Support
```typescript
interface SupportedResultTypes {
  // Descriptive statistics
  descriptives: DescriptiveStats;
  frequencies: FrequencyTables;
  crosstabs: CrossTables;
  
  // Inferential statistics
  tTests: TTestResults;
  anova: ANOVAResults;
  regression: RegressionResults;
  
  // Charts
  histograms: HistogramChart;
  scatterplots: ScatterplotChart;
  boxplots: BoxplotChart;
  
  // Custom outputs
  customTables: CustomTableRenderer;
  customCharts: CustomChartRenderer;
}
```

### Rendering System
```typescript
interface RenderingSystem {
  // Content rendering
  renderContent: (result: AnalysisResult) => ReactElement;
  
  // Table rendering
  renderTable: (table: StatisticalTable) => ReactElement;
  formatNumbers: (value: number, format: NumberFormat) => string;
  
  // Chart rendering
  renderChart: (chart: ChartData) => ReactElement;
  chartInteractions: ChartInteractionHandler;
  
  // Text rendering
  renderText: (text: FormattedText) => ReactElement;
  formatText: (text: string, format: TextFormat) => ReactElement;
  
  // Mixed content
  renderMixed: (content: MixedContent) => ReactElement;
  layoutEngine: LayoutEngine;
}
```

### Export Functionality
```typescript
interface ExportFunctionality {
  // Export formats
  pdfExport: {
    quality: 'high' | 'medium' | 'low';
    orientation: 'portrait' | 'landscape';
    includeCharts: boolean;
  };
  
  imageExport: {
    format: 'png' | 'jpg' | 'svg';
    resolution: number;
    transparent: boolean;
  };
  
  dataExport: {
    format: 'csv' | 'xlsx' | 'spss';
    includeLabels: boolean;
    encoding: string;
  };
  
  htmlExport: {
    standalone: boolean;
    includeCSS: boolean;
    interactive: boolean;
  };
}
```

### Editing Capabilities
```typescript
interface EditingCapabilities {
  // Inline editing
  editTitles: boolean;
  editFootnotes: boolean;
  editLabels: boolean;
  
  // Format editing
  numberFormats: boolean;
  tableStyles: boolean;
  chartStyles: boolean;
  
  // Content modification
  hideColumns: boolean;
  hideRows: boolean;
  reorderElements: boolean;
  
  // Advanced editing
  customFormulas: boolean;
  conditionalFormatting: boolean;
}
```

## ⚡ Performance Optimizations

### Rendering Performance
```typescript
interface RenderingOptimizations {
  // Virtual rendering
  virtualizedTables: boolean;
  lazyChartRendering: boolean;
  progressiveImageLoading: boolean;
  
  // Memory management
  resultCaching: LRUCache;
  componentCleanup: boolean;
  memoryMonitoring: boolean;
  
  // Update optimization
  incrementalUpdates: boolean;
  debouncedUpdates: boolean;
  batchedOperations: boolean;
}
```

### Loading Strategies
```typescript
interface LoadingStrategies {
  // Progressive loading
  priorityLoading: boolean;
  backgroundPreloading: boolean;
  onDemandLoading: boolean;
  
  // Caching
  resultCaching: boolean;
  imageCaching: boolean;
  computationCaching: boolean;
  
  // Error handling
  gracefulDegradation: boolean;
  retryMechanism: boolean;
  fallbackContent: boolean;
}
```

### Navigation Optimization
```typescript
interface NavigationOptimizations {
  // State persistence
  urlSynchronization: boolean;
  sessionStorage: boolean;
  
  // Prefetching
  adjacentResultPrefetch: boolean;
  popularResultPreload: boolean;
  
  // Smooth transitions
  animatedTransitions: boolean;
  loadingIndicators: boolean;
  progressBars: boolean;
}
```

## 🎨 Display Formatting

### Table Formatting
```typescript
interface TableFormatting {
  // Number formatting
  decimalPlaces: number;
  thousandsSeparator: string;
  scientificNotation: boolean;
  
  // Cell styling
  alternatingRows: boolean;
  headerStyling: boolean;
  footerStyling: boolean;
  
  // Responsive design
  mobileLayout: boolean;
  horizontalScroll: boolean;
  collapsibleColumns: boolean;
}
```

### Chart Formatting
```typescript
interface ChartFormatting {
  // Visual styling
  colorScheme: ColorPalette;
  fontSizes: FontSizeMap;
  lineStyles: LineStyleMap;
  
  // Interactive features
  tooltips: boolean;
  zoomPan: boolean;
  dataPointSelection: boolean;
  
  // Export optimization
  vectorGraphics: boolean;
  highDPI: boolean;
  printOptimized: boolean;
}
```

### Text Formatting
```typescript
interface TextFormatting {
  // Typography
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  
  // Layout
  paragraphSpacing: number;
  marginSettings: MarginConfig;
  alignmentOptions: AlignmentOptions;
  
  // Rich text
  boldItalic: boolean;
  superscriptSubscript: boolean;
  hyperlinks: boolean;
}
```

## 🔄 State Management

### Result State
```typescript
interface ResultState {
  // Current result
  activeResult: AnalysisResult | null;
  resultHistory: AnalysisResult[];
  
  // Navigation state
  selectedResultId: string | null;
  expandedCategories: Set<string>;
  navigationHistory: string[];
  
  // UI state
  sidebarCollapsed: boolean;
  displayMode: DisplayMode;
  editMode: boolean;
  
  // Filter state
  searchTerm: string;
  activeFilters: FilterConfig;
  sortOrder: SortConfig;
}
```

### Store Integration
```typescript
interface StoreIntegration {
  // Result store
  useResultStore: {
    results: AnalysisResult[];
    selectedResult: string | null;
    actions: ResultActions;
  };
  
  // Modal store
  useModalStore: {
    exportModal: boolean;
    deleteConfirmModal: boolean;
    editModal: boolean;
  };
  
  // Table ref store
  useTableRefStore: {
    viewMode: ViewMode;
    tableRef: TableRef;
  };
}
```

## 🧪 Testing Strategy

### Component Tests
```typescript
interface ComponentTestCoverage {
  // Rendering tests
  resultDisplayRendering: boolean;
  sidebarRendering: boolean;
  navigationTesting: boolean;
  
  // Interaction tests
  resultSelection: boolean;
  exportFunctionality: boolean;
  editingCapabilities: boolean;
  
  // State tests
  stateUpdates: boolean;
  storeIntegration: boolean;
  urlSynchronization: boolean;
  
  // Performance tests
  largeResultSets: boolean;
  memoryUsage: boolean;
  renderingPerformance: boolean;
}
```

### Integration Tests
- **Navigation Flow**: Complete user navigation workflows
- **Export Pipeline**: End-to-end export functionality
- **State Persistence**: State management across sessions
- **Error Scenarios**: Error handling dan recovery

## 📱 Responsive Design

### Mobile Adaptation
```typescript
interface MobileAdaptation {
  // Layout changes
  stackedLayout: boolean;
  collapsibleSidebar: boolean;
  touchOptimized: boolean;
  
  // Interaction patterns
  swipeNavigation: boolean;
  tapToExpand: boolean;
  pinchToZoom: boolean;
  
  // Content adaptation
  simplifiedTables: boolean;
  responsiveCharts: boolean;
  optimizedExport: boolean;
}
```

### Cross-Device Consistency
- **Breakpoint Strategy**: Consistent behavior across devices
- **Touch Support**: Touch-friendly interactions
- **Performance**: Optimized untuk mobile devices
- **Accessibility**: Screen reader support

## 🔒 Security & Data Integrity

### Data Protection
```typescript
interface DataProtection {
  // Access control
  resultPermissions: boolean;
  userAuthentication: boolean;
  
  // Data validation
  resultIntegrity: boolean;
  exportValidation: boolean;
  
  // Privacy
  sensitiveDataHandling: boolean;
  auditLogging: boolean;
}
```

### Export Security
- **Content Sanitization**: Prevent malicious content
- **Format Validation**: Ensure export integrity
- **Access Logging**: Track export activities
- **Data Masking**: Protect sensitive information

## 📋 Development Guidelines

### Component Architecture
```typescript
interface ComponentArchitecture {
  // Separation of concerns
  displayLogic: boolean;
  businessLogic: boolean;
  stateManagement: boolean;
  
  // Reusability
  genericComponents: boolean;
  customizableRenderers: boolean;
  pluggableFormatters: boolean;
  
  // Maintainability
  clearInterfaces: boolean;
  comprehensiveTypes: boolean;
  documentedAPI: boolean;
}
```

### Adding New Result Types
1. **Type Definition**: Define TypeScript interfaces
2. **Renderer Implementation**: Create specialized renderer
3. **Export Support**: Add export capabilities
4. **Testing**: Comprehensive test coverage
5. **Documentation**: Update component documentation

### Performance Guidelines
- **Lazy Loading**: Load results on demand
- **Memoization**: Cache expensive computations
- **Virtualization**: Handle large result sets
- **Memory Management**: Monitor dan optimize memory usage

### Error Handling
- **Graceful Degradation**: Handle missing atau corrupt results
- **User Feedback**: Clear error messages
- **Recovery Options**: Provide recovery mechanisms
- **Logging**: Comprehensive error logging

---

Result page menyediakan powerful interface untuk analysis result exploration dengan emphasis pada usability, performance, dan comprehensive visualization capabilities.
