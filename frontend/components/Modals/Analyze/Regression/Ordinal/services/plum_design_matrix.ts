import { Variable } from "@/types/Variable";
import { LocationInteraction } from "../types/ordinal";

export interface FactorLevelMetadata {
  variableName: string;
  levelValue: string;
  levelLabel?: string;
  isReference: boolean;
  isRedundant: boolean;
  parameterName: string;
  activeColumnIndex: number | null;
}

export interface FactorLevelSummary {
  variableName: string;
  levels: string[];
  referenceLevel: string;
  levelLabels: Record<string, string>;
}

export interface BuildOrdinalPlumDesignMatrixInput {
  rows: Array<Record<string, any>>;
  factors: Variable[];
  covariates: Variable[];
  interactions: LocationInteraction[];
  getRowValue: (row: any, columnIndex: number) => unknown;
  toNumberOrThrow: (value: unknown, label: string) => number;
}

export interface BuildOrdinalPlumDesignMatrixResult {
  locationDesignMatrix: number[][];
  locationTermNames: string[];
  factorLevelMetadata: FactorLevelMetadata[];
  factorLevelSummaries: FactorLevelSummary[];
  referenceCategories: Record<string, string>;
  warnings: string[];
  activeParameterCount: number;
}

const normalizeLevelKey = (value: unknown) => String(value);

const buildValueLabelOrder = (variable: Variable): Array<string | number> => {
  if (!Array.isArray(variable.values) || variable.values.length === 0) {
    return [];
  }
  return variable.values.map((entry) => entry.value);
};

const buildValueLabelMap = (variable: Variable): Record<string, string> => {
  if (!Array.isArray(variable.values) || variable.values.length === 0) {
    return {};
  }
  return variable.values.reduce<Record<string, string>>((acc, entry) => {
    acc[normalizeLevelKey(entry.value)] = entry.label;
    return acc;
  }, {});
};

export const extractOrdinalDependentCategories = (
  values: unknown[],
  variable?: Variable | null
): Array<string | number> => {
  const explicitOrder = variable ? buildValueLabelOrder(variable) : [];
  const hasExplicitOrder = explicitOrder.length > 0;
  const seen = new Set<string | number>();
  const ordered: Array<string | number> = [];

  if (explicitOrder.length > 0) {
    for (const value of explicitOrder) {
      if (value === null || value === undefined || value === "") continue;
      if (seen.has(value)) continue;
      seen.add(value);
      ordered.push(value);
    }
  }

  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const normalized = typeof value === "number" && Number.isFinite(value)
      ? value
      : String(value);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(normalized);
  }

  if (hasExplicitOrder) {
    return ordered;
  }

  const allNumeric = ordered.every((v) => typeof v === "number" && Number.isFinite(v));
  if (allNumeric) {
    return [...ordered].sort((a, b) => Number(a) - Number(b));
  }

  return ordered.map((value) => String(value)).sort((a, b) => a.localeCompare(b));
};

export const extractFactorLevelsForPlum = (
  values: unknown[],
  variable: Variable
): FactorLevelSummary => {
  const explicitOrder = buildValueLabelOrder(variable);
  const hasExplicitOrder = explicitOrder.length > 0;
  const labelMap = buildValueLabelMap(variable);
  const seen = new Set<string>();
  const ordered: string[] = [];

  if (explicitOrder.length > 0) {
    for (const value of explicitOrder) {
      if (value === null || value === undefined || value === "") continue;
      const key = normalizeLevelKey(value);
      if (seen.has(key)) continue;
      seen.add(key);
      ordered.push(key);
    }
  }

  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const key = normalizeLevelKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(key);
  }

  const allNumeric = ordered.every((value) => Number.isFinite(Number(value)));
  const sorted = hasExplicitOrder
    ? ordered
    : (allNumeric
      ? [...ordered].sort((a, b) => Number(a) - Number(b))
      : [...ordered].sort((a, b) => a.localeCompare(b)));

  const referenceLevel = sorted.length > 0 ? sorted[sorted.length - 1] : "";

  return {
    variableName: variable.name,
    levels: sorted,
    referenceLevel,
    levelLabels: labelMap,
  };
};

