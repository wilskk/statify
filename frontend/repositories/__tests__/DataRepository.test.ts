import { DataRepository } from '../DataRepository';
import db from '@/lib/db';
import { DataRow } from '@/types/Data';

// Mock the db module
jest.mock('@/lib/db', () => {
  const mockDb = {
    dataRows: {
      toArray: jest.fn(),
      clear: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      add: jest.fn(),
      bulkAdd: jest.fn(),
    },
    transaction: jest.fn(),
  };

  // Mock the transaction to just execute the callback by default
  mockDb.transaction.mockImplementation((mode, tables, callback) => {
    return callback();
  });

  return {
    __esModule: true,
    default: mockDb,
  };
});

// Create a typed mock for easier use
const mockedDb = db as jest.Mocked<typeof db>;

describe('DataRepository', () => {
  let repository: DataRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-mock the transaction implementation before each test to allow for specific overrides
    (mockedDb.transaction as jest.Mock).mockImplementation((mode, tables, callback) => {
        return callback();
    });
    repository = new DataRepository();
  });

  // Suppress console.error during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('clearAllData', () => {
    it('should call db.dataRows.clear', async () => {
      (mockedDb.dataRows.clear as jest.Mock).mockResolvedValue(undefined);
      await repository.clearAllData();
      expect(mockedDb.dataRows.clear).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if clear fails', async () => {
      const mockError = new Error('DB clear failed');
      (mockedDb.dataRows.clear as jest.Mock).mockRejectedValue(mockError);
      
      await expect(repository.clearAllData()).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith('Failed to reset data:', mockError);
    });
  });

  describe('getAllRows', () => {
    it('should return sorted and gap-filled data from the database', async () => {
      const mockDbData = [
        { id: 2, data: ['c1', 'c2'] },
        { id: 0, data: ['a1', 'a2'] },
      ];
      (mockedDb.dataRows.toArray as jest.Mock).mockResolvedValue(mockDbData);

      const result = await repository.getAllRows();

      const expectedData = [
        ['a1', 'a2'],
        ['', ''],
        ['c1', 'c2'],
      ];
      expect(result).toEqual(expectedData);
    });

    it('should return an empty array if the database is empty', async () => {
      (mockedDb.dataRows.toArray as jest.Mock).mockResolvedValue([]);
      const result = await repository.getAllRows();
      expect(result).toEqual([]);
    });

    it('should throw an error if the database operation fails', async () => {
      const mockError = new Error('DB read failed');
      (mockedDb.dataRows.toArray as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.getAllRows()).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith('Failed to load data:', mockError);
    });
  });

  describe('updateRow', () => {
    const rowIndex = 5;
    const rowData: DataRow = ['new', 'data'];

    it('should update an existing row', async () => {
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue({ id: rowIndex, data: ['old', 'data'] });
      await repository.updateRow(rowIndex, rowData);
      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(rowIndex);
      expect(mockedDb.dataRows.update).toHaveBeenCalledWith(rowIndex, { data: rowData });
      expect(mockedDb.dataRows.add).not.toHaveBeenCalled();
    });

    it('should add a new row if it does not exist', async () => {
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue(undefined);
      await repository.updateRow(rowIndex, rowData);
      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(rowIndex);
      expect(mockedDb.dataRows.add).toHaveBeenCalledWith({ id: rowIndex, data: rowData });
      expect(mockedDb.dataRows.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the operation fails', async () => {
        const mockError = new Error('DB get failed');
        (mockedDb.dataRows.get as jest.Mock).mockRejectedValue(mockError);
        await expect(repository.updateRow(rowIndex, rowData)).rejects.toThrow(mockError);
        expect(console.error).toHaveBeenCalledWith(`Failed to update row ${rowIndex}:`, mockError);
      });
  });

  describe('replaceAllData', () => {
    const newData: DataRow[] = [['a', 'b'], ['c', 'd']];

    it('should clear, format, and bulk add new data within a transaction', async () => {
      (mockedDb.dataRows.clear as jest.Mock).mockResolvedValue(undefined);
      (mockedDb.dataRows.bulkAdd as jest.Mock).mockResolvedValue(undefined);

      await repository.replaceAllData(newData);

      expect(mockedDb.transaction).toHaveBeenCalledWith('rw', mockedDb.dataRows, expect.any(Function));
      
      const clearOrder = (mockedDb.dataRows.clear as jest.Mock).mock.invocationCallOrder[0];
      const bulkAddOrder = (mockedDb.dataRows.bulkAdd as jest.Mock).mock.invocationCallOrder[0];
      expect(clearOrder).toBeLessThan(bulkAddOrder);
      
      const expectedBulkData = [{ id: 0, data: ['a', 'b'] }, { id: 1, data: ['c', 'd'] }];
      expect(mockedDb.dataRows.bulkAdd).toHaveBeenCalledWith(expectedBulkData);
    });

    it('should throw an error if the transaction fails', async () => {
      const mockError = new Error('Transaction failed');
      (mockedDb.transaction as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.replaceAllData(newData)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith('Failed to replace all data:', mockError);
    });
  });

  describe('ensureRowExists', () => {
    it('should not do anything if the row already exists', async () => {
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue({ id: 1, data: ['a'] });
      
      await repository.ensureRowExists(1, 5);

      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(1);
      expect(mockedDb.dataRows.add).not.toHaveBeenCalled();
    });

    it('should add an empty row if the row does not exist', async () => {
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue(undefined);
      
      await repository.ensureRowExists(1, 3);

      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(1);
      const expectedEmptyRow = {
        id: 1,
        data: ['', '', ''],
      };
      expect(mockedDb.dataRows.add).toHaveBeenCalledWith(expectedEmptyRow);
    });

    it('should throw an error if the get operation fails', async () => {
      const mockError = new Error('DB check failed');
      (mockedDb.dataRows.get as jest.Mock).mockRejectedValue(mockError);
      
      await expect(repository.ensureRowExists(1, 3)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith('Failed to ensure row 1 exists:', mockError);
    });
  });

  describe('updateBulkCells', () => {
    it('should correctly update multiple cells in an existing row', async () => {
      const initialRowData = ['a', 'b', 'c'];
      const rowIndex = 0;
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue({ id: rowIndex, data: initialRowData });
      (mockedDb.dataRows.update as jest.Mock).mockResolvedValue(undefined);

      const cellsToUpdate = [
        { row: rowIndex, col: 0, value: 'A_NEW' },
        { row: rowIndex, col: 2, value: 'C_NEW' },
      ];

      await repository.updateBulkCells(cellsToUpdate);

      // It should get the existing row to update it
      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(rowIndex);

      // It should then update the row with the merged data
      const expectedData = ['A_NEW', 'b', 'C_NEW'];
      expect(mockedDb.dataRows.update).toHaveBeenCalledWith(rowIndex, { data: expectedData });
      
      // It should not add a new row
      expect(mockedDb.dataRows.add).not.toHaveBeenCalled();
    });

    it('should correctly create a new row and update cells within it', async () => {
      const rowIndex = 1;
      // Row 1 does not exist initially
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue(undefined);
      (mockedDb.dataRows.add as jest.Mock).mockResolvedValue(undefined);

      const cellsToUpdate = [
        { row: rowIndex, col: 1, value: 'B_NEW' },
      ];

      await repository.updateBulkCells(cellsToUpdate);

      // It should attempt to get the row first
      expect(mockedDb.dataRows.get).toHaveBeenCalledWith(rowIndex);

      // It should then add a new row with the correct data, padded with empty strings
      const expectedData = ['', 'B_NEW']; // Padded at index 0
      expect(mockedDb.dataRows.add).toHaveBeenCalledWith({ id: rowIndex, data: expectedData });

      // It should not update an existing row
      expect(mockedDb.dataRows.update).not.toHaveBeenCalled();
    });

    it('should handle updates and deletions in the same transaction', async () => {
      const rowIndex = 0;
      const initialRowData = ['a', 'b', 'c', 'd'];
      (mockedDb.dataRows.get as jest.Mock).mockResolvedValue({ id: rowIndex, data: initialRowData });
      (mockedDb.dataRows.update as jest.Mock).mockResolvedValue(undefined);

      const cellsToUpdate = [
        { row: rowIndex, col: 0, value: 'A_NEW' }, // Update
      ];
      // Note: keysToDelete format is [col, row]
      const keysToDelete: Array<[number, number]> = [
        [2, rowIndex], // Delete col 2
      ];

      await repository.updateBulkCells(cellsToUpdate, keysToDelete);

      // Verify the final updated row data
      const expectedData = ['A_NEW', 'b', '', 'd']; // col 0 updated, col 2 cleared
      expect(mockedDb.dataRows.update).toHaveBeenCalledWith(rowIndex, { data: expectedData });
    });

    it('should throw an error if the transaction fails', async () => {
      const mockError = new Error('Transaction failed');
      (mockedDb.transaction as jest.Mock).mockImplementation((mode, tables, callback) => {
        return Promise.reject(mockError);
      });

      await expect(repository.updateBulkCells([], [])).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith('Failed to update bulk cells:', mockError);
    });
  });
});
