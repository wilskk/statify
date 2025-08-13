# File Operations Modals - Import, Export, and File Management

Direktori `File/` berisi modal system untuk file operations dalam Statify. Modals ini menangani critical file management tasks termasuk data import/export, file format conversion, dan comprehensive data handling workflows.

## 📁 Struktur Arsitektur

```
File/
├── FileRegistry.tsx          # File modal registration system
├── index.ts                  # Module exports
│
├── Export/                   # Data export operations
│   ├── index.tsx                # Main export modal
│   ├── README.md               # Export documentation
│   ├── types.ts                # Export type definitions
│   ├── __tests__/              # Test files
│   │   └── index.test.tsx
│   ├── components/             # UI components
│   │   ├── ExportContent.tsx       # Main export interface
│   │   ├── Tour.tsx                # Guided tour component
│   │   └── __tests__/
│   │       └── ExportContent.test.tsx
│   └── hooks/                  # Business logic hooks
│       ├── useExportForm.ts        # Export form management
│       └── __test__/
│           └── useExportForm.test.ts
│
├── ImportData/               # Data import operations
│   ├── index.tsx                # Main import modal
│   ├── README.md               # Import documentation
│   ├── types.ts                # Import type definitions
│   ├── __tests__/              # Test files
│   │   └── index.test.tsx
│   ├── components/             # UI components
│   │   ├── ImportContent.tsx       # Main import interface
│   │   ├── Tour.tsx                # Guided tour component
│   │   └── __tests__/
│   │       └── ImportContent.test.tsx
│   └── hooks/                  # Business logic hooks
│       ├── useImportForm.ts        # Import form management
│       └── __test__/
│           └── useImportForm.test.ts
│
├── ReadDatabase/             # Database reading operations
│   ├── index.tsx                # Main database modal
│   ├── README.md               # Database documentation
│   ├── types.ts                # Database type definitions
│   ├── __tests__/              # Test files
│   │   └── index.test.tsx
│   ├── components/             # UI components
│   │   ├── DatabaseContent.tsx     # Main database interface
│   │   ├── Tour.tsx                # Guided tour component
│   │   └── __tests__/
│   │       └── DatabaseContent.test.tsx
│   └── hooks/                  # Business logic hooks
│       ├── useDatabaseForm.ts      # Database form management
│       └── __test__/
│           └── useDatabaseForm.test.ts
│
├── ReadTextData/             # Text file reading operations
│   ├── index.tsx                # Main text import modal
│   ├── README.md               # Text import documentation
│   ├── types.ts                # Text import type definitions
│   ├── __tests__/              # Test files
│   │   └── index.test.tsx
│   ├── components/             # UI components
│   │   ├── TextDataContent.tsx     # Main text import interface
│   │   ├── Tour.tsx                # Guided tour component
│   │   └── __tests__/
│   │       └── TextDataContent.test.tsx
│   └── hooks/                  # Business logic hooks
│       ├── useTextImportForm.ts    # Text import form management
│       └── __test__/
│           └── useTextImportForm.test.ts
│
└── SaveAs/                   # Save operations
    ├── index.tsx                # Main save modal
    ├── README.md               # Save documentation
    ├── types.ts                # Save type definitions
    ├── __tests__/              # Test files
    │   └── index.test.tsx
    ├── components/             # UI components
    │   ├── SaveAsContent.tsx       # Main save interface
    │   ├── Tour.tsx                # Guided tour component
    │   └── __tests__/
    │       └── SaveAsContent.test.tsx
    └── hooks/                  # Business logic hooks
        ├── useSaveAsForm.ts        # Save form management
        └── __test__/
            └── useSaveAsForm.test.ts
```

## 🎯 File Operations Overview

### Operation Categories

#### **Data Import Operations**
- **File Import**: Support untuk multiple file formats (.sav, .csv, .xlsx, .txt, .json)
- **Database Import**: Direct database connections dan SQL queries
- **Text Import**: Advanced text file parsing dengan custom delimiters
- **Validation**: Comprehensive data validation dan error detection

#### **Data Export Operations**
- **Format Export**: Export ke multiple formats dengan format-specific options
- **Filtered Export**: Export selected data subsets atau filtered results
- **Statistical Export**: Export analysis results dan statistical summaries
- **Batch Export**: Multiple dataset export capabilities

