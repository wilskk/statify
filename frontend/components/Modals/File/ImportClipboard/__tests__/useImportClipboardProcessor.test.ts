import { renderHook, act } from '@testing-library/react';
import { useImportClipboardProcessor } from '../hooks/useImportClipboardProcessor';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import * as utils from '../importClipboard.utils';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('../importClipboard.utils', () => ({
  ...jest.requireActual('../importClipboard.utils'), // Keep actual implementation for some utils
  excelStyleTextToColumns: jest.fn(),
}));

const mockedSetData = jest.fn();
const mockedOverwriteVariables = jest.fn();
const mockedExcelStyleParser = utils.excelStyleTextToColumns as jest.Mock;

(useDataStore as jest.Mock).mockReturnValue({ setData: mockedSetData });
(useVariableStore as jest.Mock).mockReturnValue({ overwriteVariables: mockedOverwriteVariables });


describe('useImportClipboardProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleText = 'ID,Name\n1,Alice\n2,Bob';
  const parsedData = [['ID', 'Name'], ['1', 'Alice'], ['2', 'Bob']];

  it('should process data with header row correctly', async () => {
    mockedExcelStyleParser.mockReturnValue(parsedData);
    const { result } = renderHook(() => useImportClipboardProcessor());

    await act(async () => {
      await result.current.processClipboardData(sampleText, {
        delimiter: 'comma',
        firstRowAsHeader: true,
        trimWhitespace: true,
        skipEmptyRows: true,
        detectDataTypes: true,
      });
    });

    expect(mockedSetData).toHaveBeenCalledWith([['1', 'Alice'], ['2', 'Bob']]);
    expect(mockedOverwriteVariables).toHaveBeenCalledTimes(1);
    
    const createdVariables = mockedOverwriteVariables.mock.calls[0][0];
    expect(createdVariables.length).toBe(2);
    expect(createdVariables[0].name).toBe('ID');
    expect(createdVariables[0].type).toBe('NUMERIC');
    expect(createdVariables[1].name).toBe('Name');
    expect(createdVariables[1].type).toBe('STRING');
  });

  it('should process data without header row correctly', async () => {
    const dataOnly = [['1', 'Alice'], ['2', 'Bob']];
    mockedExcelStyleParser.mockReturnValue(dataOnly);
    const { result } = renderHook(() => useImportClipboardProcessor());

    await act(async () => {
      await result.current.processClipboardData(sampleText, {
        delimiter: 'comma',
        firstRowAsHeader: false,
        trimWhitespace: true,
        skipEmptyRows: true,
        detectDataTypes: true,
      });
    });

    expect(mockedSetData).toHaveBeenCalledWith(dataOnly);
    
    const createdVariables = mockedOverwriteVariables.mock.calls[0][0];
    expect(createdVariables.length).toBe(2);
    expect(createdVariables[0].name).toBe('VAR001');
    expect(createdVariables[1].name).toBe('VAR002');
  });

  it('should throw an error if no text is provided', async () => {
    const { result } = renderHook(() => useImportClipboardProcessor());
    await expect(result.current.processClipboardData('', { delimiter: 'comma', firstRowAsHeader: false, trimWhitespace: true, skipEmptyRows: true, detectDataTypes: true }))
      .rejects.toThrow('No text data provided');
  });

  it('should throw an error if parsing results in empty data', async () => {
    mockedExcelStyleParser.mockReturnValue([]);
    const { result } = renderHook(() => useImportClipboardProcessor());

    await expect(result.current.processClipboardData('some text', { delimiter: 'comma', firstRowAsHeader: false, trimWhitespace: true, skipEmptyRows: true, detectDataTypes: true }))
      .rejects.toThrow('No valid data found in the pasted text');
  });
  
  it('should use pre-processed data if provided', async () => {
    const preProcessedData = [['pre', 'processed'], ['data', 'here']];
    const { result } = renderHook(() => useImportClipboardProcessor());

    await act(async () => {
      await result.current.processClipboardData(sampleText, {
        delimiter: 'comma',
        firstRowAsHeader: true,
        trimWhitespace: true,
        skipEmptyRows: true,
        detectDataTypes: true,
        excelProcessedData: preProcessedData,
      });
    });

    expect(mockedExcelStyleParser).not.toHaveBeenCalled();
    expect(mockedSetData).toHaveBeenCalledWith([['data', 'here']]);
    const createdVariables = mockedOverwriteVariables.mock.calls[0][0];
    expect(createdVariables[0].name).toBe('pre');
    expect(createdVariables[1].name).toBe('processed');
  });
}); 