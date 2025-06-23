import { ResultRepository } from '../ResultRepository';
import db from '@/lib/db';
import { Log, Analytic, Statistic } from '@/types/Result';

// Mock the db module
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    logs: {
      get: jest.fn(),
      update: jest.fn(),
      add: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    },
    analytics: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      add: jest.fn(),
      clear: jest.fn(),
    },
    statistics: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      delete: jest.fn(),
      update: jest.fn(),
      add: jest.fn(),
      clear: jest.fn(),
      get: jest.fn(),
    },
    // Mock custom transaction methods
    transaction: jest.fn().mockImplementation((mode, tables, callback) => callback()),
    getAllLogsWithRelations: jest.fn(),
    getLogWithRelations: jest.fn(),
  },
}));

// Create a typed mock for easier use
const mockedDb = db as jest.Mocked<typeof db>;

describe('ResultRepository', () => {
  let repository: ResultRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ResultRepository();
  });

  // Suppress console.error during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('deleteStatistic', () => {
    it('should call db.statistics.delete with the correct id', async () => {
      const statisticId = 123;
      (mockedDb.statistics.delete as jest.Mock).mockResolvedValue(undefined);

      await repository.deleteStatistic(statisticId);

      expect(mockedDb.statistics.delete).toHaveBeenCalledWith(statisticId);
      expect(mockedDb.statistics.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the delete operation fails', async () => {
      const statisticId = 123;
      const mockError = new Error('DB delete failed');
      (mockedDb.statistics.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(repository.deleteStatistic(statisticId)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(`Failed to delete statistic with ID ${statisticId}:`, mockError);
    });
  });

  describe('deleteAnalytic', () => {
    const analyticId = 456;

    it('should delete associated statistics and then the analytic itself', async () => {
      // Mock the chainable calls for statistics deletion
      const statisticsDeleteMock = jest.fn().mockResolvedValue(undefined);
      (mockedDb.statistics.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          delete: statisticsDeleteMock,
        }),
      });

      (mockedDb.analytics.delete as jest.Mock).mockResolvedValue(undefined);

      await repository.deleteAnalytic(analyticId);

      // Verify that we first query and delete the statistics
      expect(mockedDb.statistics.where).toHaveBeenCalledWith('analytic_id');
      expect(mockedDb.statistics.where('analytic_id').equals).toHaveBeenCalledWith(analyticId);
      expect(statisticsDeleteMock).toHaveBeenCalledTimes(1);

      // Verify that we then delete the analytic
      expect(mockedDb.analytics.delete).toHaveBeenCalledWith(analyticId);
      
      // Verify the order of operations
      const statsDeleteOrder = (statisticsDeleteMock as jest.Mock).mock.invocationCallOrder[0];
      const analyticDeleteOrder = (mockedDb.analytics.delete as jest.Mock).mock.invocationCallOrder[0];
      expect(statsDeleteOrder).toBeLessThan(analyticDeleteOrder);
    });

    it('should throw an error if deleting statistics fails', async () => {
      const mockError = new Error('Failed to delete statistics');
      (mockedDb.statistics.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          delete: jest.fn().mockRejectedValue(mockError),
        }),
      });

      await expect(repository.deleteAnalytic(analyticId)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(`Failed to delete analytic with ID ${analyticId}:`, mockError);
      expect(mockedDb.analytics.delete).not.toHaveBeenCalled(); // The analytic itself should not be deleted
    });
  });

  describe('deleteLog', () => {
    const logId = 789;
    const mockAnalytics: Analytic[] = [
        { id: 1, log_id: logId, title: 'Analytic 1', statistics: [] },
        { id: 2, log_id: logId, title: 'Analytic 2', statistics: [] },
    ];

    it('should delete statistics, analytics, and then the log in correct order', async () => {
        // Mock the chainable calls
        const analyticsToArrayMock = jest.fn().mockResolvedValue(mockAnalytics);
        const analyticsDeleteMock = jest.fn().mockResolvedValue(undefined);
        const statisticsDeleteMock = jest.fn().mockResolvedValue(undefined);
        (mockedDb.analytics.where as jest.Mock).mockReturnValue({
            equals: jest.fn().mockReturnValue({
                toArray: analyticsToArrayMock,
                delete: analyticsDeleteMock,
            }),
        });
        (mockedDb.statistics.where as jest.Mock).mockReturnValue({
            equals: jest.fn().mockReturnValue({
                delete: statisticsDeleteMock,
            }),
        });
        (mockedDb.logs.delete as jest.Mock).mockResolvedValue(undefined);

        await repository.deleteLog(logId);

        // 1. Fetched analytics for the log
        expect(analyticsToArrayMock).toHaveBeenCalledTimes(1);

        // 2. Deleted statistics for each analytic
        expect(mockedDb.statistics.where).toHaveBeenCalledWith('analytic_id');
        expect(mockedDb.statistics.where('analytic_id').equals).toHaveBeenCalledWith(mockAnalytics[0].id);
        expect(mockedDb.statistics.where('analytic_id').equals).toHaveBeenCalledWith(mockAnalytics[1].id);
        expect(statisticsDeleteMock).toHaveBeenCalledTimes(2);

        // 3. Deleted analytics for the log
        expect(analyticsDeleteMock).toHaveBeenCalledTimes(1);

        // 4. Deleted the log itself
        expect(mockedDb.logs.delete).toHaveBeenCalledWith(logId);

        // Verify order
        const statsDeleteOrder = (statisticsDeleteMock as jest.Mock).mock.invocationCallOrder[0];
        const analyticsDeleteOrder = (analyticsDeleteMock as jest.Mock).mock.invocationCallOrder[0];
        const logDeleteOrder = (mockedDb.logs.delete as jest.Mock).mock.invocationCallOrder[0];

        expect(statsDeleteOrder).toBeLessThan(analyticsDeleteOrder);
        expect(analyticsDeleteOrder).toBeLessThan(logDeleteOrder);
    });
  });

  describe('saveStatistic', () => {
    const mockStatistic: Statistic = {
      analytic_id: 1,
      title: 'Test Statistic',
      output_data: JSON.stringify({ some: 'data' }),
      components: JSON.stringify([]),
      description: 'A test'
    };

    it('should add a new statistic if no id is provided', async () => {
      (mockedDb.statistics.add as jest.Mock).mockResolvedValue(999); // New ID
      const result = await repository.saveStatistic(mockStatistic);

      expect(result).toBe(999);
      expect(mockedDb.statistics.add).toHaveBeenCalledWith(mockStatistic);
      expect(mockedDb.statistics.update).not.toHaveBeenCalled();
    });

    it('should update an existing statistic if an id is provided', async () => {
      const statisticWithId = { ...mockStatistic, id: 123 };
      (mockedDb.statistics.update as jest.Mock).mockResolvedValue(123);
      
      const result = await repository.saveStatistic(statisticWithId);

      expect(result).toBe(123);
      const { id, ...updateData } = statisticWithId;
      expect(mockedDb.statistics.update).toHaveBeenCalledWith(id, updateData);
      expect(mockedDb.statistics.add).not.toHaveBeenCalled();
    });

    it('should throw an error if save fails', async () => {
        const mockError = new Error('DB add failed');
        (mockedDb.statistics.add as jest.Mock).mockRejectedValue(mockError);

        await expect(repository.saveStatistic(mockStatistic)).rejects.toThrow(mockError);
        expect(console.error).toHaveBeenCalledWith('Failed to save statistic:', mockError);
    });
  });

  describe('clearResults', () => {
    it('should clear all result-related tables in a single transaction', async () => {
      (mockedDb.statistics.clear as jest.Mock).mockResolvedValue(undefined);
      (mockedDb.analytics.clear as jest.Mock).mockResolvedValue(undefined);
      (mockedDb.logs.clear as jest.Mock).mockResolvedValue(undefined);

      await repository.clearResults();

      // Verify it runs in a transaction
      expect(mockedDb.transaction).toHaveBeenCalledWith('rw', [mockedDb.logs, mockedDb.analytics, mockedDb.statistics], expect.any(Function));

      // Verify all clear methods were called
      expect(mockedDb.statistics.clear).toHaveBeenCalledTimes(1);
      expect(mockedDb.analytics.clear).toHaveBeenCalledTimes(1);
      expect(mockedDb.logs.clear).toHaveBeenCalledTimes(1);

      // Verify order
      const statsClearOrder = (mockedDb.statistics.clear as jest.Mock).mock.invocationCallOrder[0];
      const analyticsClearOrder = (mockedDb.analytics.clear as jest.Mock).mock.invocationCallOrder[0];
      const logsClearOrder = (mockedDb.logs.clear as jest.Mock).mock.invocationCallOrder[0];

      expect(statsClearOrder).toBeLessThan(analyticsClearOrder);
      expect(analyticsClearOrder).toBeLessThan(logsClearOrder);
    });

    it('should throw an error if the transaction fails', async () => {
        const mockError = new Error('Transaction failed');
        (mockedDb.transaction as jest.Mock).mockImplementation((mode, tables, callback) => {
            return Promise.reject(mockError);
        });

        await expect(repository.clearResults()).rejects.toThrow(mockError);
        expect(console.error).toHaveBeenCalledWith('Failed to clear results:', mockError);
    });
  });
}); 