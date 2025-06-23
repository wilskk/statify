import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SortVariablesModal from '../index';
import { useSortVariables } from '../hooks/useSortVariables';
import { SortVarsUIProps } from '../types';

// Mock the hook
jest.mock('../hooks/useSortVariables');
const mockedUseSortVariables = useSortVariables as jest.Mock;

const mockHandleOk = jest.fn();
const mockHandleReset = jest.fn();
const mockHandleSelectColumn = jest.fn();
const mockSetSortOrder = jest.fn();
const mockOnClose = jest.fn();

const mockHookValues: Omit<SortVarsUIProps, 'onClose' | 'containerType'> = {
  columns: ['Name', 'Type', 'Label'],
  selectedColumn: null,
  sortOrder: 'asc',
  handleOk: mockHandleOk,
  handleReset: mockHandleReset,
  handleSelectColumn: mockHandleSelectColumn,
  setSortOrder: mockSetSortOrder,
};

const renderComponent = (props: Partial<SortVarsUIProps> = {}) => {
  mockedUseSortVariables.mockReturnValue({
    ...mockHookValues,
    ...props,
  });

  render(<SortVariablesModal onClose={mockOnClose} />);
};

describe('SortVariablesModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with initial state from the hook', () => {
    renderComponent();
    expect(screen.getByText('Sort Variables')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /ascending/i })).toBeChecked();
  });

  it('calls handleSelectColumn when a column item is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nameColumn = screen.getByText('Name');
    await user.click(nameColumn);

    expect(mockHandleSelectColumn).toHaveBeenCalledWith('Name');
  });

  it('calls setSortOrder when a radio button is changed', async () => {
    const user = userEvent.setup();
    renderComponent();

    const descendingRadio = screen.getByRole('radio', { name: /descending/i });
    await user.click(descendingRadio);
    
    // In the UI, the onChange handler receives the 'value' of the radio input
    expect(mockSetSortOrder).toHaveBeenCalledWith('desc');
  });

  it('calls handleOk when the OK button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const okButton = screen.getByRole('button', { name: /ok/i });
    await user.click(okButton);

    expect(mockHandleOk).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls handleReset when the Reset button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    expect(mockHandleReset).toHaveBeenCalledTimes(1);
  });
}); 