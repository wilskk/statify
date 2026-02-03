# Services Directory - Business Logic Layer

Direktori `services/` berisi business logic dan API integration layer untuk aplikasi Statify. Services menyediakan abstraksi antara UI components dan data operations.

## 📁 Struktur

```
services/
├── index.ts              # Main service exports
├── TESTING.md           # Testing documentation
├── api/                 # API integration services
├── chart/               # Chart generation services
├── data/                # Data processing services  
└── worker/              # Web worker management
```

## 🎯 Service Architecture

### Design Principles
- **Separation of Concerns**: Business logic terpisah dari UI logic
- **Single Responsibility**: Setiap service mengelola domain yang spesifik
- **Dependency Injection**: Services dapat di-inject dan di-mock untuk testing
- **Error Handling**: Consistent error handling dan recovery
- **Type Safety**: Full TypeScript support dengan proper interfaces

### Service Categories

#### 🌐 API Services (`/api`)
**Purpose**: External API communication dan data fetching

```typescript
// Example API service structure
interface ApiService {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;
  post<T>(endpoint: string, data?: any): Promise<T>;
  put<T>(endpoint: string, data?: any): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
}
```

#### 📊 Chart Services (`/chart`)
**Purpose**: Chart generation dan data visualization

```typescript
// Chart service interface
interface ChartService {
  createChart(type: ChartType, data: any[], config: ChartConfig): ChartInstance;
  updateChart(chart: ChartInstance, newData: any[]): void;
  exportChart(chart: ChartInstance, format: 'png' | 'svg' | 'pdf'): Blob;
}
```

#### 🗃 Data Services (`/data`)
**Purpose**: Data processing, transformation, dan validation

```typescript
// Data service interface
interface DataService {
  importData(file: File): Promise<ImportResult>;
  exportData(data: any[], format: ExportFormat): Promise<Blob>;
  validateData(data: any[]): ValidationResult;
  transformData(data: any[], transformation: Transform): any[];
}
```

#### ⚡ Worker Services (`/worker`)
**Purpose**: Web worker management untuk heavy computations

```typescript
// Worker service interface
interface WorkerService {
  createWorker(script: string): WorkerInstance;
  executeTask<T>(worker: WorkerInstance, task: Task): Promise<T>;
  terminateWorker(worker: WorkerInstance): void;
}
```

## 🛠 Service Implementation Patterns

### Base Service Class
```typescript
// BaseService.ts
export abstract class BaseService {
  protected baseURL: string;
  protected headers: Record<string, string>;
  
  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }
  
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.headers,
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  protected handleError(error: any): void {
    console.error('Service Error:', error);
    // Add error reporting logic
  }
}
```

