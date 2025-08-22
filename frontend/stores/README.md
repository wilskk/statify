# Stores Directory - State Management

Direktori `stores/` berisi semua Zustand stores yang mengelola global state aplikasi Statify.

## 📁 Struktur

```
stores/
├── useDataStore.ts          # Data management state
├── useVariableStore.ts      # Variable management state  
├── useResultStore.ts        # Analysis results state
├── useModalStore.ts         # Modal management state
├── useMetaStore.ts         # Metadata state
├── useTableRefStore.ts     # Table reference state
├── useTimeSeriesStore.ts   # Time series data state
├── useStoreMediator.ts     # Cross-store communication
└── __tests__/              # Store tests
```

## 🎯 State Management Philosophy

### Zustand Advantages
- **Simplicity**: Minimal boilerplate dibanding Redux
- **TypeScript**: Full TypeScript support out of the box
- **Performance**: Automatic shallow comparison
- **DevTools**: Redux DevTools integration
- **Modularity**: Easy store composition

### Store Design Principles
- **Single Responsibility**: Setiap store mengelola domain yang spesifik
- **Immutability**: State updates yang immutable
- **Computed Values**: Derived state dengan selectors
- **Actions**: Encapsulated state mutations
- **Persistence**: Local storage integration where needed

## 🗃 Store Overview

### 📊 Data Store (`useDataStore`)
**Purpose**: Mengelola dataset dan operasi data

```typescript
interface DataStore {
  // State
  data: TableData[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setData: (data: TableData[]) => void;
  addRow: (row: TableData) => void;
  updateRow: (index: number, row: TableData) => void;
  deleteRow: (index: number) => void;
  clearData: () => void;
  
  // Async actions
  importData: (file: File) => Promise<void>;
  exportData: (format: 'csv' | 'excel') => Promise<void>;
}
```

**Key Features**:
- Data import/export
- Row-level operations
- Undo/redo functionality
- Data validation
- Persistence dengan IndexedDB

### 🔧 Variable Store (`useVariableStore`)
**Purpose**: Mengelola variable metadata dan properties

```typescript
interface VariableStore {
  // State
  variables: Variable[];
  selectedVariables: string[];
  
  // Actions
  setVariables: (variables: Variable[]) => void;
  updateVariable: (id: string, updates: Partial<Variable>) => void;
  selectVariables: (ids: string[]) => void;
  setVariableType: (id: string, type: VariableType) => void;
  setVariableLabels: (id: string, labels: ValueLabel[]) => void;
}
```

**Key Features**:
- Variable type management
- Value labels
- Missing values definition
- Variable selection
- Measurement levels

### 📈 Result Store (`useResultStore`)
**Purpose**: Mengelola hasil analisis dan visualisasi

```typescript
interface ResultStore {
  // State
  results: AnalysisResult[];
  currentResult: string | null;
  charts: ChartData[];
  
  // Actions
  addResult: (result: AnalysisResult) => void;
  setCurrentResult: (id: string) => void;
  updateChart: (id: string, chart: ChartData) => void;
  clearResults: () => void;
}
```

**Key Features**:
- Analysis results storage
- Chart data management
- Result navigation
- Export capabilities
- Result comparison

### 🪟 Modal Store (`useModalStore`)
**Purpose**: Mengelola modal dialogs dan overlays

```typescript
interface ModalStore {
  // State
  modals: Record<string, ModalState>;
  
  // Actions
  openModal: <T>(type: ModalType, props?: T) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModalProps: <T>(id: string, props: T) => void;
}
```

**Key Features**:
- Dynamic modal registration
- Modal stacking
- Type-safe modal props
- Modal lifecycle management

### 📋 Meta Store (`useMetaStore`)
**Purpose**: Mengelola metadata aplikasi

```typescript
interface MetaStore {
  // State
  fileInfo: FileInfo | null;
  datasetInfo: DatasetInfo;
  appSettings: AppSettings;
  
  // Actions
  setFileInfo: (info: FileInfo) => void;
  updateDatasetInfo: (info: Partial<DatasetInfo>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}
```

### 🔗 Store Mediator (`useStoreMediator`)
**Purpose**: Koordinasi antar stores

```typescript
interface StoreMediator {
  // Cross-store actions
  importDataWithVariables: (file: File) => Promise<void>;
  runAnalysisWithResults: (config: AnalysisConfig) => Promise<void>;
  resetAllStores: () => void;
}
```

## 🛠 Store Development Patterns

### Basic Store Structure
```typescript
// useExampleStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ExampleState {
  count: number;
  items: Item[];
  
  // Actions
  increment: () => void;
  addItem: (item: Item) => void;
  
  // Computed (via selectors)
  getItemById: (id: string) => Item | undefined;
}

const useExampleStore = create<ExampleState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        count: 0,
        items: [],
        
        // Actions
        increment: () => set(state => ({ count: state.count + 1 })),
        
        addItem: (item: Item) => set(state => ({
          items: [...state.items, item]
        })),
        
        // Selectors
        getItemById: (id: string) => {
          return get().items.find(item => item.id === id);
        },
      }),
      {
        name: 'example-storage',
        partialize: (state) => ({ count: state.count }), // Only persist count
      }
    ),
    { name: 'ExampleStore' }
  )
);

export default useExampleStore;
```

### Async Actions
```typescript
const useAsyncStore = create<AsyncState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  
  fetchData: async (url: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      set({ data, isLoading: false });
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },
}));
```

