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
      // If variable has an ID, update it, otherwise add it
      if (variable.id !== undefined) {
        await db.variables.update(variable.id, {
          columnIndex: variable.columnIndex,
          name: variable.name,
          type: variable.type,
          width: variable.width,
          decimals: variable.decimals,
          label: variable.label,
          values: variable.values,
          missing: variable.missing,
          columns: variable.columns,
          align: variable.align,
          measure: variable.measure,
          role: variable.role
        });
        return variable.id;
      } else {
        return await db.variables.add(variable);
      }
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
      if (valueLabel.id !== undefined) {
        await db.valueLabels.update(valueLabel.id, valueLabel);
        return valueLabel.id;
      } else {
        return await db.valueLabels.add(valueLabel);
      }
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
      // Get all value labels for the old variable name
      const valueLabels = await this.getValueLabels(oldName);
      
      // Update each value label with the new variable name
      await db.transaction('rw', db.valueLabels, async () => {
        for (const valueLabel of valueLabels) {
          await db.valueLabels.update(valueLabel.id!, {
            ...valueLabel,
            variableName: newName
          });
        }
      });
    } catch (error) {
      console.error(`Failed to update value labels from ${oldName} to ${newName}:`, error);
      throw error;
    }
  }
}

const variableRepository = new VariableRepository();
export default variableRepository; 