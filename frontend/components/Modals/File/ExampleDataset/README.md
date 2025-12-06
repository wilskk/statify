# Example Dataset Modal - Comprehensive Demo Data Management System

Advanced demo data loading system dalam Statify untuk providing curated example datasets, educational data exploration, dan quick analysis prototyping. System ini menyediakan comprehensive dataset library dengan intelligent data processing dan seamless integration capabilities.

## 📁 Component Architecture

```
ExampleDataset/
├── index.tsx                  # Main modal component
├── types.ts                   # TypeScript type definitions
├── example-datasets.ts        # Dataset catalog and metadata
├── README.md                  # Documentation
│
├── __tests__/                 # Test suite
│   ├── ExampleDatasetModal.test.tsx        # Main component tests
│   ├── services.test.ts                    # Service function tests
│   └── useExampleDatasetLogic.test.ts      # Hook logic tests
│
├── hooks/                     # Business logic hooks
│   └── useExampleDatasetLogic.ts           # Core dataset loading logic
│
└── services/                  # Business logic services
    └── services.ts                         # Dataset processing and API integration
```

## 🎯 Core Functionality

### Example Dataset System
```typescript
interface ExampleDatasetSystem {
  // Dataset catalog
  datasetCatalog: {
    educationalDatasets: {
      purpose: 'Learning and training datasets';
      categories: DatasetCategory[];
      difficulty: DatasetDifficulty[];
      analysisTypes: AnalysisType[];
      datasets: EducationalDataset[];
    };
    
    businessDatasets: {
      purpose: 'Real-world business scenario datasets';
      industries: Industry[];
      useCases: BusinessUseCase[];
      complexityLevels: ComplexityLevel[];
      datasets: BusinessDataset[];
    };
    
    scientificDatasets: {
      purpose: 'Research and scientific analysis datasets';
      disciplines: ScientificDiscipline[];
      methodologies: ResearchMethodology[];
      publicationStatus: PublicationStatus[];
      datasets: ScientificDataset[];
    };
    
    syntheticDatasets: {
      purpose: 'Generated datasets for specific testing';
      generators: DataGenerator[];
      patterns: DataPattern[];
      anomalies: AnomalyType[];
      datasets: SyntheticDataset[];
    };
  };
  
  // Dataset metadata
  datasetMetadata: {
    basicInfo: {
      id: string;
      name: string;
      description: string;
      source: DatasetSource;
      version: string;
      lastUpdated: Date;
    };
    
    statisticalInfo: {
      sampleSize: number;
      variableCount: number;
      missingDataPercentage: number;
      dataQualityScore: number;
      distributionSummary: DistributionSummary;
    };
    
    analyticalInfo: {
      recommendedAnalyses: AnalysisRecommendation[];
      skillLevel: SkillLevel;
      estimatedTime: EstimatedAnalysisTime;
      learningObjectives: LearningObjective[];
      keyInsights: DatasetInsight[];
    };
    
    technicalInfo: {
      fileFormat: FileFormat;
      encoding: DataEncoding;
      delimiter: string;
      headerPresent: boolean;
      dataTypes: DataTypeInfo[];
    };
  };
  
  // Advanced dataset features
  advancedDatasetFeatures: {
    datasetVariations: {
      cleanVersion: CleanDatasetVersion;
      messyVersion: MessyDatasetVersion;
      partialVersion: PartialDatasetVersion;
      augmentedVersion: AugmentedDatasetVersion;
    };
    
    interactiveFeatures: {
      guidedAnalysis: GuidedAnalysisWorkflow;
      stepByStepTutorial: TutorialSteps[];
      challengeMode: AnalysisChallenge[];
      progressTracking: ProgressTracker;
    };
    
    customization: {
      sampleSizeAdjustment: SampleSizeAdjuster;
      variableSelection: VariableSelector;
      dataTransformation: DataTransformer;
      noiseInjection: NoiseInjector;
    };
    
    collaboration: {
      shareableConfigurations: ShareableConfig[];
      teamWorkspaces: TeamWorkspace[];
      annotationSystem: AnnotationSystem;
      discussionThreads: DiscussionThread[];
    };
  };
}
```

