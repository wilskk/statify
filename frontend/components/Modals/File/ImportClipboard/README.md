# Import Clipboard Modal - Advanced Clipboard Data Import System

Comprehensive clipboard import system dalam Statify untuk providing intuitive data import from clipboard, intelligent parsing capabilities, dan flexible data configuration. System ini menyediakan powerful clipboard data processing dengan advanced format detection dan real-time preview capabilities.

## 📁 Component Architecture

```
ImportClipboard/
├── index.tsx                         # Main modal orchestrator
├── types.ts                          # TypeScript type definitions
├── importClipboard.utils.ts          # Parsing and utility functions
├── README.md                         # Documentation
│
├── __tests__/                        # Test suite
│   ├── importClipboard.utils.test.ts         # Utility function tests
│   ├── ImportClipboardConfigurationStep.test.tsx # Configuration component tests
│   ├── ImportClipboardPasteStep.test.tsx     # Paste component tests
│   ├── services.test.ts                      # Service function tests
│   ├── useImportClipboardLogic.test.ts       # Logic hook tests
│   └── useImportClipboardProcessor.test.ts   # Processor hook tests
│
├── components/                       # UI components
│   ├── ImportClipboardConfigurationStep.tsx  # Configuration step UI
│   └── ImportClipboardPasteStep.tsx          # Paste step UI
│
├── hooks/                           # Business logic hooks
│   ├── useImportClipboardLogic.ts            # Core import logic
│   └── useImportClipboardProcessor.ts        # Data processing logic
│
└── services/                        # Business logic services
    └── services.ts                           # Import processing services
```

## 🎯 Core Functionality

### Clipboard Import System
```typescript
interface ClipboardImportSystem {
  // Import workflow stages
  importWorkflowStages: {
    dataCapture: {
      purpose: 'Capture data from clipboard or manual input';
      methods: DataCaptureMethod[];
      validation: InputValidation;
      preprocessing: DataPreprocessing;
    };
    
    formatDetection: {
      purpose: 'Automatically detect data format and structure';
      detectors: FormatDetector[];
      heuristics: DetectionHeuristic[];
      confidence: DetectionConfidence;
    };
    
    configuration: {
      purpose: 'Configure parsing parameters with real-time preview';
      options: ConfigurationOption[];
      preview: RealTimePreview;
      validation: ConfigurationValidation;
    };
    
    dataProcessing: {
      purpose: 'Process and import data into application';
      processing: DataProcessingPipeline;
      validation: DataValidation;
      integration: StoreIntegration;
    };
  };
  
  // Advanced parsing capabilities
  advancedParsingCapabilities: {
    intelligentDelimiterDetection: {
      autoDetectDelimiter: (text: string) => DelimiterDetectionResult;
      analyzeDataStructure: (text: string) => StructureAnalysisResult;
      validateDelimiterConsistency: (text: string, delimiter: string) => ConsistencyResult;
      suggestOptimalDelimiter: (text: string) => DelimiterSuggestion;
    };
    
    textQualifierHandling: {
      detectTextQualifiers: (text: string) => QualifierDetectionResult;
      handleNestedQualifiers: (text: string, qualifier: string) => ProcessedText;
      validateQualifierConsistency: (text: string, qualifier: string) => QualifierValidation;
      escapeSpecialCharacters: (text: string) => EscapedText;
    };
    
    dataTypeInference: {
      inferColumnTypes: (columns: string[][]) => TypeInferenceResult[];
      detectDateFormats: (values: string[]) => DateFormatDetection;
      identifyNumericFormats: (values: string[]) => NumericFormatDetection;
      handleMixedTypes: (values: string[]) => MixedTypeHandling;
    };
    
    structuralAnalysis: {
      detectHeaderRow: (data: string[][]) => HeaderDetectionResult;
      identifyDataRegions: (data: string[][]) => DataRegionAnalysis;
      handleIrregularStructures: (data: string[][]) => StructureNormalization;
      validateDataConsistency: (data: string[][]) => ConsistencyValidation;
    };
  };
  
  // Real-time preview system
  realTimePreviewSystem: {
    previewGeneration: {
      generatePreview: (text: string, options: ParsingOptions) => PreviewResult;
      updatePreviewRealTime: (text: string, options: ParsingOptions) => void;
      optimizePreviewPerformance: (text: string) => PerformanceOptimization;
      handleLargeDataPreviews: (text: string) => LargeDataPreview;
    };
    
    interactiveConfiguration: {
      provideConfigurationOptions: () => ConfigurationOption[];
      validateConfigurationChanges: (changes: ConfigurationChange[]) => ValidationResult;
      applyConfigurationRealTime: (options: ParsingOptions) => void;
      suggestOptimalConfiguration: (text: string) => ConfigurationSuggestion;
    };
    
    visualFeedback: {
      highlightParsingIssues: (preview: PreviewResult) => HighlightedIssues;
      showDataQualityIndicators: (preview: PreviewResult) => QualityIndicator[];
      provideParsingGuidance: (issues: ParsingIssue[]) => ParsingGuidance;
      displayConfidenceMetrics: (analysis: AnalysisResult) => ConfidenceMetrics;
    };
  };
  
  // Advanced import features
  advancedImportFeatures: {
    batchClipboardProcessing: {
      processMultipleClipboards: (clipboards: ClipboardData[]) => Promise<BatchProcessingResult>;
      mergeClipboardData: (clipboards: ClipboardData[]) => MergedData;
      handleDataConflicts: (conflicts: DataConflict[]) => ConflictResolution;
      validateBatchConsistency: (batch: ClipboardBatch) => BatchValidation;
    };
    
    formatSpecificHandling: {
      handleExcelCopiedData: (excelData: ExcelClipboardData) => ProcessedData;
      processSpssCopiedData: (spssData: SpssClipboardData) => ProcessedData;
      handleWebTableData: (htmlData: HtmlTableData) => ProcessedData;
      processJsonClipboardData: (jsonData: JsonClipboardData) => ProcessedData;
    };
    
    intelligentDataCleaning: {
      removeUnwantedCharacters: (text: string) => CleanedText;
      normalizeWhitespace: (text: string) => NormalizedText;
      handleEncodingIssues: (text: string) => EncodingCorrectedText;
      repairCorruptedData: (data: CorruptedData) => RepairedData;
    };
    
    contextAwareProcessing: {
      adaptToDataContext: (data: RawData, context: DataContext) => AdaptedProcessing;
      applyDomainSpecificRules: (data: RawData, domain: DataDomain) => DomainProcessedData;
      useHistoricalPatterns: (data: RawData, history: ImportHistory) => PatternBasedProcessing;
      personalizeImportSettings: (data: RawData, userProfile: UserProfile) => PersonalizedSettings;
    };
  };
}
```

