import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportClipboardConfigurationStep } from '../components/ImportClipboardConfigurationStep';
import { useImportClipboardProcessor } from '../hooks/useImportClipboardProcessor';

// Mock dependencies
jest.mock('../hooks/useImportClipboardProcessor');
const mockedUseImportClipboardProcessor = useImportClipboardProcessor as jest.Mock;

jest.mock('@handsontable/react-wrapper', () => ({
  HotTable: React.forwardRef((props: any, ref: any) => {
    // Mock the ref with a dummy hotInstance and updateSettings method
    if (ref) {
      ref.current = {
        hotInstance: {
          updateSettings: jest.fn(),
        },
      };
    }
    return <div>Mocked HotTable</div>;
  }),
}));

describe('ImportClipboardConfigurationStep Component', () => {
  const mockOnClose = jest.fn();
  const mockOnBack = jest.fn();
  const mockProcessClipboardData = jest.fn();
  const mockExcelStyleTextToColumns = jest.fn();

  const defaultPastedText = 'col1,col2\nval1,val2';
  const initialParsedData = [['col1', 'col2'], ['val1', 'val2']];
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseImportClipboardProcessor.mockReturnValue({
      processClipboardData: mockProcessClipboardData,
      excelStyleTextToColumns: mockExcelStyleTextToColumns.mockReturnValue(initialParsedData),
    });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onClose: mockOnClose,
      onBack: mockOnBack,
      pastedText: defaultPastedText,
      parsedData: initialParsedData,
      ...props
    };
    return render(<ImportClipboardConfigurationStep {...defaultProps} />);
  }

  it('renders correctly and shows initial preview', () => {
    renderComponent();
    expect(screen.getByText('Configure Clipboard Import')).toBeInTheDocument();
    expect(screen.getByText('Mocked HotTable')).toBeInTheDocument();
    expect(mockExcelStyleTextToColumns).toHaveBeenCalledTimes(1);
  });
  
  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls processClipboardData when import button is clicked', async () => {
    const user = userEvent.setup();
    mockProcessClipboardData.mockResolvedValue({}); // mock successful import
    renderComponent();
    const importButton = screen.getByRole('button', { name: /import/i });
    await user.click(importButton);

    expect(mockProcessClipboardData).toHaveBeenCalledTimes(1);
    // You could also assert the options passed to processClipboardData
    expect(mockProcessClipboardData).toHaveBeenCalledWith(
        defaultPastedText,
        expect.objectContaining({
            firstRowAsHeader: false, // Initial state
            delimiter: 'tab'
        })
    );
    // Check that onClose is called on success
    await screen.findByText('Mocked HotTable'); // wait for state update cycle
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('updates preview when options change', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Initial call
    expect(mockExcelStyleTextToColumns).toHaveBeenCalledTimes(1);

    const headerCheckbox = screen.getByLabelText(/first row as headers/i);
    await user.click(headerCheckbox);
    
    // Called again on option change
    expect(mockExcelStyleTextToColumns).toHaveBeenCalledTimes(2);
    expect(mockExcelStyleTextToColumns).toHaveBeenLastCalledWith(
      defaultPastedText,
      expect.objectContaining({ hasHeaderRow: true })
    );
  });
  
  it('displays error message on failed import', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Import failed!';
    mockProcessClipboardData.mockRejectedValue(new Error(errorMessage));
    renderComponent();

    const importButton = screen.getByRole('button', { name: /import/i });
    await user.click(importButton);
    
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
}); 