export const encodeTreatmentContrastsForPlum = (
  value: unknown,
  levels: string[],
  referenceLevel: string
): number[] => {
  const key = normalizeLevelKey(value);
  const coding: number[] = [];

  for (const level of levels) {
    if (level === referenceLevel) continue;
    coding.push(key === level ? 1 : 0);
  }

  return coding;
};

export const buildPlumParameterMetadata = (
  factorSummaries: FactorLevelSummary[],
  currentColumnOffset: number
): { metadata: FactorLevelMetadata[]; nextOffset: number } => {
  const metadata: FactorLevelMetadata[] = [];
  let offset = currentColumnOffset;

  for (const summary of factorSummaries) {
    for (const level of summary.levels) {
      const isReference = level === summary.referenceLevel;
      const isRedundant = isReference;
      const parameterName = `[${summary.variableName} = ${level}]`;
      metadata.push({
        variableName: summary.variableName,
        levelValue: level,
        levelLabel: summary.levelLabels[level],
        isReference,
        isRedundant,
        parameterName,
        activeColumnIndex: isReference ? null : offset,
      });
      if (!isReference) {
        offset += 1;
      }
    }
  }

  return { metadata, nextOffset: offset };
};

export const buildOrdinalPlumDesignMatrix = (
  input: BuildOrdinalPlumDesignMatrixInput
): BuildOrdinalPlumDesignMatrixResult => {
  const { rows, factors, covariates, interactions, getRowValue, toNumberOrThrow } = input;
  const warnings: string[] = [];
  const locationTermNames: string[] = [];
  const referenceCategories: Record<string, string> = {};

  const factorSummaries: FactorLevelSummary[] = factors.map((factor) => {
    const values = rows.map((row) => getRowValue(row, factor.columnIndex));
    const summary = extractFactorLevelsForPlum(values, factor);
    if (summary.levels.length < 2) {
      throw new Error(`Factor '${factor.name}' contains less than 2 categories.`);
    }
    referenceCategories[factor.name] = summary.referenceLevel;
    return summary;
  });

  const levelWarningThreshold = Math.max(20, Math.floor(Math.sqrt(Math.max(rows.length, 1))));
  factorSummaries.forEach((summary) => {
    if (summary.levels.length > levelWarningThreshold) {
      warnings.push(
        `Factor '${summary.variableName}' memiliki ${summary.levels.length} level. Model dapat tidak stabil.`
      );
    }
  });

  let columnIndexOffset = covariates.length;
  const factorMetadataResult = buildPlumParameterMetadata(factorSummaries, columnIndexOffset);
  const factorLevelMetadata = factorMetadataResult.metadata;
  columnIndexOffset = factorMetadataResult.nextOffset;

  for (const covariate of covariates) {
    locationTermNames.push(covariate.name);
  }

  for (const summary of factorSummaries) {
    for (const level of summary.levels) {
      if (level === summary.referenceLevel) continue;
      locationTermNames.push(`${summary.variableName}=${level}`);
    }
  }

  for (const interaction of interactions) {
    locationTermNames.push(interaction.name);
  }

  const locationDesignMatrix = rows.map((row) => {
    const rowValues: number[] = [];

    for (const covariate of covariates) {
      const value = getRowValue(row, covariate.columnIndex);
      rowValues.push(toNumberOrThrow(value, covariate.name));
    }

    for (const summary of factorSummaries) {
      const factor = factors.find((f) => f.name === summary.variableName);
      if (!factor) continue;
      const value = getRowValue(row, factor.columnIndex);
      const coding = encodeTreatmentContrastsForPlum(value, summary.levels, summary.referenceLevel);
      rowValues.push(...coding);
    }

    for (const interaction of interactions) {
      const product = interaction.variables.reduce((acc, variable) => {
        const value = getRowValue(row, variable.columnIndex);
        return acc * toNumberOrThrow(value, variable.name);
      }, 1);
      rowValues.push(product);
    }

    return rowValues;
  });

  const activeParameterCount = locationTermNames.length;

  return {
    locationDesignMatrix,
    locationTermNames,
    factorLevelMetadata,
    factorLevelSummaries: factorSummaries,
    referenceCategories,
    warnings,
    activeParameterCount,
  };
};