### Dataset Loading and Processing
```typescript
interface DatasetLoadingProcessing {
  // Loading workflow
  loadingWorkflow: {
    datasetSelection: {
      browseDatasets: () => DatasetBrowser;
      filterDatasets: (criteria: FilterCriteria) => Dataset[];
      searchDatasets: (query: SearchQuery) => SearchResult[];
      previewDataset: (dataset: Dataset) => DatasetPreview;
    };
    
    loadingProcess: {
      initializeLoading: (dataset: Dataset) => LoadingSession;
      downloadDataset: (dataset: Dataset) => Promise<DownloadResult>;
      validateDataset: (data: RawData) => ValidationResult;
      processDataset: (data: RawData) => ProcessedData;
    };
    
    dataIntegration: {
      integratewithStores: (data: ProcessedData) => Promise<IntegrationResult>;
      updateGlobalState: (data: ProcessedData) => StateUpdateResult;
      configureAnalysisEnvironment: (dataset: Dataset) => EnvironmentConfig;
      setupDefaultViews: (data: ProcessedData) => ViewConfiguration;
    };
    
    postLoadingSetup: {
      generateDataSummary: (data: ProcessedData) => DataSummary;
      suggestAnalyses: (data: ProcessedData) => AnalysisSuggestion[];
      createTutorialPath: (dataset: Dataset) => TutorialPath;
      enableGuidedMode: (dataset: Dataset) => GuidedModeConfig;
    };
  };
  
  // Data processing pipeline
  dataProcessingPipeline: {
    rawDataProcessing: {
      parseFileContent: (content: string) => ParsedData;
      detectDelimiter: (content: string) => DelimiterDetectionResult;
      inferDataTypes: (data: ParsedData) => TypeInferenceResult;
      handleMissingValues: (data: ParsedData) => MissingValueResult;
    };
    
    dataValidation: {
      validateDataIntegrity: (data: ParsedData) => IntegrityValidationResult;
      checkDataQuality: (data: ParsedData) => QualityAssessmentResult;
      detectAnomalies: (data: ParsedData) => AnomalyDetectionResult;
      assessCompleteness: (data: ParsedData) => CompletenessAssessment;
    };
    
    dataTransformation: {
      normalizeData: (data: ParsedData) => NormalizedData;
      standardizeVariables: (data: ParsedData) => StandardizedData;
      createDerivedVariables: (data: ParsedData) => DerivedVariableResult;
      applyDatasetSpecificTransforms: (data: ParsedData, transforms: Transform[]) => TransformedData;
    };
    
    metadataEnrichment: {
      extractMetadata: (data: ProcessedData) => ExtractedMetadata;
      enhanceWithDomainKnowledge: (metadata: ExtractedMetadata) => EnhancedMetadata;
      generateVariableDescriptions: (variables: Variable[]) => VariableDescription[];
      createAnalysisRecommendations: (data: ProcessedData) => AnalysisRecommendation[];
    };
  };
  
  // Quality assurance
  qualityAssurance: {
    dataValidation: {
      validateDatasetFormat: (dataset: Dataset) => FormatValidationResult;
      checkDatasetVersion: (dataset: Dataset) => VersionCheckResult;
      verifyDatasetIntegrity: (dataset: Dataset) => IntegrityVerificationResult;
      assessDatasetUsability: (dataset: Dataset) => UsabilityAssessment;
    };
    
    loadingVerification: {
      verifyLoadingSuccess: (loadingResult: LoadingResult) => VerificationResult;
      checkDataLoss: (original: RawData, processed: ProcessedData) => DataLossReport;
      validateTransformations: (transformations: Transformation[]) => TransformationValidation;
      confirmStoreIntegration: (integrationResult: IntegrationResult) => IntegrationConfirmation;
    };
    
    userExperienceValidation: {
      assessLoadingPerformance: (loadingMetrics: LoadingMetrics) => PerformanceAssessment;
      validateUserInterface: (uiState: UIState) => UIValidationResult;
      checkTutorialAccuracy: (tutorial: Tutorial) => TutorialValidation;
      verifyGuidedModeSetup: (guidedMode: GuidedMode) => GuidedModeValidation;
    };
  };
}
```

## 🔧 Hook Implementation

