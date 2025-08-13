# Utils Directory - Utility Functions

Direktori `utils/` berisi utility functions dan helper modules yang digunakan di seluruh aplikasi Statify untuk operasi-operasi umum.

## 📁 Struktur

```
utils/
├── file-parsers.ts          # File parsing utilities
├── savFileUtils.ts         # SAV file handling utilities
├── workerClient.ts         # Web worker client utilities
├── workerRegistry.ts       # Worker registration management
└── chartBuilder/           # Chart building utilities
    ├── README.md           # Chart builder documentation
    └── [chart builder files]
```

## 🎯 Utility Philosophy

### Design Principles
- **Pure Functions**: Utilities sebagai pure functions tanpa side effects
- **Single Responsibility**: Setiap utility memiliki satu tujuan yang jelas
- **Type Safety**: Full TypeScript support dengan proper generics
- **Performance**: Optimized untuk performance dan memory usage
- **Testability**: Easy to test dengan minimal dependencies

### Utility Categories

#### 📄 File Processing (`file-parsers.ts`)
**Purpose**: Parsing dan processing berbagai format file

```typescript
interface FileParser<T> {
  parse(file: File): Promise<T>;
  validate(file: File): boolean;
  getSupportedExtensions(): string[];
}

interface ParseResult {
  data: any[];
  metadata: FileMetadata;
  errors: string[];
}
```

#### 💾 SAV File Utilities (`savFileUtils.ts`)
**Purpose**: SPSS SAV file format handling

```typescript
interface SavFileUtilities {
  readSavFile(buffer: ArrayBuffer): Promise<SavData>;
  extractMetadata(buffer: ArrayBuffer): SavMetadata;
  convertToJSON(savData: SavData): any[];
}
```

#### ⚡ Worker Utilities (`workerClient.ts`, `workerRegistry.ts`)
**Purpose**: Web worker management dan communication

```typescript
interface WorkerClient {
  createWorker(script: string): WorkerInstance;
  executeTask<T>(worker: WorkerInstance, task: any): Promise<T>;
  terminateWorker(worker: WorkerInstance): void;
}
```

#### 📊 Chart Builder (`chartBuilder/`)
**Purpose**: Chart generation dan configuration utilities

## 🛠 Utility Implementation Patterns

### Pure Function Pattern
```typescript
// mathUtils.ts
export const round = (value: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const normalize = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};
```

### Generic Utility Functions
```typescript
// arrayUtils.ts
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

export const groupBy = <T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(
  array: T[],
  getKey: (item: T) => number | string
): T[] => {
  return [...array].sort((a, b) => {
    const keyA = getKey(a);
    const keyB = getKey(b);
    
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
};
```

### Object Utilities
```typescript
// objectUtils.ts
export const pick = <T, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  const cloned = {} as T;
  Object.keys(obj).forEach(key => {
    cloned[key as keyof T] = deepClone(obj[key as keyof T]);
  });
  
  return cloned;
};

export const merge = <T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  const result = { ...target };
  
  sources.forEach(source => {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = merge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    });
  });
  
  return result;
};
```

## 📄 File Parser Utilities

