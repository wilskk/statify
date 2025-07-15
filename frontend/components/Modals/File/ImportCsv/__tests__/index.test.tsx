import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImportCsv } from '..';
import { useImportCsvFileReader } from '../hooks/useImportCsvFileReader';

// Mock child components
jest.mock('../components/ImportCsvSelection', () => ({
  ImportCsvSelection: jest.fn(({ onFileSelect, onContinue, selectedFile }) => (
    <div>
      <h1>Selection Stage</h1>
      <input 
        type="file" 
        data-testid="file-input" 
        onChange={(e) => onFileSelect(e.target.files ? e.target.files[0] : null)} 
      />
      <button onClick={onContinue} disabled={!selectedFile}>Continue</button>
    </div>
  )),
}));

jest.mock('../components/ImportCsvConfiguration', () => ({
  ImportCsvConfiguration: jest.fn(({ onBack }) => (
    <div>
      <h1>Configuration Stage</h1>
      <button onClick={onBack}>Back</button>
    </div>
  )),
}));

// Mock the custom hook
jest.mock('../hooks/useImportCsvFileReader', () => ({
  useImportCsvFileReader: jest.fn(),
}));

const mockUseImportCsvFileReader = useImportCsvFileReader as jest.Mock;

describe('ImportCsv Component', () => {
  const mockOnClose = jest.fn();
  const mockReadFile = jest.fn();
  const mockResetFileState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseImportCsvFileReader.mockReturnValue({
      fileName: '',
      fileContent: null,
      error: null,
      isLoading: false,
      readFile: mockReadFile,
      resetFileState: mockResetFileState,
    });
  });

  it('should render the selection stage initially', () => {
    render(<ImportCsv onClose={mockOnClose} containerType="dialog" />);
    expect(screen.getByText('Selection Stage')).toBeInTheDocument();
  });

  it('should call readFile and show loading when continuing from selection', () => {
    render(<ImportCsv onClose={mockOnClose} containerType="dialog" />);
    
    const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-input');
    const continueButton = screen.getByRole('button', { name: /Continue/i });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(continueButton);

    expect(mockReadFile).toHaveBeenCalledWith(file);
  });

  it('should transition to configure stage when file is read successfully', () => {
    const { rerender } = render(<ImportCsv onClose={mockOnClose} containerType="dialog" />);

    // 1. Select file and click continue
    const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(mockReadFile).toHaveBeenCalledWith(file);

    // 2. Mock that the hook has finished reading the file
    act(() => {
      mockUseImportCsvFileReader.mockReturnValue({
        fileName: 'test.csv',
        fileContent: 'a,b,c',
        error: null,
        isLoading: false,
        readFile: mockReadFile,
        resetFileState: mockResetFileState,
      });
    });
    
    // We need to re-render to simulate the state update that happens inside the component
    // when the hook's return value changes. In a real app, this happens automatically.
    rerender(<ImportCsv onClose={mockOnClose} containerType="dialog" />);

    expect(screen.getByText('Configuration Stage')).toBeInTheDocument();
  });

  it('should transition back to select stage from configure stage', () => {
    // Start in the configure stage
    mockUseImportCsvFileReader.mockReturnValue({
        fileName: 'test.csv',
        fileContent: 'a,b,c',
        error: null,
        isLoading: false,
        readFile: mockReadFile,
        resetFileState: mockResetFileState,
    });
    const { rerender } = render(<ImportCsv onClose={mockOnClose} containerType="dialog" />);
    act(() => {
      rerender(<ImportCsv onClose={mockOnClose} containerType="dialog" />);
    });
    // Manually set stage to configure for the test setup
    // This is a bit of a workaround because we can't directly set state. 
    // The better way is to simulate the flow that gets it there.
    const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    rerender(<ImportCsv onClose={mockOnClose} containerType="dialog" />);

    // Now we are in configure stage, find and click the back button
    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);

    // After clicking back, we should be in the selection stage again
    expect(screen.getByText('Selection Stage')).toBeInTheDocument();
    expect(mockResetFileState).toHaveBeenCalled();
  });
});
