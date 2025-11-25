"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, HelpCircle } from "lucide-react";

// Stores & Hooks
import { useVariableStore } from "@/stores/useVariableStore";
import { useModalStore } from "@/stores/useModalStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";

// Components
import { VariablesTab } from "./VariablesTab";
import { CategoricalTab } from "./CategoricalTab";
import { SaveTab } from "./SaveTab";
import { OptionsTab } from "./OptionsTab";

// Formatter
import { formatBinaryLogisticResult } from "../services/formatter";

// Types
import { Variable } from "@/types/Variable";
import {
  BinaryLogisticOptions,
  BinaryLogisticCategoricalParams,
  BinaryLogisticSaveParams,
  BinaryLogisticOptionsParams,
} from "../types/binary-logistic";

export const BinaryLogisticMain = () => {
  const { closeModal } = useModalStore();
  const variablesFromStore = useVariableStore((state) => state.variables);

  const { data } = useDataStore();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("variables");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Variable Selection State
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] =
    useState<Variable | null>(null);
  const [options, setOptions] = useState<BinaryLogisticOptions>({
    dependent: null,
    covariates: [],
    factors: [],
    method: "Enter",
  });

  // Sub-Dialog Params State
  const [catParams, setCatParams] = useState<BinaryLogisticCategoricalParams>({
    covariates: [],
    contrast: "Indicator",
    referenceCategory: "Last",
  });
  const [saveParams, setSaveParams] = useState<BinaryLogisticSaveParams>({
    predictedProbabilities: false,
    predictedGroup: false,
    residualsUnstandardized: false,
    residualsLogit: false,
    residualsStudentized: false,
    residualsStandardized: false,
    residualsDeviance: false,
    influenceCooks: false,
    influenceLeverage: false,
    influenceDfBeta: false,
  });

  const [optParams, setOptParams] = useState<BinaryLogisticOptionsParams>({
    classificationPlots: false,
    hosmerLemeshow: false,
    casewiseListing: false,
    casewiseType: "outliers",
    casewiseOutliers: 2.0,
    correlations: false,
    iterationHistory: false,
    ciForExpB: false,
    ciLevel: 95,
    displayAtEachStep: false,
    probEntry: 0.05,
    probRemoval: 0.1,
    classificationCutoff: 0.5,
    maxIterations: 20,
    includeConstant: true,
  });

  // --- EFFECTS ---
  useEffect(() => {
    const selectedIds = new Set([
      options.dependent?.id,
      ...options.covariates.map((v) => v.id),
      ...options.factors.map((v) => v.id),
    ]);

    const filtered = variablesFromStore.filter((v) => !selectedIds.has(v.id));
    setAvailableVariables(filtered);
  }, [
    variablesFromStore,
    options.dependent,
    options.covariates,
    options.factors,
  ]);

  // --- HANDLERS ---
  const handleMoveToDependent = () => {
    if (highlightedVariable) {
      setOptions((prev) => ({ ...prev, dependent: highlightedVariable }));
      setHighlightedVariable(null);
    }
  };

  const handleMoveToCovariates = () => {
    if (highlightedVariable) {
      setOptions((prev) => ({
        ...prev,
        covariates: [...prev.covariates, highlightedVariable],
      }));
      setHighlightedVariable(null);
    }
  };

  const handleMoveToFactors = () => {
    if (highlightedVariable) {
      setOptions((prev) => ({
        ...prev,
        factors: [...prev.factors, highlightedVariable],
      }));
      setHighlightedVariable(null);
    }
  };

  const handleRemoveDependent = () => {
    setOptions((prev) => ({ ...prev, dependent: null }));
  };

  const handleRemoveCovariate = (variable: Variable) => {
    setOptions((prev) => ({
      ...prev,
      covariates: prev.covariates.filter((v) => v.id !== variable.id),
    }));
    setCatParams((prev) => ({
      ...prev,
      covariates: prev.covariates.filter((n) => n !== variable.name),
    }));
  };

  const handleRemoveFactor = (variable: Variable) => {
    setOptions((prev) => ({
      ...prev,
      factors: prev.factors.filter((v) => v.id !== variable.id),
    }));
  };

  // --- LOGIKA UTAMA EKSEKUSI WORKER ---
  const handleAnalyze = async () => {
    if (!options.dependent || options.covariates.length === 0) {
      setErrorMsg(
        "Please select a dependent variable and at least one covariate."
      );
      return;
    }

    if (!data || data.length === 0) {
      setErrorMsg("No data available.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Ambil Data Mentah
      const depIndex = options.dependent.columnIndex;
      const yData = data.map((row: any) => Number(row[depIndex]));

      // Gabungkan covariates dan factors
      const allPredictors = [...options.covariates, ...options.factors];
      const xData = data.map((row: any) =>
        allPredictors.map((v) => Number(row[v.columnIndex]))
      );

      // 2. Payload untuk Worker
      const payload = {
        y: yData,
        x: xData,
        config: {
          cutoff: optParams.classificationCutoff,
          max_iterations: optParams.maxIterations,
          include_constant: optParams.includeConstant,
        },
      };

      console.log("Sending payload to worker:", payload);

      // 3. Panggil Web Worker
      const worker = new Worker(
        "/workers/Regression/binaryLogistic.worker.js",
        {
          type: "module",
        }
      );

      worker.postMessage({ type: "RUN_ANALYSIS", payload });

      worker.onmessage = async (event) => {
        const { type, result, error } = event.data;

        if (type === "SUCCESS") {
          // 4. Format Hasil HTML
          const htmlOutput = formatBinaryLogisticResult(
            result,
            options.dependent!.name
          );

          const varNames = options.covariates.map((c) => c.name).join(" ");
          const logId = await addLog({
            log: `LOGISTIC REGRESSION VARIABLES ${
              options.dependent!.name
            } /METHOD=ENTER ${varNames}`,
          });

          const analyticId = await addAnalytic(logId, {
            title: "Binary Logistic Regression",
            note: `Method: Enter`,
          });

          // [FIX] JSON.stringify agar tidak error "Invalid data: JSON format is incorrect"
          await addStatistic(analyticId, {
            title: "Logistic Regression Output",
            output_data: JSON.stringify(htmlOutput), // PENTING: Stringify HTML
            components: "HtmlOutput",
            description: "Variables in Equation, Model Summary, etc.",
          });

          setIsLoading(false);
          closeModal("BINARY_LOGISTIC");
          worker.terminate();
        } else {
          // Tampilkan error dari worker dengan jelas
          setErrorMsg(`Analysis Failed: ${error}`);
          setIsLoading(false);
          worker.terminate();
        }
      };

      worker.onerror = (event) => {
        console.error("WORKER ERROR EVENT:", event);

        let message = "Unknown Worker Error";
        if (event instanceof ErrorEvent) {
          message = event.message;
        } else {
          message =
            "Failed to load worker script. Check file path or Network tab (404).";
        }

        setErrorMsg(`Analysis Failed: ${message}`);
        setIsLoading(false);
        worker.terminate();
      };
    } catch (err: any) {
      setErrorMsg("Error preparing data: " + err.message);
      setIsLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 py-4 flex-shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">
          Binary Logistic Regression
        </h2>
      </div>

      <div className="px-6 py-2">
        <Separator className="my-2" />
      </div>

      <div className="flex-grow px-6 overflow-y-auto min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="categorical">Categorical</TabsTrigger>
            <TabsTrigger value="save">Save</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <div className="flex-grow min-h-0 overflow-hidden">
            <TabsContent value="variables" className="h-full mt-0">
              <VariablesTab
                availableVariables={availableVariables}
                selectedDependent={options.dependent}
                selectedCovariates={options.covariates}
                selectedFactors={options.factors}
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setHighlightedVariable}
                onMoveToDependent={handleMoveToDependent}
                onMoveToCovariates={handleMoveToCovariates}
                onMoveToFactors={handleMoveToFactors}
                onRemoveDependent={handleRemoveDependent}
                onRemoveCovariate={handleRemoveCovariate}
                onRemoveFactor={handleRemoveFactor}
                method={options.method}
                onMethodChange={(val) =>
                  setOptions((prev) => ({ ...prev, method: val }))
                }
              />
            </TabsContent>

            <TabsContent value="categorical" className="h-full mt-0">
              <CategoricalTab
                covariates={options.covariates}
                factors={options.factors}
                params={catParams}
                onChange={setCatParams}
              />
            </TabsContent>

            <TabsContent value="save" className="h-full mt-0">
              <SaveTab
                params={saveParams}
                onChange={(p) => setSaveParams((prev) => ({ ...prev, ...p }))}
              />
            </TabsContent>

            <TabsContent value="options" className="h-full mt-0">
              <OptionsTab
                params={optParams}
                onChange={(p) => setOptParams((prev) => ({ ...prev, ...p }))}
              />
            </TabsContent>
          </div>
        </Tabs>

        {errorMsg && (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
        <div className="flex items-center text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Help</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !options.dependent}
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
            onClick={() => {
              setOptions({
                dependent: null,
                covariates: [],
                factors: [],
                method: "Enter",
              });
              setHighlightedVariable(null);
            }}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => closeModal("BINARY_LOGISTIC")}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