### Clipboard Data Processing Pipeline
```typescript
interface ClipboardDataProcessingPipeline {
  // Data capture and validation
  dataCaptureValidation: {
    clipboardAccess: {
      requestClipboardPermission: () => Promise<PermissionResult>;
      readClipboardContent: () => Promise<ClipboardContent>;
      handleClipboardErrors: (error: ClipboardError) => ErrorHandling;
      validateClipboardData: (data: ClipboardData) => ValidationResult;
    };
    
    inputValidation: {
      validateTextInput: (text: string) => TextValidationResult;
      checkDataSize: (text: string) => SizeValidationResult;
      validateCharacterEncoding: (text: string) => EncodingValidation;
      detectPotentialIssues: (text: string) => IssueDetection[];
    };
    
    preprocessing: {
      normalizeLineEndings: (text: string) => NormalizedText;
      handleSpecialCharacters: (text: string) => ProcessedText;
      removeMetadata: (text: string) => CleanedText;
      prepareForParsing: (text: string) => ParseReadyText;
    };
  };
  
  // Parsing and structure analysis
  parsingStructureAnalysis: {
    delimiterAnalysis: {
      detectCommonDelimiters: (text: string) => DelimiterCandidate[];
      analyzeDelimiterFrequency: (text: string, delimiter: string) => FrequencyAnalysis;
      validateDelimiterChoice: (text: string, delimiter: string) => DelimiterValidation;
      handleMixedDelimiters: (text: string) => MixedDelimiterHandling;
    };
    
    structuralParsing: {
      parseTextToColumns: (text: string, options: ParsingOptions) => ParsedData;
      handleQuotedFields: (text: string, qualifier: string) => QuotedFieldHandling;
      processEscapedCharacters: (text: string) => EscapeProcessing;
      normalizeRowStructure: (rows: string[][]) => NormalizedRows;
    };
    
    dataTypeAnalysis: {
      analyzeColumnTypes: (columns: string[][]) => ColumnTypeAnalysis[];
      detectNumericColumns: (column: string[]) => NumericDetection;
      identifyDateColumns: (column: string[]) => DateDetection;
      handleMixedTypeColumns: (column: string[]) => MixedTypeHandling;
    };
    
    qualityAssessment: {
      assessDataQuality: (data: ParsedData) => DataQualityReport;
      identifyInconsistencies: (data: ParsedData) => InconsistencyReport;
      detectOutliers: (data: ParsedData) => OutlierDetection;
      validateDataIntegrity: (data: ParsedData) => IntegrityValidation;
    };
  };
  
  // Configuration and optimization
  configurationOptimization: {
    configurationRecommendation: {
      recommendParsingOptions: (text: string) => ParsingRecommendation;
      suggestDataTypes: (columns: string[][]) => TypeSuggestion[];
      optimizeForDataQuality: (data: ParsedData) => QualityOptimization;
      personalizeRecommendations: (text: string, history: ImportHistory) => PersonalizedRecommendation;
    };
    
    performanceOptimization: {
      optimizeParsingPerformance: (text: string, options: ParsingOptions) => PerformanceOptimization;
      handleLargeClipboardData: (largeText: string) => LargeDataHandling;
      implementProgressiveLoading: (text: string) => ProgressiveLoadingStrategy;
      cacheParsingResults: (text: string, options: ParsingOptions) => CachingStrategy;
    };
    
    adaptiveConfiguration: {
      adaptToDataCharacteristics: (data: ParsedData) => AdaptiveSettings;
      learnFromUserBehavior: (interactions: UserInteraction[]) => LearnedPreferences;
      adjustBasedOnFeedback: (feedback: UserFeedback) => AdjustedSettings;
      evolveParsingSrategy: (history: ParsingHistory) => EvolvedStrategy;
    };
  };
}
```

