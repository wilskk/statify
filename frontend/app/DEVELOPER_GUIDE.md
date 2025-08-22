# Developer Guide - Statify App Directory

> **Comprehensive developer documentation** for the Statify frontend application built with Next.js 13+ App Router, TypeScript, and modern React patterns.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Directory Structure](#directory-structure)
4. [Development Patterns](#development-patterns)
5. [State Management](#state-management)
6. [Performance Guidelines](#performance-guidelines)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

## Quick Start

### Prerequisites
```bash
# Node.js 18+ and npm/yarn
node --version  # >= 18.0.0
npm --version   # >= 8.0.0

# Required dependencies
npm install
```

### Development Server
```bash
# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Project Structure Overview
```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx               # Landing page / routing logic
├── dashboard/             # Main application (protected)
│   ├── data/             # Data management interface
│   ├── variable/         # Variable metadata editor
│   └── result/           # Analysis results viewer
├── help/                 # Help system and documentation
└── landing/              # Public marketing pages
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom design system
- **State**: Zustand for global state management
- **Charts**: D3.js and Chart.js for visualizations
- **Tables**: Handsontable for spreadsheet functionality
- **Testing**: Jest + React Testing Library

### Core Architectural Principles

#### 1. Server-First Architecture
```typescript
// Default to Server Components
export default function MyPage() {
  // Runs on server by default
  return <div>Content</div>;
}

// Client components explicitly marked
'use client';
export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <div onClick={() => setState(prev => !prev)}>Interactive</div>;
}
```

#### 2. Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced interactivity with client-side hydration
- Graceful degradation for older browsers

#### 3. Performance-First Design
- Route-based code splitting
- Component lazy loading
- Optimized bundle sizes
- Efficient state management

## Directory Structure

### App Router Convention
```
app/
├── globals.css                    # Global styles and CSS variables
├── layout.tsx                     # Root layout (metadata, providers)
├── page.tsx                      # Home page component
├── loading.tsx                   # Global loading UI
├── error.tsx                     # Global error boundary
├── not-found.tsx                 # 404 page
├── favicon.ico                   # App icon
│
├── dashboard/                    # Protected application area
│   ├── layout.tsx               # Dashboard layout
│   ├── loading.tsx              # Dashboard loading state
│   ├── page.tsx                 # Dashboard landing
│   ├── data/                    # Data management
│   │   ├── page.tsx            # Data table interface
│   │   ├── loading.tsx         # Data loading state
│   │   └── components/         # Data-specific components
│   ├── variable/               # Variable management
│   │   ├── page.tsx           # Variable editor interface
│   │   ├── loading.tsx        # Variable loading state
│   │   └── components/        # Variable-specific components
│   └── result/                # Results display
│       ├── page.tsx          # Results viewer interface
│       ├── loading.tsx       # Results loading state
│       └── components/       # Result-specific components
│
├── help/                       # Help and documentation
│   ├── page.tsx               # Help system entry
│   └── components/            # Help components
│
└── landing/                    # Public marketing
    ├── layout.tsx             # Landing layout
    ├── page.tsx              # Landing page
    └── components/           # Landing components
```

## Development Patterns

### 1. Page Component Pattern
```typescript
// app/dashboard/data/page.tsx
import { Suspense } from 'react';
import { DataTable } from './components/DataTable';
import { Toolbar } from './components/Toolbar';
import { LoadingState } from './loading';

export default function DataPage() {
  return (
    <div className="data-page">
      <Toolbar />
      <Suspense fallback={<LoadingState />}>
        <DataTable />
      </Suspense>
    </div>
  );
}

// SEO metadata
export const metadata = {
  title: 'Data Management - Statify',
  description: 'Manage and edit your datasets'
};
```

### 2. Layout Component Pattern
```typescript
// app/dashboard/layout.tsx
import { Navigation } from './components/Navigation';
import { Providers } from '@/components/providers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="dashboard-layout">
        <Navigation />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </Providers>
  );
}
```

### 3. Component Organization
```typescript
// components/feature/index.tsx - Main export
export { FeatureComponent } from './FeatureComponent';
export { FeatureDialog } from './FeatureDialog';
export type { FeatureProps } from './types';

// components/feature/FeatureComponent.tsx - Implementation
import { useFeatureLogic } from './hooks/useFeatureLogic';
import { FeatureService } from './services/FeatureService';

export function FeatureComponent({ data }: FeatureProps) {
  const { state, actions } = useFeatureLogic(data);
  
  return (
    <div className="feature-component">
      {/* Component implementation */}
    </div>
  );
}
```

## State Management

### Zustand Store Pattern
```typescript
// stores/useFeatureStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FeatureState {
  // State
  data: FeatureData[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setData: (data: FeatureData[]) => void;
  addItem: (item: FeatureData) => void;
  updateItem: (id: string, updates: Partial<FeatureData>) => void;
  deleteItem: (id: string) => void;
  
  // Async actions
  fetchData: () => Promise<void>;
  saveData: () => Promise<void>;
}

export const useFeatureStore = create<FeatureState>()(
  devtools(
    (set, get) => ({
      // Initial state
      data: [],
      isLoading: false,
      error: null,
      
      // Sync actions
      setData: (data) => set({ data }),
      addItem: (item) => set(state => ({ 
        data: [...state.data, item] 
      })),
      updateItem: (id, updates) => set(state => ({
        data: state.data.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      deleteItem: (id) => set(state => ({
        data: state.data.filter(item => item.id !== id)
      })),
      
      // Async actions
      fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await FeatureAPI.fetchData();
          set({ data, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      saveData: async () => {
        const { data } = get();
        try {
          await FeatureAPI.saveData(data);
        } catch (error) {
          set({ error: error.message });
        }
      }
    }),
    { name: 'feature-store' }
  )
);
```

### Store Communication Pattern
```typescript
// stores/useStoreMediator.ts
export const useStoreMediator = () => {
  const dataStore = useDataStore();
  const variableStore = useVariableStore();
  const resultStore = useResultStore();
  
  // Cross-store synchronization
  useEffect(() => {
    const unsubscribe = dataStore.subscribe((state) => {
      if (state.dataChanged) {
        variableStore.syncWithData(state.data);
        resultStore.invalidateResults();
      }
    });
    
    return unsubscribe;
  }, []);
  
  return {
    // Coordinated actions
    loadDataset: async (file: File) => {
      await dataStore.loadFile(file);
      await variableStore.inferFromData();
    },
    
    runAnalysis: async (config: AnalysisConfig) => {
      const data = dataStore.getData();
      const variables = variableStore.getVariables();
      return await resultStore.runAnalysis(config, data, variables);
    }
  };
};
```

## Performance Guidelines

### 1. Component Optimization
```typescript
// Memoization patterns
const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);
  
  const handleUpdate = useCallback((id: string, value: any) => {
    onUpdate(id, value);
  }, [onUpdate]);
  
  return <div>{/* Component content */}</div>;
});

// Selective store subscriptions
const optimizedSelector = (state) => ({
  relevantData: state.data.slice(0, 100), // Only what's needed
  isLoading: state.isLoading
});

const Component = () => {
  const { relevantData, isLoading } = useStore(optimizedSelector, shallow);
  // Component implementation
};
```

### 2. Large Dataset Handling
```typescript
// Virtual scrolling for tables
const VirtualizedTable = ({ data }: { data: any[] }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const visibleData = useMemo(() => 
    data.slice(visibleRange.start, visibleRange.end),
    [data, visibleRange]
  );
  
  return (
    <VirtualContainer 
      totalItems={data.length}
      itemHeight={40}
      onRangeChange={setVisibleRange}
    >
      {visibleData.map(item => (
        <TableRow key={item.id} data={item} />
      ))}
    </VirtualContainer>
  );
};
```

### 3. Bundle Optimization
```typescript
// Dynamic imports for large components
const ChartComponent = dynamic(
  () => import('./components/ChartComponent'),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false // Client-side only for heavy charts
  }
);

// Route-based code splitting (automatic with App Router)
// Each page.tsx creates a separate bundle chunk
```

## Testing Strategy

### Component Testing
```typescript
// __tests__/DataPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataPage } from '../page';
import { TestProviders } from '@/test-utils/providers';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <TestProviders>
      {component}
    </TestProviders>
  );
};

describe('DataPage', () => {
  it('renders data table with loading state', async () => {
    renderWithProviders(<DataPage />);
    
    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
  
  it('handles cell editing correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataPage />);
    
    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    
    // Double-click to edit cell
    const cell = screen.getByTestId('cell-0-0');
    await user.dblClick(cell);
    
    // Type new value
    await user.type(screen.getByRole('textbox'), 'New Value');
    await user.keyboard('{Enter}');
    
    // Verify update
    expect(cell).toHaveTextContent('New Value');
  });
});
```

### Integration Testing
```typescript
// __tests__/integration/DataFlow.test.tsx
describe('Data Flow Integration', () => {
  it('syncs data changes across stores', async () => {
    const { dataStore, variableStore } = setupTestStores();
    
    // Load test data
    await dataStore.loadData(mockDataset);
    
    // Verify variables were inferred
    await waitFor(() => {
      expect(variableStore.getState().variables).toHaveLength(5);
    });
    
    // Update variable metadata
    variableStore.updateVariable('var1', { label: 'Updated Label' });
    
    // Verify sync
    expect(dataStore.getColumnMetadata('var1').label).toBe('Updated Label');
  });
});
```

### Performance Testing
```typescript
// __tests__/performance/LargeDataset.test.tsx
describe('Performance Tests', () => {
  it('renders large dataset within time limit', async () => {
    const largeDataset = generateMockData(10000, 50);
    const startTime = performance.now();
    
    renderWithProviders(<DataPage initialData={largeDataset} />);
    
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // 1 second limit
  });
});
```

## Deployment

### Build Process
```bash
# Production build
npm run build

# Build analysis
npm run analyze

# Type checking
npm run type-check

# Linting
npm run lint
```

### Environment Configuration
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { isServer }) => {
    // Custom webpack configuration
    return config;
  },
};

module.exports = nextConfig;
```

### Performance Monitoring
```typescript
// lib/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  // Log to analytics in production
  if (process.env.NODE_ENV === 'production') {
    analytics.track('performance', {
      operation: name,
      duration: end - start
    });
  }
};
```

## Additional Resources

### Key Documentation Files
- [`app/README.md`](./README.md) - App directory overview
- [`app/dashboard/README.md`](./dashboard/README.md) - Dashboard architecture
- [`app/dashboard/data/README.md`](./dashboard/data/README.md) - Data management
- [`app/dashboard/variable/README.md`](./dashboard/variable/README.md) - Variable management
- [`app/dashboard/result/README.md`](./dashboard/result/README.md) - Results display

### Component Documentation
- [DataTable Component](./dashboard/data/components/dataTable/README.md)
- [VariableTable Component](./dashboard/variable/components/variableTable/README.md)

### Best Practices
1. **Always use TypeScript** - Strict mode enabled
2. **Follow App Router conventions** - File-based routing
3. **Optimize for performance** - Lazy loading, memoization
4. **Write comprehensive tests** - Unit, integration, performance
5. **Document complex logic** - Inline comments and README files

### Common Patterns
- Server Components by default
- Client Components for interactivity
- Zustand for state management
- Suspense for loading states
- Error boundaries for error handling
- Dynamic imports for code splitting
