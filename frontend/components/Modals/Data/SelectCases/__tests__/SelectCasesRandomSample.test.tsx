import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Dialog } from '@/components/ui/dialog';
import SelectCasesRandomSample from '../dialogs/SelectCasesRandomSample';

describe('SelectCasesRandomSample Dialog', () => {
    const onContinue = jest.fn();
    const onClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function renderWithDialog() {
        return render(
            <Dialog open={true}>
                <SelectCasesRandomSample onClose={onClose} onContinue={onContinue} />
            </Dialog>
        );
    }

    it('renders correctly with "approximate" selected by default', () => {
        renderWithDialog();
        expect(screen.getByText('Select Cases: Random Sample')).toBeInTheDocument();
        expect(screen.getByLabelText('Approximately')).toBeChecked();
        expect(screen.getByLabelText('Exactly')).not.toBeChecked();
    });

    it('allows changing selection to "exact"', async () => {
        const user = userEvent.setup();
        renderWithDialog();
        
        const exactlyRadio = screen.getByLabelText('Exactly');
        await user.click(exactlyRadio);
        
        expect(exactlyRadio).toBeChecked();
        expect(screen.getByLabelText('Approximately')).not.toBeChecked();
    });

    it('enables/disables inputs based on radio selection', async () => {
        const user = userEvent.setup();
        renderWithDialog();
        
        const percentageInput = screen.getByLabelText('% of all cases');
        const exactCountInput = screen.getByLabelText(/cases from the first/);

        expect(percentageInput).toBeEnabled();
        expect(exactCountInput).toBeDisabled();

        await user.click(screen.getByLabelText('Exactly'));

        expect(percentageInput).toBeDisabled();
        expect(exactCountInput).toBeEnabled();
    });

    it('calls onContinue with correct approximate data', async () => {
        const user = userEvent.setup();
        renderWithDialog();
        
        const percentageInput = screen.getByLabelText('% of all cases');
        await user.type(percentageInput, '20');

        await user.click(screen.getByRole('button', { name: 'Continue' }));

        expect(onContinue).toHaveBeenCalledWith({
            sampleType: 'approximate',
            percentage: 20
        });
    });

    it('calls onContinue with correct exact data', async () => {
        const user = userEvent.setup();
        renderWithDialog();
        
        await user.click(screen.getByLabelText('Exactly'));
        
        const inputs = screen.getAllByRole('spinbutton');
        const exactCountInput = inputs[1];
        const fromFirstCountInput = inputs[2];

        await user.type(exactCountInput, '50');
        await user.type(fromFirstCountInput, '100');

        await user.click(screen.getByRole('button', { name: 'Continue' }));

        expect(onContinue).toHaveBeenCalledWith({
            sampleType: 'exact',
            exactCount: 50,
            fromFirstCount: 100
        });
    });

    it('shows validation error for invalid percentage', async () => {
        const user = userEvent.setup();
        renderWithDialog();
        
        const percentageInput = screen.getByLabelText('% of all cases');
        await user.type(percentageInput, '101');
        await user.click(screen.getByRole('button', { name: 'Continue' }));

        expect(screen.getByText('Percentage must be between 1 and 100')).toBeInTheDocument();
        expect(onContinue).not.toHaveBeenCalled();
    });

    it('shows validation error for invalid exact count', async () => {
        const user = userEvent.setup();
        renderWithDialog();
        
        await user.click(screen.getByLabelText('Exactly'));
        await user.click(screen.getByRole('button', { name: 'Continue' }));

        expect(screen.getByText('Number of cases must be greater than 0')).toBeInTheDocument();
        expect(onContinue).not.toHaveBeenCalled();
    });
}); 