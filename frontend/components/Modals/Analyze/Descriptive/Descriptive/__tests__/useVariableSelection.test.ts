import { renderHook, act } from '@testing-library/react';
import { useVariableSelection } from '../hooks/useVariableSelection';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable } from '@/types/Variable';

jest.mock('@/stores/useVariableStore');

const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;

const mockVariables: Variable[] = [
    { name: 'VarA', columnIndex: 0, tempId: 't0' },
    { name: 'VarB', columnIndex: 1, tempId: 't1' },
    { name: '', columnIndex: 2, tempId: 't2' }, // Empty name, should be filtered out
    { name: 'VarC', columnIndex: 3, tempId: 't3' },
] as Variable[];

describe('useVariableSelection', () => {
    beforeEach(() => {
        mockedUseVariableStore.mockReturnValue({ variables: mockVariables });
    });

    it('initializes with available variables from store, filtering out empty names', () => {
        const { result } = renderHook(() => useVariableSelection({}));
        
        expect(result.current.availableVariables.length).toBe(3);
        expect(result.current.availableVariables.map(v => v.name)).toEqual(['VarA', 'VarB', 'VarC']);
        expect(result.current.selectedVariables).toEqual([]);
    });

    it('moves a variable to the selected list', () => {
        const { result } = renderHook(() => useVariableSelection({}));
        
        const varToMove = result.current.availableVariables[0];
        act(() => {
            result.current.moveToSelectedVariables(varToMove);
        });

        expect(result.current.selectedVariables.length).toBe(1);
        expect(result.current.selectedVariables[0].name).toBe('VarA');
        expect(result.current.availableVariables.length).toBe(2);
        expect(result.current.availableVariables.map(v => v.name)).not.toContain('VarA');
    });

    it('moves a variable back to the available list', () => {
        const { result } = renderHook(() => useVariableSelection({}));
        
        act(() => {
            result.current.moveToSelectedVariables(result.current.availableVariables[0]);
        });

        const varToMoveBack = result.current.selectedVariables[0];
        act(() => {
            result.current.moveToAvailableVariables(varToMoveBack);
        });

        expect(result.current.selectedVariables.length).toBe(0);
        expect(result.current.availableVariables.length).toBe(3);
        expect(result.current.availableVariables.map(v => v.name)).toContain('VarA');
    });

    it('reorders variables in the selected list', () => {
        const { result } = renderHook(() => useVariableSelection({}));

        act(() => {
            result.current.moveToSelectedVariables(result.current.availableVariables[0]); // VarA
            result.current.moveToSelectedVariables(result.current.availableVariables[1]); // VarB
        });

        expect(result.current.selectedVariables.map(v => v.name)).toEqual(['VarA', 'VarB']);

        const reorderedList = [result.current.selectedVariables[1], result.current.selectedVariables[0]];
        act(() => {
            result.current.reorderVariables('selected', reorderedList);
        });

        expect(result.current.selectedVariables.map(v => v.name)).toEqual(['VarB', 'VarA']);
    });
    
    it('resets the selection', () => {
        const { result } = renderHook(() => useVariableSelection({}));
        
        act(() => {
            result.current.moveToSelectedVariables(result.current.availableVariables[0]);
        });
        expect(result.current.selectedVariables.length).toBe(1);

        act(() => {
            result.current.resetVariableSelection();
        });

        expect(result.current.selectedVariables.length).toBe(0);
        expect(result.current.availableVariables.length).toBe(3);
    });
}); 