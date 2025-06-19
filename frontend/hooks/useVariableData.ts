import { useState, useEffect } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
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
