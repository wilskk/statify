# Output Components - Data Visualization & Results Display

Direktori `Output/` berisi components untuk rendering dan displaying analysis results dalam berbagai format. Components ini menyediakan comprehensive visualization capabilities untuk statistical output dengan interactive editing dan export functionality.

## 📁 Struktur

```
Output/
├── Chart/                     # Chart rendering components
│   ├── GeneralChartContainer.tsx  # Universal chart container
│   └── __tests__/                 # Chart component tests
├── Editor/                    # Output editing components
│   ├── TiptapEditor.tsx          # Rich text editor for outputs
│   ├── editor.css               # Editor styling
│   └── __tests__/               # Editor component tests
├── Table/                     # Table output components
│   ├── DataTableRenderer.tsx     # Statistical table renderer
│   └── __tests__/               # Table component tests
└── text/                      # Text output components
    └── text-renderer.tsx         # Text-based output renderer
```

## 🎯 Component Architecture

### Design Philosophy
- **Multi-Format Support**: Render statistical outputs dalam table, chart, dan text formats
- **Interactive Editing**: In-place editing capabilities untuk result customization
- **Export Ready**: Components optimized untuk various export formats
- **Statistical Focus**: Specialized rendering untuk statistical analysis results
- **Performance Optimized**: Efficient rendering untuk large datasets dan complex visualizations

### Output Types Support
```typescript
interface OutputTypeSupport {
  // Statistical tables
  descriptiveStatistics: boolean;
  frequencyTables: boolean;
  crosstabulations: boolean;
  correlationMatrices: boolean;
  regressionResults: boolean;
  
  // Charts & graphs
  histograms: boolean;
  scatterplots: boolean;
  boxplots: boolean;
  barCharts: boolean;
  lineCharts: boolean;
  
  // Text outputs
  statisticalSummaries: boolean;
  analysisNotes: boolean;
  interpretations: boolean;
  methodologyDescriptions: boolean;
  
  // Mixed content
  combinedReports: boolean;
  dashboardLayouts: boolean;
  printableReports: boolean;
}
```

## 📊 Chart/GeneralChartContainer.tsx

### Purpose
Universal chart container component yang menyediakan consistent interface untuk berbagai chart types dengan statistical context awareness.

### Core Features
```typescript
interface GeneralChartContainerFeatures {
  // Chart types support
  statisticalCharts: ChartTypeMap;
  interactiveCharts: boolean;
  responsiveDesign: boolean;
  
  // Customization
  themeSupport: boolean;
  colorSchemes: ColorSchemeMap;
  fontCustomization: boolean;
  
  // Interactivity
  zoomPan: boolean;
  dataPointSelection: boolean;
  tooltips: boolean;
  drilling: boolean;
  
  // Export
  imageExport: boolean;
  vectorExport: boolean;
  dataExport: boolean;
  printOptimization: boolean;
}
```

### Chart Configuration System
```typescript
interface ChartConfiguration {
  // Chart metadata
  chartId: string;
  chartType: ChartType;
  title: string;
  subtitle?: string;
  
  // Data configuration
  data: ChartData;
  dataMapping: DataMapping;
  variables: ChartVariable[];
  
  // Visual configuration
  theme: ChartTheme;
  colors: ColorConfiguration;
  layout: LayoutConfiguration;
  
  // Statistical configuration
  statisticalOptions: StatisticalOptions;
  regressionLines: boolean;
  confidenceIntervals: boolean;
  errorBars: boolean;
  
  // Interaction configuration
  interactive: boolean;
  selectable: boolean;
  zoomable: boolean;
  
  // Export configuration
  exportFormats: ExportFormat[];
  printSettings: PrintSettings;
}

interface ChartData {
  // Raw data
  rawData: DataPoint[];
  processedData: ProcessedDataPoint[];
  
  // Aggregations
  aggregations: AggregationMap;
  summaryStatistics: SummaryStats;
  
  // Metadata
  variableInfo: VariableInfo[];
  dataSource: DataSource;
  lastUpdated: Date;
}
```

