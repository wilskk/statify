import { dataRepository } from "@/repositories";
import { DataRow } from "@/types/Data";
import db from "@/lib/db";

export class DataService {
  /**
   * Load all data from the database
   */
  async loadAllData() {
    try {
      const data = await dataRepository.getAllRows();
      return { data };
    } catch (error) {
      console.error("Error in DataService.loadAllData:", error);
      throw error;
    }
  }

  /**
   * Reset the database by clearing all data
   */
  async resetAllData() {
    try {
      await dataRepository.clearAllData();
      return true;
    } catch (error) {
      console.error("Error in DataService.resetAllData:", error);
      throw error;
    }
  }
  
  /**
   * Apply bulk updates to the data via repository.updateBulkCells for efficiency
   */
  async applyBulkUpdates(updates: { row: number; col: number; value: string | number }[]) {
    try {
      // Deduplicate row indices for return
      const updatedRowIndices = Array.from(new Set(updates.map(u => u.row)));
      // Delegate to repository for batch update in single transaction
      await dataRepository.updateBulkCells(updates);
      return updatedRowIndices;
    } catch (error) {
      console.error("Error in DataService.applyBulkUpdates:", error);
      throw error;
    }
  }

  /**
   * Group updates by row
   * @private
   */
  private _groupUpdatesByRow(updates: { row: number; col: number; value: string | number }[]) {
    const rowUpdates = new Map<number, { colIndices: number[], values: (string | number)[] }>();
    
    updates.forEach(({ row, col, value }) => {
      if (!rowUpdates.has(row)) {
        rowUpdates.set(row, { colIndices: [], values: [] });
      }
      
      const rowUpdate = rowUpdates.get(row)!;
      rowUpdate.colIndices.push(col);
      rowUpdate.values.push(value);
    });
    
    return rowUpdates;
  }
  
  /**
   * Update a single row with multiple column changes
   * @private
   */
  private async _updateSingleRow(
    rowIndex: number, 
    update: { colIndices: number[], values: (string | number)[] },
    currentData: DataRow[]
  ) {
    // Ensure the row exists and has enough columns
    await dataRepository.ensureRowExists(rowIndex, Math.max(...update.colIndices) + 1);
    
    // Get row data
    let rowData = currentData[rowIndex] || Array(Math.max(...update.colIndices) + 1).fill("");
    
    // Apply updates to this row
    update.colIndices.forEach((col: number, i: number) => {
      // Ensure row is long enough
      while (rowData.length <= col) {
        rowData.push("");
      }
      rowData[col] = update.values[i];
    });
    
    // Save the updated row
    await dataRepository.updateRow(rowIndex, rowData);
  }
  
  /**
   * Import data from a file or external source
   */
  async importData(data: DataRow[]) {
    try {
      // Clear existing data before import
      await dataRepository.clearAllData();
      
      // Insert all data rows
      await dataRepository.replaceAllData(data);
      
      return true;
    } catch (error) {
      console.error("Error in DataService.importData:", error);
      throw error;
    }
  }
  
  /**
   * Get data for a specific column
   */
  async getColumnData(columnIndex: number) {
    try {
      const data = await dataRepository.getAllRows();
      
      // Extract the column data
      const columnData = data.map(row => 
        columnIndex < row.length ? row[columnIndex] : ""
      );
      
      return { columnData };
    } catch (error) {
      console.error(`Error in DataService.getColumnData for column ${columnIndex}:`, error);
      throw error;
    }
  }

  /**
   * Replace all data with new rows
   */
  async replaceAllData(data: DataRow[]) {
    try {
      await dataRepository.clearAllData();
      
      // Insert data rows with sequential IDs
      if (data.length > 0) {
        await dataRepository.replaceAllData(data);
      }
      
      return true;
    } catch (error) {
      console.error("Error in DataService.replaceAllData:", error);
      throw error;
    }
  }

  /**
   * Update a single cell value
   */
  async updateCell(row: number, col: number, value: string | number) {
    return this.applyBulkUpdates([{ row, col, value }]);
  }
  
  /**
   * Add a new row at the specified index
   */
  async addRow(index?: number, data?: DataRow) {
    try {
      const allData = await dataRepository.getAllRows();
      const rowIndex = index !== undefined ? index : allData.length;
      const colCount = allData.length > 0 ? (allData[0]?.length ?? 0) : 0;
      
      // Create an empty row or use provided data
      const rowData = data || Array(colCount).fill("");
      
      // Shift rows with higher indices
      for (let i = allData.length - 1; i >= rowIndex; i--) {
        await dataRepository.updateRow(i + 1, allData[i]);
      }
      
      // Insert the new row
      await dataRepository.updateRow(rowIndex, rowData);
      
      return rowIndex;
    } catch (error) {
      console.error(`Error in DataService.addRow at index ${index}:`, error);
      throw error;
    }
  }
  
