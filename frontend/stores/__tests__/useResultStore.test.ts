import { renderHook, act } from '@testing-library/react';
import { useResultStore } from '../useResultStore';
import resultService from '@/services/data/ResultService';
import { Log } from '@/types/Result';

// Mock the resultService
jest.mock('@/services/data/ResultService', () => ({
    getAllResults: jest.fn(),
    getLog: jest.fn(),
    addResultLog: jest.fn(),
    updateLog: jest.fn(),
    deleteLog: jest.fn(),
    clearAll: jest.fn(),
}));

// Cast the mock to the correct type to allow mocking its methods
const mockedResultService = resultService as jest.Mocked<typeof resultService>;

const mockLog1: Log = { id: 1, log: 'First log entry', analytics: [] };
const mockLog2: Log = { id: 2, log: 'Second log entry', analytics: [] };

describe('useResultStore', () => {
    let initialState: any;
    beforeEach(() => {
        initialState = useResultStore.getState();
        jest.clearAllMocks();
    });

    afterEach(() => {
        act(() => {
            useResultStore.setState(initialState);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useResultStore());
        expect(result.current.logs).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should add a new log', async () => {
        const { result } = renderHook(() => useResultStore());
        const newLogData = { log: 'New log' };
        
        // Mock the service to return the new ID
        mockedResultService.addResultLog.mockResolvedValue(1);

        await act(async () => {
            await result.current.addLog(newLogData);
        });

        expect(result.current.logs).toHaveLength(1);
        expect(result.current.logs[0].log).toBe('New log');
        expect(result.current.logs[0].id).toBe(1);
        expect(mockedResultService.addResultLog).toHaveBeenCalledWith(newLogData);
    });

    it('should delete a log', async () => {
        const { result } = renderHook(() => useResultStore());

        // Setup initial state with two logs
        act(() => {
            result.current.loadResults(); // This is a placeholder; let's set state directly
            useResultStore.setState({ logs: [mockLog1, mockLog2] });
        });

        mockedResultService.deleteLog.mockResolvedValue(true);

        await act(async () => {
            // Ensure id is a number
            if (typeof mockLog1.id === 'number') {
                await result.current.deleteLog(mockLog1.id);
            }
        });

        expect(result.current.logs).toHaveLength(1);
        expect(result.current.logs[0].id).toBe(mockLog2.id);
        expect(mockedResultService.deleteLog).toHaveBeenCalledWith(mockLog1.id);
    });

    it('should clear all logs', async () => {
        const { result } = renderHook(() => useResultStore());

        // Setup initial state
        act(() => {
            useResultStore.setState({ logs: [mockLog1, mockLog2] });
        });

        mockedResultService.clearAll.mockResolvedValue(true);

        await act(async () => {
            await result.current.clearAll();
        });

        expect(result.current.logs).toHaveLength(0);
        expect(mockedResultService.clearAll).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when adding a log', async () => {
        const { result } = renderHook(() => useResultStore());
        const error = new Error('Failed to add');
        mockedResultService.addResultLog.mockRejectedValue(error);

        await expect(
            act(async () => {
                await result.current.addLog({ log: 'This will fail' });
            })
        ).rejects.toThrow('Failed to add');

        // State should not have changed
        expect(result.current.logs).toHaveLength(0);
    });
}); 