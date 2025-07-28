import { renderHook, act } from '@testing-library/react';
import { useIndependentSamplesTTestAnalysis } from '../hooks/useIndependentSamplesTTestAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { IndependentSamplesTTestAnalysisProps } from '../types';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');

// Mock Worker
const mockPostMessage = jest.fn();
const mockWorkerTerminate = jest.fn();
let workerOnMessage: (event: { data: any }) => void;
let workerOnError: (event: ErrorEvent) => void;

// A fake Worker instance used by the pooled client
const fakeWorker: any = {
  postMessage: mockPostMessage,
  terminate: mockWorkerTerminate,
  set onmessage(fn: (event: { data: any }) => void) {
    workerOnMessage = fn;
  },
  set onerror(fn: (event: ErrorEvent) => void) {
    workerOnError = fn;
  },
};

// Override global.Worker as fallback
global.Worker = jest.fn().mockImplementation(() => fakeWorker);

// Mock implementations
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedUseAnalysisData = useAnalysisData as unknown as jest.Mock;

// Mock data
const mockAddLog = jest.fn();
const mockAddAnalytic = jest.fn();
const mockAddStatistic = jest.fn();
const mockCheckAndSave = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC',
    tempId: '1',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'var2',
    label: 'Variable 2',
    columnIndex: 1,
    type: 'NUMERIC',
    tempId: '2',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'group',
    label: 'Group',
    columnIndex: 2,
    type: 'NUMERIC',
    tempId: '3',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  }
];

const mockAnalysisData = [
  [10, 20, 1],
  [15, 25, 1],
  [30, 40, 2],
  [35, 45, 2],
];

describe('useIndependentSamplesTTestAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedUseResultStore.mockReturnValue({
      addLog: mockAddLog,
      addAnalytic: mockAddAnalytic,
      addStatistic: mockAddStatistic,
    });
    
    mockedUseAnalysisData.mockReturnValue({
      data: mockAnalysisData,
    });
    
    mockAddLog.mockResolvedValue('log-123');
    mockAddAnalytic.mockResolvedValue('analytic-123');
    mockCheckAndSave.mockResolvedValue(undefined);
  });

  const defaultParams: IndependentSamplesTTestAnalysisProps = {
    testVariables: [mockVariables[0]],
    groupingVariable: mockVariables[2],
    defineGroups: { useSpecifiedValues: true, cutPoint: false },
    group1: 1,
    group2: 2,
    cutPointValue: null,
    estimateEffectSize: false,
    onClose: mockOnClose
  };

  const renderTestHook = (params: Partial<IndependentSamplesTTestAnalysisProps> = {}) => {
    return renderHook(() => useIndependentSamplesTTestAnalysis({ ...defaultParams, ...params }));
  };

  it('should run analysis and process a successful worker response', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(result.current.isCalculating).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    
    // Success response from worker
    const mockWorkerResult = {
      status: 'success',
      variableName: 'var1',
      results: {
        groupStatistics: {
          variable: mockVariables[0],
          group1: {
            label: 'Group 1',
            N: 2,
            Mean: 12.5,
            StdDev: 3.54,
            SEMean: 2.5
          },
          group2: {
            label: 'Group 2',
            N: 2,
            Mean: 32.5,
            StdDev: 3.54,
            SEMean: 2.5
          }
        },
        independentSamplesTest: {
          levene: {
            F: 0,
            Sig: 1
          },
          equalVariances: {
            t: -5.66,
            df: 2,
            sig: 0.03,
            meanDifference: -20,
            stdErrorDifference: 3.54,
            confidenceInterval: {
              lower: -35.4,
              upper: -4.6
            }
          },
          unequalVariances: {
            t: -5.66,
            df: 2,
            sig: 0.03,
            meanDifference: -20,
            stdErrorDifference: 3.54,
            confidenceInterval: {
              lower: -35.4,
              upper: -4.6
            }
          }
        }
      }
    };

    await act(async () => {
      workerOnMessage({ data: mockWorkerResult });
    });

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalledTimes(2); // One for statistics and one for test results
    expect(mockOnClose).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
  });

  it('should handle multiple variables and aggregate results', async () => {
    const { result } = renderTestHook({
      testVariables: [mockVariables[0], mockVariables[1]]
    });

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);

    // First variable response
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variableName: 'var1',
          results: {
            groupStatistics: {
              variable: mockVariables[0],
              group1: { label: 'Group 1', N: 2, Mean: 12.5, StdDev: 3.54, SEMean: 2.5 },
              group2: { label: 'Group 2', N: 2, Mean: 32.5, StdDev: 3.54, SEMean: 2.5 }
            },
            independentSamplesTest: {
              levene: { F: 0, Sig: 1 },
              equalVariances: { t: -5.66, df: 2, sig: 0.03, meanDifference: -20, stdErrorDifference: 3.54, confidenceInterval: { lower: -35.4, upper: -4.6 } },
              unequalVariances: { t: -5.66, df: 2, sig: 0.03, meanDifference: -20, stdErrorDifference: 3.54, confidenceInterval: { lower: -35.4, upper: -4.6 } }
            }
          }
        }
      });
    });
    
    // Should not be complete yet
    expect(result.current.isCalculating).toBe(true);
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Second variable response
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variableName: 'var2',
          results: {
            groupStatistics: {
              variable: mockVariables[1],
              group1: { label: 'Group 1', N: 2, Mean: 22.5, StdDev: 3.54, SEMean: 2.5 },
              group2: { label: 'Group 2', N: 2, Mean: 42.5, StdDev: 3.54, SEMean: 2.5 }
            },
            independentSamplesTest: {
              levene: { F: 0, Sig: 1 },
              equalVariances: { t: -5.66, df: 2, sig: 0.03, meanDifference: -20, stdErrorDifference: 3.54, confidenceInterval: { lower: -35.4, upper: -4.6 } },
              unequalVariances: { t: -5.66, df: 2, sig: 0.03, meanDifference: -20, stdErrorDifference: 3.54, confidenceInterval: { lower: -35.4, upper: -4.6 } }
            }
          }
        }
      });
    });
    
    // Now it should finish
    expect(mockAddStatistic).toHaveBeenCalledTimes(2);
    expect(mockOnClose).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
  });

  it('should handle worker errors gracefully', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'error',
          variableName: 'var1',
          error: 'Test worker error'
        }
      });
    });
    
    expect(result.current.errorMsg).toContain('Calculation failed for var1: Test worker error');
    expect(result.current.isCalculating).toBe(false);
  });
  
  it('should handle critical worker instantiation errors', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });

    const errorEvent = new ErrorEvent('error', {
      error: new Error('Script loading failed'),
      message: 'Worker script could not be loaded'
    });

    await act(async () => {
      workerOnError(errorEvent);
    });

    expect(result.current.errorMsg).toContain('A critical worker error occurred');
    expect(result.current.isCalculating).toBe(false);
  });
  
  it('should handle insufficient data cases', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variableName: 'var1',
          results: {
            variable1: mockVariables[0],
            metadata: {
              hasInsufficientData: true,
              variableName: 'var1',
              totalData: 4,
              validData: 1
            },
            groupStatistics: {
              group1: { label: 'Group 1', N: 1, Mean: 10, StdDev: 0, SEMean: 0 },
              group2: { label: 'Group 2', N: 0, Mean: 0, StdDev: 0, SEMean: 0 }
            },
            independentSamplesTest: {
              levene: { F: 0, Sig: 1 },
              equalVariances: { t: 0, df: 0, sig: 1, meanDifference: 0, stdErrorDifference: 0, confidenceInterval: { lower: 0, upper: 0 } },
              unequalVariances: { t: 0, df: 0, sig: 1, meanDifference: 0, stdErrorDifference: 0, confidenceInterval: { lower: 0, upper: 0 } }
            }
          }
        }
      });
    });
    
    expect(mockAddStatistic).toHaveBeenCalled();
    expect(mockAddLog).toHaveBeenCalled();
    
    // Log harus mencantumkan informasi tentang T-TEST
    const logCall = mockAddLog.mock.calls[0][0];
    expect(logCall.log).toContain('T-TEST');
  });
  
  it('should cancel analysis when requested', async () => {
    const { result } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    expect(result.current.isCalculating).toBe(true);
    
    await act(async () => {
      result.current.cancelCalculation();
    });
    
    expect(mockWorkerTerminate).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
  });
  
  it('should clean up worker when unmounted', async () => {
    const { result, unmount } = renderTestHook();
    
    await act(async () => {
      await result.current.runAnalysis();
    });
    
    // Unmount komponen
    unmount();
    
    // Worker harus dibersihkan
    expect(mockWorkerTerminate).toHaveBeenCalled();
  });
}); 