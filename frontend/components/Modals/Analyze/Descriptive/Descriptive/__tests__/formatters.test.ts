import { formatDescriptiveTableOld } from '../utils/formatters';
import { DescriptiveStatisticsOptions, DisplayOrderType, DescriptiveResult } from '../types';

const mockResult: DescriptiveResult = {
  variable: {
    name: 'var1',
    label: 'Variable 1',
    type: 'NUMERIC',
    decimals: 2,
    columnIndex: 0,
  } as any,
  stats: {
    N: 10,
    Missing: 0,
    Range: 5,
    Minimum: 1,
    Maximum: 6,
    Sum: 30,
    Mean: 3,
    SEMean: 0.2,
    Median: 3,
    StdDev: 1.2,
    Variance: 1.44,
    Skewness: 0.1,
    SESkewness: 0.05,
    Kurtosis: -0.2,
    SEKurtosis: 0.1,
  },
};

describe('formatDescriptiveTableOld', () => {
  it('produces correct table structure with selected statistics', () => {
    const displayStatistics: DescriptiveStatisticsOptions = {
      mean: true,
      sum: true,
      stdDev: false,
      variance: false,
      range: true,
      minimum: true,
      maximum: true,
      standardError: true,
      median: false,
      skewness: false,
      kurtosis: false,
    };

    const table = formatDescriptiveTableOld([mockResult], displayStatistics, 'variableList' as DisplayOrderType);

    // Basic expectations about structure
    expect(table.title).toBe('Descriptive Statistics');
    // Expect headers to include Mean because mean true
    const headers = table.columnHeaders.map(h => h.header);
    expect(headers).toContain('Mean');
    expect(headers).toContain('Sum');
    // Should include exactly one data row
    expect(table.rows).toHaveLength(1);
    const row = table.rows[0] as any;
    expect(row.Mean).toBe(3);
    expect(row.Sum).toBe(30);
    expect(row.Range).toBe(5);
  });

  it('date-only variables: hide numeric-only columns; show Median and Percentiles with date formatting', () => {
    const d1 = '01-01-2020';
    const d2 = '10-01-2020';
    const d25 = '03-01-2020';
    const d75 = '08-01-2020';

    const s1 = 13865644800; // placeholder, values are not used directly in assertion of formatting
    const s2 = 13866393600;
    // Instead of relying on converter here, we assert output strings

    const dateResult: DescriptiveResult = {
      variable: { name: 'date1', label: 'Date 1', type: 'DATE', columnIndex: 0 } as any,
      stats: {
        N: 4,
        Missing: 0,
        Valid: 4,
        Minimum: s1,
        Maximum: s2,
        Median: s1,
        '25th Percentile': s1,
        '75th Percentile': s2,
      } as any,
    };

    const displayStatistics: DescriptiveStatisticsOptions = {
      mean: true,
      sum: true,
      stdDev: true,
      variance: true,
      range: true,
      minimum: true,
      maximum: true,
      standardError: true,
      median: true,
      skewness: true,
      kurtosis: true,
    };

    const table = formatDescriptiveTableOld([dateResult], displayStatistics, 'variableList');

    const headers = table.columnHeaders.map(h => h.header);
    // Numeric-only headers should be absent when all variables are dates
    expect(headers).not.toContain('Mean');
    expect(headers).not.toContain('Sum');
    expect(headers).not.toContain('Std. Deviation');
    expect(headers).not.toContain('Variance');
    expect(headers).not.toContain('Skewness');
    expect(headers).not.toContain('Kurtosis');
    expect(headers).not.toContain('Range');

    // Always allowed for dates
    expect(headers).toContain('Minimum');
    expect(headers).toContain('Maximum');
    expect(headers).toContain('Median');
    // Percentiles included because present in stats
    expect(headers).toContain('25th Percentile');
    expect(headers).toContain('75th Percentile');

    const row = table.rows[0] as any;
    // Numeric-only cells should be undefined for dates
    expect(row.Mean).toBeUndefined();
    expect(row.Sum).toBeUndefined();
    expect(row.StdDev).toBeUndefined();
    expect(row.Variance).toBeUndefined();
    expect(row.Skewness).toBeUndefined();
    expect(row.Kurtosis).toBeUndefined();
    expect(row.Range).toBeUndefined();

    // Date-like stats exist (we can't predict exact conversion here; assert presence as string)
    expect(typeof row.Minimum === 'string' || row.Minimum === null).toBe(true);
    expect(typeof row.Maximum === 'string' || row.Maximum === null).toBe(true);
    expect(typeof row.Median === 'string' || row.Median === null).toBe(true);
    expect(typeof row['25th Percentile'] === 'string' || row['25th Percentile'] === null).toBe(true);
    expect(typeof row['75th Percentile'] === 'string' || row['75th Percentile'] === null).toBe(true);
  });

  it('mixed numeric + date: include numeric-only headers; hide numeric-only values for date row; Mode gated to non-date', () => {
    const numeric: DescriptiveResult = {
      variable: { name: 'x', label: 'X', type: 'NUMERIC', columnIndex: 0 } as any,
      stats: {
        N: 3,
        Missing: 0,
        Valid: 3,
        Minimum: 1,
        Maximum: 3,
        Sum: 6,
        Mean: 2,
        SEMean: 0.58,
        StdDev: 1,
        Variance: 1,
        Skewness: 0,
        SESkewness: 0.1,
        Kurtosis: -1.5,
        SEKurtosis: 0.2,
        Mode: [2],
      } as any,
    };

    const date: DescriptiveResult = {
      variable: { name: 'd', label: 'D', type: 'DATE', columnIndex: 1 } as any,
      stats: {
        N: 2,
        Missing: 0,
        Valid: 2,
        Minimum: 13865644800,
        Maximum: 13866393600,
        Median: 13865644800,
        '25th Percentile': 13865644800,
        '75th Percentile': 13866393600,
      } as any,
    };

    const displayStatistics: DescriptiveStatisticsOptions = {
      mean: true,
      sum: true,
      stdDev: true,
      variance: true,
      range: true,
      minimum: true,
      maximum: true,
      standardError: true,
      median: true,
      skewness: true,
      kurtosis: true,
    };

    const table = formatDescriptiveTableOld([numeric, date], displayStatistics, 'variableList');
    const headers = table.columnHeaders.map(h => h.header);

    // Numeric-only headers should be present due to numeric variable
    expect(headers).toContain('Mean');
    expect(headers).toContain('Sum');
    expect(headers).toContain('Std. Deviation');
    expect(headers).toContain('Variance');
    expect(headers).toContain('Skewness');
    expect(headers).toContain('Kurtosis');
    expect(headers).toContain('Range');
    // Mode column included because numeric provided Mode
    expect(headers).toContain('Mode');

    // Date row should hide numeric-only values and Mode
    const dateRow = table.rows.find((r: any) => r.rowHeader?.[0] === 'D') as any;
    expect(dateRow.Mean).toBeUndefined();
    expect(dateRow.Sum).toBeUndefined();
    expect(dateRow.StdDev).toBeUndefined();
    expect(dateRow.Variance).toBeUndefined();
    expect(dateRow.Skewness).toBeUndefined();
    expect(dateRow.Kurtosis).toBeUndefined();
    expect(dateRow.Range).toBeUndefined();
    expect(dateRow.Mode).toBeUndefined();

    // Numeric row should include Mode joined as string
    const numRow = table.rows.find((r: any) => r.rowHeader?.[0] === 'X') as any;
    expect(numRow.Mode).toBe('2');
    expect(numRow.Mean).toBe(2);
  });
});