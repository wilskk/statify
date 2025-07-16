import type { FrequencyTable, TableColumnHeader } from '../types';

/**
 * Formats a single frequency table result into a displayable structure.
 * @param table - The frequency table result from the worker.
 * @returns A formatted table object for the frequency table.
 */
export const formatFrequencyTable = (table: FrequencyTable): any => {
    const headers: TableColumnHeader[] = [
        { header: '', key: 'rowHeader' },
        { header: '', key: 'rowHeader' },
        { header: 'Frequency', key: 'frequency' },
        { header: 'Percent', key: 'percent' },
        { header: 'Valid Percent', key: 'validPercent' },
        { header: 'Cumulative Percent', key: 'cumulativePercent' },
    ];

    const rows: any[] = [];

    // Valid rows processing
    const validChildren = table.rows.map(row => ({
        rowHeader: [null, row.label],
        frequency: row.frequency,
        percent: row.percent?.toFixed(1),
        validPercent: row.validPercent?.toFixed(1),
        cumulativePercent: row.cumulativePercent?.toFixed(1),
    }));

    const validTotalPercent = table.summary.total > 0 ? (table.summary.valid / table.summary.total * 100) : 0;

    validChildren.push({
        rowHeader: [null, 'Total'],
        frequency: table.summary.valid,
        percent: validTotalPercent.toFixed(1),
        validPercent: table.summary.valid > 0 ? '100.0' : undefined,
        cumulativePercent: undefined,
    });

    rows.push({
        rowHeader: ['Valid', null],
        children: validChildren,
    });

    // Missing rows
    if (table.summary.missing > 0) {
        const missingPercent = table.summary.total > 0 ? (table.summary.missing / table.summary.total * 100) : 0;
        rows.push({
            rowHeader: ['Missing', null],
            children: [
                {
                    rowHeader: [null, 'System'],
                    frequency: table.summary.missing,
                    percent: missingPercent.toFixed(1),
                    validPercent: null,
                    cumulativePercent: null,
                },
            ],
        });
    }

    // Grand total row
    rows.push({
        rowHeader: ['Total', null],
        frequency: table.summary.total,
        percent: table.summary.total > 0 ? '100.0' : undefined,
        validPercent: undefined,
        cumulativePercent: undefined,
    });

    return {
        tables: [
            {
                title: table.title,
                columnHeaders: headers,
                rows,
            },
        ],
    };
}; 