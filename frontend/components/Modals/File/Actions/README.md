# File Actions System - Comprehensive File Operations Management

Centralized file operations system dalam Statify untuk managing comprehensive session management, data persistence, file export capabilities, dan application lifecycle operations. System ini menyediakan robust file handling dengan advanced workflow orchestration dan state management integration.

## 📁 Component Architecture

```
Actions/
├── useFileMenuActions.ts      # Core file operations hook
├── README.md                  # Documentation
│
└── __tests__/                 # Test suite
    └── useFileMenuActions.test.ts  # Hook functionality tests
```

## 🎯 Core Functionality

### File Operations System
```typescript
interface FileOperationsSystem {
  // Session management
  sessionManagement: {
    newSession: {
      purpose: 'Create new analysis session';
      workflow: NewSessionWorkflow;
      stateReset: StateResetStrategy;
      validation: SessionValidation;
    };
    
    saveSession: {
      purpose: 'Persist current session state';
      persistence: SessionPersistence;
      dataIntegrity: DataIntegrityChecker;
      rollbackStrategy: RollbackStrategy;
    };
    
    exitSession: {
      purpose: 'Clean exit with state preservation';
      cleanup: SessionCleanup;
      unsavedChangesCheck: UnsavedChangesChecker;
      gracefulShutdown: GracefulShutdown;
    };
  };
  
  // File export operations
  fileExportOperations: {
    savAsSpss: {
      purpose: 'Export data as SPSS .sav file';
      implementation: SpssExporter;
      dataTransformation: DataTransformer;
      formatValidation: FormatValidator;
    };
    
    exportCsv: {
      purpose: 'Export data as CSV file';
      implementation: CsvExporter;
      encodingOptions: EncodingOption[];
      customizations: CsvCustomization[];
    };
    
    exportExcel: {
      purpose: 'Export data as Excel file';
      implementation: ExcelExporter;
      worksheetManagement: WorksheetManager;
      formatting: ExcelFormatting;
    };
    
    exportPdf: {
      purpose: 'Export reports as PDF';
      implementation: PdfExporter;
      layoutOptions: PdfLayoutOption[];
      reportGeneration: ReportGenerator;
    };
  };
  
  // File import operations
  fileImportOperations: {
    importSpss: {
      purpose: 'Import SPSS .sav files';
      implementation: SpssImporter;
      metadataPreservation: MetadataPreserver;
      variableMapping: VariableMapper;
    };
    
    importCsv: {
      purpose: 'Import CSV files with intelligent parsing';
      implementation: CsvImporter;
      delimiterDetection: DelimiterDetector;
      typeInference: TypeInferenceEngine;
    };
    
    importExcel: {
      purpose: 'Import Excel files with sheet selection';
      implementation: ExcelImporter;
      sheetSelector: SheetSelector;
      rangeSelection: RangeSelector;
    };
    
    importClipboard: {
      purpose: 'Import data from clipboard';
      implementation: ClipboardImporter;
      formatDetection: FormatDetector;
      dataValidation: ClipboardDataValidator;
    };
  };
  
  // Advanced file operations
  advancedFileOperations: {
    fileCompression: {
      purpose: 'Compress large datasets for export';
      implementation: FileCompressor;
      algorithms: CompressionAlgorithm[];
      optimizationStrategies: OptimizationStrategy[];
    };
    
    fileEncryption: {
      purpose: 'Encrypt sensitive data files';
      implementation: FileEncryptor;
      encryptionMethods: EncryptionMethod[];
      keyManagement: KeyManager;
    };
    
    batchOperations: {
      purpose: 'Process multiple files in batch';
      implementation: BatchProcessor;
      progressTracking: ProgressTracker;
      errorRecovery: BatchErrorRecovery;
    };
    
    fileVersioning: {
      purpose: 'Manage file versions and history';
      implementation: FileVersionManager;
      versionControl: VersionController;
      changeTracking: ChangeTracker;
    };
  };
}
```

