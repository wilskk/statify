import { renderHook, act } from '@testing-library/react';
import { usePairedSamplesTTestAnalysis } from '../hooks/usePairedSamplesTTestAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { PairedSamplesTTestAnalysisProps } from '../types';
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
  }
];

const mockAnalysisData = [
  [10, 20],
  [15, 25],
  [30, 40],
  [35, 45],
];

describe('usePairedSamplesTTestAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseResultStore.mockReturnValue({ addLog: mockAddLog, addAnalytic: mockAddAnalytic, addStatistic: mockAddStatistic });
    mockedUseAnalysisData.mockReturnValue({ data: mockAnalysisData });
    
    mockAddLog.mockResolvedValue('log-123');
    mockAddAnalytic.mockResolvedValue('analytic-123');
    mockCheckAndSave.mockResolvedValue(undefined);
  });

  const defaultParams: PairedSamplesTTestAnalysisProps = {
    testVariables1: [mockVariables[0]],
    testVariables2: [mockVariables[1]],
    pairNumbers: [1],
    calculateStandardizer: {
      standardDeviation: true,
      correctedStandardDeviation: false,
      averageOfVariances: false,
    },
    estimateEffectSize: true,
    areAllPairsValid: () => true,
    hasDuplicatePairs: () => false,
    onClose: mockOnClose
  };

  const renderTestHook = (params: Partial<PairedSamplesTTestAnalysisProps> = {}) => {
    return renderHook(() => usePairedSamplesTTestAnalysis({ ...defaultParams, ...params }));
  };

  it('should run analysis and process a successful worker response', async () => {
    const { result } = renderTestHook();

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(result.current.isCalculating).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith({
      analysisType: ['pairedSamplesTTest'],
      variable1: mockVariables[0],
      variable2: mockVariables[1],
      pair: 1,
      data1: [10, 15, 30, 35],
      data2: [20, 25, 40, 45],
      options: {
        estimateEffectSize: true,
        calculateStandardizer: {
          standardDeviation: true,
          correctedStandardDeviation: false,
          averageOfVariances: false,
        },
      },
    });

    const mockWorkerResult = {
      status: 'success',
      variable1Name: mockVariables[0].name,
      variable2Name: mockVariables[1].name,
      results: {
        variable1: mockVariables[0],
        variable2: mockVariables[1],
        pair: 1,
        pairedSamplesStatistics: {
          group1: { label: 'Variable 1', Mean: 25, N: 4, StdDev: 10, SEMean: 5 },
          group2: { label: 'Variable 2', Mean: 32.5, N: 4, StdDev: 10, SEMean: 5 },
        },
        pairedSamplesCorrelation: {
          correlationLabel: 'Correlation',
          N: 4,
          Correlation: 0.8,
          correlationPValue: 0.2,
        },
        pairedSamplesTest: {
          label: 'Paired Samples Test',
          Mean: -7.5,
          StdDev: 5,
          SEMean: 2.5,
          LowerCI: -15,
          UpperCI: 0,
          t: -3,
          df: 3,
          pValue: 0.05,
        },
      },
    };

    await act(async () => {
      workerOnMessage({ data: mockWorkerResult });
    });

    expect(mockAddLog).toHaveBeenCalled();
    expect(mockAddAnalytic).toHaveBeenCalled();
    expect(mockAddStatistic).toHaveBeenCalledTimes(2); // One for statistics, one for test results (correlation only if has rows)
    expect(mockOnClose).toHaveBeenCalled();
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.errorMsg).toBe(null);
  });

  it('should handle multiple pairs and aggregate results', async () => {
    const { result } = renderTestHook({
      testVariables1: [mockVariables[0], mockVariables[1]],
      testVariables2: [mockVariables[1], mockVariables[0]],
      pairNumbers: [1, 2],
    });

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);

    // First pair response
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variable1Name: mockVariables[0].name,
          variable2Name: mockVariables[1].name,
          results: {
            variable1: mockVariables[0],
            variable2: mockVariables[1],
            pair: 1,
            pairedSamplesStatistics: {
              group1: { label: 'Variable 1', Mean: 25, N: 4, StdDev: 10, SEMean: 5 },
              group2: { label: 'Variable 2', Mean: 32.5, N: 4, StdDev: 10, SEMean: 5 },
            },
            pairedSamplesCorrelation: {
              correlationLabel: 'Correlation',
              N: 4,
              Correlation: 0.8,
              correlationPValue: 0.2,
            },
            pairedSamplesTest: {
              label: 'Paired Samples Test',
              Mean: -7.5,
              StdDev: 5,
              SEMean: 2.5,
              LowerCI: -15,
              UpperCI: 0,
              t: -3,
              df: 3,
              pValue: 0.05,
            },
          },
        }
      });
    });
    
    // Should not be complete yet
    expect(result.current.isCalculating).toBe(true);
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Second pair response
    await act(async () => {
      workerOnMessage({
        data: {
          status: 'success',
          variable1Name: mockVariables[1].name,
          variable2Name: mockVariables[0].name,
          results: {
            variable1: mockVariables[1],
            variable2: mockVariables[0],
            pair: 2,
            pairedSamplesStatistics: {
              group1: { label: 'Variable 2', Mean: 32.5, N: 4, StdDev: 10, SEMean: 5 },
              group2: { label: 'Variable 1', Mean: 25, N: 4, StdDev: 10, SEMean: 5 },
            },
            pairedSamplesCorrelation: {
              correlationLabel: 'Correlation',
              N: 4,
              Correlation: 0.8,
              correlationPValue: 0.2,
            },
            pairedSamplesTest: {
              label: 'Paired Samples Test',
              Mean: 7.5,
              StdDev: 5,
              SEMean: 2.5,
              LowerCI: 0,
              UpperCI: 15,
              t: 3,
              df: 3,
              pValue: 0.05,
            },
          },
        }
      });
    });
    
    // Now it should finish
    expect(mockAddStatistic).toHaveBeenCalledTimes(2); // One for aggregated statistics table, one for aggregated test table
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
          variable1Name: mockVariables[0].name,
          variable2Name: mockVariables[1].name,
          error: 'Test worker error'
        }
      });
    });
    
    expect(result.current.errorMsg).toContain('Calculation failed for var1 and var2: Test worker error');
    // The hook doesn't call addStatistic for error cases
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
          variable1Name: mockVariables[0].name,
          variable2Name: mockVariables[1].name,
          results: {
            variable1: mockVariables[0],
            variable2: mockVariables[1],
            pair: 1,
            metadata: {
              hasInsufficientData: true,
              variable1Name: mockVariables[0].name,
              variable2Name: mockVariables[1].name,
              totalData: 4,
              validData: 1
            },
            pairedSamplesStatistics: {
              group1: { label: 'Variable 1', N: 1, Mean: 10, StdDev: 0, SEMean: 0 },
              group2: { label: 'Variable 2', N: 1, Mean: 20, StdDev: 0, SEMean: 0 },
            },
            pairedSamplesCorrelation: {
              correlationLabel: 'Correlation',
              N: 1,
              Correlation: 0,
              correlationPValue: 1,
            },
            pairedSamplesTest: {
              label: 'Paired Samples Test',
              Mean: -10,
              StdDev: 0,
              SEMean: 0,
              LowerCI: -10,
              UpperCI: -10,
              t: 0,
              df: 0,
              pValue: 1,
            },
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