### Statistical Chart Types
```typescript
interface StatisticalChartTypes {
  // Descriptive charts
  histogram: {
    bins: number;
    density: boolean;
    normalCurve: boolean;
  };
  
  boxplot: {
    outliers: boolean;
    notched: boolean;
    grouping: string;
  };
  
  scatterplot: {
    regressionLine: boolean;
    confidenceInterval: boolean;
    correlation: boolean;
  };
  
  // Comparative charts
  barChart: {
    orientation: 'horizontal' | 'vertical';
    stacked: boolean;
    errorBars: boolean;
  };
  
  lineChart: {
    smoothing: boolean;
    markers: boolean;
    multiSeries: boolean;
  };
  
  // Specialized statistical charts
  qqPlot: {
    referenceDistribution: DistributionType;
    confidenceBands: boolean;
  };
  
  residualPlot: {
    fitted: boolean;
    standardized: boolean;
    cookDistance: boolean;
  };
}
```

### Rendering Engine
```typescript
interface ChartRenderingEngine {
  // Rendering pipeline
  dataPreprocessing: (data: RawData) => ProcessedData;
  layoutCalculation: (config: ChartConfig) => LayoutData;
  elementRendering: (layout: LayoutData) => RenderedElements;
  
  // Performance optimization
  virtualRendering: boolean;
  dataSubsampling: boolean;
  progressiveLoading: boolean;
  
  // Quality control
  antiAliasing: boolean;
  highDPI: boolean;
  vectorGraphics: boolean;
  
  // Animation
  enterAnimations: boolean;
  updateAnimations: boolean;
  interactionAnimations: boolean;
}
```

### Usage Examples
```typescript
// Basic statistical chart
<GeneralChartContainer
  chartType="histogram"
  data={analysisData}
  config={{
    title: "Distribution of Age",
    bins: 20,
    showNormalCurve: true,
    showStatistics: true
  }}
  exportEnabled={true}
/>

// Interactive scatterplot dengan regression
<GeneralChartContainer
  chartType="scatterplot"
  data={correlationData}
  config={{
    title: "Income vs Education",
    xVariable: "education_years",
    yVariable: "annual_income",
    regressionLine: true,
    confidenceInterval: 0.95,
    interactive: true
  }}
  onPointSelect={handlePointSelection}
/>

// Multi-series comparison chart
<GeneralChartContainer
  chartType="boxplot"
  data={groupedData}
  config={{
    title: "Performance by Group",
    groupBy: "treatment_group",
    showOutliers: true,
    notched: true
  }}
  theme="statistical"
/>
```

## ✏️ Editor/TiptapEditor.tsx

### Purpose
Rich text editor untuk statistical output editing, annotation, dan report creation dengan statistical context awareness.

### Core Features
```typescript
interface TiptapEditorFeatures {
  // Rich text editing
  formattingTools: FormattingToolset;
  statisticalNotation: boolean;
  mathematicalFormulas: boolean;
  
  // Statistical content
  tableInsertion: boolean;
  chartEmbedding: boolean;
  statisticalSymbols: boolean;
  
  // Collaboration
  realTimeEditing: boolean;
  commentSystem: boolean;
  versionHistory: boolean;
  
  // Export integration
  exportFormats: ExportFormatMap;
  citationManagement: boolean;
  bibliographySupport: boolean;
}
```