### useExampleDatasetLogic Hook
```typescript
interface UseExampleDatasetLogicHook {
  // Dataset management state
  datasetManagementState: {
    availableDatasets: Dataset[];
    selectedDataset: Dataset | null;
    datasetCategories: DatasetCategory[];
    currentCategory: DatasetCategory;
    filteredDatasets: Dataset[];
    searchQuery: string;
    sortOrder: SortOrder;
  };
  
  // Loading state management
  loadingStateManagement: {
    isLoading: boolean;
    loadingProgress: LoadingProgress;
    loadingStage: LoadingStage;
    errorState: ErrorState | null;
    successState: SuccessState | null;
    cancelToken: CancelToken;
  };
  
  // Dataset operations
  datasetOperations: {
    selectDataset: (dataset: Dataset) => void;
    loadDataset: (dataset: Dataset) => Promise<LoadingResult>;
    previewDataset: (dataset: Dataset) => Promise<PreviewResult>;
    cancelLoading: () => void;
    retryLoading: () => Promise<LoadingResult>;
    refreshDatasetList: () => Promise<void>;
  };
  
  // Filtering and search
  filteringSearch: {
    setSearchQuery: (query: string) => void;
    filterByCategory: (category: DatasetCategory) => void;
    filterByDifficulty: (difficulty: DatasetDifficulty) => void;
    filterByAnalysisType: (analysisType: AnalysisType) => void;
    setSortOrder: (order: SortOrder) => void;
    clearFilters: () => void;
  };
  
  // Dataset analysis
  datasetAnalysis: {
    analyzeDatasetMetadata: (dataset: Dataset) => DatasetAnalysis;
    calculateSuitabilityScore: (dataset: Dataset, userProfile: UserProfile) => SuitabilityScore;
    generateRecommendations: (userHistory: UserHistory) => DatasetRecommendation[];
    assessLearningValue: (dataset: Dataset) => LearningValueAssessment;
  };
  
  // Advanced features
  advancedFeatures: {
    datasetComparison: {
      compareDatasets: (datasets: Dataset[]) => ComparisonResult;
      highlightDifferences: (dataset1: Dataset, dataset2: Dataset) => DifferenceHighlight;
      suggestAlternatives: (dataset: Dataset) => AlternativeDataset[];
      createComparisonMatrix: (datasets: Dataset[]) => ComparisonMatrix;
    };
    
    personalizedRecommendations: {
      buildUserProfile: (interactions: UserInteraction[]) => UserProfile;
      recommendBasedOnHistory: (history: AnalysisHistory) => PersonalizedRecommendation[];
      suggestProgressionPath: (currentSkill: SkillLevel) => ProgressionPath;
      adaptToDifficultyPreference: (preference: DifficultyPreference) => AdaptedDatasetList;
    };
    
    socialFeatures: {
      getPopularDatasets: () => PopularDataset[];
      getCommunityRatings: (dataset: Dataset) => CommunityRating[];
      shareDatasetConfiguration: (config: DatasetConfiguration) => ShareResult;
      joinDatasetDiscussion: (dataset: Dataset) => DiscussionChannel;
    };
    
    analyticsTracking: {
      trackDatasetUsage: (dataset: Dataset, usage: UsageMetrics) => void;
      recordUserInteraction: (interaction: UserInteraction) => void;
      generateUsageReport: () => UsageReport;
      analyzeLearningProgress: (user: User) => LearningProgressAnalysis;
    };
  };
  
  // Integration management
  integrationManagement: {
    storeIntegration: {
      updateDataStore: (data: ProcessedData) => void;
      updateVariableStore: (variables: Variable[]) => void;
      updateMetaStore: (metadata: Metadata) => void;
      resetAllStores: () => void;
    };
    
    environmentSetup: {
      configureAnalysisEnvironment: (dataset: Dataset) => EnvironmentConfiguration;
      setupDefaultCharts: (data: ProcessedData) => ChartConfiguration[];
      initializeTutorialMode: (dataset: Dataset) => TutorialConfiguration;
      prepareGuidedAnalysis: (dataset: Dataset) => GuidedAnalysisSetup;
    };
    
    postLoadingActions: {
      generateWelcomeMessage: (dataset: Dataset) => WelcomeMessage;
      showDatasetOverview: (data: ProcessedData) => OverviewDisplay;
      enableRelevantFeatures: (dataset: Dataset) => FeatureConfiguration;
      setAnalysisContexty: (dataset: Dataset) => AnalysisContext;
    };
  };
}
```

