"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Stores & Hooks
import { useVariableStore } from "@/stores/useVariableStore";
import { useModalStore } from "@/stores/useModalStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";

// Tab panels & sub-dialogs
import { DiscriminantStatistics } from "./statistics";
import { DiscriminantMethod } from "./method";
import { DiscriminantClassify } from "./classify";
import { DiscriminantSave } from "./save";
import { DiscriminantBootstrap } from "./bootstrap";
import { DiscriminantDefineRange } from "./define-range";
import { DiscriminantSetValue } from "./set-value";
import { DiscriminantAssumptions } from "./assumptions";

// Types
import type { Variable } from "@/types/Variable";
import { useDiscriminantState } from "../hooks/useDiscriminantState";


export const DiscriminantMain = () => {
  const { closeModal } = useModalStore();
  const variablesFromStore = useVariableStore((state) => state.variables);
  const { data } = useDataStore();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  const {
    formData,
    updateFormData,
    executeAnalysis,
    resetFormData,
    isLoading,
    error,
  } = useDiscriminantState(variablesFromStore, data as string[][]);

  const [activeTab, setActiveTab] = useState("variables");

  // Sub-dialog open/close state (Define Range / Value remain popups since they
  // are contextual actions for the grouping / selection variable).
  const [isDefineRangeOpen, setIsDefineRangeOpen] = useState(false);
  const [isSetValueOpen, setIsSetValueOpen] = useState(false);

  const variables = useVariableStore((state) => state.variables);

  const mainData = formData.main;

  // Method applies only to the stepwise method; Bootstrap only to "enter
  // independents together". They are mutually exclusive, so we show just the
  // relevant one to keep the single tab row from getting crowded.
  const showMethod = mainData.Stepwise;
  const showBootstrap = !mainData.Stepwise;

  // --- VARIABLE SELECTION ---
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] =
    useState<Variable | null>(null);

  useEffect(() => {
    const usedIds = new Set([
      ...(mainData.IndependentVariables || []),
    ]);
    const filtered = variablesFromStore.filter(
      (v: Variable) => !usedIds.has(v.name)
    );
    setAvailableVariables(filtered as Variable[]);
  }, [mainData.IndependentVariables, variablesFromStore]);

  // If the active tab gets hidden (Method/Bootstrap toggling with the method
  // choice), fall back to the Variables tab.
  useEffect(() => {
    if (activeTab === "method" && !showMethod) setActiveTab("variables");
    if (activeTab === "bootstrap" && !showBootstrap) setActiveTab("variables");
  }, [activeTab, showMethod, showBootstrap]);

  const handleDrop = (target: string, variable: Variable) => {
    if (target === "GroupingVariable") {
      updateFormData("main", "GroupingVariable", variable.name);
    } else if (target === "IndependentVariables") {
      const current = mainData.IndependentVariables || [];
      if (!current.includes(variable.name)) {
        updateFormData("main", "IndependentVariables", [...current, variable.name]);
      }
    } else if (target === "SelectionVariable") {
      updateFormData("main", "SelectionVariable", variable.name);
    }
  };

  const handleRemoveVariable = (target: string, variable?: string) => {
    if (target === "GroupingVariable") {
      updateFormData("main", "GroupingVariable", null);
    } else if (target === "IndependentVariables" && variable) {
      const current = mainData.IndependentVariables || [];
      updateFormData("main", "IndependentVariables", current.filter((v) => v !== variable));
    } else if (target === "SelectionVariable") {
      updateFormData("main", "SelectionVariable", null);
    }
  };

  const handleMethodGrp = (value: string) => {
    updateFormData("main", "Together", value === "Together");
    updateFormData("main", "Stepwise", value === "Stepwise");
  };

  const openSubDialog = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => () => {
    setter(true);
  };

  // --- ANALYZE ---
  const handleAnalyze = async () => {
    if (!mainData.GroupingVariable) {
      toast.error("Please select a Grouping Variable.");
      return;
    }
    if (!mainData.IndependentVariables || mainData.IndependentVariables.length === 0) {
      toast.error("Please select at least one Independent Variable.");
      return;
    }

    try {
      await executeAnalysis(mainData);
      closeModal("ModalDiscriminant");
    } catch (err: any) {
      console.error("Discriminant analysis failed:", err);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-grow px-6 py-3 overflow-y-auto min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col"
        >
          <TabsList className="w-full justify-center gap-1 flex-shrink-0">
            <TabsTrigger value="variables" id="discriminant-variables-tab-trigger">
              Variables
            </TabsTrigger>
            <TabsTrigger value="statistics" id="discriminant-statistics-tab-trigger">
              Statistics
            </TabsTrigger>
            {showMethod && (
              <TabsTrigger value="method" id="discriminant-method-tab-trigger">
                Method
              </TabsTrigger>
            )}
            <TabsTrigger value="classify" id="discriminant-classify-tab-trigger">
              Classify
            </TabsTrigger>
            <TabsTrigger value="save" id="discriminant-save-tab-trigger">
              Save
            </TabsTrigger>
            {showBootstrap && (
              <TabsTrigger value="bootstrap" id="discriminant-bootstrap-tab-trigger">
                Bootstrap
              </TabsTrigger>
            )}
            <TabsTrigger value="assumptions" id="discriminant-assumptions-tab-trigger">
              Assumptions
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow min-h-0 overflow-y-auto">
            {/* === Variables Tab === */}
            <TabsContent value="variables" className="h-full mt-0">
              <div className="flex flex-col gap-4 h-full">
                {/* Radio: Together / Stepwise */}
                <div className="flex flex-col gap-1">
                  <Label className="font-semibold text-sm">Method</Label>
                  <RadioGroup
                    value={mainData.Together ? "Together" : "Stepwise"}
                    onValueChange={handleMethodGrp}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Together" id="Together" />
                      <Label htmlFor="Together">Enter independents together</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Stepwise" id="Stepwise" />
                      <Label htmlFor="Stepwise">Use stepwise method</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Variable Assignment Areas */}
                <div className="flex gap-4 flex-grow min-h-0" style={{ minHeight: 0 }}>
                  {/* Left: Available Variables */}
                  <div className="flex flex-col w-1/4 gap-1">
                    <Label className="font-semibold text-sm">Available Variables</Label>
                    <ScrollArea className="flex-grow border rounded p-2">
                      <div className="flex flex-col gap-1">
                        {availableVariables.map((variable: Variable, index: number) => (
                          <Badge
                            key={index}
                            className="w-full text-start text-sm font-light p-2 cursor-pointer"
                            variant="outline"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "text",
                                JSON.stringify(variable)
                              );
                            }}
                            onClick={() =>
                              setHighlightedVariable(
                                highlightedVariable?.name === variable.name
                                  ? null
                                  : variable
                              )
                            }
                          >
                            {variable.label || variable.name}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right: Assignment Areas */}
                  <div className="flex flex-col flex-grow gap-3">
                    {/* Grouping Variable */}
                    <div className="flex flex-col gap-1">
                      <Label className="font-semibold text-sm">Grouping Variable:</Label>
                      <div
                        className="min-h-[40px] p-2 border rounded"
                        onDrop={(e) => {
                          e.preventDefault();
                          try {
                            const variable = JSON.parse(
                              e.dataTransfer.getData("text")
                            );
                            handleDrop("GroupingVariable", variable);
                          } catch {}
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <ScrollArea>
                          {mainData.GroupingVariable ? (
                            <Badge
                              className="text-start text-sm font-light p-2 cursor-pointer"
                              variant="outline"
                              onClick={() =>
                                handleRemoveVariable("GroupingVariable")
                              }
                            >
                              {mainData.GroupingVariable}
                            </Badge>
                          ) : (
                            <span className="text-sm font-light text-gray-500">
                              Drop grouping variable here.
                            </span>
                          )}
                        </ScrollArea>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={openSubDialog(setIsDefineRangeOpen)}
                      >
                        Define Range...
                      </Button>
                    </div>

                    {/* Independent Variables */}
                    <div className="flex flex-col gap-1">
                      <Label className="font-semibold text-sm">Independents:</Label>
                      <div
                        className="min-h-[80px] p-2 border rounded"
                        onDrop={(e) => {
                          e.preventDefault();
                          try {
                            const variable = JSON.parse(
                              e.dataTransfer.getData("text")
                            );
                            handleDrop("IndependentVariables", variable);
                          } catch {}
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <ScrollArea>
                          {mainData.IndependentVariables &&
                          mainData.IndependentVariables.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {mainData.IndependentVariables.map(
                                (variable, index) => (
                                  <Badge
                                    key={index}
                                    className="text-start text-sm font-light p-2 cursor-pointer"
                                    variant="outline"
                                    onClick={() =>
                                      handleRemoveVariable(
                                        "IndependentVariables",
                                        variable
                                      )
                                    }
                                  >
                                    {variable}
                                  </Badge>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-sm font-light text-gray-500">
                              Drop independent variables here.
                            </span>
                          )}
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Selection Variable */}
                    <div className="flex flex-col gap-1">
                      <Label className="font-semibold text-sm">Selection Variable:</Label>
                      <div className="flex gap-2">
                        <div
                          className="flex-grow min-h-[40px] p-2 border rounded"
                          onDrop={(e) => {
                            e.preventDefault();
                            try {
                              const variable = JSON.parse(
                                e.dataTransfer.getData("text")
                              );
                              handleDrop("SelectionVariable", variable);
                            } catch {}
                          }}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <ScrollArea>
                            {mainData.SelectionVariable ? (
                              <Badge
                                className="text-start text-sm font-light p-2 cursor-pointer"
                                variant="outline"
                                onClick={() =>
                                  handleRemoveVariable("SelectionVariable")
                                }
                              >
                                {mainData.SelectionVariable}
                              </Badge>
                            ) : (
                              <span className="text-sm font-light text-gray-500">
                                Drop selection variable here.
                              </span>
                            )}
                          </ScrollArea>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={openSubDialog(setIsSetValueOpen)}
                        >
                          Value...
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* === Statistics Tab === */}
            <TabsContent value="statistics" className="h-full mt-0">
              <DiscriminantStatistics
                updateFormData={(field, value) =>
                  updateFormData("statistics", field, value)
                }
                data={formData.statistics}
              />
            </TabsContent>

            {/* === Method Tab (stepwise only) === */}
            <TabsContent value="method" className="h-full mt-0">
              <DiscriminantMethod
                updateFormData={(field, value) =>
                  updateFormData("method", field, value)
                }
                data={formData.method}
              />
            </TabsContent>

            {/* === Classify Tab === */}
            <TabsContent value="classify" className="h-full mt-0">
              <DiscriminantClassify
                updateFormData={(field, value) =>
                  updateFormData("classify", field, value)
                }
                data={formData.classify}
              />
            </TabsContent>

            {/* === Save Tab === */}
            <TabsContent value="save" className="h-full mt-0">
              <DiscriminantSave
                updateFormData={(field, value) =>
                  updateFormData("save", field, value)
                }
                data={formData.save}
              />
            </TabsContent>

            {/* === Bootstrap Tab (together only) === */}
            <TabsContent value="bootstrap" className="h-full mt-0">
              <DiscriminantBootstrap
                updateFormData={(field, value) =>
                  updateFormData("bootstrap", field, value)
                }
                data={formData.bootstrap}
              />
            </TabsContent>

            {/* === Assumptions Tab === */}
            <TabsContent value="assumptions" className="h-full mt-0">
              <DiscriminantAssumptions
                updateFormData={(field, value) =>
                  updateFormData("assumptions", field, value)
                }
                data={formData.assumptions}
              />
            </TabsContent>
          </div>
        </Tabs>

        {error && (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
        <div />
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleAnalyze}
            disabled={
              isLoading ||
              !mainData.GroupingVariable ||
              !mainData.IndependentVariables ||
              mainData.IndependentVariables.length === 0
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "OK"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={resetFormData}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => closeModal("ModalDiscriminant")}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Contextual popups (grouping / selection variable) */}
      <DiscriminantDefineRange
        isDefineRangeOpen={isDefineRangeOpen}
        setIsDefineRangeOpen={setIsDefineRangeOpen}
        updateFormData={(field, value) =>
          updateFormData("defineRange", field, value)
        }
        data={formData.defineRange}
      />

      <DiscriminantSetValue
        isSetValueOpen={isSetValueOpen}
        setIsSetValueOpen={setIsSetValueOpen}
        updateFormData={(field, value) =>
          updateFormData("setValue", field, value)
        }
        data={formData.setValue}
      />
    </div>
  );
};
