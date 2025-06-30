import React from 'react';
import { render } from '@testing-library/react';
import DataTable from '..';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { MIN_ROWS, MIN_COLS } from '../constants';
import { Variable } from '@/types/Variable';

// --- Mocks ---

// Mock stores
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');
jest.mock('@/stores/useTableRefStore');

// Mock HandsontableWrapper to check props passed to it
const mockHandsontableWrapper = jest.fn();
jest.mock(
  '../HandsontableWrapper',
  () => {
    // Must be a forwardRef to accept the ref from the DataTable component
    const MockedHandsontableWrapper = React.forwardRef<HTMLDivElement, any>(
      (props, ref) => {
        mockHandsontableWrapper(props); // Capture props for assertion
        return <div data-testid="handsontable-wrapper-mock" {...props} ref={ref} />;
      },
    );

    MockedHandsontableWrapper.displayName = 'MockHandsontableWrapper';

    return MockedHandsontableWrapper;
  },
);

// Mock dependencies of hooks used by DataTable
jest.mock('@/components/Common/iconHelper', () => ({
  getVariableIcon: jest.fn(() => <span>Icon</span>),
}));
jest.mock('react-dom/server', () => ({
  renderToStaticMarkup: jest.fn(() => `<span>Icon</span>`),
}));


// --- Test Suite ---

describe('DataTable Component - Integration Tests', () => {
    const mockUseDataStore = useDataStore as unknown as jest.Mock;
    const mockUseVariableStore = useVariableStore as unknown as jest.Mock;
    const mockUseMetaStore = useMetaStore as unknown as jest.Mock;
    const mockUseTableRefStore = useTableRefStore as unknown as jest.Mock;

    beforeEach(() => {
        // Clear all mocks and reset stores to a default state
        jest.clearAllMocks();
        mockHandsontableWrapper.mockClear();

        mockUseDataStore.mockReturnValue({
            data: [],
        });
        mockUseVariableStore.mockReturnValue({
            variables: [],
        });
        mockUseMetaStore.mockReturnValue({
            meta: { filter: '' },
        });
        mockUseTableRefStore.mockReturnValue({
            viewMode: 'numeric',
        });
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
        mockUseDataStore.mockReturnValue({ data: mockData });
        mockUseVariableStore.mockReturnValue({ variables: mockVariables });

        // Act
        render(<DataTable />);

        // Assert
        expect(mockHandsontableWrapper).toHaveBeenCalledTimes(1);
        
        const passedProps = mockHandsontableWrapper.mock.calls[0][0];
        
        // Check dimensions (should be inflated to MIN_ROWS/COLS)
        expect(passedProps.minRows).toBe(MIN_ROWS + 1);
        expect(passedProps.minCols).toBe(MIN_COLS + 1);
        
        // Check headers (should be inflated to MIN_COLS + 1 spare)
        expect(passedProps.colHeaders).toHaveLength(MIN_COLS + 1);
        expect(passedProps.colHeaders[0]).toContain('Var1');
        expect(passedProps.colHeaders[1]).toContain('Var2');
        expect(passedProps.colHeaders[2]).toBe('var');
    });

    it('should use data dimensions when they are larger than minimums', () => {
         // Arrange
         const largeData = Array(MIN_ROWS + 20).fill(null).map(() => Array(MIN_COLS + 10).fill(0));
         const mockVariables: Partial<Variable>[] = Array(MIN_COLS + 10).fill(null).map((_, i) => ({
             name: `Var${i}`,
             columnIndex: i,
             type: 'NUMERIC',
         }));
         
         mockUseDataStore.mockReturnValue({ data: largeData });
         mockUseVariableStore.mockReturnValue({ variables: mockVariables });
 
         // Act
         render(<DataTable />);
 
         // Assert
         expect(mockHandsontableWrapper).toHaveBeenCalledTimes(1);
         const passedProps = mockHandsontableWrapper.mock.calls[0][0];

         expect(passedProps.minRows).toBe(MIN_ROWS + 20 + 1);
         expect(passedProps.minCols).toBe(MIN_COLS + 10 + 1);
    });
}); 