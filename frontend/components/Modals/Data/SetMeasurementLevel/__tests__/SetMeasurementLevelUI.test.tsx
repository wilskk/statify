import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetMeasurementLevelUI } from '../SetMeasurementLevelUI';
import { SetMeasurementLevelUIProps } from '../types';

jest.mock('@/components/Common/VariableListManager', () => ({
    __esModule: true,
    default: ({ availableVariables, targetLists }: any) => (
        <div>
            <h2>Available</h2>
            <ul>{availableVariables.map((v: any) => <li key={v.tempId}>{v.name}</li>)}</ul>
            {targetLists.map((list: any) => (
                <div key={list.id}>
                    <h2>{list.title}</h2>
                    <ul>{list.variables.map((v: any) => <li key={v.tempId}>{v.name}</li>)}</ul>
                </div>
            ))}
        </div>
    ),
}));

const mockProps: SetMeasurementLevelUIProps = {
    onClose: jest.fn(),
    handleSave: jest.fn(),
    handleReset: jest.fn(),
    handleMoveVariable: jest.fn(),
    handleReorderVariable: jest.fn(),
    setHighlightedVariable: jest.fn(),
    unknownVariables: [{ tempId: '1', name: 'Var1' } as any],
    nominalVariables: [{ tempId: '2', name: 'Var2' } as any],
    ordinalVariables: [],
    scaleVariables: [],
    highlightedVariable: null,
    containerType: 'dialog',
};

describe('SetMeasurementLevelUI Component', () => {
    it('renders correctly and displays variables in their lists', () => {
        render(<SetMeasurementLevelUI {...mockProps} />);

        expect(screen.getByText('Set Measurement Level')).toBeInTheDocument();
        expect(screen.getByText('Var1')).toBeInTheDocument(); // In available
        expect(screen.getByText('Var2')).toBeInTheDocument(); // In nominal
    });

    it('calls onClose when Cancel button is clicked', async () => {
        render(<SetMeasurementLevelUI {...mockProps} />);
        const user = userEvent.setup();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls handleSave when OK button is clicked', async () => {
        render(<SetMeasurementLevelUI {...mockProps} />);
        const user = userEvent.setup();

        const okButton = screen.getByRole('button', { name: /ok/i });
        await user.click(okButton);

        expect(mockProps.handleSave).toHaveBeenCalledTimes(1);
    });
}); 