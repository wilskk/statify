import { renderHook, act } from '@testing-library/react';
import { useWeightCases } from '../useWeightCases';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { Variable } from '@/types/Variable';

// Mock stores
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');

const mockedUseVariableStore = useVariableStore as jest.Mock;
const mockedUseMetaStore = useMetaStore as jest.Mock;

const mockVariables: Variable[] = [
  { name: 'var1', type: 'NUMERIC', columnIndex: 0, tempId: '1' },
  { name: 'var2', type: 'STRING', columnIndex: 1, tempId: '2' },
  { name: 'var3', type: 'NUMERIC', columnIndex: 2, tempId: '3' },
];

describe('useWeightCases', () => {
  const mockSetMeta = jest.fn();
  const mockOnClose = jest.fn();
  let metaState: { weight: string };

  beforeEach(() => {
    jest.clearAllMocks();
    metaState = { weight: '' };
    mockedUseVariableStore.mockReturnValue({ variables: mockVariables });
    mockedUseMetaStore.mockImplementation(selector => {
      if (selector.toString().includes('state.meta')) {
        return metaState;
      }
      if (selector.toString().includes('state.setMeta')) {
        return mockSetMeta;
      }
      return undefined;
    });
  });

  it('should initialize with only numeric variables in the available list', () => {
    const { result } = renderHook(() => useWeightCases({ onClose: mockOnClose }));
    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var1', 'var3']);
    expect(result.current.frequencyVariables).toEqual([]);
  });

  it('should initialize with a pre-selected weight variable if present in meta store', () => {
    metaState.weight = 'var3';
    const { result } = renderHook(() => useWeightCases({ onClose: mockOnClose }));
    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var1']);
    expect(result.current.frequencyVariables.map(v => v.name)).toEqual(['var3']);
  });

  it('should move a variable from available to frequency', () => {
    const { result } = renderHook(() => useWeightCases({ onClose: mockOnClose }));
    const varToMove = result.current.availableVariables.find(v => v.name === 'var1');
    
    act(() => {
      result.current.handleMoveVariable(varToMove!, 'available', 'frequency');
    });

    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var3']);
    expect(result.current.frequencyVariables.map(v => v.name)).toEqual(['var1']);
  });

  it('should swap variables if frequency list is full', () => {
    metaState.weight = 'var3';
    const { result } = renderHook(() => useWeightCases({ onClose: mockOnClose })); // var3 is in frequency
    expect(result.current.frequencyVariables.map(v => v.name)).toEqual(['var3']);
    
    const varToMove = result.current.availableVariables.find(v => v.name === 'var1');

    act(() => {
        result.current.handleMoveVariable(varToMove!, 'available', 'frequency');
    });

    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var3']);
    expect(result.current.frequencyVariables.map(v => v.name)).toEqual(['var1']);
  });

  it('should show an error when trying to move a string variable to frequency', () => {
    const stringVar: Variable = { name: 'var2', type: 'STRING', columnIndex: 1, tempId: '2' };
    const { result } = renderHook(() => useWeightCases({ onClose: mockOnClose }));
    
    act(() => {
      result.current.handleMoveVariable(stringVar, 'available', 'frequency');
    });

    expect(result.current.errorMessage).toBe('Weight variable must be numeric');
    expect(result.current.errorDialogOpen).toBe(true);
  });

  it('should call setMeta with the correct variable name on handleSave', () => {
    const { result } = renderHook(() => useWeightCases({ onClose: mockOnClose }));
    const varToMove = result.current.availableVariables.find(v => v.name === 'var1');

    act(() => {
      result.current.handleMoveVariable(varToMove!, 'available', 'frequency');
    });

    act(() => {
      result.current.handleSave();
    });

    expect(mockSetMeta).toHaveBeenCalledWith({ weight: 'var1' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call setMeta with an empty string when saving with no frequency variable', () => {
    const { result } = renderHook(() => useWeightCases({ onClose: mockOnClose }));

    act(() => {
      result.current.handleSave();
    });

    expect(mockSetMeta).toHaveBeenCalledWith({ weight: '' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset state and meta on handleReset', () => {
    const { result } = renderHook(() => useWeightCases({ onClose: mockOnClose }));
    const varToMove = result.current.availableVariables.find(v => v.name === 'var1');

    act(() => {
        result.current.handleMoveVariable(varToMove!, 'available', 'frequency');
    });

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var1', 'var3']);
    expect(result.current.frequencyVariables).toEqual([]);
    expect(mockSetMeta).toHaveBeenCalledWith({ weight: '' });
  });
}); 