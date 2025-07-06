import { useState, useCallback, useEffect } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import {
    HighlightedVariable,
    VariableSelectionProps,
    VariableSelectionResult
} from '../types';

export const useVariableSelection = ({
    initialVariables = []
}: VariableSelectionProps = {}): VariableSelectionResult => {
    const { variables } = useVariableStore();
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [testVariables, setTestVariables] = useState<Variable[]>(initialVariables);
    const [groupingVariable, setGroupingVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);

    useEffect(() => {
        // Tambahkan tempId ke semua variabel global jika belum ada
        const globalVarsWithTempId = variables.map(v => ({
            ...v,
            tempId: v.tempId || `temp_id_${v.columnIndex}`
        }));
        const globalVarTempIds = new Set(globalVarsWithTempId.map(v => v.tempId));

        // Sinkronisasi testVariables: hanya pertahankan yang masih ada di global
        const filteredTestVars = testVariables.filter(
            sv => sv.tempId && globalVarTempIds.has(sv.tempId)
        );

        if (
            filteredTestVars.length !== testVariables.length ||
            !filteredTestVars.every((val, idx) => val.tempId === testVariables[idx]?.tempId)
        ) {
            setTestVariables(filteredTestVars);
        }

        // Sinkronisasi groupingVariable: set null jika sudah tidak ada di global
        if (groupingVariable) {
            const groupingTempId = groupingVariable.tempId || `temp_id_${groupingVariable.columnIndex}`;
            if (!globalVarTempIds.has(groupingTempId)) {
                setGroupingVariable(null);
            }
        }

        // Update availableVariables: variabel yang tidak ada di testVariables dan groupingVariable
        const usedTempIds = new Set(filteredTestVars.map(v => v.tempId));
        if (groupingVariable) {
            usedTempIds.add(groupingVariable.tempId || `temp_id_${groupingVariable.columnIndex}`);
        }
        const newAvailableVariables = globalVarsWithTempId.filter(
            v => v.name !== "" && v.tempId && !usedTempIds.has(v.tempId)
        );
        setAvailableVariables(newAvailableVariables);

    }, [variables, testVariables, groupingVariable]);

    // Function to move a variable from available or grouping to test
    const moveToTestVariables = useCallback((variable: Variable, source: 'available' | 'grouping', targetIndex?: number) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };
        if (source === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        } else if (source === 'grouping') {
            setGroupingVariable(null);
        }
        
        setTestVariables(prev => {
            if (prev.some(v => v.tempId === variableWithTempId.tempId)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variableWithTempId);
            } else {
                newList.push(variableWithTempId);
            }
            return newList;
        });
        setHighlightedVariable(null);
    }, []);

    // Function to move a variable from available or test to grouping
    const moveToGroupingVariable = useCallback((variable: Variable, source: 'available' | 'test') => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };
        
        if (source === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        } else if (source === 'test') {
            setTestVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        }
        
        setGroupingVariable(variableWithTempId);
        setHighlightedVariable(null);
    }, [groupingVariable]);

    const moveToAvailableVariables = useCallback((variable: Variable, source: 'test' | 'grouping', targetIndex?: number) => {
        const variableWithTempId = {
            ...variable,
            tempId: variable.tempId || `temp_id_${variable.columnIndex}`
        };
        if (source === 'test') {
            setTestVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
        }
        else if (source === 'grouping') {
            setGroupingVariable(null);
        }

        setAvailableVariables(prev => {
            if (prev.some(v => v.tempId === variableWithTempId.tempId)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variableWithTempId);
            } else {
                newList.push(variableWithTempId);
            }
            newList.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
            return newList;
        });

        setHighlightedVariable(null);
    }, []);

    const reorderVariables = useCallback((source: 'available' | 'test', reorderedVariables: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...reorderedVariables]);
        } else if (source === 'test') {
            setTestVariables([...reorderedVariables]);
        }
    }, []);

    // Reset function
    const resetVariableSelection = useCallback(() => {
        const validVars = variables.filter(v => v.type === 'NUMERIC' && v.name !== "");
        setAvailableVariables(validVars);
        setTestVariables([]);
        setGroupingVariable(null);
        setHighlightedVariable(null);
    }, [variables]);
    
    return {
        availableVariables,
        testVariables,
        groupingVariable,
        highlightedVariable,
        setHighlightedVariable,
        moveToTestVariables,
        moveToGroupingVariable,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    };
};

export default useVariableSelection;