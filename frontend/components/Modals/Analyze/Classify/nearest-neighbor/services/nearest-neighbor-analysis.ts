import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import type { KNNAnalysisType } from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor-worker";
import { transformNearestNeighborResult } from "./nearest-neighbor-analysis-formatter";
import { resultNearestNeighbor } from "./nearest-neighbor-analysis-output";
import { useDataStore, type CellUpdate } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";
import type { ResultJson } from "@/types/Table";

type SavedVariableResult = {
  name: string;
  label: string;
  variable_type: Variable["type"];
  measure: Variable["measure"];
  decimals: number;
  values: Array<string | number | boolean | null>;
};

type SavedVariablesResult = {
  variables?: SavedVariableResult[];
};

type VariableDefinitionPayload = {
  name?: string;
  values?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

function isResultJson(result: unknown): result is ResultJson {
  return (
    typeof result === "object" &&
    result !== null &&
    Array.isArray((result as ResultJson).tables)
  );
}

function hasWorkerErrors(errors: unknown): errors is string {
  return typeof errors === "string" && !errors.includes("No errors occurred.");
}

function normalizeKnnVarDefsForWorker(defs: unknown[][]) {
  return defs.map((group) =>
    group.map((definition) => {
      const varDef = definition as VariableDefinitionPayload;
      const values = Array.isArray(varDef.values) ? varDef.values : [];

      return {
        ...varDef,
        values: values.map((valueLabel) => ({
          ...valueLabel,
          variable_name:
            valueLabel.variable_name ?? varDef.name ?? "",
        })),
      };
    }),
  );
}

export async function analyzeKNN({
  configData,
  dataVariables,
  variables,
}: KNNAnalysisType) {
  const uniqueVariables = (items: Array<string | null | undefined>) =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))));

  const TargetVariable = configData.main.TargetVar
    ? [configData.main.TargetVar]
    : [];
  const FeaturesVariables = configData.main.FeatureVar ?? [];
  const FocalCaseIdentifierVariable = configData.main.FocalCaseIdenVar
    ? [configData.main.FocalCaseIdenVar]
    : [];
  const CaseIdentifierVariable = uniqueVariables([
    configData.main.CaseIdenVar,
    configData.partition.PartitioningVariable,
    configData.partition.VFoldPartitioningVariable,
  ]);

  const slicedDataForTarget = getSlicedData({
    dataVariables,
    variables,
    selectedVariables: TargetVariable,
  });

  const slicedDataForFeatures = getSlicedData({
    dataVariables,
    variables,
    selectedVariables: FeaturesVariables,
  });

  const slicedDataForFocalCaseIdentifier = getSlicedData({
    dataVariables,
    variables,
    selectedVariables: FocalCaseIdentifierVariable,
  });

  const slicedDataForCaseIdentifier = getSlicedData({
    dataVariables,
    variables,
    selectedVariables: CaseIdentifierVariable,
  });

  const varDefsForTarget = normalizeKnnVarDefsForWorker(
    getVarDefs(variables, TargetVariable),
  );
  const varDefsForFeatures = normalizeKnnVarDefsForWorker(
    getVarDefs(variables, FeaturesVariables),
  );
  const varDefsForFocalCaseIdentifier = normalizeKnnVarDefsForWorker(
    getVarDefs(variables, FocalCaseIdentifierVariable),
  );
  const varDefsForCaseIdentifier = normalizeKnnVarDefsForWorker(
    getVarDefs(variables, CaseIdentifierVariable),
  );

  const worker = new Worker(
    "/workers/Classify/NearestNeighbor/nearest-neighbor.worker.js",
    { type: "module" },
  );

  await new Promise<void>((resolve, reject) => {
    worker.postMessage({
      target: slicedDataForTarget.length ? slicedDataForTarget : [],
      features: slicedDataForFeatures,
      focal: slicedDataForFocalCaseIdentifier.length
        ? slicedDataForFocalCaseIdentifier
        : [],
      caseData: slicedDataForCaseIdentifier.length
        ? slicedDataForCaseIdentifier
        : null,
      targetDefs: varDefsForTarget,
      featureDefs: varDefsForFeatures,
      focalDefs: varDefsForFocalCaseIdentifier,
      caseDefs: varDefsForCaseIdentifier,
      config: configData,
    });

    worker.onmessage = async (e) => {
      try {
        if (!e.data.success) {
          reject(new Error(e.data.error ?? "KNN worker failed."));
          return;
        }

        const result = e.data.data;
        const workerErrors = e.data.errors;

        const formattedResults = isResultJson(result)
          ? result
          : transformNearestNeighborResult(result);

        const hasAnalysisTables = formattedResults.tables.some(
          (table) => table.key !== "system_settings",
        );

        if (!hasAnalysisTables && hasWorkerErrors(workerErrors)) {
          worker.terminate();
          reject(new Error(workerErrors));
          return;
        }

        await saveKnnVariablesToDataViewer(
          result.saved_variables,
          configData.save.CustomName,
        );

        await resultNearestNeighbor({
          formattedResult: formattedResults,
          rawResult: result,
        });

        worker.terminate();
        resolve();
      } catch (error) {
        worker.terminate();
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(err.message || "KNN worker error."));
    };
  });

  // await init();
  // const knn = new KNNAnalysis(
  //     slicedDataForTarget,
  //     slicedDataForFeatures,
  //     slicedDataForFocalCaseIdentifier,
  //     slicedDataForCaseIdentifier,
  //     varDefsForTarget,
  //     varDefsForFeatures,
  //     varDefsForFocalCaseIdentifier,
  //     varDefsForCaseIdentifier,
  //     configData
  // );

  // const results = knn.get_formatted_results();
  // const error = knn.get_all_errors();
  // const executed = knn.get_executed_functions();

  // const formattedResults = transformNearestNeighborResult(results);

  // // /*
  // //  * 🎉 Final Result Process 🎯
  // //  * */
  // await resultNearestNeighbor({
  //     formattedResult: formattedResults ?? [],
  // });
}

