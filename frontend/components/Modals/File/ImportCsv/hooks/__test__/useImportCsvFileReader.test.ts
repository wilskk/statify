import { renderHook, act } from '@testing-library/react';
import { useImportCsvFileReader } from '../useImportCsvFileReader';

// Mock FileReader
const mockFileReader = {
  onload: jest.fn(),
  onerror: jest.fn(),
  readAsText: jest.fn(),
  result: '',
};

global.FileReader = jest.fn(() => mockFileReader) as any;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the mock result for each test
  mockFileReader.result = '';
});

describe('useImportCsvFileReader', () => {
  it('should return the initial state correctly', () => {
    const { result } = renderHook(() => useImportCsvFileReader());

    expect(result.current.fileContent).toBeNull();
    expect(result.current.fileName).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should read a file successfully', () => {
    const { result } = renderHook(() => useImportCsvFileReader());
    const mockFile = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' });
    const fileContent = 'col1,col2\nval1,val2';

    act(() => {
      result.current.readFile(mockFile);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.fileName).toBe('test.csv');
    expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);

    // Simulate successful file read
    act(() => {
      mockFileReader.result = fileContent;
      mockFileReader.onload();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fileContent).toBe(fileContent);
    expect(result.current.error).toBeNull();
  });

  it('should handle file read error', () => {
    const { result } = renderHook(() => useImportCsvFileReader());
    const mockFile = new File([''], 'error.csv', { type: 'text/csv' });

    act(() => {
      result.current.readFile(mockFile);
    });

    expect(result.current.isLoading).toBe(true);

    // Simulate file read error
    act(() => {
      mockFileReader.onerror(new Error('Test error'));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('An error occurred while trying to read the file. Please try again.');
    expect(result.current.fileContent).toBeNull();
    expect(result.current.fileName).toBe('');
  });

  it('should handle empty file content', () => {
    const { result } = renderHook(() => useImportCsvFileReader());
    const mockFile = new File([''], 'empty.csv', { type: 'text/csv' });

    act(() => {
      result.current.readFile(mockFile);
    });

    // Simulate successful read but with empty content
    act(() => {
      mockFileReader.result = '';
      mockFileReader.onload();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('The selected file is empty or could not be read.');
    expect(result.current.fileContent).toBeNull();
    expect(result.current.fileName).toBe('');
  });

  it('should reset the state', () => {
    const { result } = renderHook(() => useImportCsvFileReader());
    const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' });

    // First, read a file to change the state
    act(() => {
      result.current.readFile(mockFile);
      mockFileReader.result = 'content';
      mockFileReader.onload();
    });

    expect(result.current.fileContent).toBe('content');

    // Now, reset the state
    act(() => {
      result.current.resetFileState();
    });

    expect(result.current.fileContent).toBeNull();
    expect(result.current.fileName).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
