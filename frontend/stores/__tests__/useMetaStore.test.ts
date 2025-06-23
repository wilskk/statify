import { renderHook, act } from '@testing-library/react';
import { useMetaStore } from '../useMetaStore';
import db from '@/lib/db';

// Explicitly mock the implementation of the db module
jest.mock('@/lib/db', () => {
    // These are now actual Jest mock functions
    const mockPut = jest.fn();
    const mockGet = jest.fn();
    const mockDelete = jest.fn();

    return {
        metadata: {
            put: mockPut,
            get: mockGet,
            delete: mockDelete,
        },
    };
});

// Cast the mock to the correct type to allow mocking its methods
const mockedDb = db as jest.Mocked<typeof db>;

describe('useMetaStore', () => {
    let initialState: any;
    beforeEach(() => {
        initialState = useMetaStore.getState();
        jest.clearAllMocks();
    });

    afterEach(() => {
        act(() => {
            useMetaStore.setState(initialState);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useMetaStore());
        expect(result.current.meta.name).toBe('');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.isLoaded).toBe(false);
    });

    it('should set meta data and save to db', async () => {
        const { result } = renderHook(() => useMetaStore());
        const newMetaData = { name: 'My Project', weight: 'WGT' };
        
        // Force cast to a Jest mock function
        (mockedDb.metadata.put as jest.Mock).mockResolvedValue('appMeta');

        await act(async () => {
            await result.current.setMeta(newMetaData);
        });

        expect(result.current.meta.name).toBe('My Project');
        expect(result.current.meta.weight).toBe('WGT');
        expect(mockedDb.metadata.put).toHaveBeenCalledTimes(1);
        // Check that the created date is still there
        expect(mockedDb.metadata.put).toHaveBeenCalledWith(
            expect.objectContaining(newMetaData)
        );
    });

    it('should reset meta data and clear from db', async () => {
        const { result } = renderHook(() => useMetaStore());

        // Set some initial data to be cleared
        act(() => {
            result.current.setMeta({ name: 'Old Project' });
        });

        (mockedDb.metadata.delete as jest.Mock).mockResolvedValue(undefined);
        (mockedDb.metadata.put as jest.Mock).mockResolvedValue('appMeta'); // For the save after reset

        await act(async () => {
            await result.current.resetMeta();
        });

        expect(result.current.meta.name).toBe('');
        expect(result.current.isLoaded).toBe(false);
        expect(mockedDb.metadata.delete).toHaveBeenCalledWith('appMeta');
        expect(mockedDb.metadata.put).toHaveBeenCalledTimes(2); // One from setMeta, one from resetMeta
    });

    it('should handle errors when saving to db', async () => {
        const { result } = renderHook(() => useMetaStore());
        const error = new Error('DB Write Failed');
        (mockedDb.metadata.put as jest.Mock).mockRejectedValue(error);

        // We expect the store to throw the error so components can react
        await expect(
            act(async () => {
                await result.current.setMeta({ name: 'This will fail' });
            })
        ).rejects.toThrow('DB Write Failed');

        // Check if the error state is set in the store
        expect(result.current.error).not.toBe(null);
        expect(result.current.error?.message).toBe('DB Write Failed');
        expect(result.current.error?.source).toBe('_saveMetaToDb');
    });
}); 