### Example Dataset Service
```typescript
interface ExampleDatasetService {
  // Dataset catalog management
  datasetCatalogManagement: {
    fetchDatasetCatalog: () => Promise<DatasetCatalog>;
    updateDatasetMetadata: (datasetId: string, metadata: Metadata) => Promise<UpdateResult>;
    addNewDataset: (dataset: NewDataset) => Promise<AddResult>;
    removeDataset: (datasetId: string) => Promise<RemoveResult>;
    validateDatasetCatalog: (catalog: DatasetCatalog) => ValidationResult;
  };
  
  // Dataset loading operations
  datasetLoadingOperations: {
    loadDatasetFromUrl: (url: string) => Promise<LoadingResult>;
    loadDatasetFromFile: (file: File) => Promise<LoadingResult>;
    loadDatasetFromCache: (datasetId: string) => Promise<CachedLoadingResult>;
    streamLargeDataset: (dataset: LargeDataset) => AsyncIterator<DataChunk>;
  };
  
  // Data processing services
  dataProcessingServices: {
    processSavFileFromUrl: (url: string) => Promise<SavProcessingResult>;
    processCsvData: (csvData: string) => Promise<CsvProcessingResult>;
    processExcelData: (excelData: ArrayBuffer) => Promise<ExcelProcessingResult>;
    processJsonData: (jsonData: object) => Promise<JsonProcessingResult>;
  };
  
  // Quality control services
  qualityControlServices: {
    validateDatasetQuality: (dataset: ProcessedDataset) => QualityControlResult;
    performDatasetHealthCheck: (dataset: ProcessedDataset) => HealthCheckResult;
    generateQualityReport: (dataset: ProcessedDataset) => QualityReport;
    suggestQualityImprovements: (qualityReport: QualityReport) => ImprovementSuggestion[];
  };
  
  // Caching and optimization
  cachingOptimization: {
    cacheDataset: (dataset: ProcessedDataset) => Promise<CacheResult>;
    getCachedDataset: (datasetId: string) => Promise<CachedDataset>;
    invalidateCache: (datasetId: string) => Promise<void>;
    optimizeDatasetLoading: (dataset: Dataset) => OptimizationStrategy;
  };
  
  // Analytics and tracking
  analyticsTracking: {
    trackDatasetLoad: (datasetId: string, loadTime: number) => void;
    recordUserInteraction: (datasetId: string, interaction: Interaction) => void;
    generateUsageAnalytics: () => Promise<UsageAnalytics>;
    createRecommendationEngine: () => RecommendationEngine;
  };
}
```

## 🎨 UI Components