### Concrete Service Implementation
```typescript
// DataImportService.ts
interface ImportOptions {
  delimiter?: string;
  encoding?: string;
  hasHeader?: boolean;
  skipRows?: number;
}

interface ImportResult {
  data: any[];
  variables: Variable[];
  metadata: DataMetadata;
  errors: string[];
}

export class DataImportService extends BaseService {
  async importCSV(file: File, options: ImportOptions = {}): Promise<ImportResult> {
    const {
      delimiter = ',',
      encoding = 'utf-8',
      hasHeader = true,
      skipRows = 0,
    } = options;
    
    try {
      const text = await this.readFile(file, encoding);
      const rows = this.parseCSV(text, delimiter);
      
      if (skipRows > 0) {
        rows.splice(0, skipRows);
      }
      
      const { data, variables } = this.processRows(rows, hasHeader);
      const metadata = this.generateMetadata(file, data);
      const errors = this.validateData(data);
      
      return {
        data,
        variables,
        metadata,
        errors,
      };
    } catch (error) {
      throw new Error(`CSV import failed: ${error.message}`);
    }
  }
  
  async importExcel(file: File): Promise<ImportResult> {
    // Excel import logic using Web Worker
    return new Promise((resolve, reject) => {
      const worker = new Worker('/workers/excel-parser.js');
      
      worker.postMessage({ file });
      
      worker.onmessage = (e) => {
        const { success, data, error } = e.data;
        
        if (success) {
          resolve(data);
        } else {
          reject(new Error(error));
        }
        
        worker.terminate();
      };
      
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
    });
  }
  
  private async readFile(file: File, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      
      reader.readAsText(file, encoding);
    });
  }
  
  private parseCSV(text: string, delimiter: string): string[][] {
    // CSV parsing logic
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' && !inQuotes) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add final row if exists
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }
    
    return rows;
  }
  
  private processRows(rows: string[][], hasHeader: boolean): {
    data: any[];
    variables: Variable[];
  } {
    if (rows.length === 0) {
      return { data: [], variables: [] };
    }
    
    const headers = hasHeader ? rows[0] : rows[0].map((_, i) => `var${i + 1}`);
    const dataRows = hasHeader ? rows.slice(1) : rows;
    
    const variables: Variable[] = headers.map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      index,
      type: this.inferVariableType(dataRows.map(row => row[index])),
      measure: 'scale', // Default measure
      labels: [],
      missingValues: [],
    }));
    
    const data = dataRows.map(row => 
      Object.fromEntries(
        headers.map((header, index) => [header, this.parseValue(row[index])])
      )
    );
    
    return { data, variables };
  }
  
  private inferVariableType(values: string[]): VariableType {
    const nonEmptyValues = values.filter(v => v && v.trim() !== '');
    
    if (nonEmptyValues.length === 0) return 'string';
    
    const numericCount = nonEmptyValues.filter(v => !isNaN(Number(v))).length;
    const numericRatio = numericCount / nonEmptyValues.length;
    
    if (numericRatio > 0.8) {
      // Check if integers
      const isInteger = nonEmptyValues.every(v => 
        !isNaN(Number(v)) && Number.isInteger(Number(v))
      );
      
      return isInteger ? 'numeric' : 'numeric';
    }
    
    return 'string';
  }
  
  private parseValue(value: string): any {
    if (!value || value.trim() === '') return null;
    
    const trimmed = value.trim();
    
    // Try to parse as number
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
    
    // Try to parse as boolean
    const lower = trimmed.toLowerCase();
    if (lower === 'true' || lower === 'false') {
      return lower === 'true';
    }
    
    // Return as string
    return trimmed;
  }
  
  private generateMetadata(file: File, data: any[]): DataMetadata {
    return {
      fileName: file.name,
      fileSize: file.size,
      importDate: new Date().toISOString(),
      rowCount: data.length,
      columnCount: Object.keys(data[0] || {}).length,
    };
  }
  
  private validateData(data: any[]): string[] {
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push('No data rows found');
    }
    
    if (data.length > 100000) {
      errors.push('Large dataset detected. Performance may be affected.');
    }
    
    return errors;
  }
}
```

### Service with Dependency Injection
```typescript
// AnalysisService.ts
interface AnalysisDependencies {
  dataService: DataService;
  workerService: WorkerService;
  cacheService: CacheService;
}

export class AnalysisService {
  constructor(private dependencies: AnalysisDependencies) {}
  
  async runDescriptiveAnalysis(
    data: any[],
    variables: string[]
  ): Promise<DescriptiveResult> {
    const { dataService, workerService, cacheService } = this.dependencies;
    
    // Check cache first
    const cacheKey = this.generateCacheKey('descriptive', data, variables);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;
    
    // Validate and prepare data
    const validatedData = dataService.validateData(data);
    const filteredData = dataService.filterColumns(validatedData, variables);
    
    // Run analysis in Web Worker
    const result = await workerService.executeTask('descriptive-analysis', {
      data: filteredData,
      variables,
    });
    
    // Cache result
    await cacheService.set(cacheKey, result, { ttl: 3600 }); // 1 hour
    
    return result;
  }
  
  private generateCacheKey(type: string, data: any[], variables: string[]): string {
    const dataHash = this.hashData(data);
    const variablesHash = this.hashArray(variables);
    return `${type}-${dataHash}-${variablesHash}`;
  }
  
  private hashData(data: any[]): string {
    // Simple hash function for data
    return btoa(JSON.stringify(data)).slice(0, 16);
  }
  
  private hashArray(arr: string[]): string {
    return btoa(JSON.stringify(arr.sort())).slice(0, 16);
  }
}
```

