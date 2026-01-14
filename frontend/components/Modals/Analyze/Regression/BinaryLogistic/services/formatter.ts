import {
  LogisticResult,
  BinaryLogisticOutput,
  AnalysisSection,
} from "../types/binary-logistic";
import { formatSummaryTables } from "./formatter_summary";
import { formatBlock0 } from "./formatter_block0";
import { formatBlock1 } from "./formatter_block1";
import { formatAssumptionTests } from "./formatter_assumptions";
import { formatHosmerLemeshow } from "./formatter_hosmer"; // Import baru
import { Variable } from "@/types/Variable";

export const formatBinaryLogisticResult = (
  result: LogisticResult,
  dependentVariable: Variable,
  independentVariables: Variable[] = []
): BinaryLogisticOutput => {
  const allSections: AnalysisSection[] = [];

  // 1. Case Processing & Encoding
  const summaryOutput = formatSummaryTables(
    result,
    dependentVariable,
    independentVariables
  );
  if (summaryOutput.sections) {
    allSections.push(...summaryOutput.sections);
  }

  // 2. Block 0: Beginning Block
  const block0Output = formatBlock0(result, dependentVariable.name);
  if (block0Output.sections) {
    allSections.push(...block0Output.sections);
  }

  // 3. Block 1: Method = Enter/Stepwise
  // Format standard Block 1 (Omnibus, Summary, Classification, Vars)
  const block1Output = formatBlock1(result, dependentVariable.name);

  if (block1Output.sections) {
    // TRIK INSERT POSISI (Agar mirip SPSS):
    // SPSS urutan: Omnibus -> Summary -> Hosmer -> Classification -> Vars
    // Kita coba sisipkan Hosmer setelah Model Summary jika memungkinkan.

    // Cari index Model Summary
    const summaryIndex = block1Output.sections.findIndex(
      (s) => s.id === "block1_summary"
    );

    // Generate Hosmer Tables
    const hosmerOutput = formatHosmerLemeshow(result, dependentVariable.name);

    if (summaryIndex !== -1 && hosmerOutput.sections.length > 0) {
      // Masukkan Block 1 bagian awal (sampai summary)
      allSections.push(...block1Output.sections.slice(0, summaryIndex + 1));

      // Masukkan Hosmer Lemeshow (Tepat di tengah Block 1)
      allSections.push(...hosmerOutput.sections);

      // Masukkan sisa Block 1 (Classification, Vars, dll)
      allSections.push(...block1Output.sections.slice(summaryIndex + 1));
    } else {
      // Jika tidak ketemu atau tidak ada Hosmer, masukkan normal
      allSections.push(...block1Output.sections);
      // Jika Hosmer ada tapi summary tidak ketemu, taruh di akhir block 1
      if (hosmerOutput.sections.length > 0) {
        allSections.push(...hosmerOutput.sections);
      }
    }
  }

  // 4. Assumption Tests (VIF/Box-Tidwell) - Biasanya tabel terpisah di paling bawah
  const assumptionOutput = formatAssumptionTests(result);
  if (assumptionOutput.sections) {
    allSections.push(...assumptionOutput.sections);
  }

  return { sections: allSections };
};
