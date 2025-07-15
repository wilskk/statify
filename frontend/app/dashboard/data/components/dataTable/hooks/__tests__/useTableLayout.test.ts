import { renderHook } from '@testing-library/react';
import { useTableLayout } from '../useTableLayout';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { MIN_ROWS, MIN_COLS } from '../../constants';
import { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useTableRefStore');
jest.mock('@/components/Common/iconHelper', () => ({
    getVariableIcon: jest.fn(() => 'IconMock'),
}));
jest.mock('react-dom/server', () => ({
    renderToStaticMarkup: jest.fn((icon) => `<icon>${icon}</icon>`),
}));
jest.mock('../../utils/utils', () => ({
    getColumnConfig: jest.fn((variable, viewMode) => ({
        type: variable ? variable.type : 'text',
        viewMode: viewMode,
    })),
}));

describe('useTableLayout Hook', () => {
    const mockUseDataStore = useDataStore as unknown as jest.Mock;
    const mockUseVariableStore = useVariableStore as unknown as jest.Mock;
    const mockUseTableRefStore = useTableRefStore as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        const tableRefState = { viewMode: 'numeric' };
        mockUseTableRefStore.mockImplementation((selector) => (selector ? selector(tableRefState) : tableRefState));
    });

    it('should return minimum dimensions when there is no data or variables', () => {
        const dataState = { data: [] };
        mockUseDataStore.mockImplementation((selector) => (selector ? selector(dataState) : dataState));
        const varState = { variables: [] };
        mockUseVariableStore.mockImplementation((selector) => (selector ? selector(varState) : varState));

        const { result } = renderHook(() => useTableLayout());

        expect(result.current.actualNumRows).toBe(0);
        expect(result.current.actualNumCols).toBe(0);
        expect(result.current.displayNumRows).toBe(MIN_ROWS + 1);
        expect(result.current.displayNumCols).toBe(MIN_COLS + 1);
    });
    
    it('should calculate dimensions based on data when it exceeds minimums', () => {
        const largeData = Array(MIN_ROWS + 5).fill(null).map(() => Array(MIN_COLS + 5).fill(1));
        const variables = Array(MIN_COLS + 5).fill(null).map((_, i) => ({
            name: `Var${i}`, columnIndex: i, type: 'NUMERIC',
        }));

        const dataState = { data: largeData };
        mockUseDataStore.mockImplementation((selector) => (selector ? selector(dataState) : dataState));
        const varState = { variables: variables as Variable[] };
        mockUseVariableStore.mockImplementation((selector) => (selector ? selector(varState) : varState));

        const { result } = renderHook(() => useTableLayout());

        expect(result.current.actualNumRows).toBe(MIN_ROWS + 5);
        expect(result.current.actualNumCols).toBe(MIN_COLS + 5);
        expect(result.current.displayNumRows).toBe(MIN_ROWS + 5 + 1);
        expect(result.current.displayNumCols).toBe(MIN_COLS + 5 + 1);
    });

    it('should generate correct column headers from variables', () => {
        const variables: Partial<Variable>[] = [
            { name: 'Var1', columnIndex: 0, type: 'NUMERIC' },
            { name: 'Var2', columnIndex: 1, type: 'STRING' },
        ];
        const dataState = { data: [] };
        mockUseDataStore.mockImplementation((selector) => (selector ? selector(dataState) : dataState));
        const varState = { variables };
        mockUseVariableStore.mockImplementation((selector) => (selector ? selector(varState) : varState));

        const { result } = renderHook(() => useTableLayout());
        
        expect(result.current.colHeaders[0]).toContain('Var1');
        expect(result.current.colHeaders[0]).toContain('<icon>IconMock</icon>');
        expect(result.current.colHeaders[1]).toContain('Var2');
        expect(result.current.colHeaders[1]).toContain('<icon>IconMock</icon>');
        expect(result.current.colHeaders[2]).toBe('var');
    });

    it('should correctly build the display data matrix, padding with nulls', () => {
        const data = [[1, 2], [3, 4]];
        const variables: Partial<Variable>[] = [
            { name: 'Var1', columnIndex: 0 }, { name: 'Var2', columnIndex: 1 }
        ];
        const dataState = { data };
        mockUseDataStore.mockImplementation((selector) => (selector ? selector(dataState) : dataState));
        const varState = { variables };
        mockUseVariableStore.mockImplementation((selector) => (selector ? selector(varState) : varState));

        const { result } = renderHook(() => useTableLayout());

        const { displayData } = result.current;
        
        expect(displayData.length).toBe(MIN_ROWS);
        expect(displayData[0].length).toBe(MIN_COLS);
        expect(displayData[0][0]).toBe(1);
        expect(displayData[1][1]).toBe(4);
        expect(displayData[2][0]).toBeNull(); // Padded row
        expect(displayData[0][2]).toBeNull(); // Padded column
    });
}); 