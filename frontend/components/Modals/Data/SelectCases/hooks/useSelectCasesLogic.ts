import { useState } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import { 
  selectByCondition, 
  selectByFilterVariable, 
  selectByRange, 
  selectRandomSample,
  type RandomSampleConfig,
  type RangeConfig
} from "../services/selectors";

/**
 * Hook for handling the logic of selecting cases
 */
export const useSelectCasesLogic = () => {
  const { data, updateCells } = useDataStore();
  const { variables, addVariable } = useVariableStore();
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Creates a filter variable and applies the filter
   * @param selectedIndices Array of indices for selected rows
   */
  const createFilterVariable = async (selectedIndices: number[]): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setProcessingStatus("Creating filter variable...");

      // Create filter values
      const filterValues = data.map((_, index) =>
        selectedIndices.includes(index) ? 1 : 0
      );

      // Check if filter variable already exists
      const existingFilterVar = variables.find(v => v.name === "filter_$");
      
      if (existingFilterVar) {
        // Update existing filter variable
        const updates = filterValues.map((value, row) => ({
          row,
          col: existingFilterVar.columnIndex,
          value
        }));

        await updateCells(updates);
        setProcessingStatus(`Updated filter variable with ${selectedIndices.length} selected cases`);
      } else {
        // Create new filter variable
        const newVarIndex = variables.length;
        await addVariable({
          name: "filter_$",
          type: "NUMERIC",
          width: 8,
          decimals: 0,
          label: "Filter Variable",
          measure: "nominal",
          role: "input",
          columnIndex: newVarIndex,
          values: [
            { variableName: "filter_$", value: 0, label: "Not Selected" },
            { variableName: "filter_$", value: 1, label: "Selected" }
          ],
        });

        // Set the values for each row
        const updates = filterValues.map((value, row) => ({
          row,
          col: newVarIndex,
          value
        }));

        await updateCells(updates);
        setProcessingStatus(`Created filter variable with ${selectedIndices.length} selected cases`);
      }

      return true;
    } catch (error) {
      console.error("Error creating filter variable:", error);
      setError("Failed to create filter variable");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Applies a condition-based filter
   * @param expression Condition expression
   */
  const applyConditionFilter = async (expression: string): Promise<boolean> => {
    if (!expression.trim()) {
      setError("Condition expression is empty");
      return false;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Evaluating condition...");

      const selectedIndices = selectByCondition(data, variables, expression);
      
      if (selectedIndices.length === 0) {
        setError("No cases match the specified condition");
        return false;
      }
      
      return await createFilterVariable(selectedIndices);
    } catch (error) {
      console.error("Error applying condition filter:", error);
      setError("Failed to apply condition filter");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Applies a random sample filter
   * @param config Random sample configuration
   */
  const applyRandomSampleFilter = async (config: RandomSampleConfig): Promise<boolean> => {
    if (!config) {
      setError("Random sample configuration is missing");
      return false;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Selecting random sample...");

      const selectedIndices = selectRandomSample(data, config);
      
      if (selectedIndices.length === 0) {
        setError("No cases selected in the random sample");
        return false;
      }
      
      return await createFilterVariable(selectedIndices);
    } catch (error) {
      console.error("Error applying random sample filter:", error);
      setError("Failed to apply random sample filter");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Applies a range-based filter
   * @param config Range configuration
   */
  const applyRangeFilter = async (range: RangeConfig): Promise<boolean> => {
    if (!range) {
      setError("Range configuration is missing");
      return false;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Selecting cases by range...");

      const selectedIndices = selectByRange(data, range);
      
      if (selectedIndices.length === 0) {
        setError("No cases selected in the specified range");
        return false;
      }
      
      return await createFilterVariable(selectedIndices);
    } catch (error) {
      console.error("Error applying range filter:", error);
      setError("Failed to apply range filter");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Applies a variable-based filter
   * @param filterVar Filter variable
   */
  const applyVariableFilter = async (filterVar: Variable): Promise<boolean> => {
    if (!filterVar) {
      setError("Filter variable is not specified");
      return false;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Filtering by variable...");

      const selectedIndices = selectByFilterVariable(data, variables, filterVar);
      
      if (selectedIndices.length === 0) {
        setError("No cases match the filter variable criteria");
        return false;
      }
      
      return await createFilterVariable(selectedIndices);
    } catch (error) {
      console.error("Error applying variable filter:", error);
      setError("Failed to apply variable filter");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Selects all cases
   */
  const selectAllCases = async (): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setProcessingStatus("Selecting all cases...");

      const allIndices = Array.from({ length: data.length }, (_, i) => i);
      
      return await createFilterVariable(allIndices);
    } catch (error) {
      console.error("Error selecting all cases:", error);
      setError("Failed to select all cases");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Deletes unselected cases
   */
  const deleteUnselectedCases = async (): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setProcessingStatus("Deleting unselected cases...");

      const filterVarIndex = variables.find(v => v.name === "filter_$")?.columnIndex;

      if (filterVarIndex === undefined) {
        setError("Filter variable not found");
        return false;
      }

      // Find rows with filter_$ value of 0 (unselected)
      const rowsToDelete: number[] = [];
      
      for (let i = 0; i < data.length; i++) {
        if (filterVarIndex < data[i].length && data[i][filterVarIndex] === 0) {
          rowsToDelete.push(i);
        }
      }

      if (rowsToDelete.length === 0) {
        setProcessingStatus("No unselected cases to delete");
        return true;
      }

      // Delete rows from highest index to lowest to avoid index shifting problems
      rowsToDelete.sort((a, b) => b - a);
      await useDataStore.getState().deleteRows(rowsToDelete);
      
      setProcessingStatus(`Deleted ${rowsToDelete.length} unselected cases`);
      return true;
    } catch (error) {
      console.error("Error deleting unselected cases:", error);
      setError("Failed to delete unselected cases");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    applyConditionFilter,
    applyRandomSampleFilter,
    applyRangeFilter,
    applyVariableFilter,
    selectAllCases,
    deleteUnselectedCases,
    processingStatus,
    isProcessing,
    error,
    setError,
    clearError: () => setError(null)
  };
}; 