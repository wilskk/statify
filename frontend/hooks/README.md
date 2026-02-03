# Hooks Directory - Custom React Hooks

Direktori `hooks/` berisi custom React hooks yang menyediakan reusable logic di seluruh aplikasi Statify.

## 📁 Struktur

```
hooks/
├── use-toast.ts                    # Toast notification hook
├── useAnalysisData.ts             # Analysis data management
├── useAutoSync.ts                 # Auto-sync functionality
├── useFormatter.ts                # Data formatting utilities
├── useIndexedDB.ts               # IndexedDB operations
├── useLinear.ts                  # Linear algebra operations
├── useMobile.ts                  # Mobile device detection
├── useModal.ts                   # Modal management
├── useOptimizedSubscription.ts   # Optimized state subscriptions
├── usePerformanceMeasure.ts      # Performance monitoring
├── usePerformanceMonitor.ts      # Performance tracking
├── useTour.ts                    # Guided tour functionality
├── useVariable.ts                # Variable management
└── __tests__/                    # Hook tests
```

## 🎯 Custom Hooks Philosophy

### Hook Design Principles
- **Single Responsibility**: Setiap hook mengelola satu concern yang spesifik
- **Reusability**: Hooks dirancang untuk digunakan di multiple components
- **Performance**: Optimized dengan proper dependencies dan memoization
- **Type Safety**: Full TypeScript support dengan proper return types
- **Testing**: Easily testable dengan @testing-library/react-hooks

### Hook Categories

#### 🎨 UI/UX Hooks
- **use-toast**: Notification management
- **useModal**: Modal dialog management
- **useTour**: Guided tour system
- **useMobile**: Responsive design helpers

#### 📊 Data Management Hooks
- **useAnalysisData**: Statistical analysis data
- **useFormatter**: Data formatting dan display
- **useVariable**: Variable management operations
- **useIndexedDB**: Client-side data persistence

#### ⚡ Performance Hooks
- **useOptimizedSubscription**: Efficient state subscriptions
- **usePerformanceMeasure**: Performance metrics
- **usePerformanceMonitor**: Real-time performance tracking
- **useAutoSync**: Background synchronization

#### 🧮 Computation Hooks
- **useLinear**: Linear algebra calculations
- **useCalculations**: Statistical computations

## 🛠 Hook Implementation Patterns

### Basic Hook Structure
```typescript
// useExample.ts
import { useState, useEffect, useCallback } from 'react';

interface UseExampleOptions {
  initialValue?: string;
  onUpdate?: (value: string) => void;
}

interface UseExampleReturn {
  value: string;
  isLoading: boolean;
  error: Error | null;
  setValue: (value: string) => void;
  reset: () => void;
}

export const useExample = (options: UseExampleOptions = {}): UseExampleReturn => {
  const { initialValue = '', onUpdate } = options;
  
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const handleSetValue = useCallback((newValue: string) => {
    setValue(newValue);
    onUpdate?.(newValue);
  }, [onUpdate]);
  
  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);
  
  return {
    value,
    isLoading,
    error,
    setValue: handleSetValue,
    reset,
  };
};
```

### Async Data Hook
```typescript
// useAsyncData.ts
import { useState, useEffect, useCallback } from 'react';

interface UseAsyncDataOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const useAsyncData = <T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncDataOptions<T> = {}
) => {
  const { immediate = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, deps);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);
  
  return {
    data,
    isLoading,
    error,
    execute,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
};
```

## 📊 Data Management Hooks

### useAnalysisData
```typescript
// useAnalysisData.ts
import { useState, useCallback, useMemo } from 'react';
import { useDataStore, useVariableStore, useResultStore } from '@/stores';

export const useAnalysisData = () => {
  const { data } = useDataStore();
  const { variables, selectedVariables } = useVariableStore();
  const { addResult } = useResultStore();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const filteredData = useMemo(() => {
    if (selectedVariables.length === 0) return data;
    
    return data.map(row => 
      Object.fromEntries(
        Object.entries(row).filter(([key]) => 
          selectedVariables.includes(key)
        )
      )
    );
  }, [data, selectedVariables]);
  
  const runAnalysis = useCallback(async (
    type: AnalysisType,
    config: AnalysisConfig
  ) => {
    setIsAnalyzing(true);
    
    try {
      const worker = new Worker('/workers/analysis.js');
      
      const result = await new Promise((resolve, reject) => {
        worker.postMessage({
          type,
          data: filteredData,
          config,
        });
        
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (e) => reject(e.error);
      });
      
      addResult({
        id: crypto.randomUUID(),
        type,
        result,
        timestamp: Date.now(),
      });
      
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [filteredData, addResult]);
  
  return {
    data: filteredData,
    variables,
    selectedVariables,
    isAnalyzing,
    runAnalysis,
  };
};
```