## 🔧 Hook Implementation

### useImportClipboardLogic Hook
```typescript
interface UseImportClipboardLogicHook {
  // Import stage management
  importStageManagement: {
    currentStage: ImportStage;
    setStage: (stage: ImportStage) => void;
    canProceedToNext: () => boolean;
    canGoBack: () => boolean;
    resetToInitial: () => void;
  };
  
  // Data state management
  dataStateManagement: {
    pastedText: string;
    setPastedText: (text: string) => void;
    parsedData: ParsedData | null;
    setParsedData: (data: ParsedData) => void;
    clearData: () => void;
    hasValidData: () => boolean;
  };
  
  // Configuration state
  configurationState: {
    parsingOptions: ParsingOptions;
    updateParsingOptions: (options: Partial<ParsingOptions>) => void;
    resetParsingOptions: () => void;
    validateConfiguration: () => ConfigurationValidationResult;
  };
  
  // Import execution
  importExecution: {
    processImport: () => Promise<ImportResult>;
    cancelImport: () => void;
    retryImport: () => Promise<ImportResult>;
    importWithValidation: () => Promise<ValidatedImportResult>;
  };
  
  // Error and state management
  errorStateManagement: {
    importError: ImportError | null;
    clearError: () => void;
    isProcessing: boolean;
    importSuccess: boolean;
    importProgress: ImportProgress;
  };
  
  // Advanced features
  advancedFeatures: {
    clipboardIntegration: {
      requestClipboardAccess: () => Promise<ClipboardAccessResult>;
      readFromClipboard: () => Promise<ClipboardReadResult>;
      detectClipboardFormat: () => Promise<FormatDetectionResult>;
      handleClipboardPermissions: () => Promise<PermissionResult>;
    };
    
    presetManagement: {
      saveImportPreset: (name: string) => void;
      loadImportPreset: (presetId: string) => void;
      deleteImportPreset: (presetId: string) => void;
      listAvailablePresets: () => ImportPreset[];
    };
    
    historyTracking: {
      recordImportHistory: (importOperation: ImportOperation) => void;
      getImportHistory: () => ImportHistoryEntry[];
      clearImportHistory: () => void;
      learnFromHistory: () => LearnedPreferences;
    };
    
    intelligentSuggestions: {
      suggestParsingOptions: (text: string) => OptionSuggestion[];
      recommendDataTypes: (columns: string[][]) => TypeRecommendation[];
      provideQualityFeedback: (data: ParsedData) => QualityFeedback;
      generateImprovementSuggestions: (issues: DataIssue[]) => ImprovementSuggestion[];
    };
  };
}
```

