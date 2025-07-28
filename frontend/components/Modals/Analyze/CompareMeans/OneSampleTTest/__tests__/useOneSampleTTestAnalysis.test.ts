import { renderHook, act } from '@testing-library/react';
import { useOneSampleTTestAnalysis } from '../hooks/useOneSampleTTestAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { OneSampleTTestAnalysisProps } from '../types';
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
    { name: 'var1', label: 'Variable 1', columnIndex: 0, type: 'NUMERIC', tempId: '1', width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'scale', role: 'input', columns: 8 },
    { name: 'var2', label: 'Variable 2', columnIndex: 1, type: 'NUMERIC', tempId: '2', width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'scale', role: 'input', columns: 8 },
];

const mockAnalysisData = [
    [10, 100],
    [20, 200],
];

describe('useOneSampleTTestAnalysis', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseResultStore.mockReturnValue({ addLog: mockAddLog, addAnalytic: mockAddAnalytic, addStatistic: mockAddStatistic });
        mockedUseAnalysisData.mockReturnValue({ data: mockAnalysisData });
        
        mockAddLog.mockResolvedValue('log-123');
        mockAddAnalytic.mockResolvedValue('analytic-123');
        mockCheckAndSave.mockResolvedValue(undefined);
    });

    const defaultParams: OneSampleTTestAnalysisProps = {
        testVariables: [mockVariables[0]],
        testValue: 0,
        estimateEffectSize: false,
        onClose: mockOnClose
    };

    const renderTestHook = (params: Partial<OneSampleTTestAnalysisProps> = {}) => {
        return renderHook(() => useOneSampleTTestAnalysis({ ...defaultParams, ...params }));
    };

    it('should run analysis and process a successful worker response', async () => {
        const { result } = renderTestHook();

        await act(async () => {
            await result.current.runAnalysis();
        });

        expect(result.current.isCalculating).toBe(true);
        expect(mockPostMessage).toHaveBeenCalledTimes(1);
        expect(mockPostMessage).toHaveBeenCalledWith({
            analysisType: ['oneSampleTTest'],
            variable1: mockVariables[0],
            data1: [10, 20],
            options: { testValue: 0, estimateEffectSize: false }
        });

        const mockWorkerResult = {
            status: 'success',
            variableName: 'var1',
            results: {
                variable1: mockVariables[0],
                oneSampleStatistics: {
                    N: 2,
                    Mean: 15,
                    StdDev: 7.07,
                    SEMean: 5
                },
                oneSampleTest: {
                    T: 3,
                    DF: 1,
                    PValue: 0.205,
                    MeanDifference: 15,
                    Lower: -48.53,
                    Upper: 78.53
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
        const { result } = renderTestHook({ testVariables: mockVariables });

        await act(async () => {
            await result.current.runAnalysis();
        });

        expect(mockPostMessage).toHaveBeenCalledTimes(2);

        const mockWorkerResult1 = {
            status: 'success',
            variableName: 'var1',
            results: {
                variable1: mockVariables[0],
                oneSampleStatistics: {
                    N: 2,
                    Mean: 15,
                    StdDev: 7.07,
                    SEMean: 5
                },
                oneSampleTest: {
                    T: 3,
                    DF: 1,
                    PValue: 0.205,
                    MeanDifference: 15,
                    Lower: -48.53,
                    Upper: 78.53
                }
            }
        };

        const mockWorkerResult2 = {
            status: 'success',
            variableName: 'var2',
            results: {
                variable1: mockVariables[1],
                oneSampleStatistics: {
                    N: 2,
                    Mean: 150,
                    StdDev: 70.7,
                    SEMean: 50
                },
                oneSampleTest: {
                    T: 3,
                    DF: 1,
                    PValue: 0.205,
                    MeanDifference: 150,
                    Lower: -485.3,
                    Upper: 785.3
                }
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult1 });
        });
        
        // Should not terminate yet
        expect(result.current.isCalculating).toBe(true);
        
        await act(async () => {
            workerOnMessage({ data: mockWorkerResult2 });
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
        
        const mockWorkerError = { 
            status: 'error', 
            variableName: 'var1', 
            error: 'Test worker error' 
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerError });
        });
        
        expect(result.current.errorMsg).toContain('Calculation failed for var1: Test worker error');
        expect(mockAddStatistic).toHaveBeenCalled(); // Will save error table
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
        
        const mockWorkerResult = {
            status: 'success',
            variableName: 'var1',
            results: {
                variable1: mockVariables[0],
                metadata: {
                    hasInsufficientData: true,
                    variableName: 'var1',
                    totalData: 2,
                    validData: 1
                },
                oneSampleStatistics: {
                    N: 1,
                    Mean: 10,
                    StdDev: 0,
                    SEMean: 0
                }
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
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
            result.current.cancelAnalysis();
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