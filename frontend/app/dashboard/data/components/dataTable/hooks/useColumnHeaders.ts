import { useMemo, useRef, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useVariableStore } from '@/stores/useVariableStore';
import { getVariableIcon } from '@/components/Common/iconHelper';

/**
 * Hook untuk mengelola column headers dengan caching dan cleanup
 * Memisahkan logika header generation dari useTableLayout
 */
export const useColumnHeaders = (displayNumCols: number, targetVisualDataCols: number) => {
    const variables = useVariableStore(state => state.variables);
    
    // Cache untuk rendered column headers
    const headerCacheRef = useRef<Map<string, string>>(new Map());
    const lastVariablesHashRef = useRef<string>('');

    // Cleanup cache saat component unmount atau variables berubah drastis
    useEffect(() => {
        return () => {
            headerCacheRef.current.clear();
        };
    }, []);

    // Buat variable map untuk O(1) lookups
    const variableMap = useMemo(() => {
        const map = new Map();
        variables.forEach(v => map.set(v.columnIndex, v));
        return map;
    }, [variables]);

    // Generate Column Headers dengan cached rendering
    const colHeaders = useMemo(() => {
        // Buat hash dari variables untuk detect changes
        const variablesHash = variables.map(v => `${v.columnIndex}-${v.name}-${v.type}`).join('|');
        
        // Clear cache jika variables berubah
        if (lastVariablesHashRef.current !== variablesHash) {
            headerCacheRef.current.clear();
            lastVariablesHashRef.current = variablesHash;
        }

        return Array.from({ length: displayNumCols }, (_, colIndex) => {
            const variable = variableMap.get(colIndex);
            if (variable) {
                const cacheKey = `${variable.columnIndex}-${variable.name}-${variable.type}`;
                
                // Check cache terlebih dahulu
                if (headerCacheRef.current.has(cacheKey)) {
                    return headerCacheRef.current.get(cacheKey)!;
                }
                
                // Render dan cache hasilnya
                const icon = getVariableIcon(variable);
                const view = renderToStaticMarkup(icon);
                const headerHtml = `<div class="col-header-container">${view}<span class="colHeader">${variable.name}</span></div>`;
                
                headerCacheRef.current.set(cacheKey, headerHtml);
                return headerHtml;
            }
            if (colIndex < targetVisualDataCols) {
                return `var`; // Header untuk kolom yang belum diinisialisasi
            }
            return ''; // Spare column header kosong
        });
    }, [variableMap, displayNumCols, targetVisualDataCols, variables]);

    return {
        colHeaders,
        variableMap,
    };
};