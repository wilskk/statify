import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeightCasesModal from '../index';
import { useWeightCases } from '../hooks/useWeightCases';
import { Variable } from '@/types/Variable';

// Mock the hook
jest.mock('../hooks/useWeightCases');
const mockedUseWeightCases = useWeightCases as jest.Mock;

describe('WeightCasesModal', () => {
    const mockHandleSave = jest.fn();
    const mockHandleReset = jest.fn();
    const mockOnClose = jest.fn();
    const mockSetHighlightedVariable = jest.fn();
    const mockHandleMoveVariable = jest.fn();
    const mockHandleReorderVariable = jest.fn();
    const mockSetErrorDialogOpen = jest.fn();

    const mockAvailableVariables: Variable[] = [
        { name: 'var1', type: 'NUMERIC', columnIndex: 0, tempId: '1' },
        { name: 'var3', type: 'NUMERIC', columnIndex: 2, tempId: '3' },
    ];
    
    const baseMockReturn = {
        availableVariables: mockAvailableVariables,
        frequencyVariables: [],
        highlightedVariable: null,
        setHighlightedVariable: mockSetHighlightedVariable,
        errorMessage: null,
        errorDialogOpen: false,
        setErrorDialogOpen: mockSetErrorDialogOpen,
        weightMethod: 'none',
        handleMoveVariable: mockHandleMoveVariable,
        handleReorderVariable: mockHandleReorderVariable,
        handleSave: mockHandleSave,
        handleReset: mockHandleReset,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseWeightCases.mockReturnValue(baseMockReturn);
    });

    it('should render the modal with initial state', () => {
        render(<WeightCasesModal onClose={mockOnClose} />);

        expect(screen.getByText('Weight Cases')).toBeInTheDocument();
        expect(screen.getByText('var1')).toBeInTheDocument();
        expect(screen.getByText('var3')).toBeInTheDocument();
        expect(screen.getByText('Current Status:')).toBeInTheDocument();
        expect(screen.getByText('Do not weight cases')).toBeInTheDocument();
    });

    it('should call handleSave when OK button is clicked', async () => {
        render(<WeightCasesModal onClose={mockOnClose} />);
        const user = userEvent.setup();
        
        const okButton = screen.getByRole('button', { name: /ok/i });
        await user.click(okButton);

        expect(mockHandleSave).toHaveBeenCalledTimes(1);
    });

    it('should call handleReset when Reset button is clicked', async () => {
        render(<WeightCasesModal onClose={mockOnClose} />);
        const user = userEvent.setup();

        const resetButton = screen.getByRole('button', { name: /reset/i });
        await user.click(resetButton);

        expect(mockHandleReset).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', async () => {
        render(<WeightCasesModal onClose={mockOnClose} />);
        const user = userEvent.setup();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display the current weight status when a variable is selected', () => {
        mockedUseWeightCases.mockReturnValue({
            ...baseMockReturn,
            frequencyVariables: [{ name: 'var1', type: 'NUMERIC', columnIndex: 0, tempId: '1' }],
            weightMethod: 'byVariable',
        });
        render(<WeightCasesModal onClose={mockOnClose} />);

        expect(screen.getByText(/Weight cases by: var1/)).toBeInTheDocument();
    });
}); 