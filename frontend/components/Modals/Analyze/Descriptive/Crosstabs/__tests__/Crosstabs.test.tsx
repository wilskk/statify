import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Crosstabs from '../index';
import { useCrosstabsAnalysis } from '../hooks/useCrosstabsAnalysis';
import { useTourGuide } from '../hooks/useTourGuide';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

// Mock hooks and stores
jest.mock('../hooks/useCrosstabsAnalysis');
jest.mock('../hooks/useTourGuide');
jest.mock('@/stores/useVariableStore');

const mockedUseCrosstabsAnalysis = useCrosstabsAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;
const mockedUseVariableStore = useVariableStore as jest.Mock;

const mockRunAnalysis = jest.fn();
const mockStartTour = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
  { name: 'gender', label: 'Gender', columnIndex: 1, type: 'Nominal', tempId: 'v1' },
  { name: 'educ', label: 'Education Level', columnIndex: 2, type: 'Ordinal', tempId: 'v2' },
  { name: 'minority', label: 'Minority Classification', columnIndex: 3, type: 'Nominal', tempId: 'v3' },
];

describe('Crosstabs Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCrosstabsAnalysis.mockReturnValue({
      runAnalysis: mockRunAnalysis,
      isCalculating: false,
      error: null,
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      startTour: mockStartTour,
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
      currentStep: 0,
      tourSteps: [],
      currentTargetElement: null,
    });
    mockedUseVariableStore.mockReturnValue({
      variables: mockVariables,
    });
  });

  const renderComponent = () => {
    return render(<Crosstabs onClose={mockOnClose} containerType="dialog" />);
  };

  it('should render the modal with title and tabs', () => {
    renderComponent();
    expect(screen.getByText('Crosstabs')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Variables' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cells' })).toBeInTheDocument();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    renderComponent();
    const user = userEvent.setup();
    const okButton = screen.getByRole('button', { name: 'OK' });
    
    await user.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    renderComponent();
    const user = userEvent.setup();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should switch to Cells tab when clicked', async () => {
    renderComponent();
    const user = userEvent.setup();
    const cellsTabTrigger = screen.getByRole('tab', { name: 'Cells' });

    expect(cellsTabTrigger).not.toHaveAttribute('data-state', 'active');
    
    await user.click(cellsTabTrigger);
    
    expect(cellsTabTrigger).toHaveAttribute('data-state', 'active');
    expect(screen.getByText('Counts')).toBeInTheDocument();
  });

  it('should display available variables', () => {
    renderComponent();
    for (const variable of mockVariables) {
      expect(screen.getByText(variable.label)).toBeInTheDocument();
    }
  });

  it('should move a variable to Row(s) on double click and Reset should move it back', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const variableLabel = mockVariables[0].label;
    const variableItem = screen.getByText(variableLabel);

    const availableList = screen.getByText('Available Variables').parentElement;
    const rowList = screen.getByText('Row(s)').parentElement;

    expect(within(availableList!).getByText(variableLabel)).toBeInTheDocument();
    expect(within(rowList!).queryByText(variableLabel)).not.toBeInTheDocument();

    await user.doubleClick(variableItem);
    
    expect(within(availableList!).queryByText(variableLabel)).not.toBeInTheDocument();
    expect(within(rowList!).getByText(variableLabel)).toBeInTheDocument();
    
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    await user.click(resetButton);

    expect(within(availableList!).getByText(variableLabel)).toBeInTheDocument();
    expect(within(rowList!).queryByText(variableLabel)).not.toBeInTheDocument();
  });
  
   it('should start the tour when help button is clicked', async () => {
    renderComponent();
    const user = userEvent.setup();
    const helpButton = screen.getByRole('button', { name: /help/i });
    
    await user.click(helpButton);
    
    expect(mockStartTour).toHaveBeenCalledTimes(1);
  });
});