### useImportClipboardProcessor Hook
```typescript
interface UseImportClipboardProcessorHook {
  // Data processing
  dataProcessing: {
    processClipboardData: (
      text: string,
      options: ParsingOptions
    ) => Promise<ProcessingResult>;
    
    validateProcessedData: (
      data: ProcessedData
    ) => ValidationResult;
    
    optimizeDataStructure: (
      data: ProcessedData
    ) => OptimizedData;
    
    handleProcessingErrors: (
      error: ProcessingError
    ) => ErrorHandlingResult;
  };
  
  // Variable creation
  variableCreation: {
    createVariablesFromData: (
      data: ProcessedData
    ) => Variable[];
    
    inferVariableTypes: (
      columns: DataColumn[]
    ) => VariableType[];
    
    generateVariableLabels: (
      headers: string[]
    ) => VariableLabel[];
    
    validateVariableStructure: (
      variables: Variable[]
    ) => VariableValidation;
  };
  
  // Store integration
  storeIntegration: {
    updateDataStore: (data: DataMatrix) => void;
    updateVariableStore: (variables: Variable[]) => void;
    updateMetaStore: (metadata: ImportMetadata) => void;
    overwriteAllStores: (importResult: ImportResult) => void;
  };
  
  // Quality assurance
  qualityAssurance: {
    performQualityChecks: (
      data: ProcessedData
    ) => QualityAssessmentResult;
    
    validateDataIntegrity: (
      originalText: string,
      processedData: ProcessedData
    ) => IntegrityValidation;
    
    generateQualityReport: (
      processingResult: ProcessingResult
    ) => QualityReport;
    
    suggestDataImprovements: (
      qualityReport: QualityReport
    ) => ImprovementSuggestion[];
  };
  
  // Processing state
  processingState: {
    isProcessing: boolean;
    processingProgress: ProcessingProgress;
    processingError: ProcessingError | null;
    processingSuccess: boolean;
    canProcess: boolean;
  };
}
```

## 🎨 UI Components

### ImportClipboardPasteStep Component
```typescript
interface ImportClipboardPasteStepProps {
  // Data input
  dataInput: {
    pastedText: string;
    onTextChange: (text: string) => void;
    onPasteFromClipboard: () => Promise<void>;
    placeholder: string;
    maxLength: number;
  };
  
  // Clipboard integration
  clipboardIntegration: {
    canAccessClipboard: boolean;
    isReadingClipboard: boolean;
    clipboardError: ClipboardError | null;
    onRetryClipboardAccess: () => void;
  };
  
  // Validation and feedback
  validationFeedback: {
    inputValidation: InputValidationResult;
    dataPreview: DataPreview;
    showValidation: boolean;
    validationErrors: ValidationError[];
  };
  
  // Navigation
  navigation: {
    canContinue: boolean;
    onContinue: () => void;
    onCancel: () => void;
    onBack: () => void;
  };
  
  // Help and guidance
  helpGuidance: {
    showTour: boolean;
    onStartTour: () => void;
    helpText: string;
    examples: DataExample[];
  };
}
```

### ImportClipboardConfigurationStep Component
```typescript
interface ImportClipboardConfigurationStepProps {
  // Configuration options
  configurationOptions: {
    delimiter: string;
    onDelimiterChange: (delimiter: string) => void;
    textQualifier: string;
    onTextQualifierChange: (qualifier: string) => void;
    firstRowAsHeaders: boolean;
    onFirstRowAsHeadersChange: (value: boolean) => void;
    trimWhitespace: boolean;
    onTrimWhitespaceChange: (value: boolean) => void;
    skipEmptyRows: boolean;
    onSkipEmptyRowsChange: (value: boolean) => void;
  };
  
  // Real-time preview
  realTimePreview: {
    previewData: PreviewData;
    isGeneratingPreview: boolean;
    previewError: PreviewError | null;
    onRefreshPreview: () => void;
  };
  
  // Data quality feedback
  dataQualityFeedback: {
    qualityMetrics: DataQualityMetric[];
    issues: DataIssue[];
    suggestions: ConfigurationSuggestion[];
    showQualityDetails: boolean;
    onToggleQualityDetails: () => void;
  };
  
  // Import execution
  importExecution: {
    canImport: boolean;
    onImport: () => void;
    isImporting: boolean;
    importProgress: ImportProgress;
    onCancelImport: () => void;
  };
  
  // Navigation and help
  navigationHelp: {
    onBack: () => void;
    onCancel: () => void;
    onHelp: () => void;
    showAdvancedOptions: boolean;
    onToggleAdvancedOptions: () => void;
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Clipboard import functionality testing
describe('ImportClipboardModal', () => {
  describe('Data capture', () => {
    it('captures clipboard data correctly');
    it('handles manual text input properly');
    it('validates input data appropriately');
    it('manages clipboard permissions correctly');
  });
  
  describe('Format detection', () => {
    it('detects delimiters accurately');
    it('identifies text qualifiers correctly');
    it('infers data types properly');
    it('handles complex data structures');
  });
  
  describe('Real-time preview', () => {
    it('generates previews correctly');
    it('updates previews in real-time');
    it('handles large data previews efficiently');
    it('provides accurate quality feedback');
  });
  
  describe('Data processing', () => {
    it('processes data correctly');
    it('handles various text formats');
    it('maintains data integrity');
    it('integrates with stores properly');
  });
  
  describe('User experience', () => {
    it('provides intuitive workflow');
    it('handles errors gracefully');
    it('offers helpful guidance');
    it('maintains responsive interface');
  });
});

// Utility testing
describe('importClipboard.utils', () => {
  describe('Text parsing', () => {
    it('parses delimited text correctly');
    it('handles quoted fields properly');
    it('processes escaped characters');
    it('manages edge cases gracefully');
  });
  
  describe('Type inference', () => {
    it('infers types correctly');
    it('handles mixed types properly');
    it('detects dates accurately');
    it('identifies numeric formats');
  });
});
```