  /**
   * Add multiple rows at specified indices
   */
  async addBulkRows(indices: number[]) {
    try {
      // Sort indices in descending order to avoid shifting problems
      const sortedIndices = [...indices].sort((a, b) => b - a);
      
      // Get current data
      const allData = await dataRepository.getAllRows();
      const colCount = allData.length > 0 ? (allData[0]?.length ?? 0) : 0;
      
      // Add rows at each index
      for (const index of sortedIndices) {
        const rowIndex = index !== undefined ? index : allData.length;
        const emptyRow = Array(colCount).fill("");
        
        // Shift existing rows
        for (let i = allData.length - 1; i >= rowIndex; i--) {
          if (i < allData.length) {
            await dataRepository.updateRow(i + 1, allData[i]);
          }
        }
        
        // Insert the new row
        await dataRepository.updateRow(rowIndex, emptyRow);
        
        // Update our local copy of allData to reflect the change
        allData.splice(rowIndex, 0, emptyRow);
      }
      
      return true;
    } catch (error) {
      console.error("Error in DataService.addBulkRows:", error);
      throw error;
    }
  }
  
  /**
   * Delete a row at the specified index
   */
  async deleteRow(index: number) {
    try {
      const allData = await dataRepository.getAllRows();
      
      if (index < 0 || index >= allData.length) {
        throw new Error(`Invalid row index ${index} for deletion`);
      }
      
      // Remove the row at the specified index
      await db.transaction('rw', db.dataRows, async () => {
        // Delete the row at the specified index
        await db.dataRows.delete(index);
        
        // Shift all rows with higher indices down
        for (let i = index + 1; i < allData.length; i++) {
          const rowData = allData[i];
          // Delete the old position
          await db.dataRows.delete(i);
          // Add at the new position
          await db.dataRows.add({ id: i - 1, data: rowData });
        }
      });
      
      return true;
    } catch (error) {
      console.error(`Error in DataService.deleteRow at index ${index}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete multiple rows at specified indices
   */
  async deleteBulkRows(indices: number[]) {
    try {
      const allData = await dataRepository.getAllRows();
      
      // Validate indices
      for (const index of indices) {
        if (index < 0 || index >= allData.length) {
          throw new Error(`Invalid row index ${index} for deletion`);
        }
      }
      
      // Sort indices in descending order to avoid shifting problems
      const sortedIndices = [...indices].sort((a, b) => b - a);
      
      // Use a transaction to ensure consistency
      await db.transaction('rw', db.dataRows, async () => {
        // Create a map to track shifts for remaining rows
        const rowShifts = new Map<number, number>();
        let totalShift = 0;
        
        // First, delete all rows at the specified indices
        for (const index of sortedIndices) {
          await db.dataRows.delete(index);
          totalShift++;
          
          // Update the shift amount for all rows after this one
          for (let i = index + 1; i < allData.length; i++) {
            if (!indices.includes(i)) {
              rowShifts.set(i, (rowShifts.get(i) || 0) + 1);
            }
          }
        }
        
        // Now reposition all the remaining rows that need to be shifted
        for (let i = 0; i < allData.length; i++) {
          const shift = rowShifts.get(i) || 0;
          if (shift > 0 && !indices.includes(i)) {
            const rowData = allData[i];
            // Add at the new position
            await db.dataRows.add({ id: i - shift, data: rowData });
            // Delete from the old position if it still exists
            await db.dataRows.delete(i);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error in DataService.deleteBulkRows:", error);
      throw error;
    }
  }

  /**
   * Add a column at the specified index
   */
  async addColumn(index?: number) {
    try {
      const allData = await dataRepository.getAllRows();
      const colIndex = index !== undefined ? index : (allData.length > 0 ? (allData[0]?.length ?? 0) : 0);
      
      // Add a new column to each row
      for (let i = 0; i < allData.length; i++) {
        const rowData = [...allData[i]];
        rowData.splice(colIndex, 0, "");
        await dataRepository.updateRow(i, rowData);
      }
      
      return colIndex;
    } catch (error) {
      console.error(`Error in DataService.addColumn at index ${index}:`, error);
      throw error;
    }
  }
  
  /**
   * Add multiple columns at specified indices
   */
  async addBulkColumns(indices: number[]) {
    try {
      if (!indices || indices.length === 0) return false;
      
      // Sort indices in descending order to avoid shifting problems
      const sortedIndices = [...indices].sort((a, b) => b - a);
      
      // Get current data
      const allData = await dataRepository.getAllRows();
      
      // Add columns to each row
      for (let rowIndex = 0; rowIndex < allData.length; rowIndex++) {
        let rowData = [...allData[rowIndex]];
        
        // Add columns at the specified indices
        for (const colIndex of sortedIndices) {
          const targetIndex = colIndex !== undefined ? colIndex : rowData.length;
          rowData.splice(targetIndex, 0, "");
        }
        
        // Update the row
        await dataRepository.updateRow(rowIndex, rowData);
      }
      
      return true;
    } catch (error) {
      console.error("Error in DataService.addBulkColumns:", error);
      throw error;
    }
  }
  
  /**
   * Delete a column at the specified index
   */
  async deleteColumn(index: number) {
    try {
      const allData = await dataRepository.getAllRows();
      
      if (allData.length === 0) {
        return true; // Nothing to delete
      }
      
      const colCount = allData[0]?.length ?? 0;
      if (index < 0 || index >= colCount) {
        throw new Error(`Invalid column index ${index} for deletion`);
      }
      
      // Remove the column from each row
      for (let i = 0; i < allData.length; i++) {
        if (allData[i] && index < allData[i].length) {
          const rowData = [...allData[i]];
          rowData.splice(index, 1);
          await dataRepository.updateRow(i, rowData);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error in DataService.deleteColumn at index ${index}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete multiple columns at specified indices
   */
  async deleteBulkColumns(indices: number[]) {
    try {
      if (!indices || indices.length === 0) return true;
      
      const allData = await dataRepository.getAllRows();
      
      if (allData.length === 0) {
        return true; // Nothing to delete
      }
      
      const colCount = allData[0]?.length ?? 0;
      
      // Validate indices
      for (const index of indices) {
        if (index < 0 || index >= colCount) {
          throw new Error(`Invalid column index ${index} for deletion`);
        }
      }
      
      // Sort indices in descending order to avoid shifting problems
      const sortedIndices = [...indices].sort((a, b) => b - a);
      
      // Remove columns from each row
      for (let rowIndex = 0; rowIndex < allData.length; rowIndex++) {
        if (allData[rowIndex]) {
          let rowData = [...allData[rowIndex]];
          
          // Remove columns at the specified indices
          for (const colIndex of sortedIndices) {
            if (colIndex < rowData.length) {
              rowData.splice(colIndex, 1);
            }
          }
          
          // Update the row
          await dataRepository.updateRow(rowIndex, rowData);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error in DataService.deleteBulkColumns:", error);
      throw error;
    }
  }

  /**
   * Swap two rows in the dataset
   */
  async swapRows(row1: number, row2: number) {
    try {
      const allData = await dataRepository.getAllRows();
      
      // Validate row indices
      if (row1 < 0 || row2 < 0 || row1 >= allData.length || row2 >= allData.length || row1 === row2) {
        throw new Error(`Invalid row indices for swapping: ${row1}, ${row2}`);
      }
      
      // Get the row data
      const rowData1 = [...allData[row1]];
      const rowData2 = [...allData[row2]];
      
      // Swap the rows
      await db.transaction('rw', db.dataRows, async () => {
        await dataRepository.updateRow(row1, rowData2);
        await dataRepository.updateRow(row2, rowData1);
      });
      
      return true;
    } catch (error) {
      console.error(`Error in DataService.swapRows for rows ${row1}, ${row2}:`, error);
      throw error;
    }
  }
  
  /**
   * Swap two columns in the dataset
   */
  async swapColumns(col1: number, col2: number) {
    try {
      const allData = await dataRepository.getAllRows();
      
      if (allData.length === 0) {
        return true; // Nothing to swap
      }
      
      const colCount = allData[0]?.length ?? 0;
      
      // Validate column indices
      if (col1 < 0 || col2 < 0 || col1 >= colCount || col2 >= colCount || col1 === col2) {
        throw new Error(`Invalid column indices for swapping: ${col1}, ${col2}`);
      }
      
      // Swap columns in each row
      for (let i = 0; i < allData.length; i++) {
        if (allData[i] && col1 < allData[i].length && col2 < allData[i].length) {
          const rowData = [...allData[i]];
          [rowData[col1], rowData[col2]] = [rowData[col2], rowData[col1]];
          await dataRepository.updateRow(i, rowData);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error in DataService.swapColumns for columns ${col1}, ${col2}:`, error);
      throw error;
    }
  }
  