### CSV Parser
```typescript
// file-parsers.ts
interface CSVParseOptions {
  delimiter?: string;
  quote?: string;
  escape?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
}

export class CSVParser implements FileParser<ParseResult> {
  async parse(file: File, options: CSVParseOptions = {}): Promise<ParseResult> {
    const {
      delimiter = ',',
      quote = '"',
      escape = '"',
      hasHeader = true,
      skipEmptyLines = true,
    } = options;
    
    try {
      const text = await this.readFileAsText(file);
      const rows = this.parseCSVText(text, { delimiter, quote, escape, skipEmptyLines });
      
      if (rows.length === 0) {
        return {
          data: [],
          metadata: this.createMetadata(file, 0, 0),
          errors: ['No data found in file'],
        };
      }
      
      const headers = hasHeader ? rows[0] : this.generateHeaders(rows[0].length);
      const dataRows = hasHeader ? rows.slice(1) : rows;
      
      const data = this.convertRowsToObjects(dataRows, headers);
      const metadata = this.createMetadata(file, data.length, headers.length);
      const errors = this.validateData(data);
      
      return { data, metadata, errors };
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }
  
  validate(file: File): boolean {
    const validExtensions = ['.csv', '.txt'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return validExtensions.includes(extension);
  }
  
  getSupportedExtensions(): string[] {
    return ['.csv', '.txt'];
  }
  
  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
  
  private parseCSVText(
    text: string,
    options: Required<Omit<CSVParseOptions, 'hasHeader'>>
  ): string[][] {
    const { delimiter, quote, escape, skipEmptyLines } = options;
    
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === quote) {
        if (inQuotes && nextChar === quote) {
          // Escaped quote
          currentField += quote;
          i += 2;
          continue;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        currentRow.push(currentField);
        
        if (!skipEmptyLines || currentRow.some(field => field.trim() !== '')) {
          rows.push(currentRow);
        }
        
        currentRow = [];
        currentField = '';
        
        // Skip \r\n
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
      
      i++;
    }
    
    // Handle final row
    if (currentField !== '' || currentRow.length > 0) {
      currentRow.push(currentField);
      if (!skipEmptyLines || currentRow.some(field => field.trim() !== '')) {
        rows.push(currentRow);
      }
    }
    
    return rows;
  }
  
  private generateHeaders(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Column${i + 1}`);
  }
  
  private convertRowsToObjects(rows: string[][], headers: string[]): any[] {
    return rows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        const value = row[index] || '';
        obj[header] = this.parseValue(value);
      });
      return obj;
    });
  }
  
  private parseValue(value: string): any {
    const trimmed = value.trim();
    
    if (trimmed === '') return null;
    
    // Try number
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) return num;
    
    // Try boolean
    const lower = trimmed.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    
    // Try date
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && trimmed.match(/\d{4}-\d{2}-\d{2}/)) {
      return date.toISOString();
    }
    
    return trimmed;
  }
  
  private createMetadata(file: File, rows: number, columns: number): FileMetadata {
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified),
      rows,
      columns,
      parseDate: new Date(),
    };
  }
  
  private validateData(data: any[]): string[] {
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push('No data rows found');
    }
    
    if (data.length > 1000000) {
      errors.push('Large dataset detected (>1M rows). Performance may be affected.');
    }
    
    // Check for inconsistent row lengths
    const firstRowKeys = Object.keys(data[0] || {});
    const inconsistentRows = data.filter(row => 
      Object.keys(row).length !== firstRowKeys.length
    );
    
    if (inconsistentRows.length > 0) {
      errors.push(`${inconsistentRows.length} rows have inconsistent column counts`);
    }
    
    return errors;
  }
}
```

### Excel Parser
```typescript
// file-parsers.ts (continued)
export class ExcelParser implements FileParser<ParseResult> {
  async parse(file: File): Promise<ParseResult> {
    try {
      const buffer = await this.readFileAsArrayBuffer(file);
      
      // Use Web Worker for Excel parsing
      const worker = new Worker('/workers/excel-parser.js');
      
      return new Promise((resolve, reject) => {
        worker.postMessage({ buffer, fileName: file.name });
        
        worker.onmessage = (e) => {
          const { success, data, error } = e.data;
          worker.terminate();
          
          if (success) {
            resolve({
              data: data.rows,
              metadata: this.createMetadata(file, data.rows.length, data.columns.length),
              errors: data.warnings || [],
            });
          } else {
            reject(new Error(error));
          }
        };
        
        worker.onerror = (error) => {
          worker.terminate();
          reject(error);
        };
        
        // Timeout after 30 seconds
        setTimeout(() => {
          worker.terminate();
          reject(new Error('Excel parsing timeout'));
        }, 30000);
      });
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }
  
  validate(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return validExtensions.includes(extension);
  }
  
  getSupportedExtensions(): string[] {
    return ['.xlsx', '.xls'];
  }
  
  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
  
  private createMetadata(file: File, rows: number, columns: number): FileMetadata {
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified),
      rows,
      columns,
      parseDate: new Date(),
    };
  }
}
```

## ⚡ Web Worker Utilities

### Worker Client
```typescript
// workerClient.ts
interface WorkerTask {
  id: string;
  type: string;
  data: any;
  timeout?: number;
}

interface WorkerResponse {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
}

