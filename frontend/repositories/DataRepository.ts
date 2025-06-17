import db from "@/lib/db";
import { DataRow } from "@/types/Data";

export class DataRepository {
  async getAllRows(): Promise<DataRow[]> {
    try {
      const dataRows = await db.dataRows.toArray();
      
      // Sort by ID to ensure correct order
      dataRows.sort((a, b) => a.id - b.id);
      
      // Create a sparse array with the correct indices
      const result: DataRow[] = [];
      dataRows.forEach(row => {
        result[row.id] = row.data;
      });
      
      // Fill any gaps with empty rows
      for (let i = 0; i < result.length; i++) {
        if (!result[i]) {
          const columnsCount = result.find(r => r)?.length || 0;
          result[i] = Array(columnsCount).fill("");
        }
      }
      
      return result;
    } catch (error) {
      console.error("Failed to load data:", error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await db.dataRows.clear();
    } catch (error) {
      console.error("Failed to reset data:", error);
      throw error;
    }
  }

  async updateRow(rowIndex: number, rowData: DataRow): Promise<void> {
    try {
      // Check if this row already exists in DB by ID (not array position)
      const existingRow = await db.dataRows.get(rowIndex);
      
      if (existingRow) {
        await db.dataRows.update(rowIndex, { data: rowData });
      } else {
        await db.dataRows.add({ id: rowIndex, data: rowData });
      }
    } catch (error) {
      console.error(`Failed to update row ${rowIndex}:`, error);
      throw error;
    }
  }

  async updateRows(rowIndices: number[], data: DataRow[]): Promise<void> {
    try {
      await db.transaction('rw', db.dataRows, async () => {
        // Update or add each affected row
        for (const rowIndex of rowIndices) {
          if (rowIndex < data.length) {
            const rowData = data[rowIndex];
            // Check if this row already exists by ID
            const existingRow = await db.dataRows.get(rowIndex);
            
            if (existingRow) {
              await db.dataRows.update(rowIndex, { data: rowData });
            } else {
              await db.dataRows.add({ id: rowIndex, data: rowData });
            }
          }
        }
      });
    } catch (error) {
      console.error("Failed to update rows:", error);
      throw error;
    }
  }

  /**
   * Replace all data at once
   */
  async replaceAllData(dataRows: DataRow[]) {
    try {
      return await db.transaction('rw', db.dataRows, async () => {
        await db.dataRows.clear();
        
        // Batch add operations for better performance
        const rowsToAdd = dataRows.map((data, index) => ({ 
          id: index, 
          data 
        }));
        
        return await db.dataRows.bulkAdd(rowsToAdd);
      });
    } catch (error) {
      console.error("Failed to replace all data:", error);
      throw error;
    }
  }
  
  async ensureRowExists(rowIndex: number, columnCount: number): Promise<void> {
    try {
      // Check if row exists
      const existingRow = await db.dataRows.get(rowIndex);
      
      if (!existingRow) {
        // Create empty row with the right number of columns
        const emptyRow = Array(columnCount).fill("");
        await db.dataRows.add({ id: rowIndex, data: emptyRow });
      }
    } catch (error) {
      console.error(`Failed to ensure row ${rowIndex} exists:`, error);
      throw error;
    }
  }

  /**
   * Perform multiple cell updates and deletes in a single transaction
   */
  async updateBulkCells(
    cells: Array<{ row: number, col: number, value: string | number }>,
    keysToDelete?: Array<[number, number]>
  ): Promise<void> {
    try {
      await db.transaction('rw', db.dataRows, async () => {
        // Group updates by row for efficiency
        const rowUpdates = new Map<number, { cols: number[], values: (string | number)[] }>();
        
        // Process updates
        for (const cell of cells) {
          const { row, col, value } = cell;
          
          if (!rowUpdates.has(row)) {
            rowUpdates.set(row, { cols: [], values: [] });
          }
          
          const update = rowUpdates.get(row)!;
          update.cols.push(col);
          update.values.push(value);
        }
        
        // Apply all updates grouped by row
        for (const rowEntry of Array.from(rowUpdates.entries())) {
          const rowIndex = rowEntry[0];
          const update = rowEntry[1];
          
          // First ensure the row exists
          await this.ensureRowExists(rowIndex, Math.max(...update.cols) + 1);
          
          // Get current row data
          const existingRow = await db.dataRows.get(rowIndex);
          let rowData = existingRow ? [...existingRow.data] : [];
          
          // Apply all column updates to this row
          update.cols.forEach((col: number, i: number) => {
            // Ensure array is long enough
            while (rowData.length <= col) {
              rowData.push("");
            }
            rowData[col] = update.values[i];
          });
          
          // Update the row in the database
          if (existingRow) {
            await db.dataRows.update(rowIndex, { data: rowData });
          } else {
            await db.dataRows.add({ id: rowIndex, data: rowData });
          }
        }
        
        // Process deletes (if any) - convert to row operations
        if (keysToDelete && keysToDelete.length > 0) {
          const rowsToUpdate = new Set<number>();
          
          // Group by row index
          for (const keyPair of keysToDelete) {
            const [col, row] = keyPair;
            rowsToUpdate.add(row);
          }
          
          // For each affected row, update the specific columns to empty string
          for (const rowIndex of Array.from(rowsToUpdate)) {
            const existingRow = await db.dataRows.get(rowIndex);
            if (existingRow) {
              const rowData = [...existingRow.data];
              
              // Set each deleted cell to empty string
              for (const keyPair of keysToDelete) {
                const [col, row] = keyPair;
                if (row === rowIndex && col < rowData.length) {
                  rowData[col] = "";
                }
              }
              
              // Update the row
              await db.dataRows.update(rowIndex, { data: rowData });
            }
          }
        }
      });
    } catch (error) {
      console.error("Failed to update bulk cells:", error);
      throw error;
    }
  }
}

const dataRepository = new DataRepository();
export default dataRepository; 