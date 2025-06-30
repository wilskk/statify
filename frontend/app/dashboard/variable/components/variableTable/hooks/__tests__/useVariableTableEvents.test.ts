import { renderHook, act } from '@testing-library/react';
import { useVariableTableEvents } from '../useVariableTableEvents';
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
const mockDeleteVariable = jest.fn();

describe('useVariableTableEvents', () => {
    const mockOpenDialogForCell = jest.fn();
    const mockSetSelectedCell = jest.fn();
    const mockHotTableRef = {
        current: {
            hotInstance: {
                propToCol: (prop: string | number) => COLUMN_INDEX_TO_FIELD_MAP.indexOf(String(prop)),
                getSelectedRangeLast: jest.fn(),
            },
        },
    };
    const mockVariables: Variable[] = [{ columnIndex: 0, name: 'Var1' } as Variable];

    const defaultProps = {
        hotTableRef: mockHotTableRef as any,
        variables: mockVariables,
        openDialogForCell: mockOpenDialogForCell,
        setSelectedCell: mockSetSelectedCell,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useVariableStore as unknown as jest.Mock).mockReturnValue({
            addVariable: mockAddVariable,
            updateMultipleFields: mockUpdateMultipleFields,
            deleteVariable: mockDeleteVariable,
        });
        (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
    });

    it('handleBeforeChange should call updateMultipleFields for existing variable', async () => {
        const { result } = renderHook(() => useVariableTableEvents(defaultProps));
        const changes: [number, number, any, any][] = [[0, 0, 'Old', 'New']]; // row, colIndex, oldVal, newVal
        await act(async () => {
            await result.current.handleBeforeChange(changes, 'edit');
        });
        expect(mockUpdateMultipleFields).toHaveBeenCalledWith(0, { name: 'New' });
    });

    it('handleBeforeChange should call addVariable for new variable', async () => {
        const { result } = renderHook(() => useVariableTableEvents(defaultProps));
        const changes: [number, number, any, any][] = [[1, 0, '', 'NewVar']];
        await act(async () => {
            await result.current.handleBeforeChange(changes, 'edit');
        });
        expect(mockAddVariable).toHaveBeenCalledWith({ name: 'NewVar', columnIndex: 1 });
    });

    it('handleBeforeChange should open dialog for dialog-triggering columns', async () => {
        const { result } = renderHook(() => useVariableTableEvents(defaultProps));
        const changes: [number, number, any, any][] = [[0, DIALOG_TRIGGER_COLUMNS[0], '', '']];
        let returnValue;
        await act(async () => {
            returnValue = await result.current.handleBeforeChange(changes, 'edit');
        });
        expect(mockOpenDialogForCell).toHaveBeenCalledWith(0, DIALOG_TRIGGER_COLUMNS[0]);
        expect(returnValue).toBe(false); // Change should be cancelled
    });

    it('handleAfterSelectionEnd should call setSelectedCell and open dialog if needed', () => {
        const { result } = renderHook(() => useVariableTableEvents(defaultProps));
        // Single cell selection in a dialog column
        act(() => {
            result.current.handleAfterSelectionEnd(0, DIALOG_TRIGGER_COLUMNS[0], 0, DIALOG_TRIGGER_COLUMNS[0]);
        });
        expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 0, col: DIALOG_TRIGGER_COLUMNS[0] });
        expect(mockOpenDialogForCell).toHaveBeenCalledWith(0, DIALOG_TRIGGER_COLUMNS[0]);

        // Multi-cell selection
        act(() => {
            result.current.handleAfterSelectionEnd(0, 0, 1, 1);
        });
        expect(mockSetSelectedCell).toHaveBeenCalledWith(null);
    });

    it('handleInsertVariable should call addVariable operation', async () => {
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockReturnValue({ from: { row: 1 } });
        const { result } = renderHook(() => useVariableTableEvents(defaultProps));
        await act(async () => {
            await result.current.handleInsertVariable();
        });
        expect(mockAddVariable).toHaveBeenCalledWith({ columnIndex: 1 });
    });
    
    it('handleDeleteVariable should call deleteVariable operation for selected rows', async () => {
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockReturnValue({ from: { row: 0 }, to: { row: 0 } });
        const { result } = renderHook(() => useVariableTableEvents(defaultProps));
        await act(async () => {
            await result.current.handleDeleteVariable();
        });
        expect(mockDeleteVariable).toHaveBeenCalledWith(0);
    });

    it('handleCopyVariable should write variable data to clipboard', async () => {
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockReturnValue({ from: { row: 0 } });
        const { result } = renderHook(() => useVariableTableEvents(defaultProps));
        act(() => {
            result.current.handleCopyVariable();
        });
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            JSON.stringify({ name: 'Var1', columnIndex: 0 })
        );
    });
}); 