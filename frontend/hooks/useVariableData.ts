import { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import type { Variable } from '@/types/Variable';
import type { DataRow } from '@/types/Data';

export function useVariableData(variableName: string) {
  const variable = useVariableStore(state => state.variables.find(v => v.name === variableName));
  const getVariableData = useDataStore(state => state.getVariableData);
  const [data, setData] = useState<(string|number)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error|null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      if (!variable) {
        setData([]);
        setLoading(false);
        return;
      }
      try {
        const result = await getVariableData(variable);
        if (!cancelled) setData(result.data);
      } catch (err: any) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [variableName, variable, getVariableData]);

  return { data, loading, error, variable };
}

export function useFilteredData(): { data: DataRow[]; variable?: Variable } {
  const data = useDataStore(state => state.data);
  const variables = useVariableStore(state => state.variables);
  const filterVarName = useMetaStore(state => state.meta.filter);
  const filterVariable = variables.find(v => v.name === filterVarName);

  const filtered = useMemo(() => {
    if (!filterVariable) return data;
    const idx = filterVariable.columnIndex;
    return data.filter(row => {
      const val = row[idx];
      return val !== 0 && val !== '' && val !== null && val !== undefined;
    });
  }, [data, filterVariable]);

  return { data: filtered, variable: filterVariable };
}

export function useWeightedData(): { data: DataRow[]; weights: number[]; variable?: Variable } {
  const data = useDataStore(state => state.data);
  const variables = useVariableStore(state => state.variables);
  const weightVarName = useMetaStore(state => state.meta.weight);
  const weightVariable = variables.find(v => v.name === weightVarName);

  const result = useMemo(() => {
    const weights = data.map(row => {
      if (weightVariable) {
        const val = row[weightVariable.columnIndex];
        if (typeof val === 'number') return val;
        const num = parseFloat(String(val));
        return isNaN(num) ? 0 : num;
      }
      return 1;
    });
    return { data, weights, variable: weightVariable };
  }, [data, weightVariable]);

  return result;
}
