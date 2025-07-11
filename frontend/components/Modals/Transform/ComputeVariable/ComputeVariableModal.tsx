import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore, CellUpdate } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator } from "./Calculator";
import { FunctionsList } from "./FunctionsList";

interface ComputeVariableProps {
  onClose: () => void;
  containerType?: "dialog" | "sidebar";
}

// Content component
const ComputeVariableContent: React.FC<ComputeVariableProps> = ({
  onClose,
  containerType = "dialog",
}) => {
  const { toast } = useToast();
  const [targetName, setTargetName] = useState("");
  const [targetType, setTargetType] = useState<"NUMERIC" | "STRING">("NUMERIC");
  const [targetLabel, setTargetLabel] = useState("");
  const [numericExpression, setNumericExpression] = useState("");
  const [ifCondition, setIfCondition] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const allVariablesFromStore = useVariableStore.getState().variables;
  const addVariable = useVariableStore((state) => state.addVariable);
  const data = useDataStore((state) => state.data);
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  const handleVariableDoubleClick = useCallback((variable: Variable) => {
    setNumericExpression((prev) => prev + variable.name);
  }, []);

  const handleCompute = useCallback(async () => {
    if (!targetName || !numericExpression) {
      toast({
        title: "Missing required fields",
        description:
          "Please fill in both target variable name and numeric expression.",
        variant: "destructive",
      });
      return;
    }

    // Check if variable name already exists
    if (allVariablesFromStore.some((v) => v.name === targetName)) {
      toast({
        title: "Invalid variable name",
        description: "A variable with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize worker
      const worker = new Worker("/workers/ComputeVariable/ComputeVariable.js");

      const cleanedData = data.filter(
        (row) =>
          Array.isArray(row) &&
          row.some((cell) => cell !== null && cell !== undefined && cell !== "")
      );

      worker.postMessage({
        data: cleanedData,
        variables: allVariablesFromStore,
        numericExpression,
        variableType: targetType,
        ifCondition,
      });

      worker.onmessage = async (event) => {
        const { success, computedValues, error } = event.data;

        if (success) {
          try {
            // Create new variable first
            const newColumnIndex = allVariablesFromStore.length;
            const newVariable: Partial<Variable> = {
              columnIndex: newColumnIndex,
              name: targetName,
              type: targetType,
              width: 8,
              decimals: targetType === "NUMERIC" ? 2 : 0,
              label: targetLabel,
              values: [],
              missing: null,
              columns: 200,
              align: targetType === "NUMERIC" ? "right" : "left",
              measure: targetType === "NUMERIC" ? "scale" : "nominal",
              role: "input",
            };

            // Add variable first
            await addVariable(newVariable);

            // Then add the computed values to the correct column
            const bulkUpdates: CellUpdate[] = [];
            computedValues.forEach((value: any, rowIndex: number) => {
              if (value !== null) {
                bulkUpdates.push({
                  row: rowIndex,
                  col: newColumnIndex, // Use the same column index as the variable
                  value,
                });
              }
            });

            if (bulkUpdates.length > 0) {
              await useDataStore.getState().updateCells(bulkUpdates);
              await useDataStore.getState().saveData();
            }

            // Add logs
            const logMsg = `COMPUTE VARIABLE ${targetName} WITH EXPRESSION "${numericExpression}"${
              ifCondition ? ` IF ${ifCondition}` : ""
            }`;
            const logId = await addLog({ log: logMsg });
            const analyticId = await addAnalytic(logId, {
              title: "Compute Variable",
              note: "",
            });
            await addStatistic(analyticId, {
              title: "Compute Variable",
              output_data: JSON.stringify({
                text: [
                  {
                    text: `The variable \`${targetName}\` was successfully added as the last variable in the dataset.`,
                  },
                ],
              }),
              components: "Executed",
              description: "",
            });

            setIsProcessing(false);
            onClose();
          } catch (err) {
            console.error("Error during post-compute actions:", err);
            toast({
              title: "Error",
              description: "Failed to save computation results.",
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        } else {
          toast({
            title: "Computation Error",
            description: error || "Failed to compute variable.",
            variant: "destructive",
          });
          setIsProcessing(false);
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        console.error("Worker error:", error);
        toast({
          title: "Worker Error",
          description: "An error occurred during computation.",
          variant: "destructive",
        });
        setIsProcessing(false);
        worker.terminate();
      };
    } catch (error) {
      console.error("Error during computation:", error);
      toast({
        title: "Error",
        description: "Failed to start computation process.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [
    targetName,
    targetType,
    targetLabel,
    numericExpression,
    ifCondition,
    allVariablesFromStore,
    data,
    addVariable,
    addLog,
    addAnalytic,
    addStatistic,
    onClose,
    toast,
  ]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Main Content */}
      <div className="p-4 flex-grow">
        <div className="grid grid-cols-2 gap-4">
          {/* Left side - Target Variable */}
          <div className="flex flex-col">
            <div className="space-y-4 mb-4">
              <div>
                <Label className="mb-2 block">Target Variable:</Label>
                <Input
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="bg-white"
                  placeholder="Enter variable name"
                />
              </div>

              <div>
                <Label className="mb-2 block">Type:</Label>
                <Select
                  value={targetType}
                  onValueChange={(value: "NUMERIC" | "STRING") =>
                    setTargetType(value)
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMERIC">Numeric</SelectItem>
                    <SelectItem value="STRING">String</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Label:</Label>
                <Input
                  value={targetLabel}
                  onChange={(e) => setTargetLabel(e.target.value)}
                  className="bg-white"
                  placeholder="Enter variable label (optional)"
                />
              </div>
            </div>

            {/* Variables List */}
            <div className="flex-grow border bg-white rounded overflow-hidden">
              <ScrollArea className="h-[calc(100vh-500px)]">
                {allVariablesFromStore.map((variable) => (
                  <div
                    key={variable.tempId}
                    className="flex items-center p-2 hover:bg-blue-100 cursor-pointer"
                    onDoubleClick={() => handleVariableDoubleClick(variable)}
                  >
                    <span className="mr-2">
                      {variable.type === "NUMERIC"
                        ? "🔢"
                        : variable.type === "STRING"
                        ? "📝"
                        : "📅"}
                    </span>
                    <span>{variable.name}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>

          {/* Right side - Expression */}
          <div>
            <Label className="mb-2 block">Numeric Expression:</Label>
            <textarea
              value={numericExpression}
              onChange={(e) => setNumericExpression(e.target.value)}
              className="w-full h-[100px] p-2 bg-white border rounded resize-none"
            />
            <Calculator
              onButtonClick={(value) => {
                if (value === "") {
                  setNumericExpression("");
                } else {
                  setNumericExpression((prev) => prev + value);
                }
              }}
            />
            <FunctionsList
              onFunctionSelect={(func) => {
                setNumericExpression((prev) => prev + func);
              }}
            />
          </div>
        </div>

        {/* If condition */}
        {/* <div className="mt-4">
          <Label className="mb-2 block">
            If (optional case selection condition):
          </Label>
          <Input
            value={ifCondition}
            onChange={(e) => setIfCondition(e.target.value)}
            className="bg-white"
          />
        </div> */}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
        <Button
          onClick={handleCompute}
          disabled={!targetName || !numericExpression || isProcessing}
        >
          {isProcessing ? "Computing..." : "OK"}
        </Button>
        <Button variant="secondary">Paste</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setNumericExpression("");
            setIfCondition("");
          }}
        >
          Reset
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="secondary">Help</Button>
      </div>
    </div>
  );
};

// Main modal component
const ComputeVariableModal: React.FC<ComputeVariableProps> = ({
  onClose,
  containerType = "dialog",
}) => {
  if (containerType === "dialog") {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compute Variable</DialogTitle>
          </DialogHeader>
          <ComputeVariableContent
            onClose={onClose}
            containerType={containerType}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ComputeVariableContent onClose={onClose} containerType={containerType} />
  );
};

export default ComputeVariableModal;
