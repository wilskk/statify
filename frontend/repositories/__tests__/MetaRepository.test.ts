import { metaRepository } from '../MetaRepository';
import db from '@/lib/db';
import { Meta } from '@/types/Meta';

// Mock the entire db module
jest.mock('@/lib/db', () => {
    const mockTable = {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    };
    return {
        __esModule: true,
        default: {
            table: jest.fn().mockReturnValue(mockTable),
            // Add other db properties if needed for other tests
        },
        table: jest.fn().mockReturnValue(mockTable), // Also mock the named export if used
    };
});

const mockedDb = db as jest.Mocked<typeof db>;
const mockedTable = mockedDb.table('metadata') as jest.Mocked<any>;

describe('MetaRepository', () => {
    const mockMeta: Meta = {
        id: 'appMeta',
        name: 'Test File',
        location: '/test/location',
        created: new Date(),
        weight: '',
        dates: '',
        filter: '',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Suppress console.error during tests
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('getMeta', () => {
        it('should call db.table with "metadata" and get the meta object', async () => {
            mockedTable.get.mockResolvedValue(mockMeta);

            const result = await metaRepository.getMeta();

            expect(mockedDb.table).toHaveBeenCalledWith('metadata');
            expect(mockedTable.get).toHaveBeenCalledWith('appMeta');
            expect(result).toEqual(mockMeta);
        });

        it('should return undefined if no meta is found', async () => {
            mockedTable.get.mockResolvedValue(undefined);

            const result = await metaRepository.getMeta();

            expect(result).toBeUndefined();
        });

        it('should throw an error if the get operation fails', async () => {
            const mockError = new Error('DB get failed');
            mockedTable.get.mockRejectedValue(mockError);

            await expect(metaRepository.getMeta()).rejects.toThrow(mockError);
        });
    });

    describe('saveMeta', () => {
        it('should call db.table with "metadata" and put the meta object', async () => {
            await metaRepository.saveMeta(mockMeta);

            expect(mockedDb.table).toHaveBeenCalledWith('metadata');
            expect(mockedTable.put).toHaveBeenCalledWith({ ...mockMeta, id: 'appMeta' });
        });

        it('should throw an error if the save operation fails', async () => {
            const mockError = new Error('DB put failed');
            mockedTable.put.mockRejectedValue(mockError);

            await expect(metaRepository.saveMeta(mockMeta)).rejects.toThrow(mockError);
        });
    });

    describe('deleteMeta', () => {
        it('should call db.table with "metadata" and delete the meta object', async () => {
            await metaRepository.deleteMeta();

            expect(mockedDb.table).toHaveBeenCalledWith('metadata');
            expect(mockedTable.delete).toHaveBeenCalledWith('appMeta');
        });

        it('should throw an error if the delete operation fails', async () => {
            const mockError = new Error('DB delete failed');
            mockedTable.delete.mockRejectedValue(mockError);

            await expect(metaRepository.deleteMeta()).rejects.toThrow(mockError);
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