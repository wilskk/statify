"use client";
import React, { useState, FC, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import type { Variable, VariableType } from "@/types/Variable";
import RecodeVariablesTab from "../recodeSameVariables/RecodeVariablesTab";
import OldNewValuesSetup from "../recodeSameVariables/OldNewValuesSetup";
import { useResultStore } from "@/stores/useResultStore";

export interface RecodeRule {
  id: string;
  oldValueType:
    | "value"
    | "systemMissing"
    | "systemOrUserMissing"
    | "range"
    | "rangeLowest"
    | "rangeHighest"
    | "else";
  oldValue: string | number | [number | null, number | null] | null;
  oldValueDisplay: string;
  newValueType: "value" | "systemMissing";
  newValue: string | number | null;
  newValueDisplay: string;
}

interface RecodeMapping {
  sourceVariable: Variable;
  targetName: string;
  targetLabel: string;
}

interface RecodeDifferentVariablesModalProps {
  onClose: () => void;
}

const Index: FC<RecodeDifferentVariablesModalProps> = ({ onClose }) => {
  const allVariablesFromStore = useVariableStore.getState().variables;
  const dataStore = useDataStore();
  const { toast } = useToast();
  const resultStore = useResultStore();

  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [recodeMappings, setRecodeMappings] = useState<RecodeMapping[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<{
    tempId: string;
    source: "available" | "recodeList";
  } | null>(null);
  const [recodeListType, setRecodeListType] = useState<
    "NUMERIC" | "STRING" | null
  >(null);

  const [showOldNewSetup, setShowOldNewSetup] = useState(false);
  const [recodeRules, setRecodeRules] = useState<RecodeRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Alert dialog state
  const [showTypeAlert, setShowTypeAlert] = useState(false);
  const [incompatibleVariable, setIncompatibleVariable] =
    useState<Variable | null>(null);

  const [selectedMappingIndex, setSelectedMappingIndex] = useState<
    number | null
  >(null);
  const [editName, setEditName] = useState("");
  const [editLabel, setEditLabel] = useState("");

  const [variablesToRecode, setVariablesToRecode] = useState<Variable[]>([]);

  const [outputType, setOutputType] = useState<"NUMERIC" | "STRING">("NUMERIC");
  const [stringWidth, setStringWidth] = useState(8);
  const [convertStringToNumber, setConvertStringToNumber] = useState(false);

  useEffect(() => {
    const recodeVarTempIds = new Set(
      recodeMappings.map((m) => m.sourceVariable.tempId)
    );
    const initialAvailable = allVariablesFromStore
      .filter(
        (v) => v.name !== "" && v.tempId && !recodeVarTempIds.has(v.tempId)
      )
      .map((v) => ({ ...v, tempId: v.tempId || `temp_${v.columnIndex}` }));
    setAvailableVariables(initialAvailable);

    if (recodeMappings.length === 0 && recodeListType !== null) {
      setRecodeListType(null);
    }
  }, [allVariablesFromStore, recodeMappings, recodeListType]);

  const moveToRightPane = useCallback(
    (variable: Variable, targetIndex?: number) => {
      if (!variable.tempId) return;
      const varType = variable.type;
      if (variablesToRecode.length === 0) {
        if (varType === "NUMERIC" || varType === "STRING") {
          setRecodeListType(varType);
        } else {
          console.warn(
            `Variable ${variable.name} is not NUMERIC or STRING and cannot be recoded.`
          );
          return;
        }
      } else {
        if (varType !== recodeListType) {
          setIncompatibleVariable(variable);
          setShowTypeAlert(true);
          return;
        }
      }
      setAvailableVariables((prev) =>
        prev.filter((v) => v.tempId !== variable.tempId)
      );
      setVariablesToRecode((prev) => {
        if (prev.some((v) => v.tempId === variable.tempId)) return prev;
        const newList = [...prev];
        if (
          typeof targetIndex === "number" &&
          targetIndex >= 0 &&
          targetIndex <= newList.length
        ) {
          newList.splice(targetIndex, 0, variable);
        } else {
          newList.push(variable);
        }
        return newList;
      });
      setRecodeMappings((prev) => {
        if (prev.some((m) => m.sourceVariable.tempId === variable.tempId))
          return prev;
        const newList = [...prev];
        const newMapping: RecodeMapping = {
          sourceVariable: variable,
          targetName: `${variable.name}_recoded`,
          targetLabel: `Recoded ${variable.label || variable.name}`,
        };
        if (
          typeof targetIndex === "number" &&
          targetIndex >= 0 &&
          targetIndex <= newList.length
        ) {
          newList.splice(targetIndex, 0, newMapping);
        } else {
          newList.push(newMapping);
        }
        return newList;
      });
      setHighlightedVariable(null);
    },
    [variablesToRecode, recodeListType]
  );

  const moveToLeftPane = useCallback(
    (variable: Variable, targetIndex?: number) => {
      if (!variable.tempId) return;
      setVariablesToRecode((prev) =>
        prev.filter((v) => v.tempId !== variable.tempId)
      );
      setAvailableVariables((prev) => {
        if (prev.some((v) => v.tempId === variable.tempId)) return prev;
        const newList = [...prev];
        if (
          typeof targetIndex === "number" &&
          targetIndex >= 0 &&
          targetIndex <= newList.length
        ) {
          newList.splice(targetIndex, 0, variable);
        } else {
          newList.push(variable);
        }
        newList.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
        return newList;
      });
      setRecodeMappings((prev) =>
        prev.filter((m) => m.sourceVariable.tempId !== variable.tempId)
      );
      setHighlightedVariable(null);
      setSelectedMappingIndex(null);
      setEditName("");
      setEditLabel("");
    },
    []
  );

  const updateTargetVariable = (
    tempId: string,
    field: "name" | "label",
    value: string
  ) => {
    setRecodeMappings((prev) =>
      prev.map((mapping) =>
        mapping.sourceVariable.tempId === tempId
          ? { ...mapping, [field]: value }
          : mapping
      )
    );
  };

  const reorderVariables = useCallback(
    (source: "available" | "recodeList", reorderedList: Variable[]) => {
      if (source === "available") {
        setAvailableVariables([...reorderedList]);
      } else if (source === "recodeList") {
        setRecodeMappings((prev) => {
          const newList = prev.map((m) => ({
            ...m,
            sourceVariable:
              reorderedList.find((v) => v.tempId === m.sourceVariable.tempId) ||
              m.sourceVariable,
          }));
          return newList;
        });
      }
    },
    []
  );

  // Fungsi untuk mengevaluasi nilai berdasarkan aturan recode
  const evaluateValueWithRules = (
    value: string | number,
    rules: RecodeRule[]
  ): string | number | null => {
    if (value === "") {
      return value;
    }

    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    const isNumericType = recodeListType === "NUMERIC";
    const isValidNumber = !isNaN(numericValue);

    const isSystemMissing =
      value === null ||
      value === undefined ||
      (typeof value === "number" && isNaN(value)) ||
      (recodeListType === "NUMERIC" &&
        typeof value === "string" &&
        value.trim() === "");

    for (const rule of rules) {
      switch (rule.oldValueType) {
        case "value":
          if (value == rule.oldValue) {
            console.log(
              "RECODE",
              value,
              "->",
              rule.newValue,
              "(rule:",
              rule.oldValue,
              ")"
            );
            return rule.newValue;
          }
          if (isNumericType && isValidNumber && numericValue == rule.oldValue) {
            console.log(
              "RECODE NUMERIC",
              value,
              "->",
              rule.newValue,
              "(rule:",
              rule.oldValue,
              ")"
            );
            return rule.newValue;
          }
          break;

        case "range":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [min, max] = rule.oldValue;
            if (
              min !== null &&
              max !== null &&
              numericValue >= min &&
              numericValue <= max
            ) {
              return rule.newValue;
            }
          }
          break;

        case "rangeLowest":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [, max] = rule.oldValue;
            if (max !== null && numericValue <= max) {
              return rule.newValue;
            }
          }
          break;

        case "rangeHighest":
          if (isNumericType && isValidNumber && Array.isArray(rule.oldValue)) {
            const [min] = rule.oldValue;
            if (min !== null && numericValue >= min) {
              return rule.newValue;
            }
          }
          break;

        case "systemMissing":
          if (isSystemMissing) {
            return rule.newValue;
          }
          break;

        case "systemOrUserMissing":
          if (isSystemMissing) {
            return rule.newValue;
          }
          break;

        case "else":
          continue;
      }
    }

    const elseRule = rules.find((r) => r.oldValueType === "else");
    if (elseRule) {
      return elseRule.newValue;
    }

    return value;
  };

  const handleOk = async () => {
    if (recodeMappings.length === 0) {
      toast({
        title: "No variables selected",
        description: "Please select at least one variable to recode.",
        variant: "destructive",
      });
      return;
    }

    if (recodeRules.length === 0) {
      toast({
        title: "No recode rules defined",
        description: "Please define at least one rule for recoding.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      let newDataMatrix = dataStore.data.map((row) => [...row]);
      let currentColumnIndex = allVariablesFromStore.length;
      const variableStore = useVariableStore.getState();

      for (const mapping of recodeMappings) {
        const newVariable = {
          name: mapping.targetName,
          label: mapping.targetLabel,
          type: recodeListType || "NUMERIC",
          columnIndex: currentColumnIndex,
          tempId: `temp_${Date.now()}_${currentColumnIndex}`,
          width: 8,
          decimals: 2,
          values: [],
          missing: {
            discrete: [],
            range: { min: undefined, max: undefined },
          },
          columns: 100,
          align: "right" as const,
          measure: (recodeListType === "NUMERIC"
            ? "scale"
            : "nominal") as Variable["measure"],
          role: "input" as Variable["role"],
        };
        // Get data from source variable
        const { data } = await dataStore.getVariableData(
          mapping.sourceVariable
        );
        // Apply recode rules to create new data
        const newData = data.map((value) => {
          const recodedValue = evaluateValueWithRules(value, recodeRules);
          return recodedValue === null ? "" : recodedValue;
        });
        // Pastikan newData sepanjang newDataMatrix
        const paddedNewData = Array(newDataMatrix.length)
          .fill("")
          .map((_, i) => newData[i] ?? "");
        // Tambahkan kolom baru ke setiap baris
        newDataMatrix = newDataMatrix.map((row, rowIndex) => {
          const newRow = [...row];
          newRow.push(paddedNewData[rowIndex]);
          return newRow;
        });
        // Tambahkan variabel baru ke variableStore
        variableStore.addVariable(newVariable);
        currentColumnIndex++;
      }
      // Update dataStore dengan newDataMatrix
      await dataStore.setDataAndSync(newDataMatrix);

      // Add log entry
      const recodeRulesText = recodeRules
        .map((rule) => {
          switch (rule.oldValueType) {
            case "value":
              return `${rule.oldValueDisplay} → ${rule.newValueDisplay}`;
            case "range":
              return `${rule.oldValueDisplay} → ${rule.newValueDisplay}`;
            case "rangeLowest":
              return `${rule.oldValueDisplay} → ${rule.newValueDisplay}`;
            case "rangeHighest":
              return `${rule.oldValueDisplay} → ${rule.newValueDisplay}`;
            case "systemMissing":
              return "System Missing → " + rule.newValueDisplay;
            case "systemOrUserMissing":
              return "System or User Missing → " + rule.newValueDisplay;
            case "else":
              return "Else → " + rule.newValueDisplay;
            default:
              return "";
          }
        })
        .join(", ");

      const logMsg = `RECODE VARIABLE ${recodeMappings
        .map((m) => `${m.sourceVariable.name} INTO ${m.targetName}`)
        .join(", ")} WITH RULES: ${recodeRulesText}`;
      const logId = await resultStore.addLog({ log: logMsg });

      // Add analytic
      const analyticId = await resultStore.addAnalytic(logId, {
        title: "Recode into Different Variables",
        note: "",
      });

      // Add statistic
      await resultStore.addStatistic(analyticId, {
        title: "Recode into Different Variables",
        output_data: JSON.stringify({
          text: [
            {
              text: `The following variables were recoded:\n${recodeMappings
                .map(
                  (m) => `- \`${m.sourceVariable.name}\` → \`${m.targetName}\``
                )
                .join("\n")}\n\nWith the rules:\n${recodeRules
                .map(
                  (rule) =>
                    `- ${rule.oldValueDisplay} → ${rule.newValueDisplay}`
                )
                .join("\n")}`,
            },
          ],
        }),
        components: "Executed",
        description: "",
      });

      toast({
        title: "Success",
        description: "Variables have been recoded successfully.",
      });

      onClose();
    } catch (error) {
      console.error("Error during recode:", error);
      toast({
        title: "Error",
        description: "An error occurred while recoding variables.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectMapping = (idx: number) => {
    setSelectedMappingIndex(idx);
    setEditName(recodeMappings[idx].targetName);
    setEditLabel(recodeMappings[idx].targetLabel);
  };

  const handleChangeMapping = () => {
    if (selectedMappingIndex === null) return;
    setRecodeMappings((prev) =>
      prev.map((m, i) =>
        i === selectedMappingIndex
          ? { ...m, targetName: editName, targetLabel: editLabel }
          : m
      )
    );
  };

  const handleRemoveMapping = (idx: number) => {
    setRecodeMappings((prev) => {
      const removed = prev[idx];
      setAvailableVariables((avail) => [...avail, removed.sourceVariable]);
      return prev.filter((_, i) => i !== idx);
    });
    if (selectedMappingIndex === idx) {
      setSelectedMappingIndex(null);
      setEditName("");
      setEditLabel("");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="transition-all duration-300 p-0"
        style={{
          width: showOldNewSetup ? 1220 : 700,
          maxWidth: "95vw",
          minWidth: 350,
        }}
      >
        <div className="flex flex-row h-full">
          {/* Kiri: Konten utama */}
          <div className="flex-1 p-6 min-w-[350px]">
            <DialogHeader>
              <DialogTitle>Recode into Different Variables</DialogTitle>
              <DialogDescription>
                {/* Create new variables by recoding existing ones. */}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <RecodeVariablesTab
                  availableVariables={availableVariables}
                  variablesToRecode={variablesToRecode}
                  highlightedVariable={highlightedVariable}
                  setHighlightedVariable={setHighlightedVariable}
                  moveToRightPane={moveToRightPane}
                  moveToLeftPane={moveToLeftPane}
                  reorderVariables={reorderVariables}
                />
              </div>
              <div>
                <ul className="border rounded p-2 h-48 overflow-y-auto">
                  {recodeMappings.map((m, i) => (
                    <li
                      key={m.sourceVariable.tempId}
                      className={`p-2 flex items-center gap-2 cursor-pointer rounded ${
                        selectedMappingIndex === i ? "bg-blue-100" : ""
                      }`}
                      onClick={() => handleSelectMapping(i)}
                    >
                      <span>
                        {m.sourceVariable.name} --&gt; {m.targetName || "?"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveToLeftPane(m.sourceVariable);
                        }}
                      >
                        🗑️
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-col gap-2 border rounded p-2">
                  {selectedMappingIndex !== null && (
                    <>
                      <label className="text-sm font-medium">Name:</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <label className="text-sm font-medium">Label:</label>
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                      />
                      <Button onClick={handleChangeMapping} className="mt-2">
                        Change
                      </Button>
                    </>
                  )}
                  {selectedMappingIndex === null && (
                    <div className="text-gray-400 text-sm">
                      Select a variable to edit output name/label
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() => setShowOldNewSetup(true)}
                    className="w-full"
                  >
                    Define Old and New Values
                  </Button>
                </div>
                {/* Checkbox cast output */}
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={outputType === "STRING"}
                      onChange={(e) =>
                        setOutputType(e.target.checked ? "STRING" : "NUMERIC")
                      }
                    />
                    Output variables are strings
                  </label>
                  {outputType === "STRING" && (
                    <div className="flex items-center gap-2 ml-6">
                      Width:
                      <input
                        type="number"
                        min={1}
                        max={255}
                        value={stringWidth}
                        onChange={(e) => setStringWidth(Number(e.target.value))}
                        className="w-16 border rounded px-1"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={convertStringToNumber}
                      disabled={outputType !== "NUMERIC"}
                      onChange={(e) =>
                        setConvertStringToNumber(e.target.checked)
                      }
                    />
                    Convert numeric strings to numbers
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleOk}
                disabled={isProcessing || recodeMappings.length === 0}
              >
                {isProcessing ? "Processing..." : "OK"}
              </Button>
            </DialogFooter>

            <AlertDialog open={showTypeAlert} onOpenChange={setShowTypeAlert}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Incompatible Variable Type
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {incompatibleVariable && (
                      <>
                        The variable &quot;{incompatibleVariable.name}&quot; has
                        a different type than the variables already selected for
                        recoding. All variables must be of the same type (either
                        all NUMERIC or all STRING).
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction>OK</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {/* Kanan: Side panel OldNewValuesSetup */}
          {showOldNewSetup && (
            <div className="w-[600px] border-l bg-white h-full flex flex-col relative">
              <button
                onClick={() => setShowOldNewSetup(false)}
                className="absolute top-12 right-4 text-lg px-2 py-1 z-10 hover:bg-gray-100 rounded-full"
                aria-label="Close define panel"
                type="button"
              >
                ×
              </button>
              <div className="flex-1 overflow-y-auto p-4 pt-10">
                <OldNewValuesSetup
                  recodeListType={recodeListType}
                  recodeRules={recodeRules}
                  setRecodeRules={setRecodeRules}
                  onCloseSetup={() => setShowOldNewSetup(false)}
                  variableCount={variablesToRecode.length}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Index;
