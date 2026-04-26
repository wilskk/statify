"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import { LocationTab } from "./LocationTab";
import { ScaleTab } from "./ScaleTab";
import { OptionsTab } from "./OptionsTab";
import { OutputTab } from "./OutputTab";

// Services
import { formatOrdinalResult } from "../services/formatter";

// Types
import {
  OrdinalOptions,
  OrdinalLocationParams,
  OrdinalScaleParams,
  OrdinalOptionsParams,
  OrdinalOutputParams,
} from "../types/ordinal";

const OrdinalMain: React.FC = () => {
  const { closeModal } = useModalStore();
  const variablesFromStore = useVariableStore((state) => state.variables);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("variables");
  const [isLoading, setIsLoading] = useState(false); // Tetap digunakan untuk UI loading
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State untuk variabel yang dipilih
  const [options, setOptions] = useState<OrdinalOptions>({
    dependent: null,
    factors: [],
    covariates: [],
  });

  // State untuk setiap tab
  const [locationParams, setLocationParams] = useState<OrdinalLocationParams>({ locationModel: [] });
  const [scaleParams, setScaleParams] = useState<OrdinalScaleParams>({ scaleModel: [] });
  const [optParams, setOptParams] = useState<OrdinalOptionsParams>({
    maxIterations: 100,
    maxStepHalving: 5,
    logLikelihoodConvergence: 0,
    parameterConvergence: 0.000001,
    confidenceInterval: 95,
    delta: 0,
    singularityTolerance: 0.00000001,
    linkFunction: "Logit",
  });
  const [outputParams, setOutputParams] = useState<OrdinalOutputParams>({
    display: {
      goodnessOfFit: true,
      summaryStatistics: true,
      parameterEstimates: true,
      asymptoticCorrelation: false,
      cellInformation: false,
      testOfParallelLines: true,
      iterationHistory: false,
      iterationHistoryStep: 1,
    },
    savedVariables: {
      predictedCategory: false,
      predictedProbability: false,
      actualProbability: false,
    },
    printLogLikelihood: "Including",
  });

  // Menghitung variabel yang tersedia (belum dipilih)
  const availableVariables = useMemo(() => {
    const selectedIds = new Set([
      options.dependent?.id,
      ...options.factors.map((v) => v.id),
      ...options.covariates.map((v) => v.id),
    ]);
    return variablesFromStore.filter((v) => !selectedIds.has(v.id));
  }, [variablesFromStore, options]);

  const { data } = useDataStore();
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  // --- HANDLERS ---
  const handleAnalyze = async () => {
    if (!options.dependent) {
      setErrorMsg("Mohon pilih variabel dependen.");
      return;
    }

    if (!data || data.length === 0) {
      setErrorMsg("Dataset kosong atau tidak tersedia.");
      return;
    }

    const features = [...options.factors, ...options.covariates];

    if (features.length === 0) {
      setErrorMsg("Minimal 1 variabel independen.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const worker = new Worker(
        new URL("../worker/ordinal-worker.js", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = async (event) => {
        const { type, payload } = event.data;

        if (type === "SUCCESS") {
          try {
            // 🔥 1. FORMAT HASIL (WAJIB PERTAMA)
            const formattedResult = formatOrdinalResult(payload);

            // 🔥 BUAT LOG
            const logId = await addLog({
              log: `ORDINAL REGRESSION VARIABLES ${options.dependent!.name}`,
            });

            // 🔥 BUAT ANALYTIC
            const analyticId = await addAnalytic(logId, {
              title: "Ordinal Logistic Regression",
              note: `Link: ${optParams.linkFunction}`,
            });

            // 🔥 LOOP FORMATTER (IKUT BINARY)
            if (formattedResult.sections && Array.isArray(formattedResult.sections)) {
              for (const section of formattedResult.sections) {

                // Adapt payload to DataTableRenderer contract:
                // { tables: [{ title, columnHeaders, rows, footer? }] }
                const tableObjectForRenderer = {
                  title: section.title,
                  columnHeaders: section.data?.columnHeaders ?? [],
                  rows: section.data?.rows ?? [],
                  footer: section.note,
                };

                const payloadForRenderer = {
                  tables: [tableObjectForRenderer],
                };

                await addStatistic(analyticId, {
                  title: section.title,
                  description: section.description || "",
                  output_data: JSON.stringify(payloadForRenderer),
                  components: "Parameter Estimates",
                });
              }
            }

            worker.terminate();
            setIsLoading(false);
            closeModal("ORDINAL_REGRESSION");
          } catch (err) {
            console.error(err);
            setErrorMsg("Gagal menyimpan hasil.");
            setIsLoading(false);
            worker.terminate();
          }
        } else {
          setErrorMsg(payload);
          setIsLoading(false);
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error(err);
        setErrorMsg("Worker error");
        setIsLoading(false);
        worker.terminate();
      };

      // 🔥 PREPARE DATA
      const depName = options.dependent.name;

      const categories = Array.from(
        new Set(data.map((d: any) => d[depName]))
      );

      const dataset = data.map((row: any) => ({
        y: categories.indexOf(row[depName]) + 1,
        x: features.map((f) => Number(row[f.name]) || 0),
      }));

      worker.postMessage({
        data: dataset,
        featureNames: features.map((f) => f.name),
        iterations: optParams.maxIterations,
      });
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 py-4 flex-shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">
          Ordinal Regression
        </h2>
      </div>
      <Separator />
      <div className="flex-grow px-6 overflow-y-auto min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="scale">Scale</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
          <div className="flex-grow min-h-0 overflow-hidden">
            <TabsContent value="variables" className="h-full mt-0">
              <VariablesTab
                availableVariables={availableVariables}
                selectedDependent={options.dependent}
                selectedFactors={options.factors}
                selectedCovariates={options.covariates}
                onOptionsChange={setOptions}
              />
            </TabsContent>
            <TabsContent value="location" className="h-full mt-0">
              <LocationTab
                factors={options.factors}
                covariates={options.covariates}
                params={locationParams}
                onChange={setLocationParams}
              />
            </TabsContent>
            <TabsContent value="scale" className="h-full mt-0">
              <ScaleTab
                factors={options.factors}
                covariates={options.covariates}
                params={scaleParams}
                onChange={setScaleParams}
              />
            </TabsContent>
            <TabsContent value="options" className="h-full mt-0">
              <OptionsTab params={optParams} onChange={(p) => setOptParams(prev => ({ ...prev, ...p }))} />
            </TabsContent>
            <TabsContent value="output" className="h-full mt-0">
              <OutputTab params={outputParams} onChange={(p) => setOutputParams(prev => ({ ...prev, ...p }))} />
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
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-4">
          <Button onClick={handleAnalyze} disabled={isLoading || !options.dependent}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> OK</> : "OK"}
          </Button>
          <Button variant="outline" onClick={() => setOptions({ dependent: null, factors: [], covariates: [] })} disabled={isLoading}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => closeModal()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrdinalMain;