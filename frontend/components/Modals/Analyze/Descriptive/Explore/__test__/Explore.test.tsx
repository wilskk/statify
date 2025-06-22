import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Explore from '../index';
import { BaseModalProps } from '@/types/modalTypes';

// Mock hooks and child components
import * as VariableManagement from '../hooks/useVariableManagement';
import * as StatisticsSettings from '../hooks/useStatisticsSettings';
import * as ExploreAnalysis from '../hooks/useExploreAnalysis';
import * as TourGuide from '../hooks/useTourGuide';
import * as DataStore from '@/stores/useDataStore';

jest.mock('../VariablesTab', () => () => <div>VariablesTab</div>);
jest.mock('../StatisticsTab', () => () => <div>StatisticsTab</div>);

// --- Mock Implementations ---
const mockRunAnalysis = jest.fn();
const mockResetVariables = jest.fn();
const mockResetStats = jest.fn();

const setupMocks = (variables = [], error = null, isCalculating = false) => {
  jest.spyOn(VariableManagement, 'useVariableManagement').mockReturnValue({
    dependentVariables: variables,
    factorVariables: [],
    labelVariable: null,
    handleDependentChange: jest.fn(),
    handleFactorChange: jest.fn(),
    handleLabelChange: jest.fn(),
    resetVariableSelections: mockResetVariables,
  });

  jest.spyOn(StatisticsSettings, 'useStatisticsSettings').mockReturnValue({
    statistics: { mean: true },
    handleStatisticChange: jest.fn(),
    resetStatisticsSettings: mockResetStats,
  });

  jest.spyOn(ExploreAnalysis, 'useExploreAnalysis').mockReturnValue({
    runAnalysis: mockRunAnalysis,
    isCalculating: isCalculating,
    error: error,
  });

  jest.spyOn(TourGuide, 'useTourGuide').mockReturnValue({
    tourActive: false, currentStep: 0, tourSteps: [], currentTargetElement: null,
    startTour: jest.fn(), nextStep: jest.fn(), prevStep: jest.fn(), endTour: jest.fn(),
  });

  jest.spyOn(DataStore, 'useDataStore').mockImplementation((selector) => {
    const state = {
        getVariableData: jest.fn().mockResolvedValue({
            variable: { name: 'test', missing: 0, type: 'Scale' },
            data: [1, 2, 3]
        }),
    };
    return selector(state);
  });
};

describe('Explore Component - Enhanced Tests', () => {
  const mockOnClose = jest.fn();
  const defaultProps: BaseModalProps = { onClose: mockOnClose, containerType: 'dialog' };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders correctly and allows tab switching', () => {
    setupMocks();
    render(<Explore {...defaultProps} />);

    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Variables')).toBeInTheDocument();

    // The content of the first tab should be visible
    expect(screen.getByText('VariablesTab')).toBeVisible();

    // Switch to the Statistics tab
    fireEvent.click(screen.getByText('Statistics'));

    // The content of the second tab should be visible
    expect(screen.getByText('StatisticsTab')).toBeVisible();
  });

  it('calls runAnalysis when OK is clicked with valid inputs', async () => {
    setupMocks(['VAR1']); // Simulate one variable is selected
    render(<Explore {...defaultProps} />);

    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    });

    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('shows an error message if OK is clicked with no dependent variables', async () => {
    setupMocks([], 'Please select at least one dependent variable.');
    render(<Explore {...defaultProps} />);

    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    });

    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Please select at least one dependent variable.')).toBeInTheDocument();
  });

  it('calls reset functions when Reset button is clicked', () => {
    setupMocks(['VAR1']);
    render(<Explore {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(mockResetVariables).toHaveBeenCalledTimes(1);
    expect(mockResetStats).toHaveBeenCalledTimes(1);
  });

  it('disables buttons while analysis is calculating', () => {
    setupMocks(['VAR1'], null, true); // isCalculating = true
    render(<Explore {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Processing.../i })).toBeDisabled();
  });
});
