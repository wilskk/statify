import type { DescriptiveStatistics, FrequenciesResult } from '../types';
import { spssDateTypes } from '@/types/Variable';
import { spssSecondsToDateString } from '@/lib/spssDateConverter';

// Konstanta untuk precision yang konsisten
const STATS_DECIMAL_PLACES = 2;

// Helper function to check if a variable is a date type
const isDateVariable = (variable: any): boolean => {
    return variable?.type && spssDateTypes.has(variable.type);
};

// Helper to format SPSS seconds or string dates to dd-mm-yyyy
const formatDateValue = (value: any): string => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        const s = spssSecondsToDateString(value);
        return s ?? '';
    }
    if (typeof value === 'string') return value;
    return '';
};

// Effective measurement: map 'unknown' as per rules: numeric->scale, string->nominal, date->scale
type EffectiveMeasure = 'nominal' | 'ordinal' | 'scale';
const getEffectiveMeasure = (variable: any): EffectiveMeasure => {
    const measure = variable?.measure;
    if (!measure || measure === 'unknown') {
        if (isDateVariable(variable)) return 'scale';
        if (variable?.type === 'STRING') return 'nominal';
        return 'scale';
    }
    return measure as EffectiveMeasure;
};

// Determine if a stat is allowed for a variable by measurement (date-specific handling stays below)
const allowsStatByMeasure = (variable: any, key: string): boolean => {
    const m = getEffectiveMeasure(variable);
    if (key === 'Mode') return true; // always allowed
    if (key === 'Median') return m === 'ordinal' || m === 'scale';
    if (key === 'Mean' || key === 'SEMean') return m !== 'nominal'; // ordinal allowed with caution
    if (key === 'Sum') return m === 'scale';
    if (key === 'Range' || key === 'Minimum' || key === 'Maximum') return m === 'ordinal' || m === 'scale';
    if (
        key === 'StdDev' || key === 'Variance' || key === 'Skewness' || key === 'Kurtosis' ||
        key === 'SESkewness' || key === 'SEKurtosis'
    ) {
        return m !== 'nominal'; // ordinal allowed with caution
    }
    if (key === 'Percentiles') return m === 'ordinal' || m === 'scale';
    return true;
};

// Identify cautionary stats for ordinal variables
const isOrdinalCautionStat = (key: string): boolean =>
    key === 'Mean' || key === 'SEMean' || key === 'StdDev' || key === 'Variance' || key === 'Skewness' || key === 'SESkewness' || key === 'Kurtosis' || key === 'SEKurtosis';

/**
 * Formats the raw statistics data into a table structure for display.
 * @param results - Array of analysis results from the worker.
 * @returns A formatted table object for descriptive statistics.
 */