### Session Lifecycle Management
```typescript
interface SessionLifecycleManagement {
  // Session initialization
  sessionInitialization: {
    createNewSession: {
      stateReset: {
        dataStore: DataStoreReset;
        variableStore: VariableStoreReset;
        metaStore: MetaStoreReset;
        resultStore: ResultStoreReset;
        modalStore: ModalStoreReset;
      };
      
      defaultConfiguration: {
        analysisSettings: DefaultAnalysisSettings;
        uiPreferences: DefaultUIPreferences;
        dataViewSettings: DefaultDataViewSettings;
        chartDefaults: DefaultChartSettings;
      };
      
      initialization: {
        loadDefaultDataset: () => Promise<void>;
        setupAnalysisEnvironment: () => void;
        initializeUserPreferences: () => void;
        configureWorkspace: () => void;
      };
    };
    
    sessionValidation: {
      validateSessionState: () => SessionValidationResult;
      checkDataIntegrity: () => DataIntegrityResult;
      verifyStoreConsistency: () => StoreConsistencyResult;
      assessSessionHealth: () => SessionHealthResult;
    };
  };
  
  // Session persistence
  sessionPersistence: {
    saveCurrentSession: {
      dataCollection: {
        gatherDataState: () => DataState;
        gatherVariableState: () => VariableState;
        gatherMetaState: () => MetaState;
        gatherResultState: () => ResultState;
        gatherUIState: () => UIState;
      };
      
      dataSerialization: {
        serializeToSav: (data: SessionData) => Promise<Blob>;
        serializeToJson: (data: SessionData) => Promise<string>;
        compressSession: (data: SessionData) => Promise<CompressedSession>;
        validateSerialization: (serialized: SerializedData) => ValidationResult;
      };
      
      persistenceStrategy: {
        localPersistence: LocalPersistenceManager;
        cloudPersistence: CloudPersistenceManager;
        databasePersistence: DatabasePersistenceManager;
        filePersistence: FilePersistenceManager;
      };
    };
    
    sessionRecovery: {
      recoverFromCrash: () => Promise<RecoveryResult>;
      restoreFromBackup: (backup: SessionBackup) => Promise<RestoreResult>;
      validateRecoveredSession: (session: RecoveredSession) => ValidationResult;
      migrateOldSessions: (oldSession: OldSessionFormat) => Promise<MigrationResult>;
    };
  };
  
  // Session termination
  sessionTermination: {
    gracefulExit: {
      unsavedChangesCheck: {
        detectUnsavedChanges: () => UnsavedChangesResult;
        promptUserForSave: () => Promise<UserSaveDecision>;
        performAutoSave: () => Promise<AutoSaveResult>;
        skipSaveIfRequested: () => void;
      };
      
      cleanup: {
        clearTemporaryFiles: () => void;
        releaseResources: () => void;
        closeConnections: () => void;
        disposeEventListeners: () => void;
      };
      
      statePreservation: {
        preserveUserPreferences: () => void;
        saveWindowState: () => void;
        storeCacheState: () => void;
        updateRecentFiles: () => void;
      };
    };
    
    emergencyExit: {
      forceQuit: () => void;
      emergencyBackup: () => Promise<void>;
      logCrashDetails: (error: Error) => void;
      notifyErrorTracking: (error: Error) => void;
    };
  };
}
```

## 🔧 Hook Implementation

