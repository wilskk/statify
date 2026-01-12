import {
  LogisticResult,
  BinaryLogisticOutput,
  AnalysisSection,
} from "../types/binary-logistic";
import { formatSummaryTables } from "./formatter_summary";
import { formatBlock0 } from "./formatter_block0";
import { formatBlock1 } from "./formatter_block1";
import { formatAssumptionTests } from "./formatter_assumptions";

export const formatBinaryLogisticResult = (
  result: LogisticResult,
  dependentName: string
): BinaryLogisticOutput => {
  // 1. Container untuk menampung semua sections
  const allSections: AnalysisSection[] = [];

  // 2. Ambil Summary (Case Processing, Encoding)
  const summaryOutput = formatSummaryTables(result);
  if (summaryOutput.sections) {
    allSections.push(...summaryOutput.sections);
  }

  // 3. Ambil Block 0 (Null Model)
  const block0Output = formatBlock0(result, dependentName);
  if (block0Output.sections) {
    allSections.push(...block0Output.sections);
  }

  // 4. Ambil Block 1 (Main Model)
  const block1Output = formatBlock1(result, dependentName);
  if (block1Output.sections) {
    allSections.push(...block1Output.sections);
  }

  const assumptionOutput = formatAssumptionTests(result);
  if (assumptionOutput.sections) {
      allSections.push(...assumptionOutput.sections);
  }

  // 5. Kembalikan format baru
  return { sections: allSections };
};
