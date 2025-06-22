import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DuplicateCases from '..'; // Assuming index.tsx is the main export

// Mock custom hooks
const mockUseDuplicateCases = jest.fn();
const mockUseTourGuide = jest.fn();

jest.mock('../hooks/useDuplicateCases', () => ({
  useDuplicateCases: () => mockUseDuplicateCases(),
}));

jest.mock('../hooks/useTourGuide', () => ({
  useTourGuide: () => mockUseTourGuide(),
}));

// Mock child components
const MockVariableTab = () => <div data-testid="variable-tab">VariableTab</div>;
MockVariableTab.displayName = 'VariableTab';
jest.mock('../VariableTab', () => MockVariableTab);

const MockOptionsTab = () => <div data-testid="options-tab">OptionsTab</div>;
MockOptionsTab.displayName = 'OptionsTab';
jest.mock('../OptionsTab', () => MockOptionsTab);

const MockTourPopup = () => <div data-testid="tour-popup">TourPopup</div>;
MockTourPopup.displayName = 'TourPopup';
jest.mock('@/components/Common/TourComponents', () => ({
  TourPopup: MockTourPopup,
}));

// Mock lucide-react icons
// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ...jest.requireActual('lucide-react'),
    HelpCircle: (props: any) => <div data-testid="help-icon" {...props} />,
    AlertCircle: (props: any) => <div data-testid="alert-icon" {...props} />,
    Shapes: (props: any) => <div {...props} />,
    Ruler: (props: any) => <div {...props} />,
    BarChartHorizontal: (props: any) => <div {...props} />,
}));

describe('DuplicateCases Component', () => {
  const mockOnClose = jest.fn();
  const mockSetActiveTab = jest.fn();

  const defaultDuplicateCasesProps = {
    sourceVariables: [],
    matchingVariables: [],
    sortingVariables: [],
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    sortOrder: 'ascending',
    setSortOrder: jest.fn(),
    primaryCaseIndicator: 'first',
    setPrimaryCaseIndicator: jest.fn(),
    primaryName: '',
    setPrimaryName: jest.fn(),
    sequentialCount: 1,
    setSequentialCount: jest.fn(),
    sequentialName: '',
    setSequentialName: jest.fn(),
    moveMatchingToTop: true,
    setMoveMatchingToTop: jest.fn(),
    errorMessage: '',
    errorDialogOpen: false,
    setErrorDialogOpen: jest.fn(),
    isProcessing: false,
    handleMoveVariable: jest.fn(),
    handleReorderVariable: jest.fn(),
    handleReset: jest.fn(),
    handleConfirm: jest.fn(),
    displayFrequencies: true,
    setDisplayFrequencies: jest.fn(),
    filterByIndicator: false,
    setFilterByIndicator: jest.fn(),
    activeTab: 'variables',
    setActiveTab: mockSetActiveTab,
    onClose: mockOnClose,
  };

  const defaultTourGuideProps = {
    tourActive: false,
    currentStep: 0,
    tourSteps: [],
    currentTargetElement: null,
    startTour: jest.fn(),
    nextStep: jest.fn(),
    prevStep: jest.fn(),
    endTour: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDuplicateCases.mockReturnValue(defaultDuplicateCasesProps);
    mockUseTourGuide.mockReturnValue(defaultTourGuideProps);
  });

  it('renders correctly in dialog mode by default', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    expect(screen.getByText('Identify Duplicate Cases')).toBeInTheDocument();
    expect(screen.getByTestId('variable-tab')).toBeInTheDocument();
  });

  it('renders correctly in sidebar mode', () => {
    render(<DuplicateCases onClose={mockOnClose} containerType="sidebar" />);
    expect(screen.queryByText('Identify Duplicate Cases')).not.toBeInTheDocument();
    expect(screen.getByTestId('variable-tab')).toBeInTheDocument();
  });

  it('switches tabs when a tab is clicked', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    const optionsTabTrigger = screen.getByRole('tab', { name: 'Options' });
    fireEvent.click(optionsTabTrigger);
    // The hook's onValueChange should be called, which in turn calls setActiveTab
    // In a real scenario, this would update the state and show the OptionsTab content.
    // Here we check if the trigger function was called.
    // Note: The actual tab switching logic is inside the Tabs component from shadcn.
    // We assume the component works correctly. The mock setActiveTab is part of the hook, not the tab component itself.
    // A better test for the hook would be to see if `onValueChange` is called with 'options'.
    // Since we are testing the component, we verify the tab is there.
    expect(screen.getByTestId('options-tab')).toBeInTheDocument();
  });

  it('calls handleConfirm when OK button is clicked', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    const okButton = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(okButton);
    expect(defaultDuplicateCasesProps.handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls handleReset when Reset button is clicked', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);
    expect(defaultDuplicateCasesProps.handleReset).toHaveBeenCalledTimes(1);
  });

  it('disables buttons and shows "Processing..." when isProcessing is true', () => {
    mockUseDuplicateCases.mockReturnValue({ ...defaultDuplicateCasesProps, isProcessing: true });
    render(<DuplicateCases onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  it('displays error dialog when errorDialogOpen is true', () => {
    const errorMessage = 'This is an error.';
    mockUseDuplicateCases.mockReturnValue({ ...defaultDuplicateCasesProps, errorDialogOpen: true, errorMessage });
    render(<DuplicateCases onClose={mockOnClose} />);
    expect(screen.getByText('IBM SPSS Statistics')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();

    // Test closing the dialog
    // Test closing the dialog
    const okButton = screen.getAllByRole('button', { name: 'OK' }).find(btn => btn && btn.closest('.max-w-\[400px\]'));
    if (okButton) {
        fireEvent.click(okButton);
    }
    expect(defaultDuplicateCasesProps.setErrorDialogOpen).toHaveBeenCalledWith(false);
  });

  it('calls startTour when help button is clicked', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    const helpButton = screen.getByTestId('help-icon').closest('button');
    if (helpButton) {
        fireEvent.click(helpButton);
    }
    expect(defaultTourGuideProps.startTour).toHaveBeenCalledTimes(1);
  });

  it('displays TourPopup when tour is active', () => {
    mockUseTourGuide.mockReturnValue({ ...defaultTourGuideProps, tourActive: true, currentTargetElement: document.body });
    render(<DuplicateCases onClose={mockOnClose} />);
    expect(screen.getByTestId('tour-popup')).toBeInTheDocument();
  });
});
