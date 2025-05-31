import { TableColumnHeader, TableRow } from '../types';

interface FrequencyTableProps {
  variableLabel: string;
  validRowsData: {
    label: string;
    frequency: number;
    percent: number;
    validPercent: number;
    cumulativePercent: number;
  }[];
  missingRowsData: {
    label: string;
    frequency: number;
    percent: number;
    isSystem: boolean;
  }[];
  totalN: number;
  validN: number;
  totalMissingN: number;
}

export interface FrequencyTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
  components: string[];
  description: string;
}

/**
 * Format raw frequency data into a structured table for UI rendering
 */
export function formatFrequencyTable(data: FrequencyTableProps): FrequencyTable {
  // Define column headers
  const columnHeaders: TableColumnHeader[] = [
    { header: "" },
    { header: "" },
    { header: "Frequency", key: "frequency" },
    { header: "Percent", key: "percent" },
    { header: "Valid Percent", key: "valid_percent" },
    { header: "Cumulative Percent", key: "cumulative_percent" }
  ];

  // Format rows
  const rows: TableRow[] = [];

  // Helper function to round numbers
  const round = (num: number | null, decimals = 1): number | null => {
    if (num === null || num === undefined) return null;
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  };

  // Add rows for valid data
  data.validRowsData.forEach(validRow => {
    rows.push({
      rowHeader: ["Valid", validRow.label],
      frequency: validRow.frequency,
      percent: round(validRow.percent),
      valid_percent: round(validRow.validPercent),
      cumulative_percent: round(validRow.cumulativePercent)
    });
  });

  // Add total row for valid data if there are any valid entries
  if (data.validN > 0) {
    rows.push({
      rowHeader: ["Valid", "Total"],
      frequency: data.validN,
      percent: round((data.validN / data.totalN) * 100),
      valid_percent: 100.0,
      cumulative_percent: null
    });
  }

  // Add rows for missing data
  if (data.totalMissingN > 0 && Array.isArray(data.missingRowsData)) {
    let numberOfMissingRowsAdded = 0;

    data.missingRowsData.forEach(missingRow => {
      rows.push({
        rowHeader: ["Missing", missingRow.label],
        frequency: missingRow.frequency,
        percent: round(missingRow.percent),
        valid_percent: null,
        cumulative_percent: null
      });
      numberOfMissingRowsAdded++;
    });

    // Add total row for missing data if there is more than one type of missing
    if (numberOfMissingRowsAdded > 1) {
      rows.push({
        rowHeader: ["Missing", "Total"],
        frequency: data.totalMissingN,
        percent: round((data.totalMissingN / data.totalN) * 100),
        valid_percent: null,
        cumulative_percent: null
      });
    }
  }

  // Add overall total row
  rows.push({
    rowHeader: ["Total", null],
    frequency: data.totalN,
    percent: 100.0,
    valid_percent: null,
    cumulative_percent: null
  });

  return {
    title: data.variableLabel,
    columnHeaders,
    rows,
    components: ['Frequency Table'],
    description: `Frequency table for ${data.variableLabel}`
  };
} 