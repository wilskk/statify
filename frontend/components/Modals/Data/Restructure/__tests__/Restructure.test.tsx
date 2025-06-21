import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RestructureDataWizard from '../index';
import { useRestructure, UseRestructureReturn, RestructureMethod } from '../hooks/useRestructure';
import { Variable } from '@/types/Variable';

jest.mock('../hooks/useRestructure');

const mockedUseRestructure = useRestructure as jest.Mock;

const mockHookValues: UseRestructureReturn = {
    currentStep: 1,
    activeTab: 'type',
    method: RestructureMethod.VariablesToCases,
    availableVariables: [{ id: 1, name: 'var1', tempId: '1', columnIndex: 0 } as Variable],
    selectedVariables: [],
    indexVariables: [],
    identifierVariables: [],
    highlightedVariable: null,
    createCount: false,
    createIndex: true,
    dropEmptyVariables: false,
    validationErrors: [],
    setCurrentStep: jest.fn(),
    setActiveTab: jest.fn(),
    setMethod: jest.fn(),
    setHighlightedVariable: jest.fn(),
    setCreateCount: jest.fn(),
    setCreateIndex: jest.fn(),
    setDropEmptyVariables: jest.fn(),
    handleNext: jest.fn(),
    handleBack: jest.fn(),
    handleFinish: jest.fn(),
    handleMoveVariable: jest.fn(),
    handleReorderVariable: jest.fn(),
    validateCurrentStep: jest.fn(),
    prepareVariablesWithTempId: jest.fn(),
};

describe('RestructureDataWizard', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Provide a default mock implementation
        mockedUseRestructure.mockReturnValue(mockHookValues);
    });

    it('should render the first step and allow method selection', async () => {
        render(<RestructureDataWizard onClose={jest.fn()} />);

        expect(screen.getByText('Select Restructure Method')).toBeInTheDocument();
        
        // Check if the default method is selected
        const variablesToCasesRadio = screen.getByText('Variables to Cases').parentElement?.parentElement?.querySelector('input[type="radio"]');
        expect(variablesToCasesRadio).toBeChecked();

        // Simulate user clicking on another method
        const casesToVariablesOption = screen.getByText('Cases to Variables');
        await userEvent.click(casesToVariablesOption);
        
        // Verify that the setMethod function was called
        expect(mockHookValues.setMethod).toHaveBeenCalledWith(RestructureMethod.CasesToVariables);
    });

    it('should call handleNext when the "Next" button is clicked', async () => {
        render(<RestructureDataWizard onClose={jest.fn()} />);
        
        const nextButton = screen.getByRole('button', { name: /next/i });
        await userEvent.click(nextButton);

        expect(mockHookValues.handleNext).toHaveBeenCalledTimes(1);
    });
    
    it('should show "Finish" button on the last step and call handleFinish', async () => {
        // Mock the hook to be on the last step
        mockedUseRestructure.mockReturnValue({
            ...mockHookValues,
            currentStep: 3,
            activeTab: 'options',
        });

        render(<RestructureDataWizard onClose={jest.fn()} />);
        
        const finishButton = screen.getByRole('button', { name: /finish/i });
        expect(finishButton).toBeInTheDocument();
        
        await userEvent.click(finishButton);
        expect(mockHookValues.handleFinish).toHaveBeenCalledTimes(1);
    });

    it('should display validation errors when they exist', () => {
        mockedUseRestructure.mockReturnValue({
            ...mockHookValues,
            validationErrors: ['This is a test error.'],
        });

        render(<RestructureDataWizard onClose={jest.fn()} />);
        
        expect(screen.getByText('This is a test error.')).toBeInTheDocument();
    });
}); 