import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IdentifyUnusualCases from '..';

// Mock child components and hooks
jest.mock('../VariablesTab', () => () => <div>VariablesTabContent</div>);
jest.mock('../OptionsTab', () => () => <div>OptionsTabContent</div>);
jest.mock('../OutputTab', () => () => <div>OutputTabContent</div>);
jest.mock('../SaveTab', () => () => <div>SaveTabContent</div>);
jest.mock('../MissingValuesTab', () => () => <div>MissingValuesTabContent</div>);

jest.mock('../hooks/useUnusualCases', () => ({
  useUnusualCases: () => ({
    variables: [],
    setVariables: jest.fn(),
    caseIdVariable: null,
    setCaseIdVariable: jest.fn(),
    // ... mock other properties and functions from the hook as needed
    handleReset: jest.fn(),
  }),
}));

jest.mock('../hooks/useTourGuide', () => ({
    useTourGuide: () => ({
        tourActive: false,
        currentStep: 0,
        tourSteps: [],
        currentTargetElement: null,
        startTour: jest.fn(),
        nextStep: jest.fn(),
        prevStep: jest.fn(),
        endTour: jest.fn(),
    }),
}));


describe('IdentifyUnusualCases Dialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    render(<IdentifyUnusualCases onClose={mockOnClose} />);
  });

  it('should render the dialog with the correct title', () => {
    expect(screen.getByText('Identify Unusual Cases')).toBeInTheDocument();
  });

  it('should render all the tabs', () => {
    expect(screen.getByText('Variables')).toBeInTheDocument();
    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Missing Values')).toBeInTheDocument();
  });

  it('should show Variables tab content by default', () => {
    expect(screen.getByText('VariablesTabContent')).toBeVisible();
  });

  it('should switch to Options tab when clicked', () => {
    fireEvent.click(screen.getByText('Options'));
    expect(screen.getByText('OptionsTabContent')).toBeVisible();
  });

  it('should call onClose when the Cancel button is clicked', () => {
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call handleConfirm when the OK button is clicked', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    fireEvent.click(screen.getByText('OK'));
    // Check if the placeholder log is called
    expect(consoleSpy).toHaveBeenCalledWith('State to be sent to worker/service:', expect.any(Object));
    expect(mockOnClose).toHaveBeenCalledTimes(1); // OK also closes the dialog
    consoleSpy.mockRestore();
  });
});
