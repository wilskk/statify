# Repositories Directory - Data Access Layer

Direktori `repositories/` berisi data access layer untuk aplikasi Statify, menyediakan abstraksi untuk data operations dan persistence.

## 📁 Struktur

```
repositories/
├── index.ts              # Repository exports
├── DataRepository.ts     # Data management repository
├── MetaRepository.ts     # Metadata repository
├── ResultRepository.ts   # Analysis results repository
├── VariableRepository.ts # Variable management repository
└── __tests__/            # Repository tests
    └── README.md         # Testing documentation
```

## 🎯 Repository Pattern

### Design Principles
- **Separation of Concerns**: Business logic terpisah dari data access
- **Abstraction**: Hide implementation details dari business layer
- **Consistency**: Unified interface untuk semua data operations
- **Testability**: Easy to mock dan test
- **Performance**: Optimized queries dan caching

### Repository Architecture
```typescript
// Base repository interface
interface BaseRepository<T, K = string> {
  findById(id: K): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: K, updates: Partial<T>): Promise<T>;
  delete(id: K): Promise<boolean>;
  count(filter?: QueryFilter): Promise<number>;
}

interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: SortOptions;
  filter?: QueryFilter;
}

interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

interface QueryFilter {
  [key: string]: any;
}
```

## 🗃 Repository Implementations

### Data Repository (`DataRepository.ts`)
**Purpose**: Manage dataset storage dan retrieval

```typescript
import { BaseRepository } from './BaseRepository';
import { TableData, DataFilter, DataSort } from '@/types';

export interface DataEntity {
  id: string;
  name: string;
  data: TableData;
  createdAt: Date;
  updatedAt: Date;
  metadata: DataMetadata;
}

interface DataMetadata {
  rowCount: number;
  columnCount: number;
  fileSize: number;
  source: string;
  importDate: Date;
}

interface DataQueryOptions extends QueryOptions {
  includeData?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class DataRepository implements BaseRepository<DataEntity> {
  private dbName = 'statify-data';
  private storeName = 'datasets';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('source', 'metadata.source', { unique: false });
        }
      };
    });
  }

  async findById(id: string): Promise<DataEntity | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(options: DataQueryOptions = {}): Promise<DataEntity[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;

        // Apply filters
        if (options.filter) {
          results = this.applyFilter(results, options.filter);
        }

        // Apply date range filter
        if (options.dateRange) {
          results = results.filter(item => 
            item.createdAt >= options.dateRange!.start &&
            item.createdAt <= options.dateRange!.end
          );
        }

        // Apply sorting
        if (options.sort) {
          results = this.applySort(results, options.sort);
        }

        // Apply pagination
        if (options.limit || options.offset) {
          const start = options.offset || 0;
          const end = start + (options.limit || results.length);
          results = results.slice(start, end);
        }

        // Exclude data if not needed
        if (options.includeData === false) {
          results = results.map(item => ({
            ...item,
            data: [], // Remove actual data to save memory
          }));
        }

        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async create(entity: Omit<DataEntity, 'id'>): Promise<DataEntity> {
    if (!this.db) throw new Error('Database not initialized');

    const newEntity: DataEntity = {
      ...entity,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(newEntity);

      request.onsuccess = () => resolve(newEntity);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: string, updates: Partial<DataEntity>): Promise<DataEntity> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Data entity with id ${id} not found`);
    }

    const updated: DataEntity = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async count(filter?: QueryFilter): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => {
        if (filter) {
          // For complex filtering, get all and filter
          this.findAll({ filter }).then(results => resolve(results.length));
        } else {
          resolve(request.result);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Data-specific methods
  async findByName(name: string): Promise<DataEntity[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('name');
      const request = index.getAll(name);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async searchByName(query: string): Promise<DataEntity[]> {
    const allData = await this.findAll();
    return allData.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getDataWithPagination(
    id: string,
    page: number,
    pageSize: number
  ): Promise<{ data: TableData; total: number }> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error(`Data entity with id ${id} not found`);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = entity.data.slice(start, end);

    return {
      data,
      total: entity.data.length,
    };
  }

  async addRows(id: string, rows: TableData): Promise<DataEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error(`Data entity with id ${id} not found`);
    }

    const updatedData = [...entity.data, ...rows];
    
    return this.update(id, {
      data: updatedData,
      metadata: {
        ...entity.metadata,
        rowCount: updatedData.length,
      },
    });
  }

  async deleteRows(id: string, rowIndices: number[]): Promise<DataEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error(`Data entity with id ${id} not found`);
    }

    const updatedData = entity.data.filter((_, index) => 
      !rowIndices.includes(index)
    );

    return this.update(id, {
      data: updatedData,
      metadata: {
        ...entity.metadata,
        rowCount: updatedData.length,
      },
    });
  }

  async updateRows(
    id: string,
    updates: Array<{ index: number; data: Record<string, any> }>
  ): Promise<DataEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error(`Data entity with id ${id} not found`);
    }

    const updatedData = [...entity.data];
    updates.forEach(({ index, data }) => {
      if (index >= 0 && index < updatedData.length) {
        updatedData[index] = { ...updatedData[index], ...data };
      }
    });

    return this.update(id, { data: updatedData });
  }

  private applyFilter(data: DataEntity[], filter: QueryFilter): DataEntity[] {
    return data.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        const itemValue = this.getNestedValue(item, key);
        
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        
        if (typeof value === 'object' && value !== null) {
          // Handle complex filters (e.g., date ranges, numeric ranges)
          if (value.operator) {
            return this.applyOperator(itemValue, value.operator, value.value);
          }
        }
        
        return itemValue === value;
      });
    });
  }

  private applySort(data: DataEntity[], sort: SortOptions): DataEntity[] {
    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, sort.field);
      const bValue = this.getNestedValue(b, sort.field);

      let comparison = 0;
      
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private applyOperator(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'gt': return value > filterValue;
      case 'gte': return value >= filterValue;
      case 'lt': return value < filterValue;
      case 'lte': return value <= filterValue;
      case 'contains': return String(value).includes(String(filterValue));
      case 'startsWith': return String(value).startsWith(String(filterValue));
      case 'endsWith': return String(value).endsWith(String(filterValue));
      default: return value === filterValue;
    }
  }

  // Cleanup methods
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageInfo(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    
    return { used: 0, quota: 0 };
  }
}
```

### Variable Repository (`VariableRepository.ts`)
**Purpose**: Manage variable metadata dan properties

```typescript
import { Variable, VariableUpdate } from '@/types';
import { BaseRepository } from './BaseRepository';

