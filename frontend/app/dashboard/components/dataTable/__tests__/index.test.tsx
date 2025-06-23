import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Index from '../index';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useDataTableLogic } from '../hooks/useDataTableLogic';
import * as storeOperations from '../services/storeOperations';

// Mock all external hooks and services
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useTableRefStore');
jest.mock('@/stores/useMetaStore');
jest.mock('../hooks/useDataTableLogic');
jest.mock('../services/storeOperations');

// Define mock return values
const mockUseDataStore = useDataStore as unknown as jest.Mock;
const mockUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockUseTableRefStore = useTableRefStore as unknown as jest.Mock;
const mockUseMetaStore = useMetaStore as unknown as jest.Mock;
const mockUseDataTableLogic = useDataTableLogic as jest.Mock;
const mockStoreOperations = storeOperations as jest.Mocked<typeof storeOperations>;

// Default mock implementations
const mockUpdateCells = jest.fn();
// Manually add the 'cancel' property to our mock function
(mockUpdateCells as any).cancel = jest.fn();

const setupMocks = () => {
    mockUseDataStore.mockReturnValue({
        data: [],
        updateCells: mockUpdateCells,
    });
    mockUseVariableStore.mockReturnValue({
        variables: [],
    });
    mockUseTableRefStore.mockReturnValue({
        viewMode: 'numeric',
    });
    mockUseMetaStore.mockReturnValue({
        meta: { filter: '' },
    });
    mockUseDataTableLogic.mockReturnValue({
        displayMatrix: [[]],
        colHeaders: ['A'],
        columns: [{}],
        contextMenuConfig: {},
        handleBeforeChange: jest.fn(),
        // Mock all other handlers from the hook
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
    mockStoreOperations.getVariables.mockReturnValue([]);
};

describe('DataTable Component (index.tsx)', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        setupMocks();
    });

    it('should render the HandsontableWrapper', () => {
        render(<Index />);
        // A simple test to ensure the wrapper component is rendered.
        // We can assume HandsontableWrapper is tested elsewhere or is a simple wrapper.
        // Here we just check if the container div exists.
        expect(screen.getByTestId('hot-container')).toBeInTheDocument();
    });

    it('should call updateCells with converted values when viewMode changes to numeric', () => {
        // Setup initial state for this specific test
        const mockLabelVariable = {
            columnIndex: 0,
            values: [{ value: 1, label: 'One' }],
        };
        mockUseDataStore.mockReturnValue({
            data: [['One']], // Data contains a label
            updateCells: mockUpdateCells,
        });
        mockUseVariableStore.mockReturnValue({
            variables: [mockLabelVariable],
        });
        
        // Initial render in 'label' mode
        mockUseTableRefStore.mockReturnValue({ viewMode: 'label' });
        const { rerender } = render(<Index />);

        // Simulate changing the viewMode to 'numeric'
        mockUseTableRefStore.mockReturnValue({ viewMode: 'numeric' });
        rerender(<Index />);

        // Verify that updateCells was called to convert the label back to a numeric value
        expect(mockUpdateCells).toHaveBeenCalledTimes(1);
        expect(mockUpdateCells).toHaveBeenCalledWith([
            { row: 0, col: 0, value: 1 }
        ]);
    });
    
    // We would need a way to get the handleAfterChange function to test it directly.
    // Since it's defined inside the component, we'd need to expose it or
    // trigger it via the HandsontableWrapper props, which is complex.
    // For now, testing the useEffect logic is a good start.
}); 