import { DataService } from '../DataService';
import { dataRepository } from '@/repositories';
import { DataRow } from '@/types/Data';

// Mock the entire dataRepository module
jest.mock('@/repositories/dataRepository', () => ({
    getAllRows: jest.fn(),
    updateBulkCells: jest.fn(),
    clearAllData: jest.fn(),
    replaceAllData: jest.fn(),
}));

const mockedDataRepository = dataRepository as jest.Mocked<typeof dataRepository>;
const dataService = new DataService();

describe('DataService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('applyBulkUpdates', () => {
        it('should call repository.updateBulkCells and return unique row indices', async () => {
            const updates = [
                { row: 0, col: 0, value: 1 },
                { row: 1, col: 1, value: 2 },
                { row: 0, col: 1, value: 3 }, // Duplicate row index
            ];
            mockedDataRepository.updateBulkCells.mockResolvedValue(undefined);

            const result = await dataService.applyBulkUpdates(updates);

            expect(mockedDataRepository.updateBulkCells).toHaveBeenCalledTimes(1);
            expect(mockedDataRepository.updateBulkCells).toHaveBeenCalledWith(updates);
            expect(result).toEqual([0, 1]); // Should contain unique row indices
        });
    });

    describe('importData', () => {
        it('should clear existing data and then replace it', async () => {
            const newData: DataRow[] = [[1, 2, 3]];
            mockedDataRepository.clearAllData.mockResolvedValue(undefined);
            mockedDataRepository.replaceAllData.mockResolvedValue(newData.length);

            await dataService.importData(newData);

            // Verify that clear was called before replace
            const clearOrder = mockedDataRepository.clearAllData.mock.invocationCallOrder[0];
            const replaceOrder = mockedDataRepository.replaceAllData.mock.invocationCallOrder[0];
            
            expect(clearOrder).toBeLessThan(replaceOrder);

            expect(mockedDataRepository.clearAllData).toHaveBeenCalledTimes(1);
            expect(mockedDataRepository.replaceAllData).toHaveBeenCalledTimes(1);
            expect(mockedDataRepository.replaceAllData).toHaveBeenCalledWith(newData);
        });
    });

    describe('getColumnData', () => {
        it('should retrieve all rows and extract the correct column', async () => {
            const mockData: DataRow[] = [
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
                ['g', 'h', 'i'],
            ];
            mockedDataRepository.getAllRows.mockResolvedValue(mockData);

            const { columnData } = await dataService.getColumnData(1); // Get second column

            expect(mockedDataRepository.getAllRows).toHaveBeenCalledTimes(1);
            expect(columnData).toEqual(['b', 'e', 'h']);
        });

        it('should return empty strings for rows shorter than the column index', async () => {
             const mockData: DataRow[] = [
                ['a', 'b', 'c'],
                ['d'], // This row is shorter
                ['g', 'h', 'i'],
            ];
            mockedDataRepository.getAllRows.mockResolvedValue(mockData);
            
            const { columnData } = await dataService.getColumnData(2); // Get third column

            expect(columnData).toEqual(['c', '', 'i']);
        });
    });
}); 