## 📥 Data Import System

### Import Data Operations (`ImportData/`)

#### Core Features
```typescript
interface ImportDataFeatures {
  // File format support
  formatSupport: {
    spssFiles: boolean;      // .sav files
    csvFiles: boolean;       // .csv files
    excelFiles: boolean;     // .xlsx, .xls files
    textFiles: boolean;      // .txt, .dat files
    jsonFiles: boolean;      // .json files
    xmlFiles: boolean;       // .xml files
  };
  
  // Import options
  importOptions: {
    dataTypeDetection: boolean;
    headerDetection: boolean;
    encodingSelection: boolean;
    delimiterCustomization: boolean;
    previewMode: boolean;
    partialImport: boolean;
  };
  
  // Validation features
  validationFeatures: {
    dataTypeValidation: boolean;
    rangeValidation: boolean;
    completenessCheck: boolean;
    duplicateDetection: boolean;
    errorReporting: boolean;
  };
  
  // Advanced features
  advancedFeatures: {
    mappingInterface: boolean;
    transformationRules: boolean;
    conditionalImport: boolean;
    progressTracking: boolean;
    undoSupport: boolean;
  };
}
```

#### Import Logic Implementation
```typescript
interface ImportLogic {
  // File processing
  fileProcessing: {
    fileReader: FileReader;
    formatDetection: FormatDetector;
    parsers: {
      csvParser: CSVParser;
      excelParser: ExcelParser;
      textParser: TextParser;
      spssParser: SPSSParser;
    };
  };
  
  // Data transformation
  dataTransformation: {
    typeConversion: TypeConverter;
    headerMapping: HeaderMapper;
    valueTransformation: ValueTransformer;
    validationEngine: ValidationEngine;
  };
  
  // Import workflow
  importWorkflow: {
    fileSelection: FileSelectionStep;
    formatConfiguration: FormatConfigStep;
    dataPreview: DataPreviewStep;
    mappingConfiguration: MappingConfigStep;
    validation: ValidationStep;
    importExecution: ImportExecutionStep;
  };
}

// useImportForm.ts - Core import hook
interface ImportFormHook {
  // Form state
  formState: {
    selectedFile: File | null;
    fileFormat: FileFormat;
    importOptions: ImportOptions;
    mappingConfiguration: MappingConfig;
    validationResults: ValidationResult[];
  };
  
  // File operations
  fileOperations: {
    selectFile: (file: File) => void;
    detectFormat: (file: File) => Promise<FileFormat>;
    previewData: (file: File, options: ImportOptions) => Promise<PreviewData>;
    validateFile: (file: File) => Promise<ValidationResult>;
  };
  
  // Import operations
  importOperations: {
    configureImport: (config: ImportConfig) => void;
    executeImport: () => Promise<ImportResult>;
    cancelImport: () => void;
    retryImport: (errorCorrections: ErrorCorrection[]) => Promise<ImportResult>;
  };
  
  // Progress tracking
  progressTracking: {
    importProgress: number;
    currentStep: ImportStep;
    estimatedTimeRemaining: number;
    isImporting: boolean;
  };
}
```

#### File Format Handlers
```typescript
interface FileFormatHandlers {
  // SPSS file handler
  spssHandler: {
    readMetadata: (file: File) => Promise<SPSSMetadata>;
    readData: (file: File) => Promise<SPSSData>;
    readValueLabels: (file: File) => Promise<ValueLabels>;
    readVariableLabels: (file: File) => Promise<VariableLabels>;
  };
  
  // CSV file handler
  csvHandler: {
    detectDelimiter: (file: File) => Promise<string>;
    detectEncoding: (file: File) => Promise<string>;
    parseHeaders: (file: File, options: CSVOptions) => Promise<string[]>;
    parseData: (file: File, options: CSVOptions) => Promise<CSVData>;
  };
  
  // Excel file handler
  excelHandler: {
    getSheetNames: (file: File) => Promise<string[]>;
    readSheet: (file: File, sheetName: string) => Promise<ExcelData>;
    detectDataRange: (file: File, sheetName: string) => Promise<Range>;
    parseFormulas: (file: File, sheetName: string) => Promise<Formula[]>;
  };
  
  // Text file handler
  textHandler: {
    detectFormat: (file: File) => Promise<TextFormat>;
    parseFixedWidth: (file: File, columnSpecs: ColumnSpec[]) => Promise<TextData>;
    parseDelimited: (file: File, delimiter: string) => Promise<TextData>;
    detectColumnTypes: (data: TextData) => Promise<ColumnType[]>;
  };
}
```