async function saveKnnVariablesToDataViewer(
  savedVariables: SavedVariablesResult | null | undefined,
  useCustomNames: boolean,
) {
  const variablesToSave = savedVariables?.variables ?? [];
  if (!variablesToSave.length) return;

  const variableStore = useVariableStore.getState();
  const dataStore = useDataStore.getState();
  const currentVariables = variableStore.variables;
  const existingByName = new Map(
    currentVariables.map((variable) => [variable.name.toLowerCase(), variable]),
  );

  const newVariableDefinitions: Partial<Variable>[] = [];
  const newVariableUpdates: CellUpdate[] = [];
  const existingVariableUpdates: CellUpdate[] = [];
  let nextColumnIndex =
    currentVariables.length > 0
      ? Math.max(...currentVariables.map((variable) => variable.columnIndex)) + 1
      : 0;

  for (const savedVariable of variablesToSave) {
    const existingVariable = useCustomNames
      ? existingByName.get(savedVariable.name.toLowerCase())
      : undefined;

    if (existingVariable) {
      savedVariable.values.forEach((value, rowIndex) => {
        const normalizedValue = normalizeSavedValue(value);
        existingVariableUpdates.push({
          row: rowIndex,
          col: existingVariable.columnIndex,
          value: normalizedValue,
        });
      });
      continue;
    }

    const columnIndex = nextColumnIndex++;
    newVariableDefinitions.push({
      name: savedVariable.name,
      columnIndex,
      type: savedVariable.variable_type,
      width: savedVariable.variable_type === "STRING" ? 64 : 12,
      decimals: savedVariable.decimals,
      label: savedVariable.label,
      values: [],
      missing: null,
      columns: 64,
      align: savedVariable.variable_type === "STRING" ? "left" : "right",
      measure: savedVariable.measure,
      role:
        savedVariable.name === "KNN_Partition" ||
        savedVariable.name === "KNN_Fold"
          ? "partition"
          : "none",
    });

    savedVariable.values.forEach((value, rowIndex) => {
      const normalizedValue = normalizeSavedValue(value);
      if (normalizedValue !== "") {
        newVariableUpdates.push({
          row: rowIndex,
          col: columnIndex,
          value: normalizedValue,
        });
      }
    });
  }

  if (newVariableDefinitions.length > 0) {
    await variableStore.addVariables(newVariableDefinitions, newVariableUpdates);
  }

  if (existingVariableUpdates.length > 0) {
    await dataStore.updateCells(existingVariableUpdates);
  }
}

function normalizeSavedValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return value;
}
