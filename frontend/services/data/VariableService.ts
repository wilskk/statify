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
    try {
      let variableId: number;
      
      // Use transaction to ensure both variable and value labels are saved atomically
      await db.transaction('rw', [db.variables, db.valueLabels], async () => {
        // If updating an existing variable and the name has changed
        if (variable.id !== undefined) {
          const existingVariable = await variableRepository.getVariableById(variable.id);
          
          // If name has changed, we need to update the variableName in value labels
          if (existingVariable && existingVariable.name !== variable.name) {
            await variableRepository.updateValueLabelsVariableName(
              existingVariable.name, 
              variable.name
            );
          }
        }
        
        // Save the variable
        variableId = await variableRepository.saveVariable(variable);
      });
      
      return variableId!;
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
    try {
      await db.transaction('rw', [db.variables, db.valueLabels], async () => {
        // Get existing variables to track changes for value labels
        const existingVariables = await variableRepository.getAllVariables();
        const existingVariableMap = new Map<number, string>();
        
        // Map column indices to variable names for existing variables
        existingVariables.forEach(v => {
          if (v.columnIndex !== undefined && v.name) {
            existingVariableMap.set(v.columnIndex, v.name);
          }
        });
        
        // Clear all variables first
        await variableRepository.clearVariables();
        
        // Process each variable
        for (const variable of variables) {
          // Check if this column index had a variable before with a different name
          const oldName = existingVariableMap.get(variable.columnIndex);
          
          // Save the new variable first
          await variableRepository.saveVariable(variable);
          
          // If the column had a variable with a different name before, update value labels
          if (oldName && oldName !== variable.name) {
            await variableRepository.updateValueLabelsVariableName(oldName, variable.name);
          }
          
          // Add any value labels associated with this variable
          if (variable.values && variable.values.length > 0) {
            for (const valueLabel of variable.values) {
              await variableRepository.saveValueLabel({
                ...valueLabel,
                variableName: variable.name
              });
            }
          }
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