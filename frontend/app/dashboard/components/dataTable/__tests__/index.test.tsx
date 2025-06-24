import React from 'react';
import { render } from '@testing-library/react';
import DataTable from '../index';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');
jest.mock('@/stores/useTableRefStore');
jest.mock('../hooks/useDataTableLogic');
jest.mock('../services/storeOperations', () => ({
    __esModule: true, // this property makes it work with ESM
    addRow: jest.fn(),
    deleteRows: jest.fn(),
    addColumns: jest.fn(),
    deleteColumns: jest.fn(),
    updateCells: jest.fn(),
    addVariable: jest.fn(),
    addMultipleVariables: jest.fn(),
    deleteVariable: jest.fn(),
    updateVariable: jest.fn(),
    ensureCompleteVariables: jest.fn(),
    getVariables: jest.fn(() => []),
    overwriteVariables: jest.fn(),
}));
jest.mock('../HandsontableWrapper', () => {
    const HandsontableWrapperMock = (props: any, ref: any) => (
      <div data-testid="handsontable-wrapper-mock" ref={ref}></div>
    );
    const forwardRef = require('react').forwardRef;
    return forwardRef(HandsontableWrapperMock);
});

describe('DataTable Component', () => {
  const useDataStore = require('@/stores/useDataStore').useDataStore;
  const useVariableStore = require('@/stores/useVariableStore').useVariableStore;
  const useMetaStore = require('@/stores/useMetaStore').useMetaStore;
  const useTableRefStore = require('@/stores/useTableRefStore').useTableRefStore;
  const useDataTableLogic = require('../hooks/useDataTableLogic').useDataTableLogic;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    useDataStore.mockImplementation((selector?: (state: any) => any) => {
        const state = {
            data: [],
            updateCells: jest.fn(),
        };
        if (selector) return selector(state);
        return state;
    });

    useVariableStore.mockImplementation((selector?: (state: any) => any) => {
        const state = {
            variables: [],
        };
        if (selector) return selector(state);
        return state;
    });

    useMetaStore.mockImplementation((selector?: (state: any) => any) => {
        const state = {
            meta: { filter: '' },
        };
        if (selector) return selector(state);
        return state;
    });

    useTableRefStore.mockImplementation((selector?: (state: any) => any) => {
        const state = {
            viewMode: 'numeric',
        };
        if (selector) return selector(state);
        return state;
    });

    useDataTableLogic.mockReturnValue({
        displayMatrix: [],
        colHeaders: [],
        columns: [],
        contextMenuConfig: {},
        handleBeforeChange: jest.fn(),
        handleAfterCreateRow: jest.fn(),
        handleAfterCreateCol: jest.fn(),
        handleAfterRemoveRow: jest.fn(),
        handleAfterRemoveCol: jest.fn(),
        handleAfterColumnResize: jest.fn(),
        handleAfterValidate: jest.fn(),
        isRangeSelected: false,
        actualNumRows: 0,
        actualNumCols: 0,
    });
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(<DataTable />);
    expect(getByTestId('handsontable-wrapper-mock')).toBeInTheDocument();
  });

  it('should convert labels to numeric values when viewMode changes to numeric', () => {
    const mockUpdateCells = jest.fn();
    const mockData = [['One']];
    const mockVariables = [
      {
        columnIndex: 0,
        type: 'NUMERIC',
        values: [{ value: 1, label: 'One' }],
      },
    ];

    // Initial setup with label view
    useDataStore.mockImplementation((selector?: (state: any) => any) => {
      const state = {
        data: mockData,
        updateCells: mockUpdateCells,
      };
      if (selector) return selector(state);
      return state;
    });

    useVariableStore.mockImplementation((selector?: (state: any) => any) => {
        const state = {
            variables: mockVariables,
        };
        if (selector) return selector(state);
        return state;
    });

    useTableRefStore.mockImplementation((selector?: (state: any) => any) => {
        const state = {
            viewMode: 'label',
        };
        if (selector) return selector(state);
        return state;
    });

    const { rerender } = render(<DataTable />);

    // Change to numeric view
    useTableRefStore.mockImplementation((selector?: (state: any) => any) => {
        const state = {
            viewMode: 'numeric',
        };
        if (selector) return selector(state);
        return state;
    });

    rerender(<DataTable />);

    // Assert that updateCells was called with the correct payload
    expect(mockUpdateCells).toHaveBeenCalledTimes(1);
    expect(mockUpdateCells).toHaveBeenCalledWith([{ row: 0, col: 0, value: 1 }]);
  });
}); 