### useIndexedDB
```typescript
// useIndexedDB.ts
import { useState, useCallback, useRef } from 'react';

interface UseIndexedDBOptions {
  dbName: string;
  version?: number;
  stores: { name: string; keyPath?: string }[];
}

export const useIndexedDB = (options: UseIndexedDBOptions) => {
  const { dbName, version = 1, stores } = options;
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const dbRef = useRef<IDBDatabase | null>(null);
  
  const initDB = useCallback(async () => {
    try {
      const request = indexedDB.open(dbName, version);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        stores.forEach(({ name, keyPath = 'id' }) => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath });
          }
        });
      };
      
      request.onsuccess = (event) => {
        dbRef.current = (event.target as IDBOpenDBRequest).result;
        setIsReady(true);
      };
      
      request.onerror = (event) => {
        setError(new Error('Failed to open database'));
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [dbName, version, stores]);
  
  const getItem = useCallback(async <T>(storeName: string, key: string): Promise<T | null> => {
    if (!dbRef.current) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }, []);
  
  const setItem = useCallback(async <T>(storeName: string, value: T): Promise<void> => {
    if (!dbRef.current) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, []);
  
  return {
    isReady,
    error,
    initDB,
    getItem,
    setItem,
  };
};
```

## ⚡ Performance Hooks

### useOptimizedSubscription
```typescript
// useOptimizedSubscription.ts
import { useRef, useEffect, useState, useCallback } from 'react';
import { shallow } from 'zustand/shallow';

export const useOptimizedSubscription = <T, U>(
  store: (state: T) => U,
  selector: (state: T) => U,
  compare: (a: U, b: U) => boolean = shallow
) => {
  const [state, setState] = useState(() => selector(store.getState()));
  const stateRef = useRef(state);
  
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      const selected = selector(newState);
      
      if (!compare(selected, stateRef.current)) {
        stateRef.current = selected;
        setState(selected);
      }
    });
    
    return unsubscribe;
  }, [store, selector, compare]);
  
  return state;
};
```

### usePerformanceMonitor
```typescript
// usePerformanceMonitor.ts
import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
}

export const usePerformanceMonitor = (enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(0);
  
  useEffect(() => {
    if (!enabled) return;
    
    renderStartRef.current = performance.now();
    
    const measureRender = () => {
      const renderTime = performance.now() - renderStartRef.current;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
      }));
    };
    
    measureRender();
  });
  
  useEffect(() => {
    if (!enabled) return;
    
    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      
      if (now - lastTimeRef.current >= 1000) {
        const fps = (frameCountRef.current * 1000) / (now - lastTimeRef.current);
        
        setMetrics(prev => ({
          ...prev,
          fps: Math.round(fps),
        }));
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, [enabled]);
  
  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;
    
    const measureMemory = () => {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
      }));
    };
    
    const interval = setInterval(measureMemory, 1000);
    return () => clearInterval(interval);
  }, [enabled]);
  
  return metrics;
};
```

## 🎨 UI/UX Hooks

### useMobile
```typescript
// useMobile.ts
import { useState, useEffect } from 'react';

export const useMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    checkIsMobile();
    
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);
  
  return isMobile;
};
```