### Editor Configuration
```typescript
interface EditorConfiguration {
  // Editor setup
  extensions: TiptapExtension[];
  plugins: EditorPlugin[];
  toolbar: ToolbarConfiguration;
  
  // Content configuration
  contentTypes: ContentType[];
  allowedElements: HTMLElement[];
  restrictedElements: HTMLElement[];
  
  // Statistical features
  statisticalExtensions: {
    tables: StatisticalTableExtension;
    formulas: FormulaExtension;
    charts: ChartEmbedExtension;
    citations: CitationExtension;
  };
  
  // Collaboration features
  collaboration: {
    enabled: boolean;
    provider: CollaborationProvider;
    awareness: AwarenessConfiguration;
  };
  
  // Export settings
  exportOptions: {
    formats: ExportFormat[];
    quality: ExportQuality;
    includeMetadata: boolean;
  };
}
```

### Statistical Content Extensions
```typescript
interface StatisticalExtensions {
  // Table extensions
  statisticalTable: {
    formatNumbers: boolean;
    significanceStars: boolean;
    confidenceIntervals: boolean;
    editableValues: boolean;
  };
  
  // Formula extensions
  statisticalFormulas: {
    latex: boolean;
    mathML: boolean;
    statisticalSymbols: boolean;
    customNotations: boolean;
  };
  
  // Chart embedding
  chartEmbedding: {
    liveCharts: boolean;
    staticImages: boolean;
    interactiveCharts: boolean;
    chartUpdates: boolean;
  };
  
  // Annotation system
  annotations: {
    statisticalNotes: boolean;
    methodologyNotes: boolean;
    interpretationNotes: boolean;
    assumptions: boolean;
  };
}
```

### Content Structure
```typescript
interface StatisticalDocumentStructure {
  // Document sections
  abstract?: DocumentSection;
  methodology: DocumentSection;
  results: DocumentSection;
  discussion: DocumentSection;
  conclusions: DocumentSection;
  
  // Statistical content
  tables: StatisticalTable[];
  figures: StatisticalFigure[];
  formulas: MathematicalFormula[];
  
  // Metadata
  analysisMetadata: AnalysisMetadata;
  authorInformation: AuthorInfo;
  createdDate: Date;
  lastModified: Date;
  
  // References
  citations: Citation[];
  bibliography: BibliographyEntry[];
  dataReferences: DataReference[];
}
```

### Usage Examples
```typescript
// Basic statistical report editor
<TiptapEditor
  content={reportContent}
  config={{
    extensions: ['statistical-table', 'formula', 'chart-embed'],
    toolbar: 'statistical',
    collaborative: false
  }}
  onContentChange={handleContentChange}
  onExport={handleExport}
/>

// Collaborative analysis documentation
<TiptapEditor
  content={analysisDocumentation}
  config={{
    collaborative: true,
    statisticalFeatures: true,
    commentSystem: true,
    versionHistory: true
  }}
  collaborators={teamMembers}
  onCollaboratorAction={handleCollaboration}
/>

// Output annotation editor
<TiptapEditor
  content={analysisOutput}
  mode="annotation"
  config={{
    readOnlyBase: true,
    annotationLayers: true,
    highlightSupport: true
  }}
  onAnnotationAdd={handleAnnotation}
/>
```

## 📋 Table/DataTableRenderer.tsx

### Purpose
Specialized table renderer untuk statistical results dengan advanced formatting, sorting, dan export capabilities.

### Core Features
```typescript
interface DataTableRendererFeatures {
  // Statistical table features
  statisticalFormatting: boolean;
  significanceIndicators: boolean;
  confidenceIntervals: boolean;
  summaryStatistics: boolean;
  
  // Interactive features
  sortableColumns: boolean;
  filterableColumns: boolean;
  editableCells: boolean;
  columnResizing: boolean;
  
  // Display options
  numbersFormatting: NumberFormatting;
  alternatingRows: boolean;
  headerStyling: boolean;
  footerSummaries: boolean;
  
  // Export features
  csvExport: boolean;
  excelExport: boolean;
  pdfExport: boolean;
  latexExport: boolean;
}
```

