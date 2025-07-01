import React from 'react';
import { render } from '@testing-library/react';
import DataTable from '../index';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { MIN_ROWS, MIN_COLS } from '../constants';
import { Variable } from '@/types/Variable';

// --- Mocks ---
const mockHandsontableWrapper = jest.fn((props) => {
    // We only render children and ignore other props to avoid React warnings
    // about passing non-standard DOM attributes to a div.
    return <div>{props.children}</div>;
});

jest.mock('../HandsontableWrapper', () => ({
    __esModule: true,
    default: (props: any) => mockHandsontableWrapper(props),
}));

jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');
jest.mock('@/stores/useTableRefStore');
// --- End Mocks ---

describe('DataTable Component - Integration Tests', () => {
    const mockUseDataStore = useDataStore as unknown as jest.Mock;
    const mockUseVariableStore = useVariableStore as unknown as jest.Mock;
    const mockUseMetaStore = useMetaStore as unknown as jest.Mock;
    const mockUseTableRefStore = useTableRefStore as unknown as jest.Mock;

    beforeEach(() => {
        // Clear all mocks and reset stores to a default state
        jest.clearAllMocks();
        mockHandsontableWrapper.mockClear();

        const dataState = { 
            data: [],
            updateCells: jest.fn(),
        };
        mockUseDataStore.mockImplementation(selector => (selector ? selector(dataState) : dataState));

        const varState = { 
            variables: [],
            updateMultipleFields: jest.fn(),
        };
        mockUseVariableStore.mockImplementation(selector => (selector ? selector(varState) : varState));

        const metaState = { meta: { filter: '' } };
        mockUseMetaStore.mockImplementation(selector => (selector ? selector(metaState) : metaState));

        const tableRefState = { viewMode: 'numeric', setDataTableRef: jest.fn() };
        mockUseTableRefStore.mockImplementation(selector => (selector ? selector(tableRefState) : tableRefState));
    });

    it('should calculate and pass correct minimum dimensions to Handsontable when data is small', () => {
        // Arrange
        const mockData = [
            [1, 'a'],
            [2, 'b'],
        ];
        const mockVariables: Partial<Variable>[] = [
            { name: 'Var1', columnIndex: 0, type: 'NUMERIC' },
            { name: 'Var2', columnIndex: 1, type: 'STRING' },
        ];
        mockUseDataStore.mockImplementation(selector => selector({ data: mockData, updateCells: jest.fn() }));
        mockUseVariableStore.mockImplementation(selector => selector({ variables: mockVariables, updateMultipleFields: jest.fn() }));

        // Act
        render(<DataTable />);

        // Assert
        expect(mockHandsontableWrapper).toHaveBeenCalled();
        
        const passedProps = mockHandsontableWrapper.mock.calls[0][0];
        
        // +1 for spare row/col
        expect(passedProps.minRows).toBe(MIN_ROWS + 1);
        expect(passedProps.minCols).toBe(MIN_COLS + 1);
        expect(passedProps.data.length).toBe(MIN_ROWS);
        expect(passedProps.data[0].length).toBe(MIN_COLS);
    });

    it('should use data dimensions when they are larger than minimums', () => {
         // Arrange
         const largeData = Array(MIN_ROWS + 20).fill(null).map(() => Array(MIN_COLS + 10).fill(0));
         const mockVariables: Partial<Variable>[] = Array(MIN_COLS + 10).fill(null).map((_, i) => ({
             name: `Var${i}`,
             columnIndex: i,
             type: 'NUMERIC',
         }));
         
         mockUseDataStore.mockImplementation(selector => selector({ data: largeData, updateCells: jest.fn() }));
         mockUseVariableStore.mockImplementation(selector => selector({ variables: mockVariables, updateMultipleFields: jest.fn() }));
 
         // Act
         render(<DataTable />);
 
         // Assert
         expect(mockHandsontableWrapper).toHaveBeenCalled();
 
         const passedProps = mockHandsontableWrapper.mock.calls[0][0];
         
         // +1 for spare row/col
         expect(passedProps.minRows).toBe(MIN_ROWS + 20 + 1);
         expect(passedProps.minCols).toBe(MIN_COLS + 10 + 1);
    });
}); 