### Database Reading (`ReadDatabase/`)

#### Database Connection Features
```typescript
interface DatabaseFeatures {
  // Database support
  databaseSupport: {
    mysql: boolean;
    postgresql: boolean;
    sqlite: boolean;
    mssql: boolean;
    oracle: boolean;
    access: boolean;
  };
  
  // Connection management
  connectionManagement: {
    connectionPool: boolean;
    connectionTesting: boolean;
    credentialStorage: boolean;
    sslSupport: boolean;
    timeoutHandling: boolean;
  };
  
  // Query capabilities
  queryCapabilities: {
    sqlEditor: boolean;
    queryBuilder: boolean;
    tableSelection: boolean;
    joinSupport: boolean;
    parameterizedQueries: boolean;
    queryHistory: boolean;
  };
  
  // Data handling
  dataHandling: {
    largeDatasetSupport: boolean;
    streamingImport: boolean;
    progressTracking: boolean;
    errorRecovery: boolean;
    transactionSupport: boolean;
  };
}
```

#### Database Logic Implementation
```typescript
// useDatabaseForm.ts
interface DatabaseFormHook {
  // Connection state
  connectionState: {
    connectionConfig: DatabaseConfig;
    isConnected: boolean;
    connectionError: Error | null;
    availableTables: TableInfo[];
    availableColumns: ColumnInfo[];
  };
  
  // Connection operations
  connectionOperations: {
    testConnection: (config: DatabaseConfig) => Promise<ConnectionResult>;
    establishConnection: (config: DatabaseConfig) => Promise<void>;
    closeConnection: () => void;
    refreshSchema: () => Promise<void>;
  };
  
  // Query operations
  queryOperations: {
    executeQuery: (sql: string, params?: QueryParams) => Promise<QueryResult>;
    buildQuery: (tableConfig: TableConfig) => string;
    validateQuery: (sql: string) => Promise<ValidationResult>;
    getQueryHistory: () => QueryHistoryItem[];
  };
  
  // Data operations
  dataOperations: {
    previewTable: (tableName: string, limit?: number) => Promise<PreviewData>;
    importTable: (tableName: string, options: ImportOptions) => Promise<ImportResult>;
    importQuery: (sql: string, options: ImportOptions) => Promise<ImportResult>;
  };
}
```

### Text Data Reading (`ReadTextData/`)

#### Text Import Features
```typescript
interface TextImportFeatures {
  // File format detection
  formatDetection: {
    delimiterDetection: boolean;
    encodingDetection: boolean;
    headerDetection: boolean;
    dataTypeDetection: boolean;
    structureAnalysis: boolean;
  };
  
  // Parsing options
  parsingOptions: {
    customDelimiters: boolean;
    fixedWidthSupport: boolean;
    multilineRecords: boolean;
    quoteHandling: boolean;
    escapeCharacters: boolean;
    commentLines: boolean;
  };
  
  // Data transformation
  dataTransformation: {
    columnMapping: boolean;
    typeConversion: boolean;
    valueTransformation: boolean;
    conditionalLogic: boolean;
    calculatedFields: boolean;
  };
  
  // Quality control
  qualityControl: {
    previewMode: boolean;
    errorDetection: boolean;
    dataValidation: boolean;
    statisticalSummary: boolean;
    completenessAnalysis: boolean;
  };
}
```

#### Text Import Logic
```typescript
// useTextImportForm.ts
interface TextImportFormHook {
  // File analysis
  fileAnalysis: {
    analyzeStructure: (file: File) => Promise<StructureAnalysis>;
    detectDelimiter: (file: File) => Promise<DelimiterDetection>;
    detectEncoding: (file: File) => Promise<EncodingDetection>;
    sampleData: (file: File, sampleSize: number) => Promise<SampleData>;
  };
  
  // Parsing configuration
  parsingConfiguration: {
    delimiter: string;
    encoding: string;
    hasHeader: boolean;
    quoteCharacter: string;
    escapeCharacter: string;
    skipRows: number;
    maxRows: number;
  };
  
  // Column configuration
  columnConfiguration: {
    columnNames: string[];
    columnTypes: DataType[];
    columnFormats: Format[];
    includeColumns: boolean[];
    transformations: Transformation[];
  };
  
  // Import execution
  importExecution: {
    previewImport: () => Promise<PreviewResult>;
    executeImport: () => Promise<ImportResult>;
    validateImport: () => Promise<ValidationResult>;
    cancelImport: () => void;
  };
}
```

