import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportClipboardPasteStep } from '../components/ImportClipboardPasteStep';
import * as clipboardService from '../services/services';

// Mock the service
jest.mock('../services/services');
const mockedReadTextFromClipboard = clipboardService.readTextFromClipboard as jest.Mock;

describe('ImportClipboardPasteStep Component', () => {
  const mockOnClose = jest.fn();
  const mockOnTextPaste = jest.fn();
  const mockOnContinue = jest.fn();

  const defaultProps = {
    onClose: mockOnClose,
    onTextPaste: mockOnTextPaste,
    onContinue: mockOnContinue,
    isLoading: false,
    error: null,
    pastedText: '',
    isMobile: false,
    isPortrait: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ImportClipboardPasteStep {...defaultProps} />);
    expect(screen.getByText('Import from Clipboard')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your tabular data here...')).toBeInTheDocument();
  });

  it('calls onTextPaste when user types in the textarea', async () => {
    const user = userEvent.setup();
    render(<ImportClipboardPaste-Step {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Paste your tabular data here...');
    await user.type(textarea, 'hello');
    expect(mockOnTextPaste).toHaveBeenCalledWith('hello');
  });

  it('calls onContinue when the continue button is clicked and text is present', async () => {
    const user = userEvent.setup();
    render(<ImportClipboardPasteStep {...defaultProps} pastedText="some data" />);
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);
    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });

  it('disables the continue button when there is no text', () => {
    render(<ImportClipboardPasteStep {...defaultProps} pastedText="" />);
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('calls readTextFromClipboard and onTextPaste when "Paste from Clipboard" button is clicked', async () => {
    const user = userEvent.setup();
    const clipboardText = 'pasted from button';
    mockedReadTextFromClipboard.mockResolvedValue(clipboardText);
    
    render(<ImportClipboardPasteStep {...defaultProps} />);
    const pasteButton = screen.getByRole('button', { name: /paste from clipboard/i });
    await user.click(pasteButton);

    expect(mockedReadTextFromClipboard).toHaveBeenCalledTimes(1);
    expect(mockOnTextPaste).toHaveBeenCalledWith(clipboardText);
  });

  it('displays an error if readTextFromClipboard fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Clipboard access denied.';
    mockedReadTextFromClipboard.mockRejectedValue(new Error(errorMessage));

    render(<ImportClipboardPasteStep {...defaultProps} />);
    const pasteButton = screen.getByRole('button', { name: /paste from clipboard/i });
    await user.click(pasteButton);
    
    expect(await screen.findByText(/Clipboard access denied/)).toBeInTheDocument();
  });

  it('displays a general error message from props', () => {
    const generalError = 'Something went wrong.';
    render(<ImportClipboardPasteStep {...defaultProps} error={generalError} />);
    expect(screen.getByText(generalError)).toBeInTheDocument();
  });
}); 