### useTour
```typescript
// useTour.ts
import { useState, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface TourStep {
  target: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disableBeacon?: boolean;
}

interface UseTourOptions {
  tourKey: string;
  steps: TourStep[];
  autoStart?: boolean;
}

export const useTour = ({ tourKey, steps, autoStart = false }: UseTourOptions) => {
  const [hasSeenTour, setHasSeenTour] = useLocalStorage(`tour-${tourKey}`, false);
  const [isRunning, setIsRunning] = useState(autoStart && !hasSeenTour);
  const [currentStep, setCurrentStep] = useState(0);
  
  const start = useCallback(() => {
    setIsRunning(true);
    setCurrentStep(0);
  }, []);
  
  const stop = useCallback(() => {
    setIsRunning(false);
    setHasSeenTour(true);
  }, [setHasSeenTour]);
  
  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      stop();
    }
  }, [currentStep, steps.length, stop]);
  
  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);
  
  return {
    isRunning,
    currentStep,
    totalSteps: steps.length,
    hasSeenTour,
    currentStepData: steps[currentStep],
    start,
    stop,
    next,
    prev,
    goToStep,
  };
};
```

## 🧪 Testing Hooks

### Hook Testing Setup
```typescript
// __tests__/hookTestUtils.ts
import { renderHook, RenderHookResult } from '@testing-library/react';
import { ReactNode } from 'react';

interface WrapperProps {
  children: ReactNode;
}

const createWrapper = (providers: React.ComponentType<any>[] = []) => {
  return ({ children }: WrapperProps) => {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
};

export const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options: {
    initialProps?: TProps;
    providers?: React.ComponentType<any>[];
  } = {}
): RenderHookResult<TResult, TProps> => {
  const { providers = [], ...renderOptions } = options;
  
  return renderHook(hook, {
    wrapper: createWrapper(providers),
    ...renderOptions,
  });
};
```

### Hook Test Examples
```typescript
// __tests__/useExample.test.ts
import { act } from '@testing-library/react';
import { renderHookWithProviders } from './hookTestUtils';
import { useExample } from '../useExample';

describe('useExample', () => {
  it('should initialize with default value', () => {
    const { result } = renderHookWithProviders(() => 
      useExample({ initialValue: 'test' })
    );
    
    expect(result.current.value).toBe('test');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('should update value', () => {
    const { result } = renderHookWithProviders(() => 
      useExample()
    );
    
    act(() => {
      result.current.setValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
  
  it('should call onUpdate callback', () => {
    const onUpdate = jest.fn();
    const { result } = renderHookWithProviders(() => 
      useExample({ onUpdate })
    );
    
    act(() => {
      result.current.setValue('test');
    });
    
    expect(onUpdate).toHaveBeenCalledWith('test');
  });
  
  it('should reset to initial value', () => {
    const { result } = renderHookWithProviders(() => 
      useExample({ initialValue: 'initial' })
    );
    
    act(() => {
      result.current.setValue('changed');
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.value).toBe('initial');
  });
});
```

## 📋 Best Practices

### Hook Design
- **Pure Functions**: Hooks should be pure dan predictable
- **Proper Dependencies**: Always include proper dependency arrays
- **Error Handling**: Graceful error handling dengan proper error states
- **TypeScript**: Strong typing untuk parameters dan return values
- **Cleanup**: Proper cleanup untuk subscriptions dan timers

### Performance
- **Memoization**: Use useCallback dan useMemo appropriately
- **Shallow Comparison**: Use shallow comparison untuk object dependencies
- **Selective Updates**: Avoid unnecessary re-renders
- **Debouncing**: Debounce expensive operations

### Testing
- **Isolated Testing**: Test hooks dalam isolation
- **Mock Dependencies**: Mock external dependencies
- **Edge Cases**: Test error conditions dan edge cases
- **Provider Testing**: Test hooks yang depend pada context providers

### Common Patterns
```typescript
// Compound hook pattern
export const useDataManagement = () => {
  const data = useData();
  const variables = useVariables();
  const analysis = useAnalysis();
  
  return {
    ...data,
    ...variables,
    ...analysis,
  };
};

// Hook dengan cleanup
export const useWebSocket = (url: string) => {
  useEffect(() => {
    const ws = new WebSocket(url);
    
    // Setup event handlers
    
    return () => {
      ws.close();
    };
  }, [url]);
};

// Conditional hook execution
export const useConditionalEffect = (condition: boolean, effect: () => void, deps: any[]) => {
  useEffect(() => {
    if (condition) {
      effect();
    }
  }, [condition, ...deps]);
};
```

---

Direktori `hooks/` menyediakan reusable logic yang memungkinkan component separation of concerns dan code reusability yang optimal dalam aplikasi Statify.
