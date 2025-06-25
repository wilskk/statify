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
import { useToast } from "@/hooks/use-toast";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable, VariableType } from "@/types/Variable";
import RecodeVariablesTab from "./RecodeVariablesTab";
import OldNewValuesSetup from "./OldNewValuesSetup";

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

interface RecodeSameVariablesModalProps {
  onClose: () => void;
}

const Index: FC<RecodeSameVariablesModalProps> = ({ onClose }) => {
  const allVariablesFromStore = useVariableStore.getState().variables;
  const dataStore = useDataStore();
  const { toast } = useToast();
  const resultStore = useResultStore();

  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [variablesToRecode, setVariablesToRecode] = useState<Variable[]>([]);
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

  useEffect(() => {
    const recodeVarTempIds = new Set(variablesToRecode.map((v) => v.tempId));
    const initialAvailable = allVariablesFromStore
      .filter(
        (v) => v.name !== "" && v.tempId && !recodeVarTempIds.has(v.tempId)
      )
      .map((v) => ({ ...v, tempId: v.tempId || `temp_${v.columnIndex}` }));
    setAvailableVariables(initialAvailable);

    if (variablesToRecode.length === 0 && recodeListType !== null) {
      setRecodeListType(null);
    }
  }, [allVariablesFromStore, variablesToRecode, recodeListType]);

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
          // Instead of console warning, show alert dialog
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
      setHighlightedVariable(null);
    },
    [variablesToRecode, recodeListType]
  );

  const moveToLeftPane = useCallback(
    (variable: Variable, targetIndex?: number) => {
      if (!variable.tempId) return;
      setVariablesToRecode((prev) => {
        const newList = prev.filter((v) => v.tempId !== variable.tempId);
        if (newList.length === 0) {
          setRecodeListType(null);
        }
        return newList;
      });
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
      setHighlightedVariable(null);
    },
    []
  );

  const reorderVariables = useCallback(
    (source: "available" | "recodeList", reorderedList: Variable[]) => {
      if (source === "available") {
        setAvailableVariables([...reorderedList]);
      } else if (source === "recodeList") {
        setVariablesToRecode([...reorderedList]);
      }
    },
    []
  );

  // Fungsi untuk mengevaluasi nilai berdasarkan aturan recode
  const evaluateValueWithRules = (
    value: string | number,
    rules: RecodeRule[]
  ): string | number | null => {
    // Jika nilai adalah string kosong, kembalikan apa adanya
    if (value === "") {
      return value;
    }

    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    const isNumericType = recodeListType === "NUMERIC";
    const isValidNumber = !isNaN(numericValue);

    for (const rule of rules) {
      switch (rule.oldValueType) {
        case "value":
          // Untuk tipe STRING, bandingkan nilai secara langsung
          if (!isNumericType && value === rule.oldValue) {
            return rule.newValue;
          }
          // Untuk tipe NUMERIC, pastikan nilai valid dan cocok
          if (
            isNumericType &&
            isValidNumber &&
            numericValue === rule.oldValue
          ) {
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
          // System missing biasanya direpresentasikan sebagai nilai kosong
          if (value === null || value === undefined) {
            return rule.newValue;
          }
          break;

        case "systemOrUserMissing":
          // System missing atau user missing (biasanya kode khusus)
          if (value === null || value === undefined) {
            return rule.newValue;
          }
          // Implementasi user missing dapat ditambahkan di sini
          break;

        case "else":
          // Rule 'else' akan diproses di akhir loop jika tidak ada rule lain yang cocok
          // Simpan dulu dan jangan return langsung
          continue;
      }
    }

    // Cek apakah ada rule 'else' setelah semua rule lain dievaluasi
    const elseRule = rules.find((r) => r.oldValueType === "else");
    if (elseRule) {
      return elseRule.newValue;
    }

    // Jika tidak ada rule yang cocok, kembalikan nilai original
    return value;
  };

  const handleOk = async () => {
    if (variablesToRecode.length === 0) {
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
      // Process each variable
      for (const variable of variablesToRecode) {
        const { data } = await dataStore.getVariableData(variable);
        const newData = data.map((value) => {
          const recodedValue = evaluateValueWithRules(value, recodeRules);
          return recodedValue === null ? "" : recodedValue;
        });

        // Update data in the data store
        await dataStore.updateBulkCells(
          newData.map((value, rowIndex) => ({
            row: rowIndex,
            col: variable.columnIndex,
            value,
          }))
        );
      }

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

      const logMsg = `RECODE VARIABLE ${variablesToRecode
        .map((v) => v.name)
        .join(", ")} WITH RULES: ${recodeRulesText}`;
      const logId = await resultStore.addLog({ log: logMsg });

      // Add analytic
      const analyticId = await resultStore.addAnalytic(logId, {
        title: "Recode into Same Variables",
        note: "",
      });

      // Add statistic
      await resultStore.addStatistic(analyticId, {
        title: "Recode into Same Variables",
        output_data: JSON.stringify({
          text: [
            {
              text: `The following variables were recoded: ${variablesToRecode
                .map((v) => `\`${v.name}\``)
                .join(", ")}\n\nWith the rules:\n${recodeRules
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
        title: "Recoding complete",
        description: `Successfully recoded ${variablesToRecode.length} variable(s).`,
      });

      onClose();
    } catch (error) {
      console.error("Error applying recode rules:", error);
      toast({
        title: "Error recoding variables",
        description: "An error occurred while applying recode rules.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = () => {
    console.log("Paste clicked");
  };

  const handleReset = () => {
    const allVars = allVariablesFromStore
      .filter((v) => v.name !== "")
      .map((v) => ({ ...v, tempId: v.tempId || `temp_${v.columnIndex}` }))
      .sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
    setAvailableVariables(allVars);
    setVariablesToRecode([]);
    setHighlightedVariable(null);
    setRecodeListType(null);
    setRecodeRules([]);
    setShowOldNewSetup(false);
    console.log("Reset clicked");
  };

  return (
    <>
      <DialogContent className="max-w-[700px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
        <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
          <DialogTitle className="text-[22px] font-semibold">
            {showOldNewSetup
              ? "Recode into Same Variables: Old and New Values"
              : "Recode into Same Variables"}
          </DialogTitle>
          {recodeListType && (
            <DialogDescription className="text-sm text-gray-500">
              Current variable type:{" "}
              <span className="font-medium">{recodeListType}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="p-6 flex-grow overflow-y-auto">
          {showOldNewSetup ? (
            <OldNewValuesSetup
              recodeListType={recodeListType}
              recodeRules={recodeRules}
              setRecodeRules={setRecodeRules}
              onCloseSetup={() => setShowOldNewSetup(false)}
              variableCount={variablesToRecode.length}
            />
          ) : (
            <RecodeVariablesTab
              availableVariables={availableVariables}
              variablesToRecode={variablesToRecode}
              highlightedVariable={highlightedVariable}
              setHighlightedVariable={setHighlightedVariable}
              moveToRightPane={moveToRightPane}
              moveToLeftPane={moveToLeftPane}
              reorderVariables={reorderVariables}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E6E6E6] flex-shrink-0 flex flex-col space-y-3">
          {!showOldNewSetup && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (variablesToRecode.length === 0) {
                    toast({
                      title: "No variables selected",
                      description:
                        "Please select at least one variable to recode.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowOldNewSetup(true);
                }}
              >
                Old and New Values...
              </Button>
              <Button variant="outline" className="flex-1">
                If... (optional case selection condition)
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] flex-shrink-0">
          <div className="flex justify-end space-x-2 w-full">
            {showOldNewSetup ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowOldNewSetup(false)}
                >
                  Back to Variables
                </Button>
              </>
            ) : null}
            <Button
              variant="default"
              onClick={handleOk}
              disabled={
                isProcessing ||
                variablesToRecode.length === 0 ||
                recodeRules.length === 0
              }
            >
              {isProcessing ? "Processing..." : "OK"}
            </Button>
            <Button variant="outline" onClick={handlePaste}>
              Paste
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline">Help</Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Type Mismatch Alert Dialog */}
      <AlertDialog open={showTypeAlert} onOpenChange={setShowTypeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Variable Type Mismatch</AlertDialogTitle>
            <AlertDialogDescription>
              Cannot add {incompatibleVariable?.name} (
              {incompatibleVariable?.type}) to the list. Currently selected
              variables are of type {recodeListType}. Variables to recode must
              be of the same type (either all NUMERIC or all STRING).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTypeAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;