### Table Configuration System
```typescript
interface TableConfiguration {
  // Table structure
  columns: TableColumn[];
  rows: TableRow[];
  metadata: TableMetadata;
  
  // Statistical configuration
  statisticalOptions: {
    showSignificance: boolean;
    significanceLevel: number;
    confidenceLevel: number;
    roundingPrecision: number;
  };
  
  // Display configuration
  displayOptions: {
    showRowNumbers: boolean;
    showColumnHeaders: boolean;
    showSummaryRow: boolean;
    alternateRowColors: boolean;
  };
  
  // Interaction configuration
  interactionOptions: {
    allowSorting: boolean;
    allowFiltering: boolean;
    allowEditing: boolean;
    allowSelection: boolean;
  };
  
  // Export configuration
  exportOptions: {
    availableFormats: ExportFormat[];
    defaultFormat: ExportFormat;
    includeMetadata: boolean;
  };
}

interface TableColumn {
  // Column identification
  id: string;
  key: string;
  label: string;
  
  // Data configuration
  dataType: DataType;
  statisticalType: StatisticalType;
  
  // Formatting
  formatter: CellFormatter;
  width: ColumnWidth;
  alignment: TextAlignment;
  
  // Behavior
  sortable: boolean;
  filterable: boolean;
  editable: boolean;
  
  // Statistical properties
  precision: number;
  significanceColumn?: string;
  confidenceInterval?: boolean;
}
```

### Statistical Formatting
```typescript
interface StatisticalFormatting {
  // Number formatting
  numberFormats: {
    decimal: DecimalFormatter;
    scientific: ScientificFormatter;
    percentage: PercentageFormatter;
    currency: CurrencyFormatter;
  };
  
  // Statistical indicators
  significanceIndicators: {
    stars: boolean; // *, **, ***
    pValues: boolean; // p < 0.05
    customSymbols: boolean;
  };
  
  // Confidence intervals
  confidenceIntervals: {
    brackets: boolean; // [95% CI: 1.2, 3.4]
    parentheses: boolean; // (95% CI: 1.2, 3.4)
    separateColumns: boolean;
  };
  
  // Special values
  specialValues: {
    missing: string; // "--", "N/A", "."
    infinity: string; // "∞", "Inf"
    notApplicable: string; // "N/A", "-"
  };
}
```

### Data Processing Pipeline
```typescript
interface DataProcessingPipeline {
  // Data ingestion
  dataIngestion: (rawData: RawData) => ProcessedData;
  
  // Statistical processing
  statisticalProcessing: {
    calculateStatistics: boolean;
    addSignificance: boolean;
    calculateIntervals: boolean;
  };
  
  // Formatting pipeline
  formattingPipeline: {
    applyNumberFormatting: boolean;
    addStatisticalIndicators: boolean;
    applyConditionalFormatting: boolean;
  };
  
  // Output preparation
  outputPreparation: {
    generateMetadata: boolean;
    createExportData: boolean;
    optimizeForDisplay: boolean;
  };
}
```

### Usage Examples
```typescript
// Statistical results table
<DataTableRenderer
  data={regressionResults}
  config={{
    statisticalFormatting: true,
    showSignificance: true,
    confidenceIntervals: true,
    precision: 3
  }}
  exportFormats={['csv', 'excel', 'latex']}
/>

// Descriptive statistics table
<DataTableRenderer
  data={descriptiveStats}
  config={{
    summaryFooter: true,
    alternatingRows: true,
    sortableColumns: true,
    numberFormatting: 'decimal'
  }}
  onCellEdit={handleCellEdit}
/>

// Correlation matrix
<DataTableRenderer
  data={correlationMatrix}
  config={{
    symmetricalMatrix: true,
    heatmapColors: true,
    significanceStars: true,
    conditionalFormatting: true
  }}
  interactive={true}
/>
```

## 📝 text/text-renderer.tsx

### Purpose
Text-based output renderer untuk statistical narratives, summaries, dan interpretations dengan context-aware formatting.

