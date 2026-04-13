import { formatParameterEstimates } from "./formatter_parameter";
import { AnalysisSection } from "../types/ordinal";

export const formatOrdinalResult = (payload: any[]) => {
  const allSections: AnalysisSection[] = [];

  const param = formatParameterEstimates(payload);
  if (param.sections) {
    allSections.push(...param.sections);
  }

  return { sections: allSections };
};