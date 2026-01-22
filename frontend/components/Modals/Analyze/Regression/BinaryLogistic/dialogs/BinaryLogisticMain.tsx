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
import { toast } from "sonner";

// Stores & Hooks
import { useVariableStore } from "@/stores/useVariableStore";
import { useModalStore } from "@/stores/useModalStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";

// Tour Guide
import type { TabControlProps } from "@/components/Modals/Analyze/Descriptive/Descriptive/hooks/useTourGuide";
import { useTourGuide } from "@/components/Modals/Analyze/Descriptive/Descriptive/hooks/useTourGuide";
import { baseTourSteps } from "../hooks/tourConfig";
import { TourPopup, ActiveElementHighlight } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";

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
import type { CellUpdate } from "@/stores/useDataStore";
import {
  BinaryLogisticOptions,
  BinaryLogisticCategoricalParams,
  BinaryLogisticSaveParams,
  BinaryLogisticOptionsParams,
  BinaryLogisticAssumptionParams,
  LogisticResult,
  SavedPredictions,
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

  // --- Help Tour ---
  const tabControl = useMemo<TabControlProps>(
    () => ({
      setActiveTab: (tab: string) => setActiveTab(tab),
      currentActiveTab: activeTab,
    }),
    [activeTab]
  );

  const { tourActive, currentStep, tourSteps, currentTargetElement, startTour, nextStep, prevStep, endTour } =
    useTourGuide(baseTourSteps, "dialog", tabControl);

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
      // Validasi: Cek apakah variabel adalah binary (hanya 2 nilai unik)
      const colIndex = highlightedVariable.columnIndex;
      if (colIndex !== undefined && data.length > 0) {
        // Ambil semua nilai dari kolom tersebut, filter missing values
        const columnValues = data
          .map((row) => row[colIndex])
          .filter((val) => val !== null && val !== undefined && val !== "");
        
        const uniqueValues = Array.from(new Set(columnValues));
        
        if (uniqueValues.length !== 2) {
          toast.error(
            `Variable "${highlightedVariable.label || highlightedVariable.name}" has ${uniqueValues.length} unique value(s). Dependent variable must have exactly 2 unique values (binary outcome).`
          );
          return;
        }
      }
      
      // Set dependent
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

  // --- HELPER: Save Predictions to Dataset ---
  /**
   * Saves the computed predictions, residuals, and influence statistics
   * as new variables to the dataset (following SPSS naming conventions)
   * 
   * Variable names are incremental: PRE_1, PRE_2, PRE_3, etc.
   * If PRE_1 exists, next one will be PRE_2, and so on.
   * 
   * @param savedPredictions - The predictions data from Rust
   * @param yEncoding - Mapping of original label to 0/1 (e.g., {"Male": 0, "Female": 1})
   */
  const savePredictionsToDataset = async (
    savedPredictions: SavedPredictions,
    yEncoding?: Record<string, number>
  ) => {
    if (!savedPredictions?.rows?.length) {
      console.log("[Main] No saved predictions to process");
      return;
    }

    const { addVariable } = useVariableStore.getState();
    const storeVariables = useVariableStore.getState().variables;
    const variableNames = savedPredictions.variable_names;
    const rows = savedPredictions.rows;
    
    // Create a mutable copy of variable names for tracking newly added variables
    // This is needed because Zustand state is immutable
    const existingVarNames = new Set(storeVariables.map(v => v.name.toUpperCase()));
    
    // Build reverse mapping: 0/1 -> original label (e.g., {0: "Male", 1: "Female"})
    const reverseYEncoding: Record<number, string> = {};
    if (yEncoding) {
      Object.entries(yEncoding).forEach(([label, value]) => {
        reverseYEncoding[value] = label;
      });
    }

    // Get current number of variables to determine column indices
    let nextColumnIndex = storeVariables.length;

    /**
     * Helper: Generate unique incremental variable name
     * Given a prefix like "RES", finds the next available number
     * e.g., if RES_1 and RES_2 exist, returns "RES_3"
     */
    const getIncrementalVarName = (prefix: string): string => {
      let counter = 1;
      while (existingVarNames.has(`${prefix}_${counter}`.toUpperCase())) {
        counter++;
      }
      return `${prefix}_${counter}`;
    };

    // Helper to add a new variable and its data
    // Uses incremental naming: if prefix is provided, generates unique name
    const addSavedVariable = async (
      varNameFromRust: string | undefined,
      label: string,
      getValue: (row: (typeof rows)[0]) => number | undefined
    ) => {
      if (!varNameFromRust) return;

      const values = rows.map((row) => getValue(row));
      // Skip if all values are undefined
      if (values.every((v) => v === undefined)) return;

      // Extract prefix from Rust variable name (e.g., "RES_1" -> "RES")
      const prefix = varNameFromRust.replace(/_\d+$/, '');
      // Generate unique incremental name
      const varName = getIncrementalVarName(prefix);

      const newVariable: Partial<Variable> = {
        columnIndex: nextColumnIndex,
        name: varName,
        type: "NUMERIC",
        width: 8,
        decimals: 5,
        label: label,
        values: [],
        missing: null,
        columns: 200,
        align: "right",
        measure: "scale",
        role: "none", // Computed variables should not be used as input
      };

      // Add the variable
      await addVariable(newVariable);
      
      // Track new variable name for subsequent incremental naming
      existingVarNames.add(varName.toUpperCase());

      // Prepare cell updates
      const bulkUpdates: CellUpdate[] = [];
      values.forEach((value, rowIndex) => {
        if (value !== undefined && !isNaN(value)) {
          bulkUpdates.push({
            row: rowIndex,
            col: nextColumnIndex,
            value: value,
          });
        }
      });

      // Save the values
      if (bulkUpdates.length > 0) {
        await useDataStore.getState().updateCells(bulkUpdates);
      }

      nextColumnIndex++;
      
      // Return the actual name used (for logging)
      return varName;
    };

    // Helper khusus untuk predicted group dengan label asli
    const addPredictedGroupVariable = async () => {
      const varNameFromRust = variableNames?.predicted_group;
      if (!varNameFromRust) return;

      const values = rows.map((row) => {
        if (row.predicted_group === undefined) return undefined;
        // Convert 0/1 back to original label if mapping exists
        if (Object.keys(reverseYEncoding).length > 0) {
          return reverseYEncoding[row.predicted_group] ?? row.predicted_group;
        }
        return row.predicted_group;
      });

      // Skip if all values are undefined
      if (values.every((v) => v === undefined)) return;

      // Generate unique incremental name for PGR
      const varName = getIncrementalVarName("PGR");

      // Determine if values are strings (original labels) or numbers
      const hasStringLabels = Object.keys(reverseYEncoding).length > 0;

      const newVariable: Partial<Variable> = {
        columnIndex: nextColumnIndex,
        name: varName,
        type: hasStringLabels ? "STRING" : "NUMERIC",
        width: hasStringLabels ? 50 : 8,
        decimals: hasStringLabels ? 0 : 0,
        label: "Predicted group membership",
        values: [],
        missing: null,
        columns: 200,
        align: hasStringLabels ? "left" : "right",
        measure: "nominal",
        role: "none",
      };

      // Add the variable
      await addVariable(newVariable);
      
      // Track new variable name for subsequent incremental naming
      existingVarNames.add(varName.toUpperCase());

      // Prepare cell updates
      const bulkUpdates: CellUpdate[] = [];
      values.forEach((value, rowIndex) => {
        if (value !== undefined) {
          bulkUpdates.push({
            row: rowIndex,
            col: nextColumnIndex,
            value: value,
          });
        }
      });

      // Save the values
      if (bulkUpdates.length > 0) {
        await useDataStore.getState().updateCells(bulkUpdates);
      }

      nextColumnIndex++;
    };

    // --- Process Predicted Values ---
    await addSavedVariable(
      variableNames?.predicted_probability,
      "Predicted probability",
      (row) => row.predicted_probability
    );

    // Predicted Group dengan label asli
    await addPredictedGroupVariable();

    // --- Process Residuals ---
    await addSavedVariable(
      variableNames?.resid_unstandardized,
      "Unstandardized residual",
      (row) => row.resid_unstandardized
    );

    await addSavedVariable(
      variableNames?.resid_logit,
      "Logit residual",
      (row) => row.resid_logit
    );

    await addSavedVariable(
      variableNames?.resid_studentized,
      "Studentized residual",
      (row) => row.resid_studentized
    );

    await addSavedVariable(
      variableNames?.resid_standardized,
      "Standardized residual",
      (row) => row.resid_standardized
    );

    await addSavedVariable(
      variableNames?.resid_deviance,
      "Deviance residual",
      (row) => row.resid_deviance
    );

    // --- Process Influence Statistics ---
    await addSavedVariable(
      variableNames?.influence_cooks,
      "Cook's distance",
      (row) => row.influence_cooks
    );

    await addSavedVariable(
      variableNames?.influence_leverage,
      "Leverage value",
      (row) => row.influence_leverage
    );

    // --- Process DfBeta (one variable per coefficient) ---
    // DfBeta uses special naming: DFB0_1, DFB1_1, etc. for each coefficient
    // We need to find the next available suffix for all DfBeta variables
    if (variableNames?.influence_dfbeta?.length) {
      // Find the next available DfBeta suffix
      // DfBeta variables are named DFB{coefIndex}_{runNumber}
      // e.g., DFB0_1, DFB1_1 (first run), DFB0_2, DFB1_2 (second run)
      let dfbetaSuffix = 1;
      
      // Find a suffix where none of the DfBeta names exist
      while (true) {
        const anyExists = variableNames.influence_dfbeta.some((_, idx) => 
          existingVarNames.has(`DFB${idx}_${dfbetaSuffix}`.toUpperCase())
        );
        if (!anyExists) break;
        dfbetaSuffix++;
      }
      
      for (let i = 0; i < variableNames.influence_dfbeta.length; i++) {
        const varName = `DFB${i}_${dfbetaSuffix}`;
        const label = i === 0 ? "DfBeta for constant" : `DfBeta for B${i}`;
        
        const values = rows.map((row) => row.influence_dfbeta?.[i]);
        if (values.every((v) => v === undefined)) continue;

        const newVariable: Partial<Variable> = {
          columnIndex: nextColumnIndex,
          name: varName,
          type: "NUMERIC",
          width: 8,
          decimals: 5,
          label: label,
          values: [],
          missing: null,
          columns: 200,
          align: "right",
          measure: "scale",
          role: "none",
        };

        await addVariable(newVariable);
        existingVarNames.add(varName.toUpperCase());

        const bulkUpdates: CellUpdate[] = [];
        values.forEach((value, rowIndex) => {
          if (value !== undefined && !isNaN(value)) {
            bulkUpdates.push({
              row: rowIndex,
              col: nextColumnIndex,
              value: value,
            });
          }
        });

        if (bulkUpdates.length > 0) {
          await useDataStore.getState().updateCells(bulkUpdates);
        }

        nextColumnIndex++;
      }
    }

    // Save all data changes to database
    await useDataStore.getState().saveData();

    console.log("[Main] Saved predictions added to dataset successfully");
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

            // Pass display options to formatter
            const formattedResult = formatBinaryLogisticResult(
              payload,
              options.dependent!,
              allIndependentVars,
              { 
                displayAtLastStep: !optParams.displayAtEachStep,
                ciForExpB: optParams.ciForExpB,
                ciLevel: optParams.ciLevel,
                cutoff: optParams.classificationCutoff,
              }
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
                let payloadForRenderer: any;

                // Handle chart sections differently
                if (section.type === "chart" && section.chartData) {
                  // For chart sections, use the chart data format
                  payloadForRenderer = {
                    charts: section.chartData.charts,
                    description: section.description,
                    note: section.note,
                    title: section.title,
                  };
                } else {
                  // For table sections, use the table format
                  const tableObjectForRenderer = {
                    ...section.data,
                    title: section.title,
                    note: section.note,
                  };

                  payloadForRenderer = {
                    tables: [tableObjectForRenderer],
                  };
                }

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

            // E. Simpan Saved Predictions ke Dataset (jika ada)
            if (payload.saved_predictions) {
              console.log("[Main] Processing Saved Predictions...");
              // Pass y_encoding from model_info to convert 0/1 back to original labels
              const yEncoding = payload.model_info?.y_encoding;
              await savePredictionsToDataset(payload.saved_predictions, yEncoding);
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
        casewise_type: optParams.casewiseType, // BARU: "outliers" atau "all"
        casewise_outliers: optParams.casewiseOutliers,
        iteration_history: optParams.iterationHistory,
        correlations: optParams.correlations,

        // Display option - BARU: untuk menentukan at each step vs at last step
        display_at_last_step: !optParams.displayAtEachStep,

        // --- BARU: Save Options (Tab Save di UI) ---
        save_predicted_probabilities: saveParams.predictedProbabilities,
        save_predicted_group: saveParams.predictedGroup,
        save_residuals_unstandardized: saveParams.residualsUnstandardized,
        save_residuals_logit: saveParams.residualsLogit,
        save_residuals_studentized: saveParams.residualsStudentized,
        save_residuals_standardized: saveParams.residualsStandardized,
        save_residuals_deviance: saveParams.residualsDeviance,
        save_influence_cooks: saveParams.influenceCooks,
        save_influence_leverage: saveParams.influenceLeverage,
        save_influence_dfbeta: saveParams.influenceDfBeta,

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
      {/* Feature Tour elements */}
      <AnimatePresence>
        {tourActive && tourSteps.length > 0 && currentStep < tourSteps.length && (
          <TourPopup
            step={tourSteps[currentStep]}
            currentStep={currentStep}
            totalSteps={tourSteps.length}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
            targetElement={currentTargetElement}
          />
        )}
      </AnimatePresence>
      <ActiveElementHighlight active={tourActive} />

      <div className="flex-grow px-6 py-3 overflow-y-auto min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
            <TabsTrigger value="variables" id="binary-logistic-variables-tab-trigger">Variables</TabsTrigger>
            <TabsTrigger value="categorical" id="binary-logistic-categorical-tab-trigger">Categorical</TabsTrigger>
            <TabsTrigger value="save" id="binary-logistic-save-tab-trigger">Save</TabsTrigger>
            <TabsTrigger value="options" id="binary-logistic-options-tab-trigger">Options</TabsTrigger>
            <TabsTrigger value="assumption" id="binary-logistic-assumption-tab-trigger">Assumption</TabsTrigger>
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
                  data-testid="binary-logistic-help-button"
                  variant="ghost"
                  size="icon"
                  onClick={startTour}
                  aria-label="Start feature tour"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Start feature tour</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !options.dependent || options.covariates.length === 0}
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
