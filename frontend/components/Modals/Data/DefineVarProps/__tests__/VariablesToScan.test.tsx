import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesToScan from '../VariablesToScan';
import { useVariablesToScan } from '../hooks/useVariablesToScan';
import { TargetListConfig } from '@/components/Common/VariableListManager';

jest.mock('../hooks/useVariablesToScan');
jest.mock('@/components/Common/VariableListManager', () => {
    return {
        __esModule: true,
        default: jest.fn(() => <div>Mocked VariableListManager</div>),
    };
});


const mockedUseVariablesToScan = useVariablesToScan as jest.Mock;

describe('VariablesToScan', () => {
    const handleContinue = jest.fn();
    const onClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseVariablesToScan.mockReturnValue({
            availableVariables: [],
            targetListsConfig: [{ id: 'toScan', title: 'Variables to Scan:', variables: [], height: '300px', draggableItems: true, droppable: true }] as TargetListConfig[],
            managerHighlightedVariable: null,
            setManagerHighlightedVariable: jest.fn(),
            errorMessage: null,
            errorDialogOpen: false,
            setErrorDialogOpen: jest.fn(),
            limitCases: true,
            setLimitCases: jest.fn(),
            caseLimit: "50",
            setCaseLimit: jest.fn(),
            limitValues: true,
            setLimitValues: jest.fn(),
            valueLimit: "200",
            setValueLimit: jest.fn(),
            handleContinue,
            handleMoveVariable: jest.fn(),
            handleReorderVariable: jest.fn(),
        });
    });

    it('renders the component', () => {
        render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        expect(screen.getByText('Define Variable Properties')).toBeInTheDocument();
        expect(screen.getByText('Mocked VariableListManager')).toBeInTheDocument();
    });

    it('calls handleContinue when the "Continue" button is clicked', async () => {
        const user = userEvent.setup();
        render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        
        const continueButton = screen.getByRole('button', { name: /continue/i });
        await user.click(continueButton);

        expect(handleContinue).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the "Cancel" button is clicked', async () => {
        const user = userEvent.setup();
        render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
}); 