### useFileMenuActions Hook
```typescript
interface UseFileMenuActionsHook {
  // Core action handler
  actionHandler: {
    handleAction: (action: FileAction) => Promise<void>;
    actionValidation: ActionValidator;
    actionMiddleware: ActionMiddleware[];
    actionHistory: ActionHistory;
  };
  
  // File action implementations
  fileActionImplementations: {
    newAction: {
      execute: () => Promise<NewActionResult>;
      validation: NewActionValidator;
      preparation: NewActionPreparation;
      confirmation: NewActionConfirmation;
    };
    
    saveAction: {
      execute: () => Promise<SaveActionResult>;
      validation: SaveActionValidator;
      preparation: SaveActionPreparation;
      progressTracking: SaveProgressTracker;
    };
    
    saveAsAction: {
      execute: () => Promise<SaveAsActionResult>;
      validation: SaveAsActionValidator;
      fileDialog: FileDialogManager;
      formatSelection: FormatSelector;
    };
    
    exitAction: {
      execute: () => Promise<ExitActionResult>;
      validation: ExitActionValidator;
      confirmation: ExitConfirmation;
      cleanup: ExitCleanup;
    };
  };
  
  // State management integration
  stateManagementIntegration: {
    dataStore: {
      access: () => DataStore;
      reset: () => void;
      backup: () => DataStoreBackup;
      restore: (backup: DataStoreBackup) => void;
    };
    
    variableStore: {
      access: () => VariableStore;
      reset: () => void;
      backup: () => VariableStoreBackup;
      restore: (backup: VariableStoreBackup) => void;
    };
    
    metaStore: {
      access: () => MetaStore;
      reset: () => void;
      backup: () => MetaStoreBackup;
      restore: (backup: MetaStoreBackup) => void;
    };
    
    resultStore: {
      access: () => ResultStore;
      reset: () => void;
      backup: () => ResultStoreBackup;
      restore: (backup: ResultStoreBackup) => void;
    };
  };
  
  // Advanced features
  advancedFeatures: {
    actionQueuing: {
      queueAction: (action: FileAction) => void;
      processQueue: () => Promise<void>;
      clearQueue: () => void;
      prioritizeAction: (action: FileAction) => void;
    };
    
    undoRedoSystem: {
      undoLastAction: () => Promise<void>;
      redoLastAction: () => Promise<void>;
      canUndo: boolean;
      canRedo: boolean;
      actionHistory: FileActionHistory;
    };
    
    batchOperations: {
      executeBatch: (actions: FileAction[]) => Promise<BatchResult>;
      createBatch: () => BatchBuilder;
      optimizeBatch: (batch: FileActionBatch) => OptimizedBatch;
      validateBatch: (batch: FileActionBatch) => BatchValidationResult;
    };
    
    fileWatching: {
      watchFile: (filePath: string) => FileWatcher;
      stopWatching: (watcher: FileWatcher) => void;
      handleFileChange: (change: FileChange) => Promise<void>;
      autoReload: boolean;
    };
  };
  
  // Error handling and recovery
  errorHandlingRecovery: {
    errorHandler: {
      handleActionError: (error: ActionError) => Promise<ErrorHandlingResult>;
      recoverFromError: (error: ActionError) => Promise<RecoveryResult>;
      logError: (error: ActionError) => void;
      notifyUser: (error: ActionError) => void;
    };
    
    rollbackSystem: {
      createCheckpoint: () => Checkpoint;
      rollbackToCheckpoint: (checkpoint: Checkpoint) => Promise<void>;
      clearCheckpoints: () => void;
      autoCheckpoint: boolean;
    };
    
    retryMechanism: {
      retryAction: (action: FileAction) => Promise<RetryResult>;
      configureRetryPolicy: (policy: RetryPolicy) => void;
      exponentialBackoff: ExponentialBackoffConfig;
      maxRetryAttempts: number;
    };
  };
}
```

### File Export System
```typescript
interface FileExportSystem {
  // SPSS export
  spssExport: {
    dataPreparation: {
      sanitizeData: (data: DataMatrix) => SanitizedData;
      validateVariables: (variables: Variable[]) => VariableValidationResult;
      convertTypes: (data: DataMatrix) => TypeConvertedData;
      handleMissingValues: (data: DataMatrix) => ProcessedData;
    };
    
    metadataGeneration: {
      generateVariableLabels: (variables: Variable[]) => VariableLabel[];
      generateValueLabels: (variables: Variable[]) => ValueLabel[];
      generateMeasurementLevels: (variables: Variable[]) => MeasurementLevel[];
      generateCustomAttributes: (variables: Variable[]) => CustomAttribute[];
    };
    
    fileGeneration: {
      createSavFile: (data: ProcessedData, metadata: Metadata) => Promise<SavFile>;
      optimizeFileSize: (savFile: SavFile) => OptimizedSavFile;
      validateSavFile: (savFile: SavFile) => ValidationResult;
      compressSavFile: (savFile: SavFile) => CompressedSavFile;
    };
    
    downloadManagement: {
      triggerDownload: (file: SavFile, filename: string) => void;
      trackDownloadProgress: (download: Download) => ProgressTracker;
      handleDownloadError: (error: DownloadError) => void;
      cleanupTemporaryFiles: () => void;
    };
  };
  
  // Advanced export features
  advancedExportFeatures: {
    formatConversion: {
      convertToStata: (data: DataMatrix) => StataFile;
      convertToR: (data: DataMatrix) => RDataFile;
      convertToSas: (data: DataMatrix) => SasFile;
      convertToJson: (data: DataMatrix) => JsonFile;
    };
    
    customExportFormats: {
      defineCustomFormat: (format: CustomFormatDefinition) => CustomFormat;
      registerExporter: (exporter: CustomExporter) => void;
      validateCustomFormat: (format: CustomFormat) => ValidationResult;
      exportToCustomFormat: (data: DataMatrix, format: CustomFormat) => CustomFile;
    };
    
    batchExport: {
      exportMultipleFormats: (data: DataMatrix, formats: ExportFormat[]) => Promise<ExportBatchResult>;
      splitLargeDatasets: (data: DataMatrix) => DataChunk[];
      mergeExportResults: (results: ExportResult[]) => MergedExportResult;
      scheduleExport: (exportJob: ExportJob) => Promise<ScheduledExportResult>;
    };
    
    qualityAssurance: {
      validateExportedData: (original: DataMatrix, exported: ExportedData) => QualityReport;
      performIntegrityCheck: (exportedFile: ExportedFile) => IntegrityCheckResult;
      generateExportReport: (exportOperation: ExportOperation) => ExportReport;
      auditExportProcess: (exportProcess: ExportProcess) => AuditReport;
    };
  };
}
```

