import { metaRepository } from '../MetaRepository';
import db from '@/lib/db';
import { Meta } from '@/types/Meta';

// Mock the db module to handle chained calls like db.table(...).get(...)
const mockDbMethods = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};
jest.mock('@/lib/db', () => ({
  table: jest.fn(() => mockDbMethods),
}));

describe('MetaRepository', () => {
  const mockMeta: Meta = {
    id: 'appMeta',
    name: 'Test File',
    location: '/test/location',
    created: new Date(),
    weight: '',
    dates: '',
    filter: ''
  };

  beforeEach(() => {
    // Clear all mocks before each test
    (db.table as jest.Mock).mockClear();
    mockDbMethods.get.mockClear();
    mockDbMethods.put.mockClear();
    mockDbMethods.delete.mockClear();
  });

  describe('getMeta', () => {
    it('should call db.table with "metadata" and get the meta object', async () => {
      mockDbMethods.get.mockResolvedValue(mockMeta);

      const result = await metaRepository.getMeta();

      expect(db.table).toHaveBeenCalledWith('metadata');
      expect(mockDbMethods.get).toHaveBeenCalledWith('appMeta');
      expect(result).toEqual(mockMeta);
    });

    it('should return undefined if no meta is found', async () => {
      mockDbMethods.get.mockResolvedValue(undefined);

      const result = await metaRepository.getMeta();

      expect(result).toBeUndefined();
    });
  });

  describe('saveMeta', () => {
    it('should call db.table with "metadata" and put the meta object', async () => {
      await metaRepository.saveMeta(mockMeta);

      expect(db.table).toHaveBeenCalledWith('metadata');
      expect(mockDbMethods.put).toHaveBeenCalledWith({ ...mockMeta, id: 'appMeta' });
    });
  });

  describe('deleteMeta', () => {
    it('should call db.table with "metadata" and delete the meta object', async () => {
      await metaRepository.deleteMeta();

      expect(db.table).toHaveBeenCalledWith('metadata');
      expect(mockDbMethods.delete).toHaveBeenCalledWith('appMeta');
    });
  });
  
  describe('clearMeta', () => {
    it('should call deleteMeta', async () => {
        // Since clearMeta just calls deleteMeta, we can test that interaction.
        const deleteMetaSpy = jest.spyOn(metaRepository, 'deleteMeta').mockResolvedValue(undefined);
        
        await metaRepository.clearMeta();
        
        expect(deleteMetaSpy).toHaveBeenCalledTimes(1);
        
        deleteMetaSpy.mockRestore(); // clean up spy
    });
  });
}); 