### ExampleDatasetModal Component
```typescript
interface ExampleDatasetModalProps {
  // Modal state
  modalState: {
    isOpen: boolean;
    onClose: () => void;
    onDatasetLoad: (dataset: Dataset) => void;
    currentStep: ModalStep;
    canNavigateBack: boolean;
    canNavigateForward: boolean;
  };
  
  // Dataset catalog
  datasetCatalog: {
    datasets: Dataset[];
    categories: DatasetCategory[];
    selectedCategory: DatasetCategory;
    onCategorySelect: (category: DatasetCategory) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
  };
  
  // Dataset selection
  datasetSelection: {
    selectedDataset: Dataset | null;
    onDatasetSelect: (dataset: Dataset) => void;
    onDatasetPreview: (dataset: Dataset) => void;
    datasetPreview: DatasetPreview | null;
    previewLoading: boolean;
  };
  
  // Loading state
  loadingState: {
    isLoading: boolean;
    loadingProgress: LoadingProgress;
    loadingMessage: string;
    canCancel: boolean;
    onCancel: () => void;
  };
  
  // Error handling
  errorHandling: {
    error: Error | null;
    onRetry: () => void;
    onDismissError: () => void;
    errorSeverity: ErrorSeverity;
    errorRecoveryOptions: RecoveryOption[];
  };
  
  // Advanced options
  advancedOptions: {
    showAdvancedOptions: boolean;
    onToggleAdvancedOptions: () => void;
    customizationOptions: CustomizationOption[];
    selectedCustomizations: Customization[];
    onCustomizationChange: (customizations: Customization[]) => void;
  };
  
  // Recommendation system
  recommendationSystem: {
    recommendedDatasets: RecommendedDataset[];
    recommendationReason: RecommendationReason[];
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    learningPath: LearningPath;
  };
  
  // Social features
  socialFeatures: {
    popularDatasets: PopularDataset[];
    communityRatings: CommunityRating[];
    recentlyUsed: RecentDataset[];
    favorites: FavoriteDataset[];
    onToggleFavorite: (dataset: Dataset) => void;
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// Example dataset functionality testing
describe('ExampleDatasetModal', () => {
  describe('Dataset catalog', () => {
    it('loads dataset catalog correctly');
    it('filters datasets by category');
    it('searches datasets effectively');
    it('handles catalog errors gracefully');
  });
  
  describe('Dataset loading', () => {
    it('loads datasets from URLs correctly');
    it('processes SAV files properly');
    it('handles large datasets efficiently');
    it('manages loading states appropriately');
  });
  
  describe('Data integration', () => {
    it('integrates with Zustand stores correctly');
    it('updates global state properly');
    it('maintains data integrity');
    it('handles integration errors');
  });
  
  describe('User experience', () => {
    it('provides meaningful loading feedback');
    it('handles user cancellation gracefully');
    it('displays helpful error messages');
    it('guides users through selection process');
  });
  
  describe('Performance', () => {
    it('loads datasets efficiently');
    it('manages memory usage properly');
    it('implements proper caching');
    it('handles concurrent loading requests');
  });
});

// Service testing
describe('ExampleDatasetService', () => {
  describe('Dataset processing', () => {
    it('processes SAV files correctly');
    it('handles various file formats');
    it('validates data integrity');
    it('manages processing errors');
  });
  
  describe('Quality control', () => {
    it('validates dataset quality');
    it('detects data issues');
    it('provides quality metrics');
    it('suggests improvements');
  });
});
```

## 📋 Development Guidelines

### Adding New Example Datasets
```typescript
// 1. Define dataset metadata
interface NewExampleDataset extends Dataset {
  id: 'newDatasetId';
  name: 'New Example Dataset';
  description: 'Comprehensive description';
  category: DatasetCategory;
  difficulty: DatasetDifficulty;
  analysisTypes: AnalysisType[];
  metadata: DatasetMetadata;
}

// 2. Add dataset to catalog
const EXAMPLE_DATASETS = {
  ...existingDatasets,
  newDatasetId: {
    ...newDatasetMetadata,
    url: 'path/to/dataset.sav',
    processingInstructions: DatasetProcessingInstructions,
    tutorialContent: TutorialContent,
    analysisRecommendations: AnalysisRecommendation[]
  }
};

// 3. Create tutorial content
const createTutorialContent = (dataset: Dataset) => {
  return {
    introduction: 'Dataset introduction',
    keyFeatures: ['Feature 1', 'Feature 2'],
    analysisSteps: AnalysisStep[],
    expectedResults: ExpectedResult[],
    furtherExploration: ExplorationSuggestion[]
  };
};

// 4. Add comprehensive tests
describe('New Example Dataset', () => {
  it('loads correctly');
  it('provides accurate metadata');
  it('integrates with tutorial system');
  it('supports recommended analyses');
});
```

### Educational Content Guidelines
```typescript
// 1. Learning progression
const createLearningProgression = (datasets: Dataset[]) => {
  return datasets.map((dataset, index) => ({
    ...dataset,
    prerequisites: getPrerequisites(index),
    learningObjectives: getLearningObjectives(dataset),
    skillsRequired: getSkillsRequired(dataset),
    nextSteps: getNextSteps(dataset)
  }));
};

// 2. Tutorial integration
const integrateTutorialSystem = (dataset: Dataset) => {
  return {
    guidedAnalysis: createGuidedAnalysis(dataset),
    interactiveElements: createInteractiveElements(dataset),
    progressTracking: setupProgressTracking(dataset),
    assessmentQuestions: generateAssessmentQuestions(dataset)
  };
};
```