## 📤 Data Export System

### Export Operations (`Export/`)

#### Export Features
```typescript
interface ExportFeatures {
  // Format support
  formatSupport: {
    spssExport: boolean;     // .sav files
    csvExport: boolean;      // .csv files
    excelExport: boolean;    // .xlsx files
    textExport: boolean;     // .txt files
    jsonExport: boolean;     // .json files
    pdfExport: boolean;      // .pdf reports
  };
  
  // Export options
  exportOptions: {
    dataSelection: boolean;
    variableSelection: boolean;
    formatCustomization: boolean;
    compressionOptions: boolean;
    metadataInclusion: boolean;
    batchExport: boolean;
  };
  
  // Quality control
  qualityControl: {
    exportValidation: boolean;
    integrityChecks: boolean;
    formatVerification: boolean;
    sizeOptimization: boolean;
    errorReporting: boolean;
  };
  
  // Advanced features
  advancedFeatures: {
    scheduledExports: boolean;
    templateSupport: boolean;
    automationSupport: boolean;
    versionControl: boolean;
    auditTrail: boolean;
  };
}
```

#### Export Logic Implementation
```typescript
// useExportForm.ts
interface ExportFormHook {
  // Export configuration
  exportConfiguration: {
    targetFormat: ExportFormat;
    outputPath: string;
    fileName: string;
    exportOptions: ExportOptions;
    dataSelection: DataSelection;
  };
  
  // Data preparation
  dataPreparation: {
    selectData: (criteria: SelectionCriteria) => Promise<SelectedData>;
    prepareData: (data: SelectedData, options: ExportOptions) => Promise<PreparedData>;
    validateData: (data: PreparedData) => Promise<ValidationResult>;
    optimizeData: (data: PreparedData) => Promise<OptimizedData>;
  };
  
  // Export operations
  exportOperations: {
    previewExport: () => Promise<ExportPreview>;
    executeExport: () => Promise<ExportResult>;
    cancelExport: () => void;
    retryExport: () => Promise<ExportResult>;
  };
  
  // Progress tracking
  progressTracking: {
    exportProgress: number;
    currentPhase: ExportPhase;
    estimatedTimeRemaining: number;
    isExporting: boolean;
  };
}
```

### Save Operations (`SaveAs/`)

#### Save Features
```typescript
interface SaveFeatures {
  // Save options
  saveOptions: {
    nativeFormat: boolean;   // .statify format
    backupCreation: boolean;
    versionHistory: boolean;
    incrementalSave: boolean;
    compressionOptions: boolean;
  };
  
  // File management
  fileManagement: {
    locationSelection: boolean;
    nameValidation: boolean;
    overwriteProtection: boolean;
    pathOptimization: boolean;
    metadataStorage: boolean;
  };
  
  // Version control
  versionControl: {
    automaticVersioning: boolean;
    manualVersioning: boolean;
    versionComparison: boolean;
    rollbackSupport: boolean;
    changeTracking: boolean;
  };
  
  // Integration
  integration: {
    cloudStorage: boolean;
    networkDrives: boolean;
    databaseStorage: boolean;
    recentFiles: boolean;
    projectIntegration: boolean;
  };
}
```

## 🧪 Testing Strategy

