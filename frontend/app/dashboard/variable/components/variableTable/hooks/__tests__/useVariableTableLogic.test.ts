import { renderHook, act } from '@testing-library/react';
import { useVariableTableLogic } from '../useVariableTableLogic';
import { DIALOG_TRIGGER_COLUMNS, COLUMN_INDEX_TO_FIELD_MAP } from '../../tableConfig';
import { Variable } from '@/types/Variable';
import { useVariableStore } from '@/stores/useVariableStore';

// Mock clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(),
    },
});

// Mock the store
jest.mock('@/stores/useVariableStore');

const mockAddVariable = jest.fn();
const mockUpdateMultipleFields = jest.fn();
const mockDeleteVariables = jest.fn(); // Corrected: plural

describe('useVariableTableLogic', () => { // Corrected: hook name
    const mockHotTableRef = {
        current: {
            hotInstance: {
                // Simplified mock for propToCol
                propToCol: (prop: string | number) => COLUMN_INDEX_TO_FIELD_MAP.findIndex(p => p === prop),
                getSelectedRangeLast: jest.fn(),
            },
        },
    };
    const mockVariables: Variable[] = [{ columnIndex: 0, name: 'Var1' } as Variable];

    beforeAll(() => {
        // Mock requestAnimationFrame to execute immediately for tests
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        });
    });

    afterAll(() => {
        (window.requestAnimationFrame as any).mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (useVariableStore as unknown as jest.Mock).mockReturnValue({
            variables: mockVariables, // Provide variables from the store
            addVariable: mockAddVariable,
            updateMultipleFields: mockUpdateMultipleFields,
            deleteVariables: mockDeleteVariables, // Corrected: plural
        });
        (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockClear();
    });

    it('handleBeforeChange should call updateMultipleFields for existing variable', () => {
        const { result } = renderHook(() => useVariableTableLogic(mockHotTableRef as any));
        const changes: [number, string, any, any][] = [[0, 'name', 'Old', 'New']]; // row, prop, oldVal, newVal
        
        act(() => {
            result.current.handleBeforeChange(changes, 'edit');
        });

        expect(mockUpdateMultipleFields).toHaveBeenCalledWith(0, { name: 'New' });
    });

    it('handleBeforeChange should call addVariable for new variable', () => {
        const { result } = renderHook(() => useVariableTableLogic(mockHotTableRef as any));
        const changes: [number, string, any, any][] = [[1, 'name', '', 'NewVar']];
        
        act(() => {
            result.current.handleBeforeChange(changes, 'edit');
        });
        expect(mockAddVariable).toHaveBeenCalledWith({ name: 'NewVar', columnIndex: 1 });
    });

    it('handleBeforeChange should open dialog for dialog-triggering columns', () => {
        const { result } = renderHook(() => useVariableTableLogic(mockHotTableRef as any));
        // We need to spy on the dialog-opening logic. 
        // Since it's internal to the hook, we can't directly test if setShow*Dialog was called easily without exposing it.
        // Instead, we verify the change is cancelled (returns false), which is the primary side-effect for dialog columns.
        const changes: [number, string, any, any][] = [[0, 'type', '', '']]; // 'type' corresponds to a dialog column
        
        let returnValue: boolean | void = true;
        act(() => {
            returnValue = result.current.handleBeforeChange(changes, 'edit');
        });

        // The hook should return false to cancel the Handsontable native edit.
        expect(returnValue).toBe(false);
    });

    it('handleAfterSelectionEnd should open dialog for single cell selection in dialog columns', () => {
        const { result } = renderHook(() => useVariableTableLogic(mockHotTableRef as any));
        
        // Single cell selection in a dialog column
        act(() => {
            result.current.handleAfterSelectionEnd(0, DIALOG_TRIGGER_COLUMNS[0], 0, DIALOG_TRIGGER_COLUMNS[0]);
        });
        
        // We expect the type dialog to be shown.
        expect(result.current.showTypeDialog).toBe(true);
    });

    it('handleAfterSelectionEnd should not open dialog for multi-cell selection', () => {
        const { result } = renderHook(() => useVariableTableLogic(mockHotTableRef as any));
        
        act(() => {
            result.current.handleAfterSelectionEnd(0, 0, 1, 1);
        });

        expect(result.current.showTypeDialog).toBe(false);
        expect(result.current.showValuesDialog).toBe(false);
        expect(result.current.showMissingDialog).toBe(false);
    });

    it('handleInsertVariable should call addVariable operation', async () => {
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockReturnValue({ from: { row: 1 } });
        const { result } = renderHook(() => useVariableTableLogic(mockHotTableRef as any));
        
        await act(async () => {
            // handleInsertVariable is now internal to handleContextMenu, so we test via context menu
            result.current.handleContextMenu('insert_variable');
        });
        
        expect(mockAddVariable).toHaveBeenCalledWith({ columnIndex: 1 });
    });
    
    it('handleDeleteVariables should call deleteVariables operation for selected rows', async () => {
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockReturnValue({ from: { row: 0 }, to: { row: 0 } });
        const { result } = renderHook(() => useVariableTableLogic(mockHotTableRef as any));
        
        await act(async () => {
             // handleDeleteVariables is now internal to handleContextMenu
            result.current.handleContextMenu('delete_variable');
        });
        
        expect(mockDeleteVariables).toHaveBeenCalledWith([0]);
    });

    it('handleCopyVariable should write variable data to clipboard', () => {
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockReturnValue({ from: { row: 0 } });
        const { result } = renderHook(() => useVariableTableLogic(mockHotTableRef as any));
        
        act(() => {
            // handleCopyVariable is now internal to handleContextMenu
            result.current.handleContextMenu('copy_variable');
        });
        
        // We expect `id` and `tempId` to be omitted from the copied data.
        const expectedData = { ...mockVariables[0] };
        delete (expectedData as any).id;
        delete (expectedData as any).tempId;
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            JSON.stringify(expectedData)
        );
    });
}); 