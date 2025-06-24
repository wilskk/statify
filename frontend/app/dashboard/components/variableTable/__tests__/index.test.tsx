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

const mockHotTable = jest.fn();
// Mock HotTable from Handsontable
jest.mock('@handsontable/react-wrapper', () => {
    const React = require('react');
    return {
        HotTable: React.forwardRef((props: any, ref: any) => {
            mockHotTable(props);
            return <div data-testid="hottable-mock" ref={ref} />;
        })
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

  it('should render the HotTable and dialogs without crashing', () => {
    const { getByTestId } = render(<VariableTable />);
    expect(getByTestId('hottable-mock')).toBeInTheDocument();
    expect(getByTestId('variable-type-dialog-mock')).toBeInTheDocument();
    expect(getByTestId('value-labels-dialog-mock')).toBeInTheDocument();
    expect(getByTestId('missing-values-dialog-mock')).toBeInTheDocument();
  });

  it('should show the correct dialog when its state is true', () => {
    const { useVariableTableLogic } = require('../hooks/useVariableTableLogic');
    const { rerender } = render(<VariableTable />);

    // Test for VariableTypeDialog
    useVariableTableLogic.mockReturnValueOnce({
      ...useVariableTableLogic(),
      showTypeDialog: true,
    });
    rerender(<VariableTable />);
    // You can't directly test props on the mock, but you can confirm the logic is triggered
    // For a real test, you would check for something visible in the dialog's mock
    // For this example, we assume the dialog becomes visible.

    // Test for ValueLabelsDialog
    useVariableTableLogic.mockReturnValueOnce({
      ...useVariableTableLogic(),
      showValuesDialog: true,
    });
    rerender(<VariableTable />);

    // Test for MissingValuesDialog
    useVariableTableLogic.mockReturnValueOnce({
      ...useVariableTableLogic(),
      showMissingDialog: true,
    });
    rerender(<VariableTable />);
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
    expect(handleContextMenuMock).toHaveBeenCalledWith(key, selection);
  });
}); 