  /**
   * Sort the data by a specific column
   */
  async sortData(columnIndex: number, direction: 'asc' | 'desc') {
    try {
      const allData = await dataRepository.getAllRows();
      
      if (allData.length === 0) {
        return true; // Nothing to sort
      }
      
      // Sort the data
      const sortedData = [...allData].sort((rowA, rowB) => {
        const valueA = columnIndex < (rowA?.length ?? 0) ? rowA[columnIndex] : "";
        const valueB = columnIndex < (rowB?.length ?? 0) ? rowB[columnIndex] : "";
        const isANumeric = typeof valueA === 'number' || (typeof valueA === 'string' && valueA !== "" && !isNaN(Number(valueA)));
        const isBNumeric = typeof valueB === 'number' || (typeof valueB === 'string' && valueB !== "" && !isNaN(Number(valueB)));
        
        if (isANumeric && isBNumeric) {
          const numA = typeof valueA === 'number' ? valueA : Number(valueA);
          const numB = typeof valueB === 'number' ? valueB : Number(valueB);
          return direction === 'asc' ? numA - numB : numB - numA;
        }
        
        if (isANumeric && !isBNumeric) return direction === 'asc' ? -1 : 1;
        if (!isANumeric && isBNumeric) return direction === 'asc' ? 1 : -1;
        
        const strA = String(valueA ?? '').toLowerCase();
        const strB = String(valueB ?? '').toLowerCase();
        return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
      
      // Replace all data
      await this.replaceAllData(sortedData);
      
      return true;
    } catch (error) {
      console.error(`Error in DataService.sortData for column ${columnIndex}:`, error);
      throw error;
    }
  }
}

const dataService = new DataService();
export default dataService; 