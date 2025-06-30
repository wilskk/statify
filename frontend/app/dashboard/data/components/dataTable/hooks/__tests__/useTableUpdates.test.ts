import { renderHook, act } from '@testing-library/react';
import { useTableUpdates } from '../useTableUpdates';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { toast } from '@/hooks/use-toast';
import Handsontable from 'handsontable';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/hooks/use-toast', () => ({
    toast: jest.fn(),
}));

// Debounce mock
jest.useFakeTimers();

describe('useTableUpdates', () => {
    const mockUpdateCells = jest.fn();
    const mockAddVariables = jest.fn().mockResolvedValue(undefined);
    const mockVariables = [
        { name: 'Var1', columnIndex: 0, type: 'NUMERIC', decimals: 2 },
        { name: 'Var2', columnIndex: 1, type: 'STRING', width: 5 },
        { name: 'Var3', columnIndex: 2, type: 'DATE' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock store implementations
        (useDataStore as unknown as jest.Mock).mockImplementation((selector: any) => {
            const state = {
                updateCells: mockUpdateCells,
            };
            return selector ? selector(state) : state;
        });

        (useVariableStore as unknown as jest.Mock).mockImplementation((selector: any) => {
            const state = {
                variables: mockVariables,
                addVariables: mockAddVariables,
            };
            // This allows accessing both state and actions like in the real hook
            if (selector) {
                if(selector.name === 'getState') return () => state;
                return selector(state);
            }
            return state;
        });
        // Special mock for getState() used inside the hook
        (useVariableStore.getState as jest.Mock) = jest.fn().mockReturnValue({
            addVariables: mockAddVariables,
        });
    });

    it('should call debounced updateCells on data change', async () => {
        const { result } = renderHook(() => useTableUpdates('numeric'));
        const changes: Handsontable.CellChange[] = [[0, 0, null, 123]]; // row, col, oldVal, newVal

        await act(async () => {
            result.current.handleAfterChange(changes, 'edit');
        });

        // Fast-forward timers
        jest.runAllTimers();

        expect(mockUpdateCells).toHaveBeenCalledTimes(1);
        expect(mockUpdateCells).toHaveBeenCalledWith([{ row: 0, col: 0, value: 123 }]);
    });

    it('should truncate string values in beforeChange', () => {
        const { result } = renderHook(() => useTableUpdates('numeric'));
        const changes: Handsontable.CellChange[] = [[0, 1, 'this is a long value', 'this is too long']];

        act(() => {
            result.current.handleBeforeChange(changes, 'edit');
        });
        
        expect(changes[0][3]).toBe('this '); // 'this is too long' truncated to 5 chars
    });

    it('should handle new column creation when pasting data', async () => {
        const { result } = renderHook(() => useTableUpdates('numeric'));
        const changes: Handsontable.CellChange[] = [[0, 3, null, 'new data']]; // Pasting into a new column

        await act(async () => {
            await result.current.handleAfterChange(changes, 'CopyPaste.paste');
        });

        expect(mockAddVariables).toHaveBeenCalledTimes(1);
        // It should infer type STRING for the new variable
        expect(mockAddVariables).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ columnIndex: 3, type: 'STRING' })
            ]),
            changes.map(([row, col, , value]) => ({ row: col as number, col: col as number, value }))
        );
    });
    
    it('should show a toast on error', async () => {
        const { result } = renderHook(() => useTableUpdates('numeric'));
        const changes: Handsontable.CellChange[] = [[0, 0, null, 123]];
        
        mockUpdateCells.mockImplementationOnce(() => {
            throw new Error("Test error");
        });
        // Also mock the addVariables to throw for the other path
        mockAddVariables.mockRejectedValue(new Error("Test error"));

        await act(async () => {
            // Need to wrap in a try-catch because the hook's error boundary will re-throw
            try {
                await result.current.handleAfterChange(changes, 'edit');
            } catch(e) {
                // ignore
            }
        });
        
        jest.runAllTimers();

        expect(toast).toHaveBeenCalledWith(expect.objectContaining({
            variant: "destructive",
            title: "Terjadi Kesalahan",
        }));
    });
}); 