"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { AssumptionChecksTab } from "./AssumptionChecksTab";

// Formatter
import { formatBinaryLogisticResult } from "../services/formatter";
import { formatAssumptionTests } from "../services/formatter_assumptions";

// Types
import { Variable } from "@/types/Variable";
import {
  BinaryLogisticOptions,
  BinaryLogisticCategoricalParams,
  BinaryLogisticSaveParams,
  BinaryLogisticOptionsParams,
  BinaryLogisticAssumptionParams,
  LogisticResult,
  DEFAULT_BINARY_LOGISTIC_OPTIONS,
  DEFAULT_BINARY_LOGISTIC_CATEGORICAL_PARAMS,
  DEFAULT_BINARY_LOGISTIC_SAVE_PARAMS,
  DEFAULT_BINARY_LOGISTIC_OPTIONS_PARAMS,
  DEFAULT_BINARY_LOGISTIC_ASSUMPTION_PARAMS,
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
  const { variables } = useVariableStore();
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] =
    useState<Variable | null>(null);

  // Main Options State
  const [options, setOptions] = useState<BinaryLogisticOptions>(
    DEFAULT_BINARY_LOGISTIC_OPTIONS
  );

  const variableDetails = useMemo(() => {
    return variablesFromStore.reduce((acc, v) => {
      if (v.id !== undefined) {
        acc[v.id] = v;
      }
      return acc;
    }, {} as Record<number, Variable>);
  }, [variablesFromStore]);

  // Sub-Dialog Params State
  const [catParams, setCatParams] = useState<BinaryLogisticCategoricalParams>(
    DEFAULT_BINARY_LOGISTIC_CATEGORICAL_PARAMS
  );

  const [saveParams, setSaveParams] = useState<BinaryLogisticSaveParams>(
    DEFAULT_BINARY_LOGISTIC_SAVE_PARAMS
  );

  const [optParams, setOptParams] = useState<BinaryLogisticOptionsParams>(
    DEFAULT_BINARY_LOGISTIC_OPTIONS_PARAMS
  );

  const [assumptionParams, setAssumptionParams] =
    useState<BinaryLogisticAssumptionParams>(
      DEFAULT_BINARY_LOGISTIC_ASSUMPTION_PARAMS
    );

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

  // --- MODIFIKASI: Auto-detect Nominal/Ordinal variables ---
  const handleMoveToCovariates = () => {
    if (highlightedVariable) {
      // 1. Tambahkan ke daftar Covariates
      setOptions((prev) => ({
        ...prev,
        covariates: [...prev.covariates, highlightedVariable],
      }));

      // 2. Cek apakah tipe datanya Nominal atau Ordinal (case-insensitive check)
      const measure = highlightedVariable.measure?.toLowerCase();
      if (measure === "nominal" || measure === "ordinal") {
        setCatParams((prev) => {
          // Pastikan tidak duplikat
          if (!prev.covariates.includes(highlightedVariable.name)) {
            return {
              ...prev,
              covariates: [...prev.covariates, highlightedVariable.name],
            };
          }
          return prev;
        });
      }

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

  // --- WORKER HELPER ---
  const runWorkerAction = (action: string, extraConfig = {}) => {
    return new Promise((resolve, reject) => {
      // Validasi minimal untuk semua action
      if (
        (action === "run_binary_logistic" || action === "run_vif") &&
        options.covariates.length === 0
      ) {
        reject(new Error("Please select at least one covariate."));
        return;
      }

      if (!data || data.length === 0) {
        reject(new Error("No data available."));
        return;
      }

      const worker = new Worker(
        new URL(
          "/workers/Regression/binaryLogistic.worker.js",
          window.location.origin
        ),
        { type: "module" }
      );

      worker.onmessage = (event) => {
        const { type, payload } = event.data;
        worker.terminate();
        if (type === "SUCCESS") resolve(payload);
        else reject(new Error(payload || "Worker error"));
      };

      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };

      // Prepare basic indices
      const depIndex = options.dependent
        ? variables.findIndex((v) => v.id === options.dependent!.id)
        : -1;

      const indepIndices = [
        ...options.covariates.map((c) =>
          variables.findIndex((v) => v.id === c.id)
        ),
        ...options.factors.map((f) =>
          variables.findIndex((v) => v.id === f.id)
        ),
      ].filter((idx) => idx !== -1);

      // Konfigurasi umum
      const analysisConfig = {
        dependent_index: depIndex,
        independent_indices: indepIndices,
        rows: data.length,
        cols: variables.length,
        // ... (config lain tidak relevan untuk VIF/BT raw calc, tapi dikirim saja)
        ...extraConfig,
      };

      worker.postMessage({
        action,
        dependentId: options.dependent?.id, // Bisa null untuk VIF (tergantung worker)
        independentIds: [
          ...options.covariates.map((v) => v.id),
          ...options.factors.map((v) => v.id),
        ],
        data: data,
        variableDetails: variableDetails,
        config: JSON.stringify(analysisConfig),
      });
    });
  };

  // --- ASSUMPTION HANDLERS (UPDATED TO USE FORMATTER) ---
  const handleRunVIF = async () => {
    try {
      if (options.covariates.length < 2) {
        throw new Error("VIF requires at least two independent variables.");
      }

      const payload: any = await runWorkerAction("run_vif");

      console.log("VIF Payload form Worker:", payload); // Debugging

      // Save log & analytic container
      const logId = await addLog({
        log: `REGRESSION VIF CHECK VARIABLES ${options.covariates
          .map((c) => c.name)
          .join(" ")}`,
      });
      const analyticId = await addAnalytic(logId, {
        title: "Multicollinearity Diagnostics (VIF)",
      });

      const formattedOutput = formatAssumptionTests(payload);

      // Save sections using loop
      if (formattedOutput.sections && formattedOutput.sections.length > 0) {
        for (const section of formattedOutput.sections) {
          const tableDataWithTitle = {
            ...section.data,
            title: section.title,
            note: section.note,
          };
          await addStatistic(analyticId, {
            title: section.title,
            description: section.description || "",
            output_data: JSON.stringify({ tables: [tableDataWithTitle] }),
            components: "Assumption Tests",
          });
        }
      } else {
        console.warn("Formatter returned no sections for VIF", formattedOutput);
      }
    } catch (err: any) {
      console.error(err);
      throw new Error("Failed to run VIF check: " + err.message);
    }
  };

  const handleRunBoxTidwell = async () => {
    try {
      if (!options.dependent)
        throw new Error("Dependent variable is required.");

      const payload: any = await runWorkerAction("run_box_tidwell");

      // Save log & analytic container
      const logId = await addLog({
        log: `REGRESSION BOX-TIDWELL VARIABLES ${options.covariates
          .map((c) => c.name)
          .join(" ")}`,
      });
      const analyticId = await addAnalytic(logId, {
        title: "Linearity of Logit (Box-Tidwell)",
      });

      // === REUSE FORMATTER ===
      const mockResult = {
        assumption_tests: {
          box_tidwell: payload, // Payload dari worker adalah array BoxTidwellRow[]
        },
      } as Partial<LogisticResult> as LogisticResult;

      const formattedOutput = formatAssumptionTests(mockResult);

      for (const section of formattedOutput.sections) {
        const tableDataWithTitle = {
          ...section.data,
          title: section.title,
          note: section.note,
        };
        await addStatistic(analyticId, {
          title: section.title,
          description: section.description || "",
          output_data: JSON.stringify({ tables: [tableDataWithTitle] }),
          components: "Assumption Tests",
        });
      }
    } catch (err: any) {
      console.error(err);
      throw new Error("Failed to run Box-Tidwell test: " + err.message);
    }
  };

  // --- LOGIKA UTAMA EKSEKUSI WORKER ---
  const handleAnalyze = async () => {
    // 1. Validasi Input
    if (!options.dependent || options.covariates.length === 0) {
      setErrorMsg(
        "Mohon pilih satu variabel dependen dan setidaknya satu kovariat."
      );
      return;
    }

    if (!data || data.length === 0) {
      setErrorMsg("Dataset kosong atau tidak tersedia.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const worker = new Worker(
        new URL(
          "/workers/Regression/binaryLogistic.worker.js",
          window.location.origin
        ),
        { type: "module" }
      );

      worker.onmessage = async (event) => {
        const { type, payload } = event.data;
        console.log(`[Main] Worker Message: ${type}`, payload);

        if (type === "SUCCESS") {
          try {
            console.log("[Main] Starting Formatting Process...");

            const allIndependentVars = [
              ...options.covariates,
              ...options.factors,
            ];

            const formattedResult = formatBinaryLogisticResult(
              payload,
              options.dependent!,
              allIndependentVars
            );

            console.log("[Main] Formatting Complete:", formattedResult);

            if (
              !formattedResult.sections ||
              formattedResult.sections.length === 0
            ) {
              console.warn("[Main] Warning: Formatter returned 0 sections!");
            }

            // B. Simpan Log
            const varNames = options.covariates.map((c) => c.name).join(" ");
            const logId = await addLog({
              log: `LOGISTIC REGRESSION VARIABLES ${
                options.dependent!.name
              } /METHOD=${options.method.toUpperCase()} ${varNames}`,
            });

            // C. Simpan Analytic Entry (Parent)
            const analyticId = await addAnalytic(logId, {
              title: "Binary Logistic Regression",
              note: `Method: ${options.method}`,
            });

            console.log(`[Main] Saving to DB (AnalyticID: ${analyticId})...`);

            // D. Simpan Output per Section
            if (
              formattedResult.sections &&
              Array.isArray(formattedResult.sections)
            ) {
              for (const section of formattedResult.sections) {
                console.log(`[Main] Saving Section: ${section.title}`);

                // -----------------------------------------------------------
                // LOGIC CUSTOM COMPONENTS (HEADER GROUPING)
                // -----------------------------------------------------------
                let componentCategory = "Tables";
                const cleanTitle = section.title
                  .replace(/<[^>]*>?/gm, " ")
                  .trim();

                if (section.id.includes("case_processing")) {
                  componentCategory = "Case Processing Summary";
                } else if (section.id.includes("encoding")) {
                  componentCategory = "Dependent Variable Encoding";
                } else if (section.id.includes("categorical_codings")) {
                  componentCategory = "Categorical Variables Codings";
                } else if (section.id.includes("block0")) {
                  componentCategory = "Block 0: Beginning Block";
                } else if (section.id.includes("block1") || section.id.includes("hosmer")) {
                  componentCategory = `Block 1: Method = ${options.method}`;
                } else {
                  componentCategory = cleanTitle;
                }

                // -----------------------------------------------------------
                // DATA PREPARATION FOR RENDERER
                // -----------------------------------------------------------
                const tableObjectForRenderer = {
                  ...section.data,
                  title: section.title,
                  note: section.note,
                };

                const payloadForRenderer = {
                  tables: [tableObjectForRenderer],
                };

                // -----------------------------------------------------------
                // SIMPAN KE DATABASE
                // -----------------------------------------------------------
                await addStatistic(analyticId, {
                  title: section.title,
                  description: section.description || "",
                  output_data: JSON.stringify(payloadForRenderer),
                  components: componentCategory,
                });
              }
            }

            console.log("[Main] All Saved. Closing Modal.");
            setIsLoading(false);
            worker.terminate();
            closeModal("BINARY_LOGISTIC");
          } catch (saveError: any) {
            console.error("[Main] Error inside SUCCESS block:", saveError);
            setErrorMsg("Gagal menyimpan hasil: " + saveError.message);
            setIsLoading(false);
            worker.terminate();
          }
        } else if (type === "ERROR") {
          console.error("[Main] Worker reported ERROR:", payload);
          setErrorMsg(
            typeof payload === "string"
              ? payload
              : "Terjadi kesalahan perhitungan."
          );
          setIsLoading(false);
          worker.terminate();
        }
      };

      worker.onerror = (event) => {
        event.preventDefault();
        console.error("[Main] Worker System Error:", event);
        setErrorMsg("Gagal menjalankan modul kalkulasi (WASM Error).");
        setIsLoading(false);
        worker.terminate();
      };

      // --- PERSIAPAN DATA INDEX & CONFIG ---
      const depIndex = variables.findIndex(
        (v) => v.id === options.dependent!.id
      );

      const indepIndices = [
        ...options.covariates.map((c) =>
          variables.findIndex((v) => v.id === c.id)
        ),
        ...options.factors.map((f) =>
          variables.findIndex((v) => v.id === f.id)
        ),
      ].filter((idx) => idx !== -1);

      if (depIndex === -1 || indepIndices.length === 0) {
        throw new Error("Gagal menemukan index variabel di dataset.");
      }

      const methodMapping: Record<string, string> = {
        Enter: "Enter",
        "Forward: Conditional": "ForwardConditional",
        "Forward: Wald": "ForwardWald",
        "Forward: LR": "ForwardLR",
        "Backward: Conditional": "BackwardConditional",
        "Backward: Wald": "BackwardWald",
        "Backward: LR": "BackwardLR",
      };

      // --- PERUBAHAN: Mapping Konfigurasi Kategorik ---
      // Mengubah state UI (catParams) menjadi format config untuk Rust
      const categoricalConfig = options.covariates
        .filter((v) => catParams.covariates.includes(v.name))
        .map((v) => ({
          id: v.id,
          method: catParams.contrast,
          reference: catParams.referenceCategory,
        }));

      // Tambahkan factors otomatis
      options.factors.forEach((f) => {
        if (!categoricalConfig.find((c) => c.id === f.id)) {
          categoricalConfig.push({
            id: f.id,
            method: catParams.contrast,
            reference: catParams.referenceCategory,
          });
        }
      });
      // ------------------------------------------------

      const analysisConfig = {
        dependent_index: depIndex,
        independent_indices: indepIndices,

        // --- Option Params ---
        max_iterations: optParams.maxIterations,
        include_constant: optParams.includeConstant,
        convergence_threshold: 1e-6, // Fixed value for now
        confidence_level: optParams.ciLevel,
        cutoff: optParams.classificationCutoff,

        // --- Algoritma Method Params ---
        method: methodMapping[options.method] || "Enter",
        p_entry: optParams.probEntry,
        p_removal: optParams.probRemoval,

        // --- Additional Output Options sent to Worker ---
        classification_plots: optParams.classificationPlots,
        hosmer_lemeshow: optParams.hosmerLemeshow,
        casewise_listing: optParams.casewiseListing,
        casewise_outliers: optParams.casewiseOutliers,
        iteration_history: optParams.iterationHistory,
        correlations: optParams.correlations,

        rows: data.length,
        cols: variables.length,

        // --- KIRIM CONFIG KATEGORIK ---
        categoricalVariables: categoricalConfig,

        assumptions: {
          multicollinearity: assumptionParams.multicollinearity,
          box_tidwell: assumptionParams.boxTidwell,
        },
      };

      console.log("Config Cleaned for Rust:", JSON.stringify(analysisConfig));

      worker.postMessage({
        action: "run_binary_logistic",
        dependentId: options.dependent.id,
        independentIds: [
          ...options.covariates.map((v) => v.id),
          ...options.factors.map((v) => v.id),
        ],
        data: data,
        variableDetails: variableDetails,
        config: JSON.stringify(analysisConfig),
      });
    } catch (err: any) {
      console.error("Main Thread Error:", err);
      setErrorMsg("Gagal memulai analisis: " + err.message);
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
          <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="categorical">Categorical</TabsTrigger>
            <TabsTrigger value="save">Save</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="assumption">Assumption</TabsTrigger>
          </TabsList>

          <div className="flex-grow min-h-0 overflow-hidden">
            <TabsContent value="variables" className="h-full mt-0">
              <VariablesTab
                availableVariables={availableVariables}
                selectedDependent={options.dependent}
                selectedCovariates={options.covariates}
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setHighlightedVariable}
                onMoveToDependent={handleMoveToDependent}
                onMoveToCovariates={handleMoveToCovariates}
                onRemoveDependent={handleRemoveDependent}
                onRemoveCovariate={handleRemoveCovariate}
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

            <TabsContent
              value="assumption"
              className="h-full mt-0 border-0 p-0"
            >
              <AssumptionChecksTab
                dependent={options.dependent}
                covariates={options.covariates}
                onRunVIF={handleRunVIF}
                onRunBoxTidwell={handleRunBoxTidwell}
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
              setOptions(DEFAULT_BINARY_LOGISTIC_OPTIONS);
              setCatParams(DEFAULT_BINARY_LOGISTIC_CATEGORICAL_PARAMS);
              setSaveParams(DEFAULT_BINARY_LOGISTIC_SAVE_PARAMS);
              setOptParams(DEFAULT_BINARY_LOGISTIC_OPTIONS_PARAMS);
              setAssumptionParams(DEFAULT_BINARY_LOGISTIC_ASSUMPTION_PARAMS);
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