## 📋 Development Guidelines

### Adding New Parsing Features
```typescript
// 1. Define parsing feature interface
interface NewParsingFeature extends ParsingFeature {
  id: 'newFeature';
  name: 'New Parsing Feature';
  description: 'Feature description';
  category: 'delimiter' | 'type' | 'structure' | 'quality';
  implementation: FeatureImplementation;
}

// 2. Implement parsing logic
const newParsingFeatureImplementation = {
  detect: (text: string) => {
    // Feature detection logic
  },
  
  apply: (text: string, options: FeatureOptions) => {
    // Feature application logic
  },
  
  validate: (result: FeatureResult) => {
    // Result validation
  }
};

// 3. Register feature
const PARSING_FEATURES = {
  ...existingFeatures,
  newFeature: newParsingFeatureImplementation
};

// 4. Add comprehensive tests
describe('New Parsing Feature', () => {
  it('detects feature correctly');
  it('applies feature properly');
  it('validates results accurately');
  it('handles edge cases gracefully');
});
```

### Clipboard Integration Guidelines
```typescript
// 1. Clipboard API enhancement
const enhanceClipboardIntegration = () => {
  return {
    modernAPI: useClipboardAPI(),
    fallbackMethods: implementFallbackMethods(),
    permissionHandling: manageClipboardPermissions(),
    crossBrowserSupport: ensureCrossBrowserCompatibility()
  };
};

// 2. Performance optimization
const optimizeClipboardPerformance = (data: ClipboardData) => {
  return {
    streamProcessing: implementStreamProcessing(data.size),
    chunkProcessing: useChunkProcessing(data.complexity),
    caching: implementIntelligentCaching(data.characteristics),
    memoryManagement: optimizeMemoryUsage(data.estimatedSize)
  };
};
```

---

Import Clipboard modal menyediakan comprehensive clipboard data import dengan intelligent parsing capabilities, real-time preview system, dan advanced format detection untuk optimal data import experience dalam Statify.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang relevan untuk fitur ini.
    -   **`README.md`**: (File ini) Dokumentasi fitur.

-   **`components/`**
    -   **`ImportClipboardPasteStep.tsx`**: Komponen UI untuk tahap pertama. Bertanggung jawab untuk menangani input teks dari pengguna, baik melalui *paste* manual maupun tombol.
    -   **`ImportClipboardConfigurationStep.tsx`**: Komponen UI untuk tahap kedua. Menampilkan opsi konfigurasi *parsing* dan pratinjau data menggunakan `Handsontable`.

-   **`hooks/`**
    -   **`useImportClipboardLogic.ts`**: Mengelola *state* utama modal, seperti tahap saat ini (`paste` atau `configure`), teks yang ditempel, dan navigasi antar-langkah.
    -   **`useImportClipboardProcessor.ts`**: Berisi logika untuk memproses, mengubah, dan mengimpor data. Hook ini dipanggil oleh `ConfigurationStep` untuk finalisasi.

-   **`services/`**
    -   **`services.ts`**: Abstraksi untuk interaksi dengan Browser API, khususnya `navigator.clipboard.readText()` untuk mengakses clipboard secara aman.

-   **`utils/`**
    -   **`utils.ts`**: Berisi fungsi utilitas inti, termasuk fungsi `excelStyleTextToColumns` yang merupakan jantung dari logika *parsing* teks menjadi struktur kolom dan baris.

## 6. Properti Komponen (`ImportClipboardProps`)

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* yang dipanggil untuk menutup modal.
-   `containerType?: "dialog" | "sidebar"`: **(Opsional)** Menentukan konteks render untuk penyesuaian tata letak.

## 7. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`).
    -   Komponen UI dari `@/components/ui/*`.
-   **Eksternal**:
    -   `handsontable/react-wrapper`: Untuk menampilkan pratinjau data interaktif.
    -   `framer-motion`: Untuk animasi transisi dan *highlighting* pada fitur *tour*.