### Core Features
```typescript
interface TextRendererFeatures {
  // Text processing
  markdownSupport: boolean;
  htmlSupport: boolean;
  latexSupport: boolean;
  plainTextSupport: boolean;
  
  // Statistical content
  statisticalNotation: boolean;
  formulaRendering: boolean;
  symbolSupport: boolean;
  
  // Formatting
  richTextFormatting: boolean;
  codeHighlighting: boolean;
  tableEmbedding: boolean;
  
  // Dynamic content
  templateSystem: boolean;
  variableSubstitution: boolean;
  conditionalText: boolean;
  
  // Export features
  multipleFormats: boolean;
  preserveFormatting: boolean;
  crossReferences: boolean;
}
```

### Text Content Types
```typescript
interface TextContentTypes {
  // Statistical narratives
  analysisNarrative: {
    methodology: string;
    results: string;
    interpretation: string;
    conclusions: string;
  };
  
  // Automated summaries
  automatedSummaries: {
    descriptiveSummary: string;
    testResults: string;
    modelSummary: string;
    dataQuality: string;
  };
  
  // Technical documentation
  technicalDocs: {
    methodDescription: string;
    assumptionChecks: string;
    limitations: string;
    recommendations: string;
  };
  
  // Report sections
  reportSections: {
    executiveSummary: string;
    methodology: string;
    findings: string;
    appendices: string;
  };
}
```

### Template System
```typescript
interface TemplateSystem {
  // Template definition
  templateEngine: TemplateEngine;
  templateLibrary: TemplateLibrary;
  customTemplates: CustomTemplate[];
  
  // Variable system
  variableSubstitution: {
    statisticalValues: boolean;
    datasetProperties: boolean;
    analysisParameters: boolean;
    userDefinedVariables: boolean;
  };
  
  // Conditional rendering
  conditionalLogic: {
    ifStatements: boolean;
    switchStatements: boolean;
    loopStructures: boolean;
    nestedConditions: boolean;
  };
  
  // Template categories
  templateCategories: {
    analysisReports: AnalysisReportTemplate[];
    methodologyDescriptions: MethodologyTemplate[];
    resultInterpretations: InterpretationTemplate[];
    executiveSummaries: SummaryTemplate[];
  };
}
```

### Formatting Engine
```typescript
interface FormattingEngine {
  // Text formatting
  textFormatting: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    superscript: boolean;
    subscript: boolean;
  };
  
  // Statistical formatting
  statisticalFormatting: {
    pValues: (value: number) => string;
    confidenceIntervals: (lower: number, upper: number) => string;
    effectSizes: (value: number, measure: string) => string;
    testStatistics: (statistic: number, type: string) => string;
  };
  
  // List formatting
  listFormatting: {
    bulletLists: boolean;
    numberedLists: boolean;
    nestedLists: boolean;
    customBullets: boolean;
  };
  
  // Code formatting
  codeFormatting: {
    inlineCode: boolean;
    codeBlocks: boolean;
    syntaxHighlighting: boolean;
    languageDetection: boolean;
  };
}
```

### Usage Examples
```typescript
// Statistical analysis narrative
<TextRenderer
  content={analysisNarrative}
  template="analysis-report"
  variables={{
    n: sampleSize,
    mean: meanValue,
    pValue: significanceLevel
  }}
  format="markdown"
/>

// Automated results summary
<TextRenderer
  content={resultsSummary}
  config={{
    automaticFormatting: true,
    statisticalNotation: true,
    includeFormulas: true
  }}
  onContentGenerated={handleContentGeneration}
/>

// Technical methodology description
<TextRenderer
  content={methodologyText}
  template="methodology-description"
  config={{
    includeReferences: true,
    formatCitations: true,
    academicStyle: true
  }}
  exportFormat="latex"
/>
```

## 🔄 Output Integration Patterns

