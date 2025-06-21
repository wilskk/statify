import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component we want to test
import SelectCases from '../index'; // Assuming the main export is what we want

// Mock the custom hook used by the component
jest.mock('../hooks/useSelectCases', () => ({
  useSelectCases: () => ({
    storeVariables: [
      { columnIndex: 1, name: 'Var1', label: 'Variable 1', type: 'Numeric' },
      { columnIndex: 2, name: 'Var2', label: 'Variable 2', type: 'String' },
    ],
    highlightedVariable: null,
    selectOption: 'all',
    filterVariable: null,
    outputOption: 'filter',
    currentStatus: 'Unfiltered. All cases are currently included.',
    errorMessage: '',
    errorDialogOpen: false,
    ifConditionDialogOpen: false,
    randomSampleDialogOpen: false,
    rangeDialogOpen: false,
    conditionExpression: '',
    randomSampleConfig: null,
    rangeConfig: null,
    isProcessing: false,
    setErrorDialogOpen: jest.fn(),
    setIfConditionDialogOpen: jest.fn(),
    setRandomSampleDialogOpen: jest.fn(),
    setRangeDialogOpen: jest.fn(),
    handleVariableSelect: jest.fn(),
    handleVariableDoubleClick: jest.fn(),
    handleTransferClick: jest.fn(),
    handleIfButtonClick: jest.fn(),
    handleSampleButtonClick: jest.fn(),
    handleRangeButtonClick: jest.fn(),
    handleIfConditionContinue: jest.fn(),
    handleRandomSampleContinue: jest.fn(),
    handleRangeContinue: jest.fn(),
    handleConfirm: jest.fn(),
    handleReset: jest.fn(),
    setOutputOption: jest.fn(),
    setSelectOption: jest.fn(),
  }),
}));

// Mock child components to simplify testing
jest.mock('../dialogs/SelectCasesIfCondition', () => () => <div>SelectCasesIfCondition</div>);
jest.mock('../dialogs/SelectCasesRandomSample', () => () => <div>SelectCasesRandomSample</div>);
jest.mock('../dialogs/SelectCasesRange', () => () => <div>SelectCasesRange</div>);


describe('SelectCases Component', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders the component in dialog mode correctly', () => {
    render(<SelectCases onClose={onCloseMock} containerType="dialog" />);

    // Check for main labels
    expect(screen.getByText('Variables:')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();

    // Check if variables are rendered
    expect(screen.getByText('Variable 1')).toBeInTheDocument();
    expect(screen.getByText('Variable 2')).toBeInTheDocument();
  });

  it('renders the component in sidebar mode correctly', () => {
    render(<SelectCases onClose={onCloseMock} containerType="sidebar" />);

    // Check for main labels
    expect(screen.getByText('Variables:')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    
    // In sidebar mode, there are no dialog buttons like OK/Cancel in the main component
    // so we don't test for them here.
  });

  it('handles radio button changes for select options', () => {
    const { useSelectCases: useSelectCasesMock } = require('../hooks/useSelectCases');
    const setSelectOptionMock = jest.fn();
    (useSelectCasesMock as jest.Mock).mockReturnValueOnce({
        ...jest.requireActual('../hooks/useSelectCases').useSelectCases(), // use default mock values
        setSelectOption: setSelectOptionMock,
    });

    render(<SelectCases onClose={onCloseMock} />);

    const conditionRadio = screen.getByLabelText('If condition is satisfied');
    fireEvent.click(conditionRadio);

    expect(setSelectOptionMock).toHaveBeenCalledWith('condition');
  });

});
