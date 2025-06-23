import { renderHook, act } from '@testing-library/react';
import { useAggregateData } from '../hooks/useAggregateData';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useModalStore } from '@/stores/useModalStore';

// Mock stores
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useModalStore');

const mockUseVariableStore = useVariableStore as jest.Mock;
const mockUseDataStore = useDataStore as jest.Mock;
const mockUseModalStore = useModalStore as jest.Mock;

const mockAddVariable = jest.fn();
const mockUpdateCells = jest.fn();
const mockSetStatisticProgress = jest.fn();

// Using a simplified version of Variable for testing purposes
interface Variable {
    columnIndex: number;
    name: string;
    type: 'STRING' | 'NUMERIC';
    label?: string;
    measure: 'scale' | 'nominal' | 'ordinal';
}

const sampleVariables: Variable[] = [
    { columnIndex: 0, name: 'Gender', type: 'STRING', label: 'Gender', measure: 'nominal' },
    { columnIndex: 1, name: 'Region', type: 'STRING', label: 'Region', measure: 'nominal' },
    { columnIndex: 2, name: 'Salary', type: 'NUMERIC', label: 'Salary', measure: 'scale' },
];

const sampleData = [
    ['Male', 'North', 50000],
    ['Female', 'North', 60000],
    ['Male', 'South', 55000],
    ['Female', 'South', 65000],
    ['Male', 'North', 52000],
];

describe('useAggregateData', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockUseVariableStore.mockReturnValue({
            variables: sampleVariables,
            addVariable: mockAddVariable,
            getState: () => ({
                addVariable: mockAddVariable,
                variables: sampleVariables,
            }),
        });

        mockUseDataStore.mockReturnValue({
            data: sampleData,
            updateCells: mockUpdateCells,
        });

        mockUseModalStore.mockReturnValue({
            setStatisticProgress: mockSetStatisticProgress,
        });
    });

    it('should initialize with available variables from the store', () => {
        const { result } = renderHook(() => useAggregateData());
        expect(result.current.availableVariables).toEqual(sampleVariables);
        expect(result.current.breakVariables).toEqual([]);
        expect(result.current.aggregatedVariables).toEqual([]);
    });

    it('should move a variable to break variables', () => {
        const { result } = renderHook(() => useAggregateData());

        act(() => {
            result.current.moveToBreak(sampleVariables[0] as any);
        });

        expect(result.current.breakVariables).toHaveLength(1);
        expect(result.current.breakVariables[0].name).toBe('Gender');
        expect(result.current.availableVariables).toHaveLength(sampleVariables.length - 1);
    });

    it('should move a variable to aggregated variables with default function', () => {
        const { result } = renderHook(() => useAggregateData());

        act(() => {
            result.current.moveToAggregated(sampleVariables[2] as any); // Salary (NUMERIC)
        });

        expect(result.current.aggregatedVariables).toHaveLength(1);
        const aggVar = result.current.aggregatedVariables[0];
        expect(aggVar.baseVarName).toBe('Salary');
        expect(aggVar.function).toBe('MEAN'); // Default for numeric
        expect(aggVar.name).toBe('Salary_mean');
    });

    it('should handle confirming aggregation', async () => {
        const { result } = renderHook(() => useAggregateData());
        const closeModal = jest.fn();

        act(() => {
            result.current.moveToBreak(sampleVariables[0] as any);
            result.current.moveToAggregated(sampleVariables[2] as any);
        });

        await act(async () => {
            await result.current.handleConfirm(closeModal);
        });

        expect(mockSetStatisticProgress).toHaveBeenCalledWith(true);
        expect(mockAddVariable).toHaveBeenCalledTimes(1);
        expect(mockAddVariable).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Salary_mean',
            type: 'NUMERIC',
        }));

        expect(mockUpdateCells).toHaveBeenCalledTimes(1);
        const updateCalls = mockUpdateCells.mock.calls[0][0];
        expect(updateCalls).toHaveLength(sampleData.length);

        const maleAvg = (50000 + 55000 + 52000) / 3;
        const femaleAvg = (60000 + 65000) / 2;

        expect(updateCalls).toContainEqual({ row: 0, col: 3, value: maleAvg });
        expect(updateCalls).toContainEqual({ row: 1, col: 3, value: femaleAvg });
        expect(updateCalls).toContainEqual({ row: 2, col: 3, value: maleAvg });
        expect(updateCalls).toContainEqual({ row: 3, col: 3, value: femaleAvg });
        expect(updateCalls).toContainEqual({ row: 4, col: 3, value: maleAvg });


        expect(mockSetStatisticProgress).toHaveBeenCalledWith(false);
        expect(closeModal).toHaveBeenCalledTimes(1);
    });

     it('should add a number of cases variable when requested', async () => {
        const { result } = renderHook(() => useAggregateData());
        const closeModal = jest.fn();

        act(() => {
            result.current.moveToBreak(sampleVariables[0] as any);
            result.current.setAddNumberOfCases(true);
            result.current.setBreakName('N_Gender');
        });

        await act(async () => {
            await result.current.handleConfirm(closeModal);
        });

        expect(mockAddVariable).toHaveBeenCalledTimes(1);
        expect(mockAddVariable).toHaveBeenCalledWith(expect.objectContaining({
            name: 'N_Gender',
            type: 'NUMERIC',
            label: 'Number of cases in break group'
        }));

        expect(mockUpdateCells).toHaveBeenCalledTimes(1);
        const updateCalls = mockUpdateCells.mock.calls[0][0];
        expect(updateCalls).toHaveLength(sampleData.length);

        expect(updateCalls).toContainEqual({ row: 0, col: 3, value: 3 });
        expect(updateCalls).toContainEqual({ row: 1, col: 3, value: 2 });
        expect(updateCalls).toContainEqual({ row: 2, col: 3, value: 3 });
        expect(updateCalls).toContainEqual({ row: 3, col: 3, value: 2 });
        expect(updateCalls).toContainEqual({ row: 4, col: 3, value: 3 });
    });
}); 