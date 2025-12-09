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
  const variableDetails = useMemo(() => {
    return variablesFromStore.reduce((acc, v) => {
      // Hanya masukkan ke map jika id-nya ada (tidak undefined)
      if (v.id !== undefined) {
        acc[v.id] = v;
      }
      return acc;
    }, {} as Record<number, Variable>);
  }, [variablesFromStore]);

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
    // 1. Validasi Input UI
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

    // Reset State
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 2. Inisialisasi Worker
      // Menggunakan path yang sudah dipastikan benar
      const worker = new Worker(
        new URL(
          "/workers/Regression/binaryLogistic.worker.js",
          window.location.origin
        ),
        { type: "module" }
      );

      // 3. Setup Listener Pesan dari Worker
      worker.onmessage = async (event) => {
        const { type, payload } = event.data;

        if (type === "SUCCESS") {
          try {
            // A. Format Hasil untuk Tampilan
            const formattedResult = formatBinaryLogisticResult(
              payload,
              options.dependent!.name
            );

            // B. Simpan Log ke System
            const varNames = options.covariates.map((c) => c.name).join(" ");
            const logId = await addLog({
              log: `LOGISTIC REGRESSION VARIABLES ${
                options.dependent!.name
              } /METHOD=${options.method.toUpperCase()} ${varNames}`,
            });

            // C. Simpan Analytic Entry
            const analyticId = await addAnalytic(logId, {
              title: "Binary Logistic Regression",
              note: `Method: ${options.method}`,
            });

            // D. Simpan Output Statistik
            await addStatistic(analyticId, {
              title: "Logistic Regression Output",
              output_data: JSON.stringify(formattedResult),
              components: "Tables",
              description:
                "Variables in Equation, Model Summary, Classification Table.",
            });

            // Selesai
            setIsLoading(false);
            worker.terminate();
          } catch (saveError: any) {
            console.error("Error Saving Result:", saveError);
            setErrorMsg("Gagal menyimpan hasil analisis.");
            setIsLoading(false);
            worker.terminate();
          }
        } else if (type === "ERROR") {
          // Tangani error logis dari Worker (misal: Matriks Singular)
          console.error("Worker Logical Error:", payload);
          setErrorMsg(
            typeof payload === "string"
              ? payload
              : "Terjadi kesalahan perhitungan."
          );
          setIsLoading(false);
          worker.terminate();
        }
      };

      // 4. Setup Handler Error Sistem Worker (misal: File Not Found)
      worker.onerror = (event) => {
        event.preventDefault();
        console.error("Worker System Error:", event);
        setErrorMsg(
          "Gagal menjalankan modul kalkulasi. Pastikan file WASM tersedia."
        );
        setIsLoading(false);
        worker.terminate();
      };

      // 5. Konfigurasi Parameter (Sesuai State UI)
      const analysisConfig = {
        maxIterations: optParams.maxIterations,
        includeConstant: optParams.includeConstant,
        ciLevel: optParams.ciLevel,
        cutoff: optParams.classificationCutoff,
        method: options.method, // "Enter", dll.

        // Parameter untuk Stepwise (Jika metode dipilih)
        probEntry: optParams.probEntry,
        probRemoval: optParams.probRemoval,
      };

      // 6. KIRIM PESAN KE WORKER (PAYLOAD UTAMA)
      // Kita menggunakan format berbasis ID agar sesuai dengan 'variableDetails'
      worker.postMessage({
        action: "run_binary_logistic", // Penanda aksi

        dependentId: options.dependent.id,
        independentIds: [
          ...options.covariates.map((v) => v.id),
          ...options.factors.map((v) => v.id),
        ],

        data: data, // Data mentah dari store
        variableDetails: variableDetails, // Metadata penting untuk mapping kolom
        config: analysisConfig, // Config yang sudah dibentuk di atas
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