## 🧪 Testing Strategy

### Test Coverage Areas
```typescript
// File actions testing
describe('FileActionsSystem', () => {
  describe('Session management', () => {
    it('creates new session correctly');
    it('resets all stores properly');
    it('validates session state');
    it('handles session errors gracefully');
  });
  
  describe('File operations', () => {
    it('saves session data correctly');
    it('exports to SPSS format properly');
    it('handles large datasets efficiently');
    it('maintains data integrity during export');
  });
  
  describe('State integration', () => {
    it('integrates with Zustand stores correctly');
    it('manages store state transitions');
    it('handles concurrent store updates');
    it('maintains store consistency');
  });
  
  describe('Error handling', () => {
    it('recovers from export failures');
    it('provides meaningful error messages');
    it('implements proper rollback mechanisms');
    it('handles network failures gracefully');
  });
  
  describe('Performance optimization', () => {
    it('handles large datasets efficiently');
    it('implements proper memory management');
    it('optimizes file generation speed');
    it('manages concurrent operations');
  });
});

// Hook testing
describe('useFileMenuActions', () => {
  describe('Action handling', () => {
    it('processes file actions correctly');
    it('validates action parameters');
    it('handles action queuing properly');
    it('implements action history');
  });
  
  describe('Integration testing', () => {
    it('works with all Zustand stores');
    it('integrates with Next.js router');
    it('handles browser download APIs');
    it('manages file system interactions');
  });
});
```

## 📋 Development Guidelines

### Adding New File Operations
```typescript
// 1. Define file operation interface
interface NewFileOperation extends FileOperation {
  id: 'newOperation';
  name: 'New File Operation';
  description: 'Description of operation';
  category: 'import' | 'export' | 'session' | 'utility';
  parameters: FileOperationParameters;
  validation: FileOperationValidation;
}

// 2. Implement operation logic
const newFileOperationImplementation = {
  execute: async (
    data: DataMatrix,
    parameters: FileOperationParameters
  ): Promise<FileOperationResult> => {
    // Operation implementation
  },
  
  validate: (
    parameters: FileOperationParameters
  ): ValidationResult => {
    // Parameter validation
  },
  
  prepare: (
    data: DataMatrix
  ): PreparationResult => {
    // Data preparation
  }
};

// 3. Register in file actions system
const FILE_OPERATIONS = {
  ...existingOperations,
  newOperation: newFileOperationImplementation
};

// 4. Add comprehensive tests
describe('New File Operation', () => {
  it('executes operation correctly');
  it('validates parameters appropriately');
  it('handles edge cases gracefully');
  it('maintains data integrity');
});
```

### File Format Support Guidelines
```typescript
// 1. File format capabilities
const ensureFormatSupport = (format: FileFormat) => {
  const capabilities = {
    read: true,
    write: true,
    metadata: true,
    largeFiles: true,
    streaming: true
  };
  
  return validateFormatCapabilities(format, capabilities);
};

// 2. Performance optimization
const optimizeFileOperations = (operation: FileOperation) => {
  return {
    chunkSize: calculateOptimalChunkSize(operation.dataSize),
    parallelization: determineParallelizationStrategy(operation.complexity),
    memoryManagement: implementMemoryOptimization(operation.requirements),
    progressTracking: setupProgressTracking(operation.estimatedDuration)
  };
};
```

---

File Actions system menyediakan comprehensive file operations management dengan advanced session lifecycle, robust export capabilities, dan sophisticated state management integration untuk optimal file handling dalam Statify.
flowchart TD
    A[User Interaction] --> B{handleAction};
    B -- "New" --> C[Reset All Stores];
    B -- "Save" --> D[Save All Stores];
    B -- "SaveAs" --> E[Load Data from Stores];
    B -- "Exit" --> F[Reset All Stores];
    B -- "Exit" --> G[Redirect to Home];
    
    E --> H[Trim Data Matrix];
    H --> I[Filter Variables];
    I --> J[Sanitize Names];
    J --> K[Transform Data];
    K --> L[Call createSavFile API];
    L --> M[Trigger Download];
    
    C --> N[Zustand Stores];
    D --> N;
    F --> N;
    E --> N;
    
    N -- "State Changes" --> N;
    
    subgraph Legend
        direction LR
        subgraph Node Types
            direction LR
            hook[Hook]:::legend
            store[Zustand Store]:::legend
            api[API Service]:::legend
            browser[Browser API]:::legend
        end
    end
    
    classDef legend fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef hook fill:#d5e8d4,stroke:#82b366;
    classDef store fill:#fff2cc,stroke:#d6b656;
    classDef api fill:#e1d5e7,stroke:#9673a6;
    classDef browser fill:#ffe6cc,stroke:#d79b00;
    
    class A,B,C,D,E,F,G,H,I,J,K hook;
    class N store;
    class L,M api;
    class M browser;
```

### 3.3. Detailed Workflow Steps

#### New Action
1. User triggers "New" action from UI
2. `handleAction` is called with `actionType: "New"`
3. All Zustand stores are reset:
   - `useDataStore.resetData()`
   - `useVariableStore.resetVariables()`
   - `useMetaStore.resetMeta()`
   - `useResultStore.clearAll()`
4. Console log confirms session reset

#### Save Action
1. User triggers "Save" action from UI
2. `handleAction` is called with `actionType: "Save"`
3. Try/catch block wraps save operations
4. All relevant stores are saved:
   - `useMetaStore.saveMeta()`
   - `useVariableStore.saveVariables()`
   - `useDataStore.saveData()`
5. Success or error feedback is provided

#### SaveAs Action
1. User triggers "SaveAs" action from UI
2. `handleAction` is called with `actionType: "SaveAs"`
3. Try/catch block wraps export operations
4. Data is synced from stores:
   - `useVariableStore.loadVariables()`
   - `useDataStore.loadData()`
5. Data matrix is trimmed to actual used range
6. Variables are filtered for valid entries
7. Variable names are sanitized for SPSS compliance
8. Data is transformed to required JSON structure
9. `createSavFile` API is called with transformed data
10. `downloadBlobAsFile` triggers browser download
11. Success or error feedback is provided

#### Exit Action
1. User triggers "Exit" action from UI
2. `handleAction` is called with `actionType: "Exit"`
3. Try/catch block wraps exit operations
4. All Zustand stores are reset (same as New action)
5. Next.js router redirects to home page (`/`)
6. Success or error feedback is provided

## 4. Hook Properties and Return Values

### Input Parameters
The `handleAction` function accepts a payload of type `FileActionPayload`:

```typescript
interface FileActionPayload {
    actionType: FileMenuActionType;
    data?: any;
}

type FileMenuActionType = "New" | "Save" | "SaveAs" | "Exit";
```

### Return Values
The hook returns an object with the following properties:

- `handleAction: (payload: FileActionPayload) => Promise<void>`: Function to handle file menu actions

## 5. Error Handling

The hook implements comprehensive error handling:

- **Store Operations**:
  - Try/catch blocks for save and reset operations
  - Error logging to console
  - User alerts for critical failures

- **File Export**:
  - Try/catch blocks for data processing
  - Error logging to console
  - User alerts with specific error messages

- **Navigation**:
  - Try/catch blocks for router operations
  - Error logging to console
  - User alerts for navigation failures

## 6. Testing Strategy

### 6.1. Hook Testing (`__tests__/useFileMenuActions.test.ts`)
- **Focus**: Business logic in `useFileMenuActions` hook
- **Approach**: Mock Zustand stores, router, and API services
- **Coverage**:
  - Action handling for all action types
  - Store method calls
  - API service calls
  - Router navigation
  - Error scenarios
  - Unknown action handling

## 7. Performance Considerations

- Efficient state management with Zustand
- Proper resource cleanup
- Non-blocking async operations
- Optimized data processing for file export
- Memoization techniques where applicable

## 8. Dependencies

- Zustand stores (`useDataStore`, `useVariableStore`, `useMetaStore`, `useResultStore`)
- Next.js router (`next/navigation`)
- API services (`@/services/api`)
- `useModal` hook (`@/hooks/useModal`)

## 9. Usage Example

The hook is designed to be called from UI components like a main navigation menu.

```tsx
import React from 'react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useFileMenuActions, FileMenuActionType } from './hooks/useFileMenuActions';

const FileMenu = () => {
    const { handleAction } = useFileMenuActions();

    const onSelect = (action: FileMenuActionType) => {
        handleAction({ actionType: action });
    };

    return (
        <DropdownMenu>
            <DropdownMenuItem onSelect={() => onSelect("New")}>New</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSelect("Save")}>Save</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSelect("SaveAs")}>Save As...</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onSelect("Exit")}>Exit</DropdownMenuItem>
        </DropdownMenu>
    );
};

export default FileMenu;
```