export interface VariableEntity extends Variable {
  datasetId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VariableRepository implements BaseRepository<VariableEntity> {
  private dbName = 'statify-variables';
  private storeName = 'variables';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes
          store.createIndex('datasetId', 'datasetId', { unique: false });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('measure', 'measure', { unique: false });
        }
      };
    });
  }

  async findById(id: string): Promise<VariableEntity | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findAll(options: QueryOptions = {}): Promise<VariableEntity[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;

        // Apply filters
        if (options.filter) {
          results = this.applyFilter(results, options.filter);
        }

        // Apply sorting
        if (options.sort) {
          results = this.applySort(results, options.sort);
        }

        // Apply pagination
        if (options.limit || options.offset) {
          const start = options.offset || 0;
          const end = start + (options.limit || results.length);
          results = results.slice(start, end);
        }

        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async create(entity: Omit<VariableEntity, 'id'>): Promise<VariableEntity> {
    if (!this.db) throw new Error('Database not initialized');

    const newEntity: VariableEntity = {
      ...entity,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(newEntity);

      request.onsuccess = () => resolve(newEntity);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: string, updates: Partial<VariableEntity>): Promise<VariableEntity> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Variable with id ${id} not found`);
    }

    const updated: VariableEntity = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async count(filter?: QueryFilter): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => {
        if (filter) {
          this.findAll({ filter }).then(results => resolve(results.length));
        } else {
          resolve(request.result);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Variable-specific methods
  async findByDatasetId(datasetId: string): Promise<VariableEntity[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('datasetId');
      const request = index.getAll(datasetId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async findByType(type: Variable['type']): Promise<VariableEntity[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async findByMeasure(measure: Variable['measure']): Promise<VariableEntity[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('measure');
      const request = index.getAll(measure);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateMultiple(updates: VariableUpdate[]): Promise<VariableEntity[]> {
    const results: VariableEntity[] = [];

    for (const update of updates) {
      const result = await this.update(update.id, update.updates);
      results.push(result);
    }

    return results;
  }

  async deleteByDatasetId(datasetId: string): Promise<number> {
    const variables = await this.findByDatasetId(datasetId);
    
    for (const variable of variables) {
      await this.delete(variable.id);
    }

    return variables.length;
  }

  async createMultiple(variables: Omit<VariableEntity, 'id'>[]): Promise<VariableEntity[]> {
    const results: VariableEntity[] = [];

    for (const variable of variables) {
      const result = await this.create(variable);
      results.push(result);
    }

    return results;
  }

  private applyFilter(data: VariableEntity[], filter: QueryFilter): VariableEntity[] {
    return data.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        const itemValue = this.getNestedValue(item, key);
        
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        
        return itemValue === value;
      });
    });
  }

  private applySort(data: VariableEntity[], sort: SortOptions): VariableEntity[] {
    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, sort.field);
      const bValue = this.getNestedValue(b, sort.field);

      let comparison = 0;
      
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

## 🧪 Repository Testing

### Test Setup
```typescript
// __tests__/repositoryTestUtils.ts
export const setupTestDB = async (dbName: string, storeName: string) => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    // Delete existing test database
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    
    deleteRequest.onsuccess = () => {
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(storeName, { keyPath: 'id' });
      };
    };
    
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
};

