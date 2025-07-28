import { useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { getVariableIcon } from '@/components/Common/iconHelper';
import { createDefaultVariable } from '@/stores/useVariableStore';
import { getColumnConfig } from '../utils/utils';
import { DataRow } from '@/types/Data';
import { MIN_ROWS, MIN_COLS } from '../constants';
import { useTableRefStore } from '@/stores/useTableRefStore';

/**
 * A custom hook that centralizes the logic for calculating table dimensions
 * and generating the structure (headers, columns, data grid) for the DataTable.
 *
 * This hook combines the responsibilities of the previous `useTableDimensions`
 * and `useTableStructure` hooks to create a more streamlined and efficient
 * data flow, reducing prop-drilling and simplifying the main DataTable component.
 *
 * @returns An object containing all necessary properties for rendering the Handsontable instance,
 * including dimensions, column configurations, headers, and the data matrix.
 */
export const useTableLayout = () => {
    // 1. Subscribe to necessary stores
    const data = useDataStore(state => state.data);
    const variables = useVariableStore(state => state.variables);
    const { viewMode } = useTableRefStore();

    // 2. Calculate Actual Dimensions
    const actualNumRows = useMemo(() => data?.length ?? 0, [data]);

    const actualNumCols = useMemo(() => {
        if ((!variables || variables.length === 0) && (!data || data.length === 0)) {
            return 0;
        }
        const maxVarIndex = variables.length > 0 ? Math.max(...variables.map(v => v.columnIndex)) : -1;
        const maxDataCols = data?.[0]?.length ?? 0;
        return Math.max(maxVarIndex + 1, maxDataCols);
    }, [variables, data]);

    // 3. Determine Visual Grid Size (enforcing minimums)
    const targetVisualDataRows = useMemo(() => Math.max(actualNumRows, MIN_ROWS), [actualNumRows]);
    const targetVisualDataCols = useMemo(() => Math.max(actualNumCols, MIN_COLS), [actualNumCols]);

    // 4. Calculate Final Display Dimensions (adding a spare row/column for UI)
    const displayNumRows = useMemo(() => targetVisualDataRows + 1, [targetVisualDataRows]);
    const displayNumCols = useMemo(() => targetVisualDataCols + 1, [targetVisualDataCols]);

    // Create a stable variable map for O(1) lookups
    const variableMap = useMemo(() => {
        const map = new Map();
        variables.forEach(v => map.set(v.columnIndex, v));
        return map;
    }, [variables]);

    // Cache for rendered column headers to avoid excessive DOM manipulation
    const headerCacheRef = useRef<Map<string, string>>(new Map());
    const lastVariablesHashRef = useRef<string>('');

    // 5. Generate Column Headers with cached rendering
    const colHeaders = useMemo(() => {
        // Create a hash of variables to detect changes
        const variablesHash = variables.map(v => `${v.columnIndex}-${v.name}-${v.type}`).join('|');
        
        // Clear cache if variables changed
        if (lastVariablesHashRef.current !== variablesHash) {
            headerCacheRef.current.clear();
            lastVariablesHashRef.current = variablesHash;
        }

        return Array.from({ length: displayNumCols }, (_, colIndex) => {
            const variable = variableMap.get(colIndex);
            if (variable) {
                const cacheKey = `${variable.columnIndex}-${variable.name}-${variable.type}`;
                
                // Check cache first
                if (headerCacheRef.current.has(cacheKey)) {
                    return headerCacheRef.current.get(cacheKey)!;
                }
                
                // Render and cache the result
                const icon = getVariableIcon(variable);
                const view = renderToStaticMarkup(icon);
                const headerHtml = `<div class="col-header-container">${view}<span class="colHeader">${variable.name}</span></div>`;
                
                headerCacheRef.current.set(cacheKey, headerHtml);
                return headerHtml;
            }
            if (colIndex < targetVisualDataCols) {
                return `var`; // Header for uninitialized but allocated columns
            }
            return ''; // Spare column header is empty
        });
    }, [variableMap, displayNumCols, targetVisualDataCols, variables]);

    // 6. Generate Column Configurations for Handsontable with optimized lookups
    const columns = useMemo(() => {
        return Array.from({ length: displayNumCols }, (_, colIndex) => {
            const variable = variableMap.get(colIndex);
            return getColumnConfig(variable, viewMode);
        });
    }, [variableMap, displayNumCols, viewMode]);

    // Cache for data hash to detect actual data changes
    const dataHashRef = useRef<string>('');
    const cachedDisplayDataRef = useRef<DataRow[]>([]);
    
    // 7. Construct the Data Matrix for Display with optimized memoization
    const displayData = useMemo(() => {
        // Create a lightweight hash of the data to detect actual changes
        const dataHash = `${actualNumRows}-${actualNumCols}-${targetVisualDataRows}-${targetVisualDataCols}-${data?.length || 0}`;
        
        // Only recreate matrix if dimensions or data structure actually changed
        if (dataHashRef.current === dataHash && cachedDisplayDataRef.current.length > 0) {
            return cachedDisplayDataRef.current;
        }
        
        // Pre-allocate matrix for better performance
        const matrix: DataRow[] = new Array(targetVisualDataRows);
        for (let i = 0; i < targetVisualDataRows; i++) {
            matrix[i] = new Array(targetVisualDataCols).fill(null);
        }
        
        // Only copy existing data, avoid unnecessary iterations
        if (data && data.length > 0) {
            const rowsToCopy = Math.min(actualNumRows, targetVisualDataRows);
            for (let i = 0; i < rowsToCopy; i++) {
                if (data[i]) {
                    const colsToCopy = Math.min(data[i].length, targetVisualDataCols);
                    for (let j = 0; j < colsToCopy; j++) {
                        matrix[i][j] = data[i][j] ?? null;
                    }
                }
            }
        }
        
        // Cache the result
        dataHashRef.current = dataHash;
        cachedDisplayDataRef.current = matrix;
        
        return matrix;
    }, [data, actualNumRows, actualNumCols, targetVisualDataRows, targetVisualDataCols]);


    // 8. Return all computed values
    return {
        // Dimensions
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
        // Structure
        colHeaders,
        columns,
        displayData,
    };
};