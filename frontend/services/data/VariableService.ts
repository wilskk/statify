import { variableRepository } from "@/repositories";
import { Variable, ValueLabel } from "@/types/Variable";
import db from "@/lib/db";

export class VariableService {
  /**
   * Load all variables from the database
   */
  async getAllVariables() {
    try {
      const variables = await variableRepository.getAllVariables();
      return variables;
    } catch (error) {
      console.error("Error in VariableService.getAllVariables:", error);
      throw error;
    }
  }

  /**
   * Clear all variables from the database
   */
  async clearAllVariables() {
    try {
      await variableRepository.clearVariables();
      return true;
    } catch (error) {
      console.error("Error in VariableService.clearAllVariables:", error);
      throw error;
    }
  }

  /**
   * Get variable by name
   */
  async getVariableByName(name: string) {
    try {
      const variable = await variableRepository.getVariableByName(name);
      return variable;
    } catch (error) {
      console.error(`Error in VariableService.getVariableByName for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get variable by column index
   */
  async getVariableByColumnIndex(columnIndex: number) {
    try {
      const variable = await variableRepository.getVariableByColumnIndex(columnIndex);
      return variable;
    } catch (error) {
      console.error(`Error in VariableService.getVariableByColumnIndex for column ${columnIndex}:`, error);
      throw error;
    }
  }

  /**
   * Update or create a variable
   */
  async saveVariable(variable: Variable) {
    // Combined insert/update + value-labels rename in one Dexie transaction
    try {
      const id = await db.transaction('rw', [db.variables, db.valueLabels], async () => {
        // Save variable directly (insert or update)
        const savedId = await db.variables.put(variable);
        // If name changed, bulk modify labels
        if (variable.id !== undefined) {
          await db.valueLabels
            .where('variableName')
            .equals((await variableRepository.getVariableById(variable.id))?.name || '')
            .modify({ variableName: variable.name });
        }
        return savedId;
      });
      return id;
    } catch (error) {
      console.error("Error in VariableService.saveVariable:", error);
      throw error;
    }
  }

  /**
   * Delete a variable
   */
  async deleteVariable(id: number) {
    try {
      // Get variable first to also delete related value labels
      const variable = await variableRepository.getVariableById(id);
      
      if (variable) {
        await db.transaction('rw', [db.variables, db.valueLabels], async () => {
          // Delete the variable
          await variableRepository.deleteVariable(id);
          
          // Also delete associated value labels
          if (variable.name) {
            await variableRepository.deleteValueLabelsByVariable(variable.name);
          }
        });
      } else {
        await variableRepository.deleteVariable(id);
      }
      
      return true;
    } catch (error) {
      console.error(`Error in VariableService.deleteVariable for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Import variables
   */
  async importVariables(variables: Variable[]) {
    // Batch import via single transaction + bulk clear + bulk add + bulk modify labels
    try {
      await db.transaction('rw', [db.variables, db.valueLabels], async () => {
        // Map old names by columnIndex
        const existing = await db.variables.toArray();
        const oldNameMap = new Map<number, string>(existing.map(v => [v.columnIndex, v.name]));

        // Clear all variables and labels
        await db.variables.clear();
        await db.valueLabels.clear();

        // Bulk put variables
        await db.variables.bulkPut(variables);

        // Bulk insert labels
        const labels = variables.flatMap(v => v.values.map(val => ({ ...val, variableName: v.name })));
        if (labels.length) {
          await db.valueLabels.bulkPut(labels);
        }
      });
      return true;
    } catch (error) {
      console.error("Error in VariableService.importVariables:", error);
      throw error;
    }
  }
  
  /**
   * Get value labels for a variable
   */
  async getValueLabels(variableName: string) {
    try {
      return await variableRepository.getValueLabels(variableName);
    } catch (error) {
      console.error(`Error in VariableService.getValueLabels for variable ${variableName}:`, error);
      throw error;
    }
  }
  
  /**
   * Save value label
   */
  async saveValueLabel(valueLabel: ValueLabel) {
    try {
      return await variableRepository.saveValueLabel(valueLabel);
    } catch (error) {
      console.error("Error in VariableService.saveValueLabel:", error);
      throw error;
    }
  }
}

const variableService = new VariableService();
export default variableService; 