## 🌐 API Integration

### HTTP Client Service
```typescript
// HttpClientService.ts
interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class HttpClientService extends BaseService {
  private defaultConfig: RequestConfig = {
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
  };
  
  async get<T>(
    endpoint: string, 
    params?: Record<string, any>,
    config?: RequestConfig
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return this.requestWithRetry(url.toString(), {
      method: 'GET',
    }, config);
  }
  
  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.requestWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, config);
  }
  
  private async requestWithRetry<T>(
    url: string,
    options: RequestInit,
    config?: RequestConfig
  ): Promise<T> {
    const { timeout, retries, retryDelay } = { ...this.defaultConfig, ...config };
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...options,
          headers: this.headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
}
```

### Authentication Service
```typescript
// AuthService.ts
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class AuthService extends BaseService {
  private tokens: AuthTokens | null = null;
  
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.tokens = response;
    this.setAuthHeader(response.accessToken);
    this.scheduleTokenRefresh(response.expiresAt);
    
    return response;
  }
  
  async refreshTokens(): Promise<AuthTokens> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
    });
    
    this.tokens = response;
    this.setAuthHeader(response.accessToken);
    this.scheduleTokenRefresh(response.expiresAt);
    
    return response;
  }
  
  logout(): void {
    this.tokens = null;
    delete this.headers.Authorization;
  }
  
  isAuthenticated(): boolean {
    return this.tokens !== null && Date.now() < this.tokens.expiresAt;
  }
  
  private setAuthHeader(token: string): void {
    this.headers.Authorization = `Bearer ${token}`;
  }
  
  private scheduleTokenRefresh(expiresAt: number): void {
    const refreshTime = expiresAt - Date.now() - 60000; // Refresh 1 minute before expiry
    
    if (refreshTime > 0) {
      setTimeout(() => {
        this.refreshTokens().catch(console.error);
      }, refreshTime);
    }
  }
}
```

## ⚡ Web Worker Services

### Worker Manager
```typescript
// WorkerManagerService.ts
interface WorkerTask {
  id: string;
  type: string;
  data: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

export class WorkerManagerService {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: Map<string, WorkerTask> = new Map();
  
  createWorker(name: string, script: string): void {
    if (this.workers.has(name)) {
      this.terminateWorker(name);
    }
    
    const worker = new Worker(script);
    
    worker.onmessage = (e) => {
      this.handleWorkerMessage(name, e.data);
    };
    
    worker.onerror = (error) => {
      this.handleWorkerError(name, error);
    };
    
    this.workers.set(name, worker);
  }
  
  async executeTask<T>(
    workerName: string,
    taskType: string,
    data: any
  ): Promise<T> {
    const worker = this.workers.get(workerName);
    if (!worker) {
      throw new Error(`Worker '${workerName}' not found`);
    }
    
    return new Promise<T>((resolve, reject) => {
      const taskId = crypto.randomUUID();
      
      this.taskQueue.set(taskId, {
        id: taskId,
        type: taskType,
        data,
        resolve,
        reject,
      });
      
      worker.postMessage({
        taskId,
        type: taskType,
        data,
      });
      
      // Set timeout for task
      setTimeout(() => {
        if (this.taskQueue.has(taskId)) {
          this.taskQueue.delete(taskId);
          reject(new Error(`Task timeout: ${taskType}`));
        }
      }, 30000); // 30 second timeout
    });
  }
  
  terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }
  
  terminateAllWorkers(): void {
    for (const [name] of this.workers) {
      this.terminateWorker(name);
    }
  }
  
  private handleWorkerMessage(workerName: string, message: any): void {
    const { taskId, success, result, error } = message;
    const task = this.taskQueue.get(taskId);
    
    if (!task) return;
    
    this.taskQueue.delete(taskId);
    
    if (success) {
      task.resolve(result);
    } else {
      task.reject(new Error(error));
    }
  }
  
  private handleWorkerError(workerName: string, error: ErrorEvent): void {
    console.error(`Worker '${workerName}' error:`, error);
    
    // Reject all pending tasks for this worker
    for (const [taskId, task] of this.taskQueue) {
      if (task.type.startsWith(workerName)) {
        this.taskQueue.delete(taskId);
        task.reject(new Error(`Worker error: ${error.message}`));
      }
    }
  }
}
```

