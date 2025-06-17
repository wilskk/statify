import { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import type { Variable } from '@/types/Variable';
import type { DataRow } from '@/types/Data';
import { dateStringToSpssSeconds } from '@/utils/spssDateConverter';
import { spssDateTypes } from '@/types/Variable';

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
        if (!cancelled) {
          let processedData = result.data;
          if (spssDateTypes.has(variable.type) && variable.width === 11) {
            // Convert SPSS date format 'dd-mm-yyyy' to 'dd/mm/yyyy'
            processedData = processedData.map(val =>
              typeof val === 'string'
                ? val.replace(/-/g, '/')
                : val
            );
          }
          setData(processedData);
        }
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

/**
 * Interface for the return value of useAnalysisData.
 */
export interface AnalysisData {
  /** The processed data, filtered by the active 'select case' variable. */
  data: DataRow[];
  /** An array of weights corresponding to each row in `data`. Defaults to 1 if no weight variable is set. */
  weights: number[];
  /** The variable currently used for filtering ('select case'). */
  filterVariable?: Variable;
  /** The variable currently used for weighting. */
  weightVariable?: Variable;
}

/**
 * A centralized hook to get data for statistical analysis.
 * It automatically applies 'select case' (filtering) and 'weight' logic
 * based on the global settings in `useMetaStore`.
 *
 * @returns {AnalysisData} An object containing the filtered data, corresponding weights, and the variables used.
 */
export function useAnalysisData(): AnalysisData {
  const allData = useDataStore(state => state.data);
  const variables = useVariableStore(state => state.variables);
  const { filter: filterVarName, weight: weightVarName } = useMetaStore(state => state.meta);

  const filterVariable = useMemo(() => 
    variables.find(v => v.name === filterVarName),
    [variables, filterVarName]
  );
  
  const weightVariable = useMemo(() =>
    variables.find(v => v.name === weightVarName),
    [variables, weightVarName]
  );

  const filteredData = useMemo(() => {
    if (!filterVariable) {
      return allData;
    }
    const filterColumnIndex = filterVariable.columnIndex;
    return allData.filter(row => {
      const value = row[filterColumnIndex];
      // A case is included if the filter variable value is not 0, empty, null, or undefined.
      return value !== 0 && value !== '' && value !== null && value !== undefined;
    });
  }, [allData, filterVariable]);

  const weights = useMemo(() => {
    return filteredData.map(row => {
      if (!weightVariable) {
        return 1; // Default weight is 1
      }
      const weightColumnIndex = weightVariable.columnIndex;
      const value = row[weightColumnIndex];
      
      if (typeof value === 'number' && !isNaN(value) && value > 0) {
        return value;
      }
      if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
      // Cases with invalid, zero, or negative weights are typically excluded
      // from analysis by statistical procedures, but here we'll return 0
      // and let the specific procedure handle it.
      return 0;
    });
  }, [filteredData, weightVariable]);

  return {
    data: filteredData,
    weights,
    filterVariable,
    weightVariable
  };
}
