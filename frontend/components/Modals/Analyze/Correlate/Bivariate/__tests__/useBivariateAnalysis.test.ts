import { renderHook, act } from '@testing-library/react';
import { useBivariateAnalysis } from '../hooks/useBivariateAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { BivariateAnalysisProps } from '../types';
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
    { name: 'var3', label: 'Variable 3', columnIndex: 2, type: 'NUMERIC', tempId: '3', width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'scale', role: 'input', columns: 8 },
];

const mockAnalysisData = [
    [10, 100],
    [20, 200],
    [15, 150],
];

describe('useBivariateAnalysis', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseResultStore.mockReturnValue({ addLog: mockAddLog, addAnalytic: mockAddAnalytic, addStatistic: mockAddStatistic });
        mockedUseAnalysisData.mockReturnValue({ data: mockAnalysisData });
        
        mockAddLog.mockResolvedValue('log-123');
        mockAddAnalytic.mockResolvedValue('analytic-123');
        mockCheckAndSave.mockResolvedValue(undefined);
    });

    const defaultParams: BivariateAnalysisProps = {
        testVariables: [mockVariables[0], mockVariables[1]],
        controlVariables: [],
        correlationCoefficient: {
            pearson: true,
            kendallsTauB: false,
            spearman: false
        },
        testOfSignificance: {
            oneTailed: false,
            twoTailed: true
        },
        flagSignificantCorrelations: false,
        showOnlyTheLowerTriangle: false,
        showDiagonal: true,
        partialCorrelationKendallsTauB: false,
        statisticsOptions: {
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
        },
        missingValuesOptions: {
            excludeCasesPairwise: false,
            excludeCasesListwise: false
        },
        onClose: mockOnClose
    };

    const renderTestHook = (params: Partial<BivariateAnalysisProps> = {}) => {
        return renderHook(() => useBivariateAnalysis({ ...defaultParams, ...params }));
    };

    it('should run analysis and process a successful worker response', async () => {
        const { result } = renderTestHook();

        await act(async () => {
            await result.current.runAnalysis();
        });

        expect(result.current.isCalculating).toBe(true);
        expect(mockPostMessage).toHaveBeenCalledTimes(1);
        expect(mockPostMessage).toHaveBeenCalledWith({
            analysisType: 'bivariate',
            variable: [mockVariables[0], mockVariables[1]],
            data: [
                [10, 20, 15],
                [100, 200, 150]
            ],
            options: {
                controlData: [],
                controlVariables: [],
                correlationCoefficient: {
                    pearson: true,
                    kendallsTauB: false,
                    spearman: false
                },
                testOfSignificance: {
                    oneTailed: false,
                    twoTailed: true
                },
                flagSignificantCorrelations: false,
                showOnlyTheLowerTriangle: false,
                showDiagonal: true,
                partialCorrelationKendallsTauB: false,
                statisticsOptions: {
                    meansAndStandardDeviations: false,
                    crossProductDeviationsAndCovariances: false
                },
                missingValuesOptions: {
                    excludeCasesPairwise: false,
                    excludeCasesListwise: false
                }
            }
        });

        const mockWorkerResult = {
            status: 'success',
            results: {
                descriptiveStatistics: [
                    {
                        variable: 'var1',
                        Mean: 15,
                        StdDev: 5,
                        N: 3
                    },
                    {
                        variable: 'var2',
                        Mean: 150,
                        StdDev: 50,
                        N: 3
                    }
                ],
                correlation: [
                    {
                        variable1: 'var1',
                        variable2: 'var1',
                        pearsonCorrelation: {
                            Pearson: 1,
                            PValue: null,
                            SumOfSquares: 50,
                            Covariance: 25,
                            N: 3
                        }
                    },
                    {
                        variable1: 'var1',
                        variable2: 'var2',
                        pearsonCorrelation: {
                            Pearson: 0.8,
                            PValue: 0.1,
                            SumOfSquares: 200,
                            Covariance: 100,
                            N: 3
                        }
                    },
                    {
                        variable1: 'var2',
                        variable2: 'var2',
                        pearsonCorrelation: {
                            Pearson: 1,
                            PValue: null,
                            SumOfSquares: 5000,
                            Covariance: 2500,
                            N: 3
                        }
                    }
                ],
                partialCorrelation: []
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
        });

        expect(mockAddLog).toHaveBeenCalled();
        expect(mockAddAnalytic).toHaveBeenCalled();
        expect(mockAddStatistic).toHaveBeenCalledTimes(1); // One for correlation results
        expect(mockOnClose).toHaveBeenCalled();
        expect(result.current.isCalculating).toBe(false);
        expect(result.current.errorMsg).toBe(null);
    });

    it('should handle partial correlation analysis', async () => {
        const { result } = renderTestHook({
            partialCorrelationKendallsTauB: true,
            controlVariables: [mockVariables[0]]
        });

        await act(async () => {
            await result.current.runAnalysis();
        });

        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                options: expect.objectContaining({
                    controlVariables: [mockVariables[0]],
                    partialCorrelationKendallsTauB: true
                })
            })
        );

        const mockWorkerResult = {
            status: 'success',
            results: {
                descriptiveStatistics: [],
                correlation: [],
                partialCorrelation: [
                    {
                        controlVariable: 'var1',
                        variable1: 'var2',
                        variable2: 'var3',
                        partialCorrelation: {
                            Correlation: 0.5,
                            PValue: 0.05,
                            df: 1
                        }
                    }
                ]
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
        });

        expect(mockAddStatistic).toHaveBeenCalledTimes(1); // One for partial correlation
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle multiple correlation types', async () => {
        const { result } = renderTestHook({
            correlationCoefficient: {
                pearson: true,
                kendallsTauB: true,
                spearman: true
            }
        });

        await act(async () => {
            await result.current.runAnalysis();
        });

        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                options: expect.objectContaining({
                    correlationCoefficient: {
                        pearson: true,
                        kendallsTauB: true,
                        spearman: true
                    }
                })
            })
        );

        const mockWorkerResult = {
            status: 'success',
            results: {
                descriptiveStatistics: [],
                correlation: [
                    {
                        variable1: 'var1',
                        variable2: 'var2',
                        pearsonCorrelation: {
                            Pearson: 0.8,
                            PValue: 0.1,
                            SumOfSquares: 200,
                            Covariance: 100,
                            N: 3
                        },
                        kendallsTauBCorrelation: {
                            Kendall: 0.6,
                            PValue: 0.2,
                            N: 3
                        },
                        spearmanCorrelation: {
                            Spearman: 0.7,
                            PValue: 0.15,
                            N: 3
                        }
                    }
                ],
                partialCorrelation: []
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
        });

        expect(mockAddStatistic).toHaveBeenCalledTimes(2); // One for each correlation type
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle worker errors gracefully', async () => {
        const { result } = renderTestHook();
        
        await act(async () => {
            await result.current.runAnalysis();
        });
        
        const mockWorkerError = { 
            status: 'error', 
            error: 'Test worker error' 
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerError });
        });
        
        expect(result.current.errorMsg).toContain('Calculation failed for undefined: Test worker error');
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
            results: {
                descriptiveStatistics: [],
                correlation: [],
                partialCorrelation: [],
                metadata: {
                    hasInsufficientData: true,
                    totalData: 3,
                    validData: 1
                }
            }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
        });
        
        expect(mockAddStatistic).toHaveBeenCalled();
        expect(mockAddLog).toHaveBeenCalled();
        
        // Log should mention CORRELATION
        const logCall = mockAddLog.mock.calls[0][0];
        expect(logCall.log).toContain('CORRELATION');
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
        
        // Unmount component
        unmount();
        
        // Worker should be cleaned up
        expect(mockWorkerTerminate).toHaveBeenCalled();
    });


}); 