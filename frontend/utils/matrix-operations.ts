import { DataRow } from "@/types/Data";

/**
 * Ensures a data matrix has the required dimensions
 * @param data Current data matrix
 * @param maxRow Maximum row index required (0-based)
 * @param maxCol Maximum column index required (0-based)
 * @param minColCount Minimum number of columns required (optional)
 * @returns Whether structure was changed
 */
export const ensureMatrixDimensions = (
  data: DataRow[],
  maxRow: number,
  maxCol: number,
  minColCount?: number
): {updatedData: DataRow[], changed: boolean} => {
  const effectiveMaxCol = minColCount !== undefined ? Math.max(maxCol, minColCount - 1) : maxCol;
  const currentRows = data?.length || 0;
  const initialCols = currentRows > 0 ? (data[0]?.length || 0) : 0;

  let structureChanged = false;
  const targetRows = maxRow + 1;
  const targetCols = Math.max(initialCols, effectiveMaxCol + 1);
  
  // Create a copy of the data to avoid direct mutation
  const result = [...data];

  // Only proceed if expansion is needed
  if (targetRows <= currentRows && targetCols <= initialCols) {
    return {updatedData: data, changed: false};
  }

  // Add rows if needed
  if (targetRows > currentRows) {
    const rowsToAdd = targetRows - currentRows;
    for (let i = 0; i < rowsToAdd; i++) {
      result.push(Array(targetCols).fill(""));
    }
    structureChanged = true;
  }

  // Ensure all rows have the target column width
  const finalRowCount = result.length;
  for (let i = 0; i < finalRowCount; i++) {
    const currentRowWidth = result[i]?.length || 0;
    if (!result[i] || currentRowWidth < targetCols) {
      const existingRowContent = result[i] || [];
      const colsToAdd = targetCols - currentRowWidth;
      if (colsToAdd > 0) {
        result[i] = [...existingRowContent, ...Array(colsToAdd).fill("")];
        structureChanged = true;
      }
    }
  }

  return {updatedData: result, changed: structureChanged};
};
