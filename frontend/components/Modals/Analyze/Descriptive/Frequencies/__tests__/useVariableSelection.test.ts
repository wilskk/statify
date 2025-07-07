import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

// Mock the zustand store
jest.mock('@/stores/useVariableStore');
const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;

const mockVariables: Variable[] = [
  { name: 'var1', label: 'Variable 1', type: 'STRING', tempId: '1', columnIndex: 0 },
  { name: 'var2', label: 'Variable 2', type: 'STRING', tempId: '2', columnIndex: 1 },
  { name: 'var3', label: 'Variable 3', type: 'STRING', tempId: '3', columnIndex: 2 },
] as Variable[];

describe('useVariableSelection', () => {
  beforeEach(() => {
    // Provide a mock implementation for the store before each test
    mockedUseVariableStore.mockReturnValue({
      variables: mockVariables,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with all variables available and none selected', () => {
    const { result } = renderHook(() => useVariableSelection());

    expect(result.current.availableVariables).toHaveLength(3);
    expect(result.current.selectedVariables).toHaveLength(0);
    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var1', 'var2', 'var3']);
  });

  it('should move a variable from available to selected', () => {
    const { result } = renderHook(() => useVariableSelection());
    const variableToMove = result.current.availableVariables[0];

    act(() => {
      result.current.moveToSelectedVariables(variableToMove);
    });

    expect(result.current.availableVariables).toHaveLength(2);
    expect(result.current.selectedVariables).toHaveLength(1);
    expect(result.current.selectedVariables[0].name).toBe('var1');
    expect(result.current.availableVariables.find(v => v.name === 'var1')).toBeUndefined();
  });

  it('should move a variable from selected back to available', () => {
    const { result } = renderHook(() => useVariableSelection());
    const variableToMove = mockVariables[0];

    // First, move it to selected
    act(() => {
      result.current.moveToSelectedVariables(variableToMove);
    });

    // Then, move it back to available
    act(() => {
      result.current.moveToAvailableVariables(variableToMove);
    });

    expect(result.current.availableVariables).toHaveLength(3);
    expect(result.current.selectedVariables).toHaveLength(0);
    // It should also be sorted correctly
    expect(result.current.availableVariables.map(v => v.columnIndex)).toEqual([0, 1, 2]);
  });
  
  it('should reorder selected variables', () => {
    const { result } = renderHook(() => useVariableSelection());
    
    act(() => {
        result.current.moveToSelectedVariables(mockVariables[0]);
        result.current.moveToSelectedVariables(mockVariables[1]);
    });

    expect(result.current.selectedVariables.map(v => v.name)).toEqual(['var1', 'var2']);

    const reorderedList = [result.current.selectedVariables[1], result.current.selectedVariables[0]];

    act(() => {
        result.current.reorderVariables('selected', reorderedList);
    });

    expect(result.current.selectedVariables.map(v => v.name)).toEqual(['var2', 'var1']);
  });

  it('should reset the selection', () => {
    const { result } = renderHook(() => useVariableSelection());
    
    act(() => {
      result.current.moveToSelectedVariables(mockVariables[0]);
    });

    expect(result.current.availableVariables).toHaveLength(2);
    expect(result.current.selectedVariables).toHaveLength(1);

    act(() => {
      result.current.resetVariableSelection();
    });

    expect(result.current.availableVariables).toHaveLength(3);
    expect(result.current.selectedVariables).toHaveLength(0);
  });
}); 