---

Example Dataset modal menyediakan comprehensive demo data management dengan curated dataset library, intelligent processing capabilities, dan seamless educational integration untuk optimal learning experience dalam Statify.
            data_node[Data/Store]:::data
        end
    end
```

### Penjelasan Alur

1.  **Inisiasi (UI)**: Pengguna memilih salah satu dataset dari daftar yang ditampilkan oleh komponen `ExampleDatasetModal` (`index.tsx`).
2.  **Panggilan Logika (Hook)**: Aksi ini memanggil fungsi `loadDataset` dari *hook* `useExampleDatasetLogic.ts`.
3.  **Manajemen State (Zustand)**: *Hook* segera mengatur state `isLoading` menjadi `true` dan membersihkan data sebelumnya dari *store* Zustand (`useDataStore`, `useVariableStore`) untuk mencegah inkonsistensi.
4.  **Service Layer**: Fungsi `processSavFileFromUrl` dari `services/services.ts` dipanggil untuk mengambil file `.sav` dari lokasinya di direktori `public` dan memprosesnya.
5.  **Parsing & Integrasi (Zustand)**: Jika berhasil, respons dari *service* akan di-parse oleh `processSavApiResponse` untuk mengekstrak variabel, matriks data, dan metadata. Data yang bersih ini kemudian disimpan ke dalam *store* Zustand.
6.  **Feedback (UI)**: Setelah data berhasil terintegrasi, modal akan ditutup. Jika terjadi kegagalan, pesan *error* akan disimpan dalam *state* dan ditampilkan kepada pengguna.
7.  **Finalisasi**: State `isLoading` diatur kembali ke `false` setelah proses selesai, baik berhasil maupun gagal.

### Komponen Pendukung

-   **`index.tsx`**: Bertanggung jawab untuk me-render UI, termasuk daftar file dan filter tag.
-   **`example-datasets.ts`**: Menyediakan daftar statis dataset contoh, termasuk metadata seperti nama dan tag.
-   **`types.ts`**: Mendefinisikan struktur data untuk memastikan *type safety*.

## 4. Rencana Pengembangan di Masa Depan

-   **Dukungan Tipe File Lain**: Menambahkan dataset contoh dalam format lain seperti `.csv` atau `.xlsx`. Struktur file `example-datasets.ts` sudah siap untuk ini.
-   **Deskripsi Dataset**: Menambahkan deskripsi singkat atau tooltip untuk setiap dataset yang menjelaskan konteks data dan analisis apa yang cocok untuk dilakukan.
-   **Fungsi Pencarian/Filter**: Mengimplementasikan bar pencarian untuk memudahkan pengguna menemukan dataset tertentu, terutama jika daftarnya bertambah banyak.
-   **Pratinjau Data**: Memberikan kemampuan untuk melihat pratinjau beberapa baris dan kolom dari dataset sebelum memutuskan untuk memuatnya secara penuh.

## 5. Strategi Pengujian (Unit Testing)

> Semua pengujian berada di `components/Modals/File/ExampleDataset/__tests__/` dan mengikuti pola umum proyek (React-Testing-Library + Jest).

| Berkas | Fokus |
|--------|-------|
| `ExampleDatasetModal.test.tsx` | Pengujian UI untuk modal: render daftar file, interaksi klik (memanggil `loadDataset`), overlay loading, pesan error, dan tombol Cancel. |
| `useExampleDatasetLogic.test.ts` | Pengujian hook: alur pemuatan dataset (loading state ➜ fetch ➜ overwrite store ➜ close), pemanggilan store (`overwriteAll`, `resetData`, `setMeta`), serta penanganan error. |
| `services.test.ts` *(opsional)* | Pengujian utilitas/service: mock `fetch` dan `uploadSavFile` untuk memastikan alur jaringan berjalan benar. |

### Cara Menambah Pengujian Baru
1. Tambahkan berkas tes di folder `__tests__`.
2. Perbarui tabel di atas **dan** indeks pengujian sentral pada `components/Modals/File/README.md`.

---

_Last updated: <!-- KEEP THIS COMMENT: the CI tool replaces it with commit SHA & date -->_ 