### Test Coverage per Feature
```typescript
// Import testing
describe('ImportDataModal', () => {
  describe('File handling', () => {
    it('handles various file formats');
    it('detects file encoding correctly');
    it('validates file structure');
    it('handles large files efficiently');
  });
  
  describe('Data processing', () => {
    it('parses CSV files correctly');
    it('handles Excel sheets');
    it('processes SPSS files');
    it('validates imported data');
  });
  
  describe('useImportForm hook', () => {
    it('manages import state');
    it('handles file selection');
    it('processes import operations');
    it('tracks progress correctly');
  });
});

// Export testing
describe('ExportModal', () => {
  describe('Export functionality', () => {
    it('exports to multiple formats');
    it('handles data selection');
    it('applies export options');
    it('validates exported files');
  });
  
  describe('useExportForm hook', () => {
    it('configures export settings');
    it('prepares data for export');
    it('executes export operations');
    it('handles export errors');
  });
});

// Database testing
describe('ReadDatabaseModal', () => {
  describe('Connection management', () => {
    it('establishes database connections');
    it('tests connection validity');
    it('handles connection errors');
    it('manages connection pools');
  });
  
  describe('Query operations', () => {
    it('executes SQL queries');
    it('validates query syntax');
    it('handles query results');
    it('manages query history');
  });
});
```

### Integration Testing
```typescript
interface FileModalIntegrationTests {
  // Cross-modal integration
  crossModalIntegration: {
    importWithDataModals: boolean;
    exportWithAnalysisModals: boolean;
    saveWithEditModals: boolean;
  };
  
  // File system integration
  fileSystemIntegration: {
    localFileAccess: boolean;
    networkFileAccess: boolean;
    cloudStorageAccess: boolean;
  };
  
  // Data integrity testing
  dataIntegrityTesting: {
    importExportRoundtrip: boolean;
    formatConversionAccuracy: boolean;
    metadataPreservation: boolean;
  };
}
```

## 📋 Development Guidelines

### File Modal Development Standards
```typescript
interface FileModalStandards {
  // Architecture
  streamingSupport: boolean;
  progressTracking: boolean;
  errorRecovery: boolean;
  
  // Performance
  largeFileHandling: boolean;
  memoryOptimization: boolean;
  backgroundProcessing: boolean;
  
  // Security
  fileValidation: boolean;
  pathSanitization: boolean;
  accessControl: boolean;
  
  // Quality
  testCoverage: number; // >= 85%
  errorHandling: boolean;
  documentation: boolean;
}
```

### Best Practices
```typescript
// 1. Streaming file processing
const useStreamingFileProcessor = () => {
  const processLargeFile = async (file: File, processor: StreamProcessor) => {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const fileSize = file.size;
    let processedBytes = 0;
    
    const reader = file.stream().getReader();
    
    try {
      while (processedBytes < fileSize) {
        const { done, value } = await reader.read();
        if (done) break;
        
        await processor.processChunk(value);
        processedBytes += value.length;
        
        // Update progress
        const progress = (processedBytes / fileSize) * 100;
        processor.updateProgress(progress);
      }
    } finally {
      reader.releaseLock();
    }
  };
  
  return { processLargeFile };
};

// 2. Progressive data validation
const useProgressiveValidation = () => {
  const validateData = async (data: ImportData, validators: Validator[]) => {
    const results: ValidationResult[] = [];
    const totalRows = data.rows.length;
    
    for (let i = 0; i < totalRows; i += VALIDATION_BATCH_SIZE) {
      const batch = data.rows.slice(i, i + VALIDATION_BATCH_SIZE);
      
      const batchResults = await Promise.all(
        validators.map(validator => validator.validateBatch(batch))
      );
      
      results.push(...batchResults.flat());
      
      // Update progress
      const progress = Math.min(((i + VALIDATION_BATCH_SIZE) / totalRows) * 100, 100);
      updateValidationProgress(progress);
      
      // Allow UI updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  };
  
  return { validateData };
};

// 3. Error recovery pattern
const useErrorRecovery = () => {
  const withErrorRecovery = async <T>(
    operation: () => Promise<T>,
    recovery: ErrorRecoveryStrategy
  ): Promise<T> => {
    let attempts = 0;
    const maxAttempts = recovery.maxAttempts || 3;
    
    while (attempts < maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        const shouldRetry = await recovery.shouldRetry(error, attempts);
        if (!shouldRetry) {
          throw error;
        }
        
        await recovery.beforeRetry(error, attempts);
      }
    }
    
    throw new Error('Max attempts exceeded');
  };
  
  return { withErrorRecovery };
};
```

---

File operations modals menyediakan comprehensive file management capabilities dengan emphasis pada data integrity, performance optimization, dan seamless integration dengan statistical analysis workflows dalam Statify.
