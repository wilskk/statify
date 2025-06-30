import { renderHook, act } from '@testing-library/react';
import { useContextMenuLogic } from '../useContextMenuLogic';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';

// Mock stores
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');

describe('useContextMenuLogic', () => {
    const mockAddRow = jest.fn();
    const mockDeleteRows = jest.fn();
    const mockUpdateCells = jest.fn();
    const mockAddVariable = jest.fn();
    const mockDeleteVariables = jest.fn().mockResolvedValue(undefined);
    const mockUpdateMultipleVariables = jest.fn();

    const mockHotTableRef = {
        current: {
            hotInstance: {
                getSelectedLast: jest.fn(),
                getSelectedRangeLast: jest.fn(),
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock store implementations
        (useDataStore as unknown as jest.Mock).mockReturnValue({
            addRow: mockAddRow,
            deleteRows: mockDeleteRows,
            updateCells: mockUpdateCells,
            data: [['a', 'b'], ['c', 'd']],
        });

        (useVariableStore as unknown as jest.Mock).mockReturnValue({
            addVariable: mockAddVariable,
            deleteVariables: mockDeleteVariables,
            updateMultipleVariables: mockUpdateMultipleVariables,
        });
        
        // Mock Handsontable selection
        mockHotTableRef.current.hotInstance.getSelectedLast.mockReturnValue([1, 1]); // row 1, col 1
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockReturnValue({
            from: { row: 1, col: 1 },
            to: { row: 3, col: 3 },
        });
    });

    const defaultProps = {
        hotTableRef: mockHotTableRef as any,
        actualNumRows: 10,
        actualNumCols: 10,
    };

    it('should call addRow with correct index when inserting above', () => {
        const { result } = renderHook(() => useContextMenuLogic(defaultProps));
        const contextMenu = result.current.contextMenuConfig as any;
        act(() => {
            contextMenu.items.row_above.callback();
        });
        expect(mockAddRow).toHaveBeenCalledWith(1);
    });

    it('should call addRow with correct index when inserting below', () => {
        const { result } = renderHook(() => useContextMenuLogic(defaultProps));
        const contextMenu = result.current.contextMenuConfig as any;
        act(() => {
            contextMenu.items.row_below.callback();
        });
        expect(mockAddRow).toHaveBeenCalledWith(2);
    });

    it('should call addVariable with correct index when inserting left', () => {
        const { result } = renderHook(() => useContextMenuLogic(defaultProps));
        const contextMenu = result.current.contextMenuConfig as any;
        act(() => {
            contextMenu.items.col_left.callback();
        });
        expect(mockAddVariable).toHaveBeenCalledWith({ columnIndex: 1 });
    });

    it('should call addVariable with correct index when inserting right', () => {
        const { result } = renderHook(() => useContextMenuLogic(defaultProps));
        const contextMenu = result.current.contextMenuConfig as any;
        act(() => {
            contextMenu.items.col_right.callback();
        });
        expect(mockAddVariable).toHaveBeenCalledWith({ columnIndex: 2 });
    });
    
    it('should call deleteRows with selected row indices', () => {
        const { result } = renderHook(() => useContextMenuLogic(defaultProps));
        const contextMenu = result.current.contextMenuConfig as any;
        act(() => {
            contextMenu.items.remove_row.callback();
        });
        expect(mockDeleteRows).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should call deleteVariables with selected column indices', async () => {
        const { result } = renderHook(() => useContextMenuLogic(defaultProps));
        const contextMenu = result.current.contextMenuConfig as any;
        await act(async () => {
            contextMenu.items.remove_col.callback();
        });
        expect(mockDeleteVariables).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should call updateMultipleVariables for alignment', async () => {
        const { result } = renderHook(() => useContextMenuLogic(defaultProps));
        const contextMenu = result.current.contextMenuConfig as any;
        await act(async () => {
            contextMenu.items.alignment.submenu.items[0].callback(); // Left
        });
        
        expect(mockUpdateMultipleVariables).toHaveBeenCalledWith([
            { identifier: 1, changes: { align: 'left' } },
            { identifier: 2, changes: { align: 'left' } },
            { identifier: 3, changes: { align: 'left' } },
        ]);
    });

    it('should disable menu items when no range is selected', () => {
        mockHotTableRef.current.hotInstance.getSelectedRangeLast.mockReturnValue(undefined);
        const { result } = renderHook(() => useContextMenuLogic(defaultProps));
        
        const contextMenu = result.current.contextMenuConfig as any;
        expect(contextMenu.items.row_above.disabled()).toBe(true);
        expect(contextMenu.items.remove_row.disabled()).toBe(true);
        expect(contextMenu.items.col_left.disabled()).toBe(true);
        expect(contextMenu.items.remove_col.disabled()).toBe(true);
        expect(contextMenu.items.alignment.disabled()).toBe(true);
    });
}); 