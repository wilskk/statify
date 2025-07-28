import { useTableDimensions } from './useTableDimensions';
import { useColumnHeaders } from './useColumnHeaders';
import { useColumnConfigs } from './useColumnConfigs';
import { useDisplayData } from './useDisplayData';

/**
 * Hook yang telah direfactor untuk mengurangi kompleksitas dan mencegah memory leaks.
 * Menggunakan komposisi hooks yang lebih kecil untuk better separation of concerns.
 * 
 * @returns Object berisi semua properti yang diperlukan untuk rendering Handsontable instance
 */
export const useTableLayout = () => {
    // 1. Hitung dimensi tabel
    const dimensions = useTableDimensions();
    const {
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols,
        displayNumRows,
        displayNumCols,
    } = dimensions;

    // 2. Generate column headers dengan caching dan cleanup
    const { colHeaders, variableMap } = useColumnHeaders(displayNumCols, targetVisualDataCols);

    // 3. Generate column configurations
    const { columns } = useColumnConfigs(variableMap, displayNumCols);

    // 4. Construct display data matrix dengan optimisasi
    const { displayData } = useDisplayData(
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols
    );

    // 5. Return semua computed values
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