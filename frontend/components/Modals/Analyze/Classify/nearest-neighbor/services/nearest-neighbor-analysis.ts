import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import type { KNNAnalysisType } from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor-worker";
import { transformNearestNeighborResult } from "./nearest-neighbor-analysis-formatter";
import { resultNearestNeighbor } from "./nearest-neighbor-analysis-output";
import { useDataStore, type CellUpdate } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";

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

  const varDefsForTarget = getVarDefs(variables, TargetVariable);
  const varDefsForFeatures = getVarDefs(variables, FeaturesVariables);
  const varDefsForFocalCaseIdentifier = getVarDefs(
    variables,
    FocalCaseIdentifierVariable,
  );
  const varDefsForCaseIdentifier = getVarDefs(
    variables,
    CaseIdentifierVariable,
  );

  console.group("🧠 KNN DEBUG - UI INPUT");

  console.log("TargetVar:", configData.main.TargetVar);
  console.log("FeatureVar:", configData.main.FeatureVar);
  console.log("FocalCaseIdenVar:", configData.main.FocalCaseIdenVar);
  console.log("CaseIdenVar:", configData.main.CaseIdenVar);
  console.log("PartitioningVariable:", configData.partition.PartitioningVariable);
  console.log(
    "VFoldPartitioningVariable:",
    configData.partition.VFoldPartitioningVariable,
  );

  console.log("Full Config:", configData);

  console.groupEnd();

  console.group("📦 DATASET");

  console.log("Total rows:", dataVariables.length);
  console.log("Sample row:", dataVariables[0]);

  console.groupEnd();

  console.group("✂️ SLICED DATA");

  console.log("Target:", slicedDataForTarget);
  console.log("Features:", slicedDataForFeatures);
  console.log("Focal:", slicedDataForFocalCaseIdentifier);
  console.log("Case:", slicedDataForCaseIdentifier);

  console.groupEnd();

  console.group("📘 VARIABLE DEFINITIONS");

  console.log("TargetDefs:", varDefsForTarget);
  console.log("FeatureDefs:", varDefsForFeatures);
  console.log("FocalDefs:", varDefsForFocalCaseIdentifier);
  console.log("CaseDefs:", varDefsForCaseIdentifier);

  console.groupEnd();

  const worker = new Worker(
    "/workers/Classify/NearestNeighbor/nearest-neighbor.worker.js",
    { type: "module" },
  );

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
    if (!e.data.success) {
      console.error(e.data.error);
      return;
    }

    const result = e.data.data;

    console.log("🔥 RAW RESULT:", result);

    const formattedResults = transformNearestNeighborResult(result);

    console.log("✨ FORMATTED RESULT:", formattedResults);

    await saveKnnVariablesToDataViewer(
      result.saved_variables,
      configData.save.CustomName,
    );

    await resultNearestNeighbor({
      formattedResult: formattedResults ?? [],
      rawResult: result,
    });

    worker.terminate();
  };

  worker.onerror = (err) => {
    console.error("Worker error:", err);
  };

  console.log("configData", configData);

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

  // console.log("knn results", results);
  // console.log("error", error);
  // console.log("executed", executed);

  // const formattedResults = transformNearestNeighborResult(results);
  // // console.log("formattedResults", formattedResults);

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
