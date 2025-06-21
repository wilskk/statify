import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Aggregate from '..';
import { useAggregateData } from '../hooks/useAggregateData';

// Mock the hook
jest.mock('../hooks/useAggregateData');
const mockedUseAggregateData = useAggregateData as jest.Mock;

// Mock the useModal hook from the library
jest.mock('@/hooks/useModal', () => ({
    useModal: () => ({
        closeModal: jest.fn(),
    }),
}));

// Mock child dialogs
jest.mock('../dialogs/ErrorDialog', () => ({ ErrorDialog: () => <div data-testid="error-dialog" /> }));
jest.mock('../dialogs/FunctionDialog', () => ({ FunctionDialog: () => <div data-testid="function-dialog" /> }));
jest.mock('../dialogs/NameLabelDialog', () => ({ NameLabelDialog: () => <div data-testid="name-label-dialog" /> }));


const mockHandleConfirm = jest.fn();
const mockHandleReset = jest.fn();
const mockOnClose = jest.fn();

// Simplified Variable type for tests
interface Variable {
    columnIndex: number;
    name: string;
    type: 'STRING' | 'NUMERIC';
    label?: string;
    measure: 'scale' | 'nominal' | 'ordinal';
}

const sampleAvailableVars: Variable[] = [
    { columnIndex: 0, name: 'Var1', type: 'NUMERIC', label: '', measure: 'scale' },
    { columnIndex: 1, name: 'Var2', type: 'STRING', label: 'Variable 2', measure: 'nominal' },
];

describe('Aggregate Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseAggregateData.mockReturnValue({
            // State
            availableVariables: sampleAvailableVars,
            breakVariables: [],
            aggregatedVariables: [],
            activeTab: 'variables',
            highlightedVariable: null,
            addNumberOfCases: false,
            breakName: 'N_BREAK',
            // State Setters
            setActiveTab: jest.fn(),
            setAddNumberOfCases: jest.fn(),
            setBreakName: jest.fn(),
            // Handlers
            handleConfirm: mockHandleConfirm,
            handleReset: mockHandleReset,
            getDisplayName: (v: Variable) => v.label || v.name,
            handleVariableSelect: jest.fn(),
            handleAggregatedVariableSelect: jest.fn(),
            handleVariableDoubleClick: jest.fn(),
            moveToBreak: jest.fn(),
        });
    });

    it('renders the Aggregate modal with title and tabs', () => {
        render(<Aggregate onClose={mockOnClose} />);

        expect(screen.getByText('Aggregate Data')).toBeInTheDocument();
        expect(screen.getByText('Variables')).toBeInTheDocument();
        expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('calls handleConfirm when OK button is clicked', async () => {
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();

        const okButton = screen.getByRole('button', { name: /ok/i });
        await user.click(okButton);

        expect(mockHandleConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', async () => {
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();
        
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls handleReset when Reset button is clicked', async () => {
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();

        const resetButton = screen.getByRole('button', { name: /reset/i });
        await user.click(resetButton);

        expect(mockHandleReset).toHaveBeenCalledTimes(1);
    });

    it('switches tabs when a tab is clicked', async () => {
        const setActiveTab = jest.fn();
        mockedUseAggregateData.mockReturnValue({
            ...mockedUseAggregateData(),
            activeTab: 'variables',
            setActiveTab,
        });

        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();

        const optionsTab = screen.getByText('Options');
        await user.click(optionsTab);

        expect(setActiveTab).toHaveBeenCalledWith('options');
    });

    it('renders available variables and handles double click', async () => {
        const handleVariableDoubleClick = jest.fn();
        mockedUseAggregateData.mockReturnValue({
          ...mockedUseAggregateData(),
          handleVariableDoubleClick,
        });
    
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();
    
        // Find variable by its display name (label or name)
        const variableItem = screen.getByText('Variable 2'); // This is the label for Var2
        expect(variableItem).toBeInTheDocument();
    
        await user.dblClick(variableItem);
    
        expect(handleVariableDoubleClick).toHaveBeenCalledTimes(1);
        // The second argument is the source list, which is 'available'
        expect(handleVariableDoubleClick).toHaveBeenCalledWith(1, 'available');
      });
}); 