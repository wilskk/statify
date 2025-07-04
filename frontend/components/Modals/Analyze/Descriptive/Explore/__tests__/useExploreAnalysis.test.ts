import { renderHook, act } from '@testing-library/react';
import { useExploreAnalysis } from '../hooks/useExploreAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { ExploreAnalysisParams } from '../types';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');

// Mock Worker
const mockPostMessage = jest.fn();
const mockTerminate = jest.fn();
const mockWorkerInstances: any[] = [];
let workerOnMessage: (event: { data: any }) => void;
let workerOnError: (event: ErrorEvent) => void;

global.Worker = jest.fn().mockImplementation(() => {
    const instance = {
        postMessage: mockPostMessage,
        terminate: mockTerminate,
        set onmessage(fn: (event: { data: any }) => void) {
            workerOnMessage = fn;
        },
        set onerror(fn: (event: ErrorEvent) => void) {
            workerOnError = fn;
        },
    };
    mockWorkerInstances.push(instance);
    return instance;
});

// Mock implementations
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedUseAnalysisData = useAnalysisData as unknown as jest.Mock;

const mockAddLog = jest.fn();
const mockAddAnalytic = jest.fn();
const mockAddStatistic = jest.fn();
const mockOnClose = jest.fn();

const mockDepVars: Variable[] = [
    { name: 'dep1', label: 'Dependent 1', columnIndex: 0, type: 'NUMERIC', tempId: 'd1', measure: 'scale' } as Variable,
];
const mockFactorVars: Variable[] = [
    { name: 'factor1', label: 'Factor 1', columnIndex: 1, type: 'STRING', tempId: 'f1', measure: 'nominal' } as Variable,
];

// Data: dep1, factor1, dep2
const mockAnalysisData = [
    [10, 'A', 100],
    [20, 'B', 200],
    [15, 'A', 150],
    [25, 'B', 250],
];
const mockWeights = null;

describe('useExploreAnalysis', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockWorkerInstances.length = 0;
        mockedUseResultStore.mockReturnValue({ addLog: mockAddLog, addAnalytic: mockAddAnalytic, addStatistic: mockAddStatistic });
        mockedUseAnalysisData.mockReturnValue({ data: mockAnalysisData, weights: mockWeights });
        
        mockAddLog.mockResolvedValue('log-456');
        mockAddAnalytic.mockResolvedValue('analytic-456');
    });

    const defaultParams: ExploreAnalysisParams = {
        dependentVariables: mockDepVars,
        factorVariables: [],
        labelVariable: null,
        confidenceInterval: '95',
        showDescriptives: true,
        showMEstimators: false,
        showOutliers: false,
        showPercentiles: false,
        boxplotType: 'dependents-together',
        showStemAndLeaf: false,
        showHistogram: false,
        showNormalityPlots: false,
    };

    const renderTestHook = (params: Partial<ExploreAnalysisParams> = {}) => {
        return renderHook(() => useExploreAnalysis({ ...defaultParams, ...params }, mockOnClose));
    };

    it('should not run analysis if no dependent variables are selected', async () => {
        const { result } = renderTestHook({ dependentVariables: [] });

        await act(async () => {
            await result.current.runAnalysis();
        });

        expect(result.current.error).toBe("Please select at least one dependent variable.");
        expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should run analysis for one dependent variable without factors', async () => {
        const { result } = renderTestHook();

        let runPromise: Promise<void> | undefined;
        act(() => {
            runPromise = result.current.runAnalysis();
        });

        expect(result.current.isCalculating).toBe(true);
        expect(global.Worker).toHaveBeenCalledTimes(1);
        expect(mockPostMessage).toHaveBeenCalledTimes(1);
        expect(mockPostMessage).toHaveBeenCalledWith({
            analysisType: 'examine',
            variable: mockDepVars[0],
            data: [10, 20, 15, 25], // all data for dep1
            weights: mockWeights,
            options: expect.any(Object),
        });

        const mockWorkerResult = {
            status: 'success',
            results: { summary: { n: 4 }, descriptives: { mean: 17.5 } }
        };

        await act(async () => {
            workerOnMessage({ data: mockWorkerResult });
            if (runPromise) await runPromise;
        });

        expect(mockAddLog).toHaveBeenCalled();
        expect(mockAddAnalytic).toHaveBeenCalled();
        expect(mockAddStatistic).toHaveBeenCalledTimes(1); // Only descriptives table shown by default
        expect(mockOnClose).toHaveBeenCalled();
        expect(result.current.isCalculating).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should group data by a factor variable and run analysis for each group', async () => {
        const { result } = renderTestHook({ factorVariables: mockFactorVars });
    
        let runPromise: Promise<void> | undefined;
        act(() => {
            runPromise = result.current.runAnalysis();
        });
        
        expect(result.current.isCalculating).toBe(true);
        // This will be called for each group.
        await act(async () => {
            // Wait for the async part of runAnalysis to complete to get the correct number of workers.
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(global.Worker).toHaveBeenCalledTimes(2); // One worker per group (A and B)
    
        // Check calls for each group
        expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
            data: [10, 15] // Data for group 'A'
        }));
        expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
            data: [20, 25] // Data for group 'B'
        }));
    
        const mockWorkerResultA = { status: 'success', results: { summary: { n: 2 } } };
        const mockWorkerResultB = { status: 'success', results: { summary: { n: 2 } } };
        
        await act(async () => {
            // For this test, we'll assume they resolve sequentially for simplicity.
            const firstWorkerOnMessage = (mockWorkerInstances[0] as any).onmessage;
            const secondWorkerOnMessage = (mockWorkerInstances[1] as any).onmessage;
            
            firstWorkerOnMessage({ data: mockWorkerResultA });
            secondWorkerOnMessage({ data: mockWorkerResultB });
            
            if (runPromise) await runPromise;
        });
        
        expect(mockAddStatistic).toHaveBeenCalledTimes(1);
        const formatCall = (mockAddStatistic.mock.calls[0][1] as any).output_data;
        const parsedData = JSON.parse(formatCall);
        
        // The formatter should produce rows for each factor level in a nested structure
        const rows = parsedData.tables[0].rows;
        expect(rows).toHaveLength(1); // One parent row for the dependent variable
        expect(rows[0].rowHeader[0]).toBe('Dependent 1');
        expect(rows[0].children).toHaveLength(2); // Two child rows for the factor levels
        expect(rows[0].children).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ rowHeader: [null, 'A'] }),
                expect.objectContaining({ rowHeader: [null, 'B'] }),
            ])
        );

        expect(result.current.isCalculating).toBe(false);
        expect(mockOnClose).toHaveBeenCalled();
    });
    

    it('should handle worker errors during analysis', async () => {
        const { result } = renderTestHook();
        
        let runPromise: Promise<void> | undefined;
        act(() => {
            runPromise = result.current.runAnalysis();
        });
        
        const mockWorkerError = { status: 'error', error: 'Calculation failed in worker' };
        
        await act(async () => {
            workerOnMessage({ data: mockWorkerError });
            if (runPromise) await runPromise;
        });
        
        expect(result.current.error).toContain('An analysis task failed');
        expect(mockAddStatistic).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
        expect(result.current.isCalculating).toBe(false);
    });
}); 