### Cross-Component Integration
```typescript
interface OutputIntegration {
  // Chart-Table integration
  chartTableSync: {
    dataBinding: boolean;
    selectionSync: boolean;
    filterSync: boolean;
  };
  
  // Editor-Output integration
  editorOutputSync: {
    livePreview: boolean;
    embedOutputs: boolean;
    dynamicUpdates: boolean;
  };
  
  // Export coordination
  exportCoordination: {
    combinedExports: boolean;
    formatConsistency: boolean;
    metadataSync: boolean;
  };
}
```

### State Management
```typescript
interface OutputStateManagement {
  // Global output state
  outputStore: {
    activeOutputs: Output[];
    selectedOutputs: Output[];
    exportQueue: ExportJob[];
  };
  
  // Component state sync
  stateSync: {
    chartState: ChartState;
    tableState: TableState;
    editorState: EditorState;
    textState: TextState;
  };
  
  // Performance optimization
  performanceOptimization: {
    virtualScrolling: boolean;
    lazyLoading: boolean;
    memoization: boolean;
    debouncing: boolean;
  };
}
```

## 🧪 Testing Strategy

### Component Testing
```typescript
// Chart component testing
describe('GeneralChartContainer', () => {
  it('renders histogram correctly', () => {
    render(<GeneralChartContainer chartType="histogram" data={testData} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });
  
  it('handles interactive features', () => {
    const onPointSelect = jest.fn();
    render(
      <GeneralChartContainer
        chartType="scatterplot"
        interactive={true}
        onPointSelect={onPointSelect}
      />
    );
    
    // Simulate point selection
    fireEvent.click(screen.getByTestId('data-point-0'));
    expect(onPointSelect).toHaveBeenCalled();
  });
});

// Table renderer testing
describe('DataTableRenderer', () => {
  it('formats statistical values correctly', () => {
    render(
      <DataTableRenderer
        data={statisticalData}
        config={{ showSignificance: true, precision: 3 }}
      />
    );
    
    expect(screen.getByText('0.001***')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// Output integration testing
describe('Output Integration', () => {
  it('synchronizes chart and table selection', () => {
    render(
      <OutputContainer>
        <GeneralChartContainer />
        <DataTableRenderer />
      </OutputContainer>
    );
    
    // Select chart data point
    fireEvent.click(screen.getByTestId('chart-point-1'));
    
    // Verify table row is highlighted
    expect(screen.getByTestId('table-row-1')).toHaveClass('selected');
  });
});
```

## 📋 Development Guidelines

### Component Standards
```typescript
// Output component pattern
interface OutputComponentProps {
  // Data props
  data: OutputData;
  config: OutputConfig;
  
  // Interaction props
  interactive?: boolean;
  onInteraction?: (event: InteractionEvent) => void;
  
  // Export props
  exportEnabled?: boolean;
  exportFormats?: ExportFormat[];
  onExport?: (format: ExportFormat, data: ExportData) => void;
  
  // Styling props
  theme?: OutputTheme;
  className?: string;
}

// Consistent error handling
const OutputComponent: React.FC<Props> = (props) => {
  const [error, setError] = useState<Error | null>(null);
  
  if (error) {
    return <OutputErrorFallback error={error} onRetry={() => setError(null)} />;
  }
  
  try {
    return <div>{/* Component content */}</div>;
  } catch (err) {
    setError(err as Error);
    return null;
  }
};
```

### Performance Guidelines
```typescript
// Optimization patterns
const OptimizedOutputComponent = React.memo<Props>(({ data, config }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => 
    processOutputData(data, config), [data, config]
  );
  
  // Virtualization for large datasets
  const virtualizedRows = useVirtualization({
    data: processedData,
    itemHeight: 50,
    containerHeight: 400
  });
  
  return <div>{/* Optimized rendering */}</div>;
});
```

---

Direktori `Output/` menyediakan comprehensive visualization dan rendering capabilities untuk statistical analysis results dengan emphasis pada interactive editing, multiple format support, dan professional presentation quality.
