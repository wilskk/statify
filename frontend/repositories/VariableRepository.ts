import db from "@/lib/db";
import { Variable, ValueLabel } from "@/types/Variable";

export class VariableRepository {
  async getAllVariables(): Promise<Variable[]> {
    try {
      return await db.variables.toArray();
    } catch (error) {
      console.error("Failed to load variables:", error);
      throw error;
    }
  }

  async getVariableByColumnIndex(columnIndex: number): Promise<Variable | undefined> {
    try {
      return await db.variables.where('columnIndex').equals(columnIndex).first();
    } catch (error) {
      console.error(`Failed to get variable for column ${columnIndex}:`, error);
      throw error;
    }
  }

  async getVariableByName(name: string): Promise<Variable | undefined> {
    try {
      return await db.variables.where('name').equals(name).first();
    } catch (error) {
      console.error(`Failed to get variable by name ${name}:`, error);
      throw error;
    }
  }

  async saveVariable(variable: Variable): Promise<number> {
    try {
      // Insert or update variable in one step
      const id = await db.variables.put(variable);
      return id;
    } catch (error) {
      console.error("Failed to save variable:", error);
      throw error;
    }
  }

  async deleteVariable(id: number): Promise<void> {
    try {
      await db.variables.delete(id);
    } catch (error) {
      console.error(`Failed to delete variable with id ${id}:`, error);
      throw error;
    }
  }

  async clearVariables(): Promise<void> {
    try {
      await db.variables.clear();
    } catch (error) {
      console.error("Failed to clear variables:", error);
      throw error;
    }
  }

  // Value Labels operations
  async getValueLabels(variableName: string): Promise<ValueLabel[]> {
    try {
      return await db.valueLabels.where('variableName').equals(variableName).toArray();
    } catch (error) {
      console.error(`Failed to get value labels for ${variableName}:`, error);
      throw error;
    }
  }

  async saveValueLabel(valueLabel: ValueLabel): Promise<number> {
    try {
      // Insert or update value label in one step
      return await db.valueLabels.put(valueLabel);
    } catch (error) {
      console.error("Failed to save value label:", error);
      throw error;
    }
  }

  async deleteValueLabel(id: number): Promise<void> {
    try {
      await db.valueLabels.delete(id);
    } catch (error) {
      console.error(`Failed to delete value label with id ${id}:`, error);
      throw error;
    }
  }

  async deleteValueLabelsByVariable(variableName: string): Promise<void> {
    try {
      await db.valueLabels.where('variableName').equals(variableName).delete();
    } catch (error) {
      console.error(`Failed to delete value labels for variable ${variableName}:`, error);
      throw error;
    }
  }

  async getVariableById(id: number): Promise<Variable | undefined> {
    try {
      return await db.variables.get(id);
    } catch (error) {
      console.error(`Failed to get variable with id ${id}:`, error);
      throw error;
    }
  }

  async updateValueLabelsVariableName(oldName: string, newName: string): Promise<void> {
    try {
      // Bulk update variableName for matching value labels
      await db.valueLabels
        .where('variableName')
        .equals(oldName)
        .modify({ variableName: newName });
    } catch (error) {
      console.error(`Failed to update value labels from ${oldName} to ${newName}:`, error);
      throw error;
    }
  }
}

const variableRepository = new VariableRepository();
export default variableRepository; 