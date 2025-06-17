import { DescriptiveStatisticsOptions } from '../types';

interface VariableStats {
  name: string;
  label: string;
  type: string;
  n: number;
  range?: number | string | null;
  minimum?: number | string | null;
  maximum?: number | string | null;
  sum?: number | string | null;
  mean?: number | string | null;
  standardError?: number | string | null;
  median?: number | string | null;
  stdDev?: number | string | null;
  variance?: number | null;
  skewness?: number | null;
  skewnessStdError?: number | null;
  kurtosis?: number | null;
  kurtosisStdError?: number | null;
}

interface DescriptiveStatisticsData {
  variables: {
    [key: string]: VariableStats;
  };
  listwiseValidN: number;
}

export interface TableColumnHeader {
  header: string;
  key?: string;
  children?: TableColumnHeader[];
}

export interface TableRow {
  rowHeader: string[];
  [key: string]: any;
}

export interface DescriptiveTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}

/**
 * Memformat data statistik mentah menjadi struktur tabel untuk UI
 */
export function formatDescriptiveTable(
  data: DescriptiveStatisticsData, 
  displayStatistics: DescriptiveStatisticsOptions,
  displayOrder: 'variableList' | 'alphabetic' | 'ascendingMeans' | 'descendingMeans' = 'variableList'
): DescriptiveTable {
  // Bangun header kolom berdasarkan opsi statistik
  const columnHeaders: TableColumnHeader[] = [{ header: "" }]; // Untuk rowHeader (nama/label variabel)
  columnHeaders.push({ header: "N", key: "n" });
  
  if (displayStatistics.range) columnHeaders.push({ header: "Range", key: "range" });
  if (displayStatistics.minimum) columnHeaders.push({ header: "Minimum", key: "minimum" });
  if (displayStatistics.maximum) columnHeaders.push({ header: "Maximum", key: "maximum" });
  if (displayStatistics.sum) columnHeaders.push({ header: "Sum", key: "sum" });

  const meanGroupChildren: TableColumnHeader[] = [];
  if (displayStatistics.mean) meanGroupChildren.push({ header: "Statistic", key: "mean_statistic" });
  if (displayStatistics.standardError) meanGroupChildren.push({ header: "Std. Error", key: "mean_std_error" });
  if (meanGroupChildren.length > 0) columnHeaders.push({ header: "Mean", children: meanGroupChildren });
  
  if (displayStatistics.median) columnHeaders.push({ header: "Median", key: "median_statistic" });
  if (displayStatistics.stdDev) columnHeaders.push({ header: "Std. Deviation", key: "std_deviation" });
  if (displayStatistics.variance) columnHeaders.push({ header: "Variance", key: "variance" });

  const skewnessGroupChildren: TableColumnHeader[] = [];
  if (displayStatistics.skewness) {
    skewnessGroupChildren.push({ header: "Statistic", key: "skewness_statistic" });
    skewnessGroupChildren.push({ header: "Std. Error", key: "skewness_std_error" });
    columnHeaders.push({ header: "Skewness", children: skewnessGroupChildren });
  }

  const kurtosisGroupChildren: TableColumnHeader[] = [];
  if (displayStatistics.kurtosis) {
    kurtosisGroupChildren.push({ header: "Statistic", key: "kurtosis_statistic" });
    kurtosisGroupChildren.push({ header: "Std. Error", key: "kurtosis_std_error" });
    columnHeaders.push({ header: "Kurtosis", children: kurtosisGroupChildren });
  }

  // Ambil variabel dari data
  let variables = Object.values(data.variables);

  // Urutkan variabel sesuai displayOrder
  if (displayOrder === 'alphabetic') {
    variables = variables.sort((a, b) => a.name.localeCompare(b.name));
  } else if (displayOrder === 'ascendingMeans') {
    variables = variables.sort((a, b) => {
      const meanA = typeof a.mean === 'number' ? a.mean : Number.MAX_VALUE;
      const meanB = typeof b.mean === 'number' ? b.mean : Number.MAX_VALUE;
      return meanA - meanB;
    });
  } else if (displayOrder === 'descendingMeans') {
    variables = variables.sort((a, b) => {
      const meanA = typeof a.mean === 'number' ? a.mean : -Number.MAX_VALUE;
      const meanB = typeof b.mean === 'number' ? b.mean : -Number.MAX_VALUE;
      return meanB - meanA;
    });
  }
  // variableList adalah default, tidak perlu pengurutan

  // Buat row data dari variabel
  const rows: TableRow[] = variables.map(variable => {
    const row: TableRow = { 
      rowHeader: [variable.label] 
    };

    // Isi nilai N
    row.n = variable.n;

    // Isi nilai statistik sesuai yang tersedia
    if (displayStatistics.range) row.range = variable.range;
    if (displayStatistics.minimum) row.minimum = variable.minimum;
    if (displayStatistics.maximum) row.maximum = variable.maximum;
    if (displayStatistics.sum) row.sum = variable.sum;
    
    if (displayStatistics.mean) row.mean_statistic = variable.mean;
    if (displayStatistics.standardError) row.mean_std_error = variable.standardError;
    if (displayStatistics.median) row.median_statistic = variable.median;
    if (displayStatistics.stdDev) row.std_deviation = variable.stdDev;
    if (displayStatistics.variance) row.variance = variable.variance;
    
    if (displayStatistics.skewness) {
      row.skewness_statistic = variable.skewness;
      row.skewness_std_error = variable.skewnessStdError;
    }
    
    if (displayStatistics.kurtosis) {
      row.kurtosis_statistic = variable.kurtosis;
      row.kurtosis_std_error = variable.kurtosisStdError;
    }

    return row;
  });

  // Tambahkan row untuk Valid N (listwise)
  const listwiseRow: TableRow = { rowHeader: ["Valid N (listwise)"], n: data.listwiseValidN };
  
  // Set semua nilai statistik lainnya ke null
  columnHeaders.forEach(ch => {
    if (ch.key && ch.key !== 'n') listwiseRow[ch.key] = null;
    if (ch.children) {
      ch.children.forEach(child => { 
        if (child.key) listwiseRow[child.key] = null; 
      });
    }
  });
  
  rows.push(listwiseRow);

  return {
    title: "Descriptive Statistics",
    columnHeaders,
    rows
  };
} 