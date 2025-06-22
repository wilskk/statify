import { renderHook, act } from '@testing-library/react';
import { useCrosstabsAnalysis } from '../hooks/useCrosstabsAnalysis';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useResultStore } from '@/stores/useResultStore';
import { CrosstabsAnalysisParams } from '../types';
import type { Variable } from '@/types/Variable';

// Mock stores
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useResultStore');

// Mock Worker
const mockPostMessage = jest.fn();
const mockTerminate = jest.fn();
let workerOnMessage: (event: { data: any }) => void;
let workerOnError: (event: ErrorEvent) => void;

global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: mockPostMessage,
  terminate: mockTerminate,
  set onmessage(fn: (event: { data: any }) => void) {
    workerOnMessage = fn;
  },
  set onerror(fn: (event: ErrorEvent) => void) {
    workerOnError = fn;
  },
}));


// Mock implementations
const mockedUseDataStore = useDataStore as jest.Mock;
const mockedUseVariableStore = useVariableStore as jest.Mock;
const mockedUseResultStore = useResultStore as jest.Mock;

const mockAddLog = jest.fn();
const mockAddAnalytic = jest.fn();
const mockAddStatistic = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
    { name: 'var1', label: 'Variable 1', columnIndex: 0, type: 'Numeric', tempId: '1' },
    { name: 'var2', label: 'Variable 2', columnIndex: 1, type: 'Numeric', tempId: '2' },
];

const mockData = [
    [1, 'A'],
    [2, 'B'],
];

describe('useCrosstabsAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDataStore.mockReturnValue({ data: mockData });
    mockedUseVariableStore.mockReturnValue({ variables: mockVariables });
    mockedUseResultStore.mockReturnValue({
        addLog: mockAddLog,
        addAnalytic: mockAddAnalytic,
        addStatistic: mockAddStatistic,
    });
    mockAddLog.mockResolvedValue('log-123');
    mockAddAnalytic.mockResolvedValue('analytic-123');
  });

  const defaultParams: CrosstabsAnalysisParams = {
    rowVariables: [mockVariables[0]],
    columnVariables: [mockVariables[1]],
    options: {
        cells: { observed: true, expected: false, row: false, column: false, total: false },
    },
  };

  it('should not run analysis if row or column variables are empty', async () => {
    const params: CrosstabsAnalysisParams = { ...defaultParams, rowVariables: [] };
    const { result } = renderHook(() => useCrosstabsAnalysis(params, mockOnClose));

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should run analysis and process successful worker response', async () => {
    const { result } = renderHook(() => useCrosstabsAnalysis(defaultParams, mockOnClose));

    // Initial state
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.error).toBe(null);

    let runPromise: Promise<void>;
    act(() => {
      runPromise = result.current.runAnalysis();
    });
    
    // State during calculation
    expect(result.current.isCalculating).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith({
        analysisType: 'crosstabs',
        variable: { row: mockVariables[0], col: mockVariables[1] },
        data: [{ var1: 1, var2: 'A' }, { var1: 2, var2: 'B' }],
        weights: null,
        options: defaultParams.options,
    });

    const mockWorkerResult = { 
        status: 'success', 
        results: { 
            summary: { valid: 2, missing: 0, rowCategories: [], colCategories: [], rowTotals: [], colTotals: [], totalCases: 2 }, 
            contingencyTable: [] 
        }, 
        variableName: 'var1 * var2' 
    };

    await act(async () => {
        workerOnMessage({ data: mockWorkerResult });
        await runPromise; // wait for the full analysis process to complete
    });
    
    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalledTimes(2); // Case Processing & Crosstabs table
    expect(mockTerminate).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle worker error', async () => {
    const { result } = renderHook(() => useCrosstabsAnalysis(defaultParams, mockOnClose));

    let runPromise: Promise<void>;
    act(() => {
      runPromise = result.current.runAnalysis();
    });

    const mockWorkerError = {
        status: 'error',
        error: 'Something went wrong',
        variableName: 'var1 * var2'
    };
    
    await act(async () => {
        workerOnMessage({ data: mockWorkerError });
        await runPromise;
    });

    expect(result.current.error).toContain('Something went wrong');
    expect(result.current.isCalculating).toBe(false);
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockTerminate).toHaveBeenCalled();
  });
  
  it('should handle worker instantiation error', async () => {
    const { result } = renderHook(() => useCrosstabsAnalysis(defaultParams, mockOnClose));

    act(() => {
      result.current.runAnalysis();
    });
    
    const errorEvent = new ErrorEvent('error', {
      error: new Error('Failed to load script'),
      message: 'Worker script failed to load'
    });
    
    act(() => {
        workerOnError(errorEvent);
    });

    expect(result.current.error).toContain('Failed to load the analysis worker');
    expect(result.current.isCalculating).toBe(false);
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockTerminate).toHaveBeenCalled();
  });
}); 