## 🧪 Service Testing

### Service Test Setup
```typescript
// __tests__/serviceTestUtils.ts
import { jest } from '@jest/globals';

export const createMockService = <T>(serviceClass: new (...args: any[]) => T): jest.Mocked<T> => {
  const mockService = new serviceClass() as jest.Mocked<T>;
  
  // Mock all methods
  Object.getOwnPropertyNames(serviceClass.prototype).forEach(method => {
    if (method !== 'constructor' && typeof mockService[method] === 'function') {
      mockService[method] = jest.fn();
    }
  });
  
  return mockService;
};

export const createMockFetch = () => {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
  });
};
```

### Service Tests
```typescript
// __tests__/DataImportService.test.ts
import { DataImportService } from '../DataImportService';
import { createMockFetch } from './serviceTestUtils';

describe('DataImportService', () => {
  let service: DataImportService;
  let mockFetch: jest.Mock;
  
  beforeEach(() => {
    service = new DataImportService();
    mockFetch = createMockFetch();
    global.fetch = mockFetch;
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('importCSV', () => {
    it('should import CSV file successfully', async () => {
      const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      const result = await service.importCSV(file);
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: 'John', age: 30, city: 'NYC' });
      expect(result.variables).toHaveLength(3);
      expect(result.variables[0].name).toBe('name');
    });
    
    it('should handle custom delimiter', async () => {
      const csvContent = 'name;age;city\nJohn;30;NYC\nJane;25;LA';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      const result = await service.importCSV(file, { delimiter: ';' });
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: 'John', age: 30, city: 'NYC' });
    });
    
    it('should handle files without headers', async () => {
      const csvContent = 'John,30,NYC\nJane,25,LA';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      const result = await service.importCSV(file, { hasHeader: false });
      
      expect(result.variables[0].name).toBe('var1');
      expect(result.variables[1].name).toBe('var2');
      expect(result.variables[2].name).toBe('var3');
    });
    
    it('should throw error for invalid file', async () => {
      const file = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
      
      // Mock file reader to throw error
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn().mockImplementation(() => ({
        readAsText: jest.fn().mockImplementation(function() {
          this.onerror();
        }),
        onerror: null,
        onload: null,
      }));
      
      await expect(service.importCSV(file)).rejects.toThrow();
      
      global.FileReader = originalFileReader;
    });
  });
});
```

## 📋 Best Practices

### Service Design
- **Interface Segregation**: Define clear interfaces untuk services
- **Dependency Injection**: Services should accept dependencies via constructor
- **Error Handling**: Consistent error handling dengan meaningful messages
- **Logging**: Comprehensive logging untuk debugging
- **Caching**: Implement caching untuk expensive operations

### Performance
- **Lazy Loading**: Load services only when needed
- **Connection Pooling**: Reuse connections untuk API calls
- **Batch Operations**: Batch multiple operations when possible
- **Timeouts**: Set appropriate timeouts untuk network requests

### Security
- **Input Validation**: Validate all inputs
- **Output Sanitization**: Sanitize outputs untuk prevent XSS
- **Token Management**: Secure token storage dan refresh
- **HTTPS**: Always use HTTPS untuk production

### Testing
- **Mocking**: Mock external dependencies
- **Integration Tests**: Test service interactions
- **Error Scenarios**: Test error conditions
- **Performance Tests**: Test dengan large datasets

---

Direktori `services/` menyediakan business logic layer yang robust dan maintainable, memisahkan concerns antara UI dan data operations dalam aplikasi Statify.