export class WorkerClient {
  private workers: Map<string, Worker> = new Map();
  private pendingTasks: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  
  createWorker(name: string, scriptPath: string): void {
    if (this.workers.has(name)) {
      this.terminateWorker(name);
    }
    
    const worker = new Worker(scriptPath);
    
    worker.onmessage = (e) => {
      this.handleWorkerMessage(e.data);
    };
    
    worker.onerror = (error) => {
      this.handleWorkerError(name, error);
    };
    
    this.workers.set(name, worker);
  }
  
  async executeTask<T>(
    workerName: string,
    task: Omit<WorkerTask, 'id'>
  ): Promise<T> {
    const worker = this.workers.get(workerName);
    if (!worker) {
      throw new Error(`Worker '${workerName}' not found`);
    }
    
    const taskId = crypto.randomUUID();
    const timeout = task.timeout || 30000; // 30 seconds default
    
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        reject(new Error(`Task timeout: ${task.type}`));
      }, timeout);
      
      this.pendingTasks.set(taskId, {
        resolve,
        reject,
        timeout: timeoutId,
      });
      
      worker.postMessage({
        id: taskId,
        type: task.type,
        data: task.data,
      });
    });
  }
  
  terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
    
    // Reject all pending tasks for this worker
    for (const [taskId, task] of this.pendingTasks) {
      clearTimeout(task.timeout);
      task.reject(new Error(`Worker '${name}' terminated`));
      this.pendingTasks.delete(taskId);
    }
  }
  
  terminateAllWorkers(): void {
    for (const [name] of this.workers) {
      this.terminateWorker(name);
    }
  }
  
  private handleWorkerMessage(response: WorkerResponse): void {
    const task = this.pendingTasks.get(response.taskId);
    if (!task) return;
    
    clearTimeout(task.timeout);
    this.pendingTasks.delete(response.taskId);
    
    if (response.success) {
      task.resolve(response.result);
    } else {
      task.reject(new Error(response.error || 'Worker task failed'));
    }
  }
  
  private handleWorkerError(workerName: string, error: ErrorEvent): void {
    console.error(`Worker '${workerName}' error:`, error);
    
    // Reject all pending tasks
    for (const [taskId, task] of this.pendingTasks) {
      clearTimeout(task.timeout);
      task.reject(new Error(`Worker error: ${error.message}`));
      this.pendingTasks.delete(taskId);
    }
  }
}

// Singleton instance
export const workerClient = new WorkerClient();
```

### Worker Registry
```typescript
// workerRegistry.ts
interface WorkerConfig {
  name: string;
  scriptPath: string;
  maxInstances?: number;
  autoRestart?: boolean;
}

export class WorkerRegistry {
  private configs: Map<string, WorkerConfig> = new Map();
  private instances: Map<string, WorkerClient[]> = new Map();
  private roundRobinCounters: Map<string, number> = new Map();
  
  register(config: WorkerConfig): void {
    this.configs.set(config.name, {
      maxInstances: 1,
      autoRestart: true,
      ...config,
    });
    
    this.instances.set(config.name, []);
    this.roundRobinCounters.set(config.name, 0);
  }
  