export const formatStatisticsTable = (results: FrequenciesResult[]): any => {
    const statsResults = results.filter(r => r.stats);
    if (statsResults.length === 0) return null;

    const statsMap = new Map<string, DescriptiveStatistics>();
    statsResults.forEach(r => {
        if (r.stats) {
            statsMap.set(r.variable.name, r.stats);
        }
    });

    const variableNames = statsResults.map(r => r.variable.name);

    const columnHeaders = [
        { header: '', key: 'stat' },
        { header: '', key: 'subStat' },
        ...statsResults.map(r => ({
            header: r.variable.label || r.variable.name,
            key: r.variable.name,
        })),
    ];

    const rows: any[] = [];
    let ordinalCautionUsed = false;

    // N Row
    rows.push({
        rowHeader: ['N', null],
        children: [
            {
                rowHeader: [null, 'Valid'],
                ...Object.fromEntries(variableNames.map(name => [name, statsMap.get(name)?.N?.toString() ?? ''])),
            },
            {
                rowHeader: [null, 'Missing'],
                ...Object.fromEntries(variableNames.map(name => [name, statsMap.get(name)?.Missing?.toString() ?? ''])),
            },
        ],
    });

    const statRowsConfig = [
        { name: 'Mean', key: 'Mean', precision: STATS_DECIMAL_PLACES },
        // Align key with worker output (SEMean)
        { name: 'Std. Error of Mean', key: 'SEMean', precision: STATS_DECIMAL_PLACES },
        { name: 'Median', key: 'Median', precision: STATS_DECIMAL_PLACES },
    ];

    statRowsConfig.forEach(config => {
        const row: any = { rowHeader: [config.name] };
        variableNames.forEach(name => {
            const variable = statsResults.find(r => r.variable.name === name)?.variable;
            // Primary value from stats
            let value: any = (statsMap.get(name) as any)?.[config.key];
            // Fallback: if Median missing, use Percentiles['50']
            if ((value === undefined || value === null) && config.key === 'Median') {
                const p = statsMap.get(name)?.Percentiles as any;
                value = p?.[50] ?? p?.['50'];
            }
            const allowedByMeasure = allowsStatByMeasure(variable, config.key);
            if (!allowedByMeasure) {
                row[name] = '';
            } else if (isDateVariable(variable)) {
                // For dates, only Median is shown here
                if (config.key === 'Median') {
                    row[name] = formatDateValue(value);
                } else {
                    row[name] = '';
                }
            } else {
                // Non-date, allowed by measure
                if (isOrdinalCautionStat(config.key) && getEffectiveMeasure(variable) === 'ordinal' && value !== undefined && value !== null) {
                    ordinalCautionUsed = true;
                }
                row[name] = typeof value === 'number' ? value.toFixed(config.precision) : (value ?? '');
            }
        });
        rows.push(row);
    });

    // Mode Row
    const modeRow: any = { rowHeader: ['Mode'] };
    variableNames.forEach(name => {
        const variable = statsResults.find(r => r.variable.name === name)?.variable;
        const modes = statsMap.get(name)?.Mode;
        if (modes && Array.isArray(modes) && modes.length > 0) {
            const first = modes[0] as unknown;
            if (isDateVariable(variable)) {
                // For date variables, format numeric seconds to dd-mm-yyyy; pass through strings
                modeRow[name] = formatDateValue(first) + (modes.length > 1 ? '<sup>a</sup>' : '');
            } else {
                // For numeric variables, format with decimals; otherwise, show as-is (string/value-label)
                modeRow[name] = (typeof first === 'number'
                    ? first.toFixed(STATS_DECIMAL_PLACES)
                    : String(first)) + (modes.length > 1 ? '<sup>a</sup>' : '');
            }
        } else {
            modeRow[name] = '';
        }
    });
    rows.push(modeRow);

    const remainingStatRowsConfig = [
        { name: 'Std. Deviation', key: 'StdDev', precision: STATS_DECIMAL_PLACES },
        { name: 'Variance', key: 'Variance', precision: STATS_DECIMAL_PLACES },
        { name: 'Skewness', key: 'Skewness', precision: STATS_DECIMAL_PLACES },
        // Align keys with worker output (SESkewness, SEKurtosis)
        { name: 'Std. Error of Skewness', key: 'SESkewness', precision: STATS_DECIMAL_PLACES },
        { name: 'Kurtosis', key: 'Kurtosis', precision: STATS_DECIMAL_PLACES },
        { name: 'Std. Error of Kurtosis', key: 'SEKurtosis', precision: STATS_DECIMAL_PLACES },
        { name: 'Range', key: 'Range', precision: STATS_DECIMAL_PLACES },
        { name: 'Minimum', key: 'Minimum', precision: STATS_DECIMAL_PLACES },
        { name: 'Maximum', key: 'Maximum', precision: STATS_DECIMAL_PLACES },
        { name: 'Sum', key: 'Sum', precision: STATS_DECIMAL_PLACES },
    ];

    remainingStatRowsConfig.forEach(config => {
        const row: any = { rowHeader: [config.name] };
        variableNames.forEach(name => {
            const variable = statsResults.find(r => r.variable.name === name)?.variable;
            const allowedByMeasure = allowsStatByMeasure(variable, config.key);
            if (!allowedByMeasure) {
                row[name] = '';
            } else if (isDateVariable(variable)) {
                // For date variables, don't show these numerical statistics
                row[name] = '';
            } else {
                const value = (statsMap.get(name) as any)?.[config.key];
                if (isOrdinalCautionStat(config.key) && getEffectiveMeasure(variable) === 'ordinal' && value !== undefined && value !== null) {
                    ordinalCautionUsed = true;
                }
                row[name] = typeof value === 'number' ? value.toFixed(config.precision) : value ?? '';
            }
        });
        rows.push(row);
    });

    // Percentiles
    const percentileLevels = new Set<number>();
    statsResults.forEach(r => {
        if (r.stats?.Percentiles) {
            Object.keys(r.stats.Percentiles).forEach(p => percentileLevels.add(Number(p)));
        }
    });

    if (percentileLevels.size > 0) {
        const sortedLevels = Array.from(percentileLevels).sort((a, b) => a - b);
        const percentileChildren = sortedLevels.map(level => {
            const childRow: any = { rowHeader: [null, level.toString()] };
            variableNames.forEach(name => {
                const variable = statsResults.find(r => r.variable.name === name)?.variable;
                const value = statsMap.get(name)?.Percentiles?.[level];
                const allowedByMeasure = allowsStatByMeasure(variable, 'Percentiles');
                if (!allowedByMeasure) {
                    childRow[name] = '.';
                } else if (isDateVariable(variable)) {
                    // Show date percentiles (25, 50, 75) as dd-mm-yyyy
                    const formatted = formatDateValue(value);
                    childRow[name] = formatted || '.';
                } else {
                    childRow[name] = typeof value === 'number' ? value.toFixed(STATS_DECIMAL_PLACES) : '.';
                }
            });
            return childRow;
        });
        rows.push({
            rowHeader: ['Percentiles', null],
            children: percentileChildren,
        });
    }

    const hasMultipleModes = statsResults.some(r => r.stats && Array.isArray(r.stats.Mode) && r.stats.Mode.length > 1);
    const footerParts: string[] = [];
    if (hasMultipleModes) footerParts.push('<sup>a</sup>. Multiple modes exist. The smallest value is shown.');
    if (ordinalCautionUsed) footerParts.push('<sup>b</sup>. Ordinal variables: numeric statistics are computed on coded values and should be interpreted with caution.');

    return {
        tables: [
            {
                title: 'Statistics',
                columnHeaders: columnHeaders.map(h => ({ header: h.header, key: h.key })), // Match desired output
                rows,
                ...(footerParts.length > 0 && { footer: footerParts.join(' ') }),
            },
        ],
    };
};