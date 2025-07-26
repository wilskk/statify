import type { DescriptiveStatistics, FrequenciesResult } from '../types';

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
        { name: 'Mean', key: 'Mean', precision: 4 },
        // Align key with worker output (SEMean)
        { name: 'Std. Error of Mean', key: 'SEMean', precision: 5 },
        { name: 'Median', key: 'Median', precision: 4 },
    ];

    statRowsConfig.forEach(config => {
        const row: any = { rowHeader: [config.name] };
        variableNames.forEach(name => {
            const value = (statsMap.get(name) as any)?.[config.key];
            row[name] = typeof value === 'number' ? value.toFixed(config.precision) : value ?? '';
        });
        rows.push(row);
    });

    // Mode Row
    const modeRow: any = { rowHeader: ['Mode'] };
    variableNames.forEach(name => {
        const modes = statsMap.get(name)?.Mode;
        if (modes && Array.isArray(modes) && modes.length > 0) {
            modeRow[name] = modes[0].toFixed(2) + (modes.length > 1 ? '<sup>a</sup>' : '');
        } else {
            modeRow[name] = '';
        }
    });
    rows.push(modeRow);

    const remainingStatRowsConfig = [
        { name: 'Std. Deviation', key: 'StdDev', precision: 5 },
        { name: 'Variance', key: 'Variance', precision: 3 },
        { name: 'Skewness', key: 'Skewness', precision: 3 },
        // Align keys with worker output (SESkewness, SEKurtosis)
        { name: 'Std. Error of Skewness', key: 'SESkewness', precision: 3 },
        { name: 'Kurtosis', key: 'Kurtosis', precision: 3 },
        { name: 'Std. Error of Kurtosis', key: 'SEKurtosis', precision: 3 },
        { name: 'Range', key: 'Range', precision: 2 },
        { name: 'Minimum', key: 'Minimum', precision: 2 },
        { name: 'Maximum', key: 'Maximum', precision: 2 },
        { name: 'Sum', key: 'Sum', precision: 2 },
    ];

    remainingStatRowsConfig.forEach(config => {
        const row: any = { rowHeader: [config.name] };
        variableNames.forEach(name => {
            const value = (statsMap.get(name) as any)?.[config.key];
            row[name] = typeof value === 'number' ? value.toFixed(config.precision) : value ?? '';
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
                const value = statsMap.get(name)?.Percentiles?.[level];
                childRow[name] = typeof value === 'number' ? value.toFixed(4) : '.';
            });
            return childRow;
        });
        rows.push({
            rowHeader: ['Percentiles', null],
            children: percentileChildren,
        });
    }

    const hasMultipleModes = statsResults.some(r => r.stats && Array.isArray(r.stats.Mode) && r.stats.Mode.length > 1);

    return {
        tables: [
            {
                title: 'Statistics',
                columnHeaders: columnHeaders.map(h => ({ header: h.header, key: h.key })), // Match desired output
                rows,
                ...(hasMultipleModes && { footer: '<sup>a</sup>. Multiple modes exist. The smallest value is shown.' }),
            },
        ],
    };
}; 