  async getWorker(name: string): Promise<WorkerClient> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Worker '${name}' not registered`);
    }
    
    let instances = this.instances.get(name)!;
    
    // Create instance if none exist
    if (instances.length === 0) {
      await this.createWorkerInstance(name, config);
      instances = this.instances.get(name)!;
    }
    
    // Round-robin selection for multiple instances
    const counter = this.roundRobinCounters.get(name)!;
    const selectedInstance = instances[counter % instances.length];
    
    this.roundRobinCounters.set(name, counter + 1);
    
    return selectedInstance;
  }
  
  private async createWorkerInstance(name: string, config: WorkerConfig): Promise<void> {
    const instances = this.instances.get(name)!;
    
    if (instances.length >= config.maxInstances!) {
      return; // Max instances reached
    }
    
    const client = new WorkerClient();
    client.createWorker(name, config.scriptPath);
    
    instances.push(client);
  }
  
  terminateWorker(name: string): void {
    const instances = this.instances.get(name);
    if (instances) {
      instances.forEach(client => client.terminateAllWorkers());
      this.instances.set(name, []);
    }
  }
  
  terminateAllWorkers(): void {
    for (const [name] of this.configs) {
      this.terminateWorker(name);
    }
  }
}

// Global registry instance
export const workerRegistry = new WorkerRegistry();

// Register common workers
workerRegistry.register({
  name: 'csv-parser',
  scriptPath: '/workers/csv-parser.js',
});

workerRegistry.register({
  name: 'excel-parser',
  scriptPath: '/workers/excel-parser.js',
});

workerRegistry.register({
  name: 'statistical-analysis',
  scriptPath: '/workers/statistical-analysis.js',
  maxInstances: 2, // Allow multiple instances for parallel processing
});
```

## 🧪 Utility Testing

### Test Utilities
```typescript
// __tests__/testUtils.ts
export const createMockFile = (
  content: string,
  fileName: string = 'test.csv',
  type: string = 'text/csv'
): File => {
  const blob = new Blob([content], { type });
  return new File([blob], fileName, { type });
};

export const createMockArrayBuffer = (size: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  
  // Fill with dummy data
  for (let i = 0; i < size; i++) {
    view[i] = i % 256;
  }
  
  return buffer;
};

export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const expectArraysEqual = <T>(actual: T[], expected: T[]): void => {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((item, index) => {
    expect(actual[index]).toEqual(item);
  });
};
```

### Utility Tests
```typescript
// __tests__/arrayUtils.test.ts
import { chunk, unique, groupBy, sortBy } from '../arrayUtils';

describe('arrayUtils', () => {
  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = chunk(array, 3);
      
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
    });
    
    it('should handle arrays that do not divide evenly', () => {
      const array = [1, 2, 3, 4, 5];
      const result = chunk(array, 2);
      
      expect(result).toEqual([
        [1, 2],
        [3, 4],
        [5],
      ]);
    });
    
    it('should return empty array for empty input', () => {
      const result = chunk([], 3);
      expect(result).toEqual([]);
    });
  });
  
  describe('unique', () => {
    it('should remove duplicates from array', () => {
      const array = [1, 2, 2, 3, 3, 3, 4];
      const result = unique(array);
      
      expect(result).toEqual([1, 2, 3, 4]);
    });
    
    it('should work with strings', () => {
      const array = ['a', 'b', 'a', 'c', 'b'];
      const result = unique(array);
      
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });
  
  describe('groupBy', () => {
    it('should group objects by key', () => {
      const array = [
        { type: 'fruit', name: 'apple' },
        { type: 'vegetable', name: 'carrot' },
        { type: 'fruit', name: 'banana' },
      ];
      
      const result = groupBy(array, item => item.type);
      
      expect(result).toEqual({
        fruit: [
          { type: 'fruit', name: 'apple' },
          { type: 'fruit', name: 'banana' },
        ],
        vegetable: [
          { type: 'vegetable', name: 'carrot' },
        ],
      });
    });
  });
});
```

## 📋 Best Practices

### Utility Design
- **Pure Functions**: Utilities harus pure functions tanpa side effects
- **Immutability**: Jangan mutate input parameters
- **Type Safety**: Use proper TypeScript types dan generics
- **Error Handling**: Validate inputs dan provide meaningful errors
- **Documentation**: Clear JSDoc documentation untuk complex utilities

### Performance
- **Lazy Evaluation**: Use lazy evaluation untuk expensive operations
- **Memoization**: Cache results untuk expensive pure functions
- **Streaming**: Use streaming untuk large data processing
- **Web Workers**: Offload heavy computations ke Web Workers

### Testing
- **Unit Tests**: Test setiap utility function secara isolated
- **Edge Cases**: Test edge cases dan error conditions
- **Performance Tests**: Test dengan large datasets
- **Property-Based Testing**: Use property-based testing untuk complex utilities

### Organization
- **Logical Grouping**: Group related utilities dalam same file
- **Clear Naming**: Use descriptive names untuk functions
- **Consistent API**: Consistent parameter order dan naming conventions
- **Tree Shaking**: Export individual functions untuk better tree shaking

---

Direktori `utils/` menyediakan foundational utilities yang mendukung functionality di seluruh aplikasi Statify dengan focus pada performance, type safety, dan maintainability.