### Computed Values dengan Selectors
```typescript
// Separate selectors file
export const selectFilteredItems = (state: StoreState) => (filter: string) =>
  state.items.filter(item => item.category === filter);

export const selectItemCount = (state: StoreState) => 
  state.items.length;

export const selectExpensiveComputation = createSelector(
  (state: StoreState) => state.items,
  (state: StoreState) => state.config,
  (items, config) => {
    // Expensive computation here
    return computeExpensiveValue(items, config);
  }
);

// Usage dalam component
const Component = () => {
  const filteredItems = useStore(selectFilteredItems)('electronics');
  const itemCount = useStore(selectItemCount);
};
```

## 🔄 Store Communication

### Store Subscriptions
```typescript
// Listen to changes dalam stores lain
const useStoreListener = () => {
  const dataStore = useDataStore();
  const resultStore = useResultStore();
  
  useEffect(() => {
    // Subscribe to data changes
    const unsubscribe = useDataStore.subscribe(
      (state) => state.data,
      (data) => {
        // React to data changes
        if (data.length === 0) {
          resultStore.clearResults();
        }
      }
    );
    
    return unsubscribe;
  }, []);
};
```

### Cross-Store Actions
```typescript
// actions/crossStoreActions.ts
export const importDataWithAnalysis = async (file: File) => {
  const { setData, setLoading } = useDataStore.getState();
  const { setVariables } = useVariableStore.getState();
  const { addResult } = useResultStore.getState();
  
  setLoading(true);
  
  try {
    const { data, variables } = await parseFile(file);
    
    setData(data);
    setVariables(variables);
    
    // Auto-run basic analysis
    const basicStats = await calculateBasicStats(data);
    addResult(basicStats);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    setLoading(false);
  }
};
```

## 💾 Persistence Strategy

### Local Storage
```typescript
// Simple persistence
const usePersistedStore = create(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) => set({ settings: newSettings }),
    }),
    {
      name: 'app-settings',
    }
  )
);
```

### IndexedDB untuk Large Data
```typescript
// Custom persistence untuk large datasets
const useDataStore = create((set, get) => ({
  data: [],
  
  loadFromIndexedDB: async () => {
    const data = await indexedDB.getData('datasets');
    set({ data });
  },
  
  saveToIndexedDB: async () => {
    const { data } = get();
    await indexedDB.saveData('datasets', data);
  },
}));
```

### Selective Persistence
```typescript
const useSelectivePersist = create(
  persist(
    (set) => ({
      temporaryData: [],
      permanentSettings: {},
      updateSettings: (settings) => set({ permanentSettings: settings }),
    }),
    {
      name: 'selective-storage',
      partialize: (state) => ({ 
        permanentSettings: state.permanentSettings 
      }), // Only persist settings, not temporary data
    }
  )
);
```

## 🧪 Testing Stores

### Unit Tests
```typescript
// useExampleStore.test.ts
import { renderHook, act } from '@testing-library/react';
import useExampleStore from './useExampleStore';

describe('useExampleStore', () => {
  beforeEach(() => {
    // Reset store state
    useExampleStore.setState({ count: 0, items: [] });
  });
  
  it('should increment count', () => {
    const { result } = renderHook(() => useExampleStore());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
  
  it('should add items', () => {
    const { result } = renderHook(() => useExampleStore());
    const newItem = { id: '1', name: 'Test Item' };
    
    act(() => {
      result.current.addItem(newItem);
    });
    
    expect(result.current.items).toContain(newItem);
  });
});
```

### Integration Tests
```typescript
// Test cross-store functionality
describe('Store Integration', () => {
  it('should sync data between stores', async () => {
    const { result: dataResult } = renderHook(() => useDataStore());
    const { result: variableResult } = renderHook(() => useVariableStore());
    
    const testData = [{ id: 1, name: 'John', age: 30 }];
    
    await act(async () => {
      await dataResult.current.setData(testData);
    });
    
    // Variables should be auto-generated
    expect(variableResult.current.variables).toHaveLength(3);
  });
});
```

## 📊 Performance Optimization

### Memoization
```typescript
// Memoized selectors
const useOptimizedSelector = () => {
  return useStore(
    useCallback(
      (state) => ({
        filteredData: state.data.filter(item => item.active),
        count: state.data.length,
      }),
      []
    ),
    shallow // Shallow comparison
  );
};
```

### Store Splitting
```typescript
// Split large stores untuk better performance
const useLargeDataStore = create((set) => ({
  metadata: {},
  setMetadata: (metadata) => set({ metadata }),
}));

const useActualDataStore = create((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));
```

## 🔧 DevTools Integration

### Redux DevTools
```typescript
const useDevToolsStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
    }),
    { name: 'MyStore' }
  )
);
```

### Custom DevTools
```typescript
const useDebugStore = create((set, get) => ({
  data: [],
  
  debugLog: (action: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Store Action: ${action}`, get());
    }
  },
  
  setData: (data) => {
    set({ data });
    get().debugLog('setData');
  },
}));
```

## 📋 Best Practices

### Store Design
- **Keep stores focused**: Satu store untuk satu domain
- **Use TypeScript**: Strong typing untuk safety
- **Immutable updates**: Selalu return new objects
- **Action naming**: Consistent action naming convention
- **Error handling**: Proper error states dalam stores

### Performance
- **Selective subscriptions**: Subscribe hanya ke data yang diperlukan
- **Memoization**: Use selectors dengan proper memoization
- **Store splitting**: Pisahkan stores yang besar
- **Lazy loading**: Load store data when needed

### Testing
- **Reset state**: Always reset store state dalam tests
- **Mock async**: Mock async operations dalam tests
- **Integration tests**: Test cross-store interactions
- **Performance tests**: Test dengan large datasets

---

Direktori `stores/` menyediakan centralized state management yang scalable dan maintainable untuk aplikasi Statify, dengan emphasis pada TypeScript safety dan performance optimization.
