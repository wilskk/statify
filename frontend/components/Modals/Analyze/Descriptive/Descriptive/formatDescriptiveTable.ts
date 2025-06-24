import { DescriptiveStatisticsOptions, DisplayOrderType, DescriptiveResult, DescriptiveStats } from './types';
import { spssDateTypes } from '@/types/Variable';
import { spssSecondsToDateString } from '@/utils/spssDateConverter';
import type { TableRow, TableColumnHeader } from './types';

export interface DescriptiveTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}

/**
 * Formats the raw statistics data into a table structure for display.
 * @param results - Array of analysis results from the worker.
 * @returns A formatted table object for descriptive statistics.
 */
export const formatDescriptiveTable = (results: DescriptiveResult[]): any => {
    if (!results || results.length === 0) return null;

    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "" },
        { header: "N", children: [{ header: "Statistic", key: "N_Statistic" }] },
        { header: "Range", children: [{ header: "Statistic", key: "Range_Statistic" }] },
        { header: "Minimum", children: [{ header: "Statistic", key: "Minimum_Statistic" }] },
        { header: "Maximum", children: [{ header: "Statistic", key: "Maximum_Statistic" }] },
        { header: "Sum", children: [{ header: "Statistic", key: "Sum_Statistic" }] },
        { header: "Mean", children: [
            { header: "Statistic", key: "Mean_Statistic" },
            { header: "Std. Error", key: "Mean_StdError" }
        ]},
        { header: "Std. Deviation", children: [{ header: "Statistic", key: "StdDeviation_Statistic" }] },
        { header: "Variance", children: [{ header: "Statistic", key: "Variance_Statistic" }] },
        { header: "Skewness", children: [
            { header: "Statistic", key: "Skewness_Statistic" },
            { header: "Std. Error", key: "Skewness_StdError" }
        ]},
        { header: "Kurtosis", children: [
            { header: "Statistic", key: "Kurtosis_Statistic" },
            { header: "Std. Error", key: "Kurtosis_StdError" }
        ]}
    ];

    let validNListwise = Infinity;

    const rows: TableRow[] = results
        .filter(result => result.stats)
        .map(result => {
            const stats = result.stats!;
            if (stats.N < validNListwise) {
                validNListwise = stats.N;
            }

            const row: TableRow = {
                rowHeader: [result.variable.label || result.variable.name],
                N_Statistic: stats.N,
                Range_Statistic: stats.Range?.toFixed(2),
                Minimum_Statistic: stats.Minimum?.toFixed(2),
                Maximum_Statistic: stats.Maximum?.toFixed(2),
                Sum_Statistic: stats.Sum?.toFixed(2),
                Mean_Statistic: stats.Mean?.toFixed(4),
                Mean_StdError: stats.SEMean?.toFixed(5),
                StdDeviation_Statistic: stats.StdDev?.toFixed(5),
                Variance_Statistic: stats.Variance?.toFixed(3),
                Skewness_Statistic: stats.Skewness?.toFixed(3),
                Skewness_StdError: stats.SESkewness?.toFixed(3),
                Kurtosis_Statistic: stats.Kurtosis?.toFixed(3),
                Kurtosis_StdError: stats.SEKurtosis?.toFixed(3),
            };
            return row;
        });

    if (results.length > 0) {
        rows.push({
            rowHeader: ["Valid N (listwise)"],
            N_Statistic: validNListwise === Infinity ? 0 : validNListwise,
        });
    }

    return {
        tables: [{
            title: "Descriptive Statistics",
            columnHeaders: columnHeaders,
            rows: rows,
        }]
    };
};

/**
 * Memformat data statistik mentah menjadi struktur tabel untuk UI (versi final yang disederhanakan)
 */
