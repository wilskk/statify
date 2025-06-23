import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { GoToContent } from '../components/GoToContent';
import { useGoToForm } from '../hooks/useGoToForm';
import { GoToMode } from '../types';

// Mock the hook
jest.mock('../hooks/useGoToForm');
const mockedUseGoToForm = useGoToForm as jest.Mock;

describe('GoToContent', () => {
    const mockHandleGo = jest.fn();
    const mockHandleClose = jest.fn();
    const mockHandleCaseNumberChange = jest.fn();
    const mockHandleSelectedVariableChange = jest.fn();
    const mockSetActiveTab = jest.fn();

    const baseMockValues = {
        activeTab: GoToMode.CASE,
        setActiveTab: mockSetActiveTab,
        caseNumberInput: '',
        handleCaseNumberChange: mockHandleCaseNumberChange,
        caseError: null as string | null,
        variableNames: ['Var1', 'Var2'],
        selectedVariableName: '',
        handleSelectedVariableChange: mockHandleSelectedVariableChange,
        variableError: null as string | null,
        totalCases: 100,
        handleGo: mockHandleGo,
        handleClose: mockHandleClose,
        lastNavigationSuccess: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseGoToForm.mockReturnValue(baseMockValues);
    });
    
    const renderComponent = (props: Partial<typeof baseMockValues> = {}) => {
        return render(<GoToContent onClose={jest.fn()} {...props} />);
    };

    it('renders correctly in "Case" mode by default', () => {
        renderComponent();
        expect(screen.getByLabelText(/go to case number/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    });

    it('switches to "Variable" mode and displays variable selector', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByRole('tab', { name: 'Variable' }));
        expect(mockSetActiveTab).toHaveBeenCalledWith(GoToMode.VARIABLE);
    });

    it('calls handleCaseNumberChange on input change', async () => {
        const user = userEvent.setup();
        renderComponent();

        const input = screen.getByLabelText(/go to case number/i);
        await user.type(input, '12');
        expect(mockHandleCaseNumberChange).toHaveBeenCalledWith('12');
    });

    it('calls handleSelectedVariableChange on select change', async () => {
        const user = userEvent.setup();
        // Render in variable mode to show the select dropdown
        renderComponent({ activeTab: GoToMode.VARIABLE });

        const selectTrigger = screen.getByRole('combobox');
        await user.click(selectTrigger);
        
        const option = await screen.findByText('Var1');
        await user.click(option);

        expect(mockHandleSelectedVariableChange).toHaveBeenCalledWith('Var1');
    });

    it('calls handleGo and handleClose on button clicks', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByRole('button', { name: 'Go' }));
        expect(mockHandleGo).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(mockHandleClose).toHaveBeenCalledTimes(1);
    });

    it('disables the "Go" button when case input is empty or has an error', () => {
        // Case 1: Empty input
        renderComponent({ caseNumberInput: '' });
        expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();

        // Case 2: Input has an error
        renderComponent({ caseNumberInput: 'abc', caseError: 'Invalid number' });
        expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
    });
    
    it('disables the "Go" button when no variable is selected or has an error', () => {
        // Case 1: No variable selected yet
        renderComponent({ activeTab: GoToMode.VARIABLE, selectedVariableName: '' });
        expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();

        // Case 2: An error is present (even with a selection)
        renderComponent({ 
            activeTab: GoToMode.VARIABLE, 
            selectedVariableName: 'Var1',
            variableError: 'Some error' 
        });
        expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
    });
}); 