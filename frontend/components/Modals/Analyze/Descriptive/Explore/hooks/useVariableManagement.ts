import { useState, useEffect, useCallback } from 'react';
import type { Variable } from "@/types/Variable";
import { useVariableStore } from "@/stores/useVariableStore";
import { HighlightedVariable } from '../types';

export interface VariableManagementState {
    availableVariables: Variable[];
    dependentVariables: Variable[];
    factorVariables: Variable[];
    labelVariable: Variable | null;
    highlightedVariable: HighlightedVariable | null;
}

export interface VariableManagementHandlers {
    moveToDependentVariables: (variable: Variable, targetIndex?: number) => void;
    moveToFactorVariables: (variable: Variable, targetIndex?: number) => void;
    moveToLabelVariable: (variable: Variable) => void;
    moveToAvailableVariables: (variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => void;
    reorderVariables: (source: 'dependent' | 'factor', reorderedList: Variable[]) => void;
    setHighlightedVariable: (variable: HighlightedVariable | null) => void;
    resetVariableSelections: () => void;
}

export type UseVariableManagementResult = VariableManagementState & VariableManagementHandlers;

export const useVariableManagement = (): UseVariableManagementResult => {
    // Some Jest mocks replace useVariableStore with a simple jest.fn() that does not
    // support selector functions. Attempt selector first, then fall back to getState.
    let allVariables = useVariableStore((state: any) => state.variables as Variable[]);
    if (!Array.isArray(allVariables)) {
        // Fallback for tests where the selector form isn't implemented
        allVariables = (typeof (useVariableStore as any).getState === 'function')
            ? (useVariableStore as any).getState().variables
            : [];
    }

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [dependentVariables, setDependentVariables] = useState<Variable[]>([]);
    const [factorVariables, setFactorVariables] = useState<Variable[]>([]);
    const [labelVariable, setLabelVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);

    const getInitialAvailable = useCallback(() => {
        return allVariables
            .filter(v => v.name !== "")
            .map(v => ({ ...v, tempId: v.tempId || `temp_${v.columnIndex}` }))
            .sort((a, b) => a.columnIndex - b.columnIndex);
    }, [allVariables]);

    useEffect(() => {
        const initialVars = getInitialAvailable();
        const dependentTempIds = new Set(dependentVariables.map(v => v.tempId));
        const factorTempIds = new Set(factorVariables.map(v => v.tempId));
        const labelTempId = labelVariable?.tempId;

        const finalAvailable = initialVars.filter(v =>
            v.tempId &&
            !dependentTempIds.has(v.tempId) &&
            !factorTempIds.has(v.tempId) &&
            (!labelTempId || v.tempId !== labelTempId)
        );
        setAvailableVariables(finalAvailable);
    }, [allVariables, dependentVariables, factorVariables, labelVariable, getInitialAvailable]);

    const moveToDependentVariables = useCallback((variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) return;
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setDependentVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) return prev;
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        setHighlightedVariable(null);
    }, []);

    const moveToFactorVariables = useCallback((variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) return;
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setFactorVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) return prev;
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        setHighlightedVariable(null);
    }, []);

    const moveToLabelVariable = useCallback((variable: Variable) => {
        if (!variable.tempId) return;
        if (labelVariable && labelVariable.tempId) {
            setAvailableVariables(prev => {
                if (!prev.some(v => v.tempId === labelVariable.tempId)) {
                    const newList = [...prev, labelVariable];
                    newList.sort((a, b) => a.columnIndex - b.columnIndex);
                    return newList;
                }
                return prev;
            });
        }
        setLabelVariable(variable);
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setHighlightedVariable(null);
    }, [labelVariable]);

    const moveToAvailableVariables = useCallback((variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => {
        if (!variable.tempId) return;
        if (source === 'dependent') setDependentVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        else if (source === 'factor') setFactorVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        else if (source === 'label') setLabelVariable(null);

        setAvailableVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) return prev;
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            newList.sort((a, b) => a.columnIndex - b.columnIndex);
            return newList;
        });
        setHighlightedVariable(null);
    }, []);

    const reorderVariables = useCallback((source: 'dependent' | 'factor', reorderedList: Variable[]) => {
        if (source === 'dependent') setDependentVariables([...reorderedList]);
        else if (source === 'factor') setFactorVariables([...reorderedList]);
    }, []);
    
    const resetVariableSelections = useCallback(() => {
        setDependentVariables([]);
        setFactorVariables([]);
        setLabelVariable(null);
        setAvailableVariables(getInitialAvailable());
        setHighlightedVariable(null);
    }, [getInitialAvailable]);

    return {
        availableVariables,
        dependentVariables,
        factorVariables,
        labelVariable,
        highlightedVariable,
        moveToDependentVariables,
        moveToFactorVariables,
        moveToLabelVariable,
        moveToAvailableVariables,
        reorderVariables,
        setHighlightedVariable,
        resetVariableSelections
    };
}; 