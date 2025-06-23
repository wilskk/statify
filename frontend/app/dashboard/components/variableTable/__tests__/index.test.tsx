import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // For .toBeInTheDocument()
import VariableTable from '../index';
import { useVariableTableLogic } from '../hooks/useVariableTableLogic';
import { Variable } from '@/types/Variable';

// Mock the main logic hook, HotTable, and all dialog components
jest.mock('../hooks/useVariableTableLogic');
jest.mock('@handsontable/react', () => ({
    HotTable: (props) => <div data-testid="hot-table" {...props} />,
}));
jest.mock('../dialog/VariableTypeDialog', () => ({
    VariableTypeDialog: ({ open, ...props }) => <div data-testid="variable-type-dialog" data-open={open} {...props} />,
}));
jest.mock('../dialog/ValueLabelsDialog', () => ({
    ValueLabelsDialog: ({ open, ...props }) => <div data-testid="value-labels-dialog" data-open={open} {...props} />,
}));
jest.mock('../dialog/MissingValuesDialog', () => ({
    MissingValuesDialog: ({ open, ...props }) => <div data-testid="missing-values-dialog" data-open={open} {...props} />,
}));

const mockUseVariableTableLogic = useVariableTableLogic as jest.Mock;

// Helper to create a mock variable
const createMockVariable = (columnIndex: number, type: Variable['type'], measure: Variable['measure']): Partial<Variable> => ({
    columnIndex,
    type,
    measure,
    name: `VAR${columnIndex}`,
});

// Default mock implementation
const setupMocks = (overrides = {}) => {
    mockUseVariableTableLogic.mockReturnValue({
        hotTableRef: { current: null },
        tableData: [],
        variables: [],
        handleBeforeChange: jest.fn(),
        handleAfterSelectionEnd: jest.fn(),
        handleContextMenu: jest.fn(),
        showTypeDialog: false,
        setShowTypeDialog: jest.fn(),
        showValuesDialog: false,
        setShowValuesDialog: jest.fn(),
        showMissingDialog: false,
        setShowMissingDialog: jest.fn(),
        selectedVariable: null,
        selectedVariableType: 'NUMERIC',
        handleTypeChange: jest.fn(),
        handleValuesChange: jest.fn(),
        handleMissingChange: jest.fn(),
        ...overrides,
    });
};

describe('VariableTable Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupMocks();
    });

    it('should render the HotTable and all dialogs', () => {
        render(<VariableTable />);
        expect(screen.getByTestId('hot-table')).toBeInTheDocument();
        expect(screen.getByTestId('variable-type-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('value-labels-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('missing-values-dialog')).toBeInTheDocument();
    });

    it('should render correctly even with complex variable state', () => {
        const mockVariables = [
            createMockVariable(0, 'NUMERIC', 'scale'),
            createMockVariable(1, 'STRING', 'nominal'),
            createMockVariable(2, 'DATE', 'scale'),
        ];
        setupMocks({ variables: mockVariables });

        // This test mainly confirms that the component does not crash when provided
        // with a typical 'variables' state, as the logic for dynamicCellsConfig
        // depends on it. Direct testing of the callback is better suited for the hook test.
        render(<VariableTable />);
        expect(screen.getByTestId('hot-table')).toBeInTheDocument();
    });
    
    it('should pass correct `open` prop to dialogs and update them correctly', () => {
        // Initial render with all dialogs closed
        const { rerender } = render(<VariableTable />);
        expect(screen.getByTestId('variable-type-dialog')).toHaveAttribute('data-open', 'false');
        expect(screen.getByTestId('value-labels-dialog')).toHaveAttribute('data-open', 'false');
        expect(screen.getByTestId('missing-values-dialog')).toHaveAttribute('data-open', 'false');

        // Open Type dialog
        setupMocks({ showTypeDialog: true });
        rerender(<VariableTable />);
        expect(screen.getByTestId('variable-type-dialog')).toHaveAttribute('data-open', 'true');
        expect(screen.getByTestId('value-labels-dialog')).toHaveAttribute('data-open', 'false');

        // Open Values dialog
        setupMocks({ showTypeDialog: false, showValuesDialog: true });
        rerender(<VariableTable />);
        expect(screen.getByTestId('variable-type-dialog')).toHaveAttribute('data-open', 'false');
        expect(screen.getByTestId('value-labels-dialog')).toHaveAttribute('data-open', 'true');

        // Open Missing dialog
        setupMocks({ showValuesDialog: false, showMissingDialog: true });
        rerender(<VariableTable />);
        expect(screen.getByTestId('value-labels-dialog')).toHaveAttribute('data-open', 'false');
        expect(screen.getByTestId('missing-values-dialog')).toHaveAttribute('data-open', 'true');
    });
}); 