export const teardownTestDB = async (dbName: string) => {
  return new Promise<void>((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
};

export const createMockDataEntity = (): Omit<DataEntity, 'id'> => ({
  name: 'Test Dataset',
  data: [
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 25 },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    rowCount: 2,
    columnCount: 3,
    fileSize: 1024,
    source: 'test',
    importDate: new Date(),
  },
});
```

### Repository Tests
```typescript
// __tests__/DataRepository.test.ts
import { DataRepository } from '../DataRepository';
import { setupTestDB, teardownTestDB, createMockDataEntity } from './repositoryTestUtils';

describe('DataRepository', () => {
  let repository: DataRepository;
  const dbName = 'test-statify-data';

  beforeEach(async () => {
    await setupTestDB(dbName, 'datasets');
    repository = new DataRepository();
  });

  afterEach(async () => {
    await teardownTestDB(dbName);
  });

  describe('create', () => {
    it('should create a new data entity', async () => {
      const mockEntity = createMockDataEntity();
      
      const result = await repository.create(mockEntity);
      
      expect(result).toMatchObject(mockEntity);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('should find entity by id', async () => {
      const mockEntity = createMockDataEntity();
      const created = await repository.create(mockEntity);
      
      const found = await repository.findById(created.id);
      
      expect(found).toEqual(created);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent');
      
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update entity', async () => {
      const mockEntity = createMockDataEntity();
      const created = await repository.create(mockEntity);
      
      const updates = { name: 'Updated Dataset' };
      const updated = await repository.update(created.id, updates);
      
      expect(updated.name).toBe('Updated Dataset');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete entity', async () => {
      const mockEntity = createMockDataEntity();
      const created = await repository.create(mockEntity);
      
      const deleted = await repository.delete(created.id);
      expect(deleted).toBe(true);
      
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all entities', async () => {
      const entity1 = await repository.create(createMockDataEntity());
      const entity2 = await repository.create(createMockDataEntity());
      
      const all = await repository.findAll();
      
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(entity1);
      expect(all).toContainEqual(entity2);
    });

    it('should apply filters', async () => {
      const entity1 = await repository.create({
        ...createMockDataEntity(),
        name: 'Dataset A',
      });
      
      const entity2 = await repository.create({
        ...createMockDataEntity(),
        name: 'Dataset B',
      });
      
      const filtered = await repository.findAll({
        filter: { name: 'Dataset A' },
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(entity1);
    });

    it('should apply pagination', async () => {
      // Create multiple entities
      for (let i = 0; i < 5; i++) {
        await repository.create(createMockDataEntity());
      }
      
      const page1 = await repository.findAll({
        limit: 2,
        offset: 0,
      });
      
      const page2 = await repository.findAll({
        limit: 2,
        offset: 2,
      });
      
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('data-specific methods', () => {
    it('should add rows to dataset', async () => {
      const entity = await repository.create(createMockDataEntity());
      const newRows = [
        { id: 3, name: 'Bob', age: 35 },
        { id: 4, name: 'Alice', age: 28 },
      ];
      
      const updated = await repository.addRows(entity.id, newRows);
      
      expect(updated.data).toHaveLength(4);
      expect(updated.metadata.rowCount).toBe(4);
    });

    it('should delete rows from dataset', async () => {
      const entity = await repository.create(createMockDataEntity());
      
      const updated = await repository.deleteRows(entity.id, [0]);
      
      expect(updated.data).toHaveLength(1);
      expect(updated.data[0].name).toBe('Jane');
      expect(updated.metadata.rowCount).toBe(1);
    });

    it('should update specific rows', async () => {
      const entity = await repository.create(createMockDataEntity());
      
      const updates = [
        { index: 0, data: { age: 31 } },
        { index: 1, data: { name: 'Janet' } },
      ];
      
      const updated = await repository.updateRows(entity.id, updates);
      
      expect(updated.data[0].age).toBe(31);
      expect(updated.data[1].name).toBe('Janet');
    });
  });
});
```

## 📋 Best Practices

### Repository Design
- **Interface Segregation**: Define clear interfaces untuk different repository types
- **Consistent API**: Unified method signatures across repositories
- **Error Handling**: Proper error handling dengan meaningful messages
- **Type Safety**: Full TypeScript support dengan proper generics
- **Async/Await**: Use async/await untuk better error handling

### Performance
- **Indexing**: Create appropriate indexes untuk frequently queried fields
- **Pagination**: Implement pagination untuk large datasets
- **Caching**: Cache frequently accessed data
- **Batch Operations**: Support batch operations untuk better performance

### Data Integrity
- **Validation**: Validate data before persistence
- **Transactions**: Use transactions untuk atomic operations
- **Constraints**: Implement business rule constraints
- **Backup**: Regular backup strategies

### Testing
- **Unit Tests**: Test each repository method
- **Integration Tests**: Test repository interactions
- **Performance Tests**: Test dengan large datasets
- **Error Scenarios**: Test error conditions

---

Direktori `repositories/` menyediakan robust data access layer yang memisahkan concerns antara business logic dan data persistence dalam aplikasi Statify.