export function formatDescriptiveTableOld(
  data: DescriptiveResult[],
  displayStatistics: DescriptiveStatisticsOptions,
  displayOrder: DisplayOrderType = 'variableList'
): DescriptiveTable {
  
  // 1. Bangun Headers
  const columnHeaders: TableColumnHeader[] = [{ header: "" }];
  columnHeaders.push({ header: "N", key: "N" }, { header: "Missing", key: "Missing" });

  if (displayStatistics.range) columnHeaders.push({ header: "Range", key: "Range" });
  if (displayStatistics.minimum) columnHeaders.push({ header: "Minimum", key: "Minimum" });
  if (displayStatistics.maximum) columnHeaders.push({ header: "Maximum", key: "Maximum" });
  if (displayStatistics.sum) columnHeaders.push({ header: "Sum", key: "Sum" });
  if (displayStatistics.mean) columnHeaders.push({ header: "Mean", key: "Mean" });
  if (displayStatistics.standardError) columnHeaders.push({ header: "Std. Error", key: "SEMean" });
  if (displayStatistics.median) columnHeaders.push({ header: "Median", key: "Median" });
  if (displayStatistics.stdDev) columnHeaders.push({ header: "Std. Deviation", key: "StdDev" });
  if (displayStatistics.variance) columnHeaders.push({ header: "Variance", key: "Variance" });

  if (displayStatistics.skewness) {
    columnHeaders.push({
      header: "Skewness",
      children: [{ header: "Statistic", key: "Skewness" }, { header: "Std. Error", key: "SESkewness" }]
    });
  }
  if (displayStatistics.kurtosis) {
    columnHeaders.push({
      header: "Kurtosis",
      children: [{ header: "Statistic", key: "Kurtosis" }, { header: "Std. Error", key: "SEKurtosis" }]
    });
  }

  // 2. Urutkan Data
  const sortedStats = [...data].sort((a, b) => {
    if (displayOrder === 'alphabetic') return a.variable.name.localeCompare(b.variable.name);
    if (displayOrder === 'mean' || displayOrder === 'ascendingMeans') {
        const meanA = typeof a.stats.Mean === 'number' ? a.stats.Mean : Infinity;
        const meanB = typeof b.stats.Mean === 'number' ? b.stats.Mean : Infinity;
        return meanA - meanB;
    }
    if (displayOrder === 'descendingMeans') {
        const meanA = typeof a.stats.Mean === 'number' ? a.stats.Mean : -Infinity;
        const meanB = typeof b.stats.Mean === 'number' ? b.stats.Mean : -Infinity;
        return meanB - meanA;
    }
    return 0; // default (variableList)
  });

  // 3. Buat Baris Tabel
  const rows: TableRow[] = sortedStats.map(({ variable, stats }) => {
    let headerText = variable.label || variable.name;
    if (headerText.length > 50) { // Truncate long labels
        headerText = headerText.substring(0, 47) + '...';
    }
    const row: TableRow = { rowHeader: [headerText] };
    const isDateType = spssDateTypes.has(variable.type);
    const decimals = variable.decimals;

    // Fungsi helper untuk memformat nilai
    const format = (value: number | null | undefined, formatAs: 'date' | 'number') => {
      if (value === null || value === undefined) return value;
      if (isDateType && formatAs === 'date') return spssSecondsToDateString(value);
      if (typeof value === 'number' && decimals >= 0) {
        // Use toFixed for rounding and convert back to number to remove trailing zeros
        return parseFloat(value.toFixed(decimals));
      }
      return value;
    };

    row.N = stats.N;
    row.Missing = stats.Missing;
    
    // Tetapkan setiap stat secara eksplisit untuk keamanan tipe
    if (displayStatistics.range) row.Range = format(stats.Range, 'number');
    if (displayStatistics.minimum) row.Minimum = format(stats.Minimum, 'date');
    if (displayStatistics.maximum) row.Maximum = format(stats.Maximum, 'date');
    if (displayStatistics.sum) row.Sum = format(stats.Sum, 'number');
    if (displayStatistics.mean) row.Mean = format(stats.Mean, 'date');
    if (displayStatistics.standardError) row.SEMean = format(stats.SEMean, 'number');
    if (displayStatistics.median) row.Median = format(stats.Median, 'date');
    if (displayStatistics.stdDev) row.StdDev = format(stats.StdDev, 'number');
    if (displayStatistics.variance) row.Variance = format(stats.Variance, 'number');
    if (displayStatistics.skewness) {
      row.Skewness = format(stats.Skewness, 'number');
      row.SESkewness = format(stats.SESkewness, 'number');
    }
    if (displayStatistics.kurtosis) {
      row.Kurtosis = format(stats.Kurtosis, 'number');
      row.SEKurtosis = format(stats.SEKurtosis, 'number');
    }

    return row;
  });

  return { title: "Descriptive Statistics", columnHeaders, rows };
} 