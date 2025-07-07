import React from 'react';
import { render } from '@testing-library/react';
import VariableTable from '../index';

// Mock child components and hooks
jest.mock('../hooks/useVariableTableLogic', () => ({
  useVariableTableLogic: jest.fn(),
}));

jest.mock('../dialog/VariableTypeDialog', () => ({
  VariableTypeDialog: () => <div data-testid="variable-type-dialog-mock" />,
}));

jest.mock('../dialog/ValueLabelsDialog', () => ({
  ValueLabelsDialog: () => <div data-testid="value-labels-dialog-mock" />,
}));

jest.mock('../dialog/MissingValuesDialog', () => ({
  MissingValuesDialog: () => <div data-testid="missing-values-dialog-mock" />,
}));

// We conditionally render the dialogs, so we have to mock them as if they are always there for some tests.
const renderDialogs = (useLogicResult: any) => {
    return (
        <>
            {useLogicResult.showTypeDialog && <div data-testid="variable-type-dialog-mock" />}
            {useLogicResult.showValuesDialog && <div data-testid="value-labels-dialog-mock" />}
            {useLogicResult.showMissingDialog && <div data-testid="missing-values-dialog-mock" />}
        </>
    )
}

const mockHotTable = jest.fn();
// Mock HotTable from Handsontable
jest.mock('@handsontable/react-wrapper', () => {
    const React = require('react');
    const MockHotTable = React.forwardRef((props: any, ref: any) => {
        mockHotTable(props);
        return <div data-testid="hottable-mock" ref={ref} />;
    });
    MockHotTable.displayName = 'MockHotTable';
    return {
        HotTable: MockHotTable
    };
});

describe('VariableTable Component', () => {
  const { useVariableTableLogic } = require('../hooks/useVariableTableLogic');

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockHotTable.mockClear();

    // Setup default mock implementation for the logic hook
    useVariableTableLogic.mockReturnValue({
      hotTableRef: React.createRef(),
      tableData: [],
      variables: [],
      handleBeforeChange: jest.fn(),
      handleAfterSelectionEnd: jest.fn(),
      handleInsertVariable: jest.fn(),
      handleDeleteVariable: jest.fn(),
      handleCopyVariable: jest.fn(),
      handleContextMenu: jest.fn(),
      showTypeDialog: false,
      setShowTypeDialog: jest.fn(),
      showValuesDialog: false,
      setShowValuesDialog: jest.fn(),
      showMissingDialog: false,
      setShowMissingDialog: jest.fn(),
      selectedVariable: null,
      selectedVariableType: 'NUMERIC',
      handleTypeChange: jest.fn(),
      handleValuesChange: jest.fn(),
      handleMissingChange: jest.fn(),
    });
  });

  it('should render the HotTable without crashing', () => {
    const { getByTestId, queryByTestId } = render(<VariableTable />);
    expect(getByTestId('hottable-mock')).toBeInTheDocument();
    // Dialogs should not be visible by default
    expect(queryByTestId('variable-type-dialog-mock')).not.toBeInTheDocument();
    expect(queryByTestId('value-labels-dialog-mock')).not.toBeInTheDocument();
    expect(queryByTestId('missing-values-dialog-mock')).not.toBeInTheDocument();
  });

  it('should show the correct dialog when its state is true', () => {
    const { useVariableTableLogic } = require('../hooks/useVariableTableLogic');
    
    // Test for VariableTypeDialog
    const logicResultType = {
      ...useVariableTableLogic(),
      showTypeDialog: true,
    };
    useVariableTableLogic.mockReturnValue(logicResultType);
    const { getByTestId, rerender } = render(<VariableTable />);
    expect(getByTestId('variable-type-dialog-mock')).toBeInTheDocument();

    // Test for ValueLabelsDialog
    const logicResultValues = {
      ...useVariableTableLogic(),
      showValuesDialog: true,
    };
    useVariableTableLogic.mockReturnValue(logicResultValues);
    rerender(<VariableTable />);
    expect(getByTestId('value-labels-dialog-mock')).toBeInTheDocument();

    // Test for MissingValuesDialog
    const logicResultMissing = {
      ...useVariableTableLogic(),
      showMissingDialog: true,
    };
    useVariableTableLogic.mockReturnValue(logicResultMissing);
    rerender(<VariableTable />);
    expect(getByTestId('missing-values-dialog-mock')).toBeInTheDocument();
  });

  it('should call handleContextMenu when a context menu action is triggered', () => {
    const handleContextMenuMock = jest.fn();
    const { useVariableTableLogic } = require('../hooks/useVariableTableLogic');

    // Override the default hook return value for this specific test
    useVariableTableLogic.mockReturnValue({
      hotTableRef: React.createRef(),
      tableData: [],
      variables: [],
      handleBeforeChange: jest.fn(),
      handleAfterSelectionEnd: jest.fn(),
      handleInsertVariable: jest.fn(),
      handleDeleteVariable: jest.fn(),
      handleCopyVariable: jest.fn(),
      handleContextMenu: handleContextMenuMock, // Provide the mock handler
      showTypeDialog: false,
      setShowTypeDialog: jest.fn(),
      showValuesDialog: false,
      setShowValuesDialog: jest.fn(),
      showMissingDialog: false,
      setShowMissingDialog: jest.fn(),
      selectedVariable: null,
      selectedVariableType: 'NUMERIC',
      handleTypeChange: jest.fn(),
      handleValuesChange: jest.fn(),
      handleMissingChange: jest.fn(),
    });

    render(<VariableTable />);

    // Get the props passed to our mocked HotTable component
    const hotTableProps = mockHotTable.mock.calls[0][0];

    // Simulate the callback being invoked by Handsontable
    const key = 'insert_variable';
    const selection = [{ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }];
    hotTableProps.contextMenu.callback(key, selection);

    // Assert that our handler was called correctly
    expect(handleContextMenuMock).toHaveBeenCalledTimes(1);
    expect(handleContextMenuMock).toHaveBeenCalledWith(key);
  });
}); 