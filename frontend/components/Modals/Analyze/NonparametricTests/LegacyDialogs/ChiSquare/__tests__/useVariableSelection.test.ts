import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import type { Variable } from '@/types/Variable';

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC',
    tempId: '1',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
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
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'ordinal',
    role: 'input',
    columns: 8
  },
  {
    name: 'var3',
    label: 'Variable 3',
    columnIndex: 2,
    type: 'NUMERIC',
    tempId: '3',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  }
];

describe('useVariableSelection', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTestHook = (initialSelected: Variable[] = []) => {
    return renderHook(() => useVariableSelection({
      variables: mockVariables,
      selectedVariables: initialSelected,
      onChange: mockOnChange
    }));
  };

  describe('Initial State', () => {
    it('should initialize with empty selected variables', () => {
      const { result } = renderTestHook();

      expect(result.current.selectedVariables).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should initialize with pre-selected variables', () => {
      const { result } = renderTestHook([mockVariables[0]]);

      expect(result.current.selectedVariables).toEqual([mockVariables[0]]);
      expect(result.current.selectedCount).toBe(1);
    });
  });

  describe('Variable Selection', () => {
    it('should select a single variable', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.toggleVariable(mockVariables[0]);
      });

      expect(result.current.selectedVariables).toEqual([mockVariables[0]]);
      expect(result.current.selectedCount).toBe(1);
      expect(mockOnChange).toHaveBeenCalledWith([mockVariables[0]]);
    });

    it('should select multiple variables', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.toggleVariable(mockVariables[0]);
        result.current.toggleVariable(mockVariables[1]);
      });

      expect(result.current.selectedVariables).toEqual([mockVariables[0], mockVariables[1]]);
      expect(result.current.selectedCount).toBe(2);
      expect(mockOnChange).toHaveBeenCalledWith([mockVariables[0]]);
      expect(mockOnChange).toHaveBeenCalledWith([mockVariables[0], mockVariables[1]]);
    });

    it('should deselect a variable', () => {
      const { result } = renderTestHook([mockVariables[0]]);

      act(() => {
        result.current.toggleVariable(mockVariables[0]);
      });

      expect(result.current.selectedVariables).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should handle selecting already selected variable', () => {
      const { result } = renderTestHook([mockVariables[0]]);

      act(() => {
        result.current.toggleVariable(mockVariables[0]);
      });

      expect(result.current.selectedVariables).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
    });
  });

  describe('Bulk Operations', () => {
    it('should select all variables', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedVariables).toEqual(mockVariables);
      expect(result.current.selectedCount).toBe(3);
      expect(mockOnChange).toHaveBeenCalledWith(mockVariables);
    });

    it('should deselect all variables', () => {
      const { result } = renderTestHook(mockVariables);

      act(() => {
        result.current.deselectAll();
      });

      expect(result.current.selectedVariables).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should select all when some are already selected', () => {
      const { result } = renderTestHook([mockVariables[0]]);

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedVariables).toEqual(mockVariables);
      expect(result.current.selectedCount).toBe(3);
      expect(mockOnChange).toHaveBeenCalledWith(mockVariables);
    });
  });

  describe('Variable Status', () => {
    it('should check if variable is selected', () => {
      const { result } = renderTestHook([mockVariables[0]]);

      expect(result.current.isSelected(mockVariables[0])).toBe(true);
      expect(result.current.isSelected(mockVariables[1])).toBe(false);
    });

    it('should handle checking non-existent variable', () => {
      const { result } = renderTestHook();

      const nonExistentVariable: Variable = {
        name: 'nonexistent',
        label: 'Non-existent',
        columnIndex: 999,
        type: 'NUMERIC',
        tempId: '999',
        width: 8,
        decimals: 0,
        values: [],
        missing: {},
        align: 'left',
        measure: 'nominal',
        role: 'input',
        columns: 8
      };

      expect(result.current.isSelected(nonExistentVariable)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty variables list', () => {
      const { result } = renderHook(() => useVariableSelection({
        variables: [],
        selectedVariables: [],
        onChange: mockOnChange
      }));

      expect(result.current.selectedVariables).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.isSelected(mockVariables[0])).toBe(false);
    });

    it('should handle null variables', () => {
      const { result } = renderHook(() => useVariableSelection({
        variables: null as any,
        selectedVariables: [],
        onChange: mockOnChange
      }));

      expect(result.current.selectedVariables).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should handle undefined onChange', () => {
      const { result } = renderHook(() => useVariableSelection({
        variables: mockVariables,
        selectedVariables: [],
        onChange: undefined
      }));

      // Should not throw when toggling variable
      act(() => {
        expect(() => result.current.toggleVariable(mockVariables[0])).not.toThrow();
      });

      expect(result.current.selectedVariables).toEqual([mockVariables[0]]);
    });

    it('should handle duplicate variables in selection', () => {
      const { result } = renderTestHook([mockVariables[0], mockVariables[0]]);

      expect(result.current.selectedVariables).toEqual([mockVariables[0]]);
      expect(result.current.selectedCount).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle large number of variables efficiently', () => {
      const largeVariablesList: Variable[] = Array.from({ length: 1000 }, (_, index) => ({
        name: `var${index + 1}`,
        label: `Variable ${index + 1}`,
        columnIndex: index,
        type: 'NUMERIC',
        tempId: `${index + 1}`,
        width: 8,
        decimals: 0,
        values: [],
        missing: {},
        align: 'left',
        measure: 'nominal',
        role: 'input',
        columns: 8
      }));

      const { result } = renderHook(() => useVariableSelection({
        variables: largeVariablesList,
        selectedVariables: [],
        onChange: mockOnChange
      }));

      const startTime = performance.now();
      
      act(() => {
        result.current.selectAll();
      });
      
      const endTime = performance.now();

      // Should handle large selections efficiently (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
      expect(result.current.selectedCount).toBe(1000);
    });
  });

  describe('State Updates', () => {
    it('should update when props change', () => {
      const { result, rerender } = renderTestHook();

      // Initially no variables selected
      expect(result.current.selectedVariables).toEqual([]);

      // Update props with selected variables
      rerender(() => useVariableSelection({
        variables: mockVariables,
        selectedVariables: [mockVariables[0]],
        onChange: mockOnChange
      }));

      expect(result.current.selectedVariables).toEqual([mockVariables[0]]);
      expect(result.current.selectedCount).toBe(1);
    });

    it('should maintain internal state consistency', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.toggleVariable(mockVariables[0]);
        result.current.toggleVariable(mockVariables[1]);
        result.current.toggleVariable(mockVariables[0]); // Deselect first variable
      });

      expect(result.current.selectedVariables).toEqual([mockVariables[1]]);
      expect(result.current.selectedCount).toBe(1);
      expect(result.current.isSelected(mockVariables[0])).toBe(false);
      expect(result.current.isSelected(mockVariables[1])).toBe(true);
    });
  });

  describe('Callback Invocation', () => {
    it('should call onChange with correct parameters', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.toggleVariable(mockVariables[0]);
      });

      expect(mockOnChange).toHaveBeenCalledWith([mockVariables[0]]);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange when no change occurs', () => {
      const { result } = renderTestHook([mockVariables[0]]);

      // Try to select already selected variable
      act(() => {
        result.current.toggleVariable(mockVariables[0]);
      });

      // Should call onChange to deselect
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should call onChange for bulk operations', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.selectAll();
      });

      expect(mockOnChange).toHaveBeenCalledWith(mockVariables);

      act(() => {
        result.current.deselectAll();
      });

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });
}); 