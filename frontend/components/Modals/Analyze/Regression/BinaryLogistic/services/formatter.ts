/**
 * formatter.ts
 * Main Orchestrator for Binary Logistic Regression Output.
 * Menggabungkan semua bagian modular menjadi satu hasil akhir.
 */

import { LogisticResult, BinaryLogisticOutput } from "../types/binary-logistic";

// Import bagian-bagian modular
import { formatSummaryTables } from "./formatter_summary";
import { formatBlock0 } from "./formatter_block0";
import { formatBlock1 } from "./formatter_block1";

export const formatBinaryLogisticResult = (
  result: LogisticResult,
  dependentName: string
): BinaryLogisticOutput => {
  
  // Container utama untuk semua tabel output
  const tables: any[] = [];

  // ----------------------------------------------------------------------
  // 1. Case Processing Summary & Dependent Variable Encoding
  // ----------------------------------------------------------------------
  const summaryOutput = formatSummaryTables(result);
  tables.push(...summaryOutput.tables);

  // ----------------------------------------------------------------------
  // 2. Block 0: Beginning Block (Null Model)
  // ----------------------------------------------------------------------
  const block0Tables = formatBlock0(result, dependentName);
  tables.push(...block0Tables);

  // ----------------------------------------------------------------------
  // 3. Block 1: Method = Enter / Stepwise (Main Model)
  // ----------------------------------------------------------------------
  const block1Tables = formatBlock1(result, dependentName);
  tables.push(...block1Tables);

  // Return format sesuai kontrak interface BinaryLogisticOutput
  return { tables };
};