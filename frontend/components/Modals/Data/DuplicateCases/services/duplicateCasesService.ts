import { Variable } from "@/types/Variable";

interface ProcessDuplicatesArgs {
    data: any[][];
    matchingVariables: Partial<Variable>[];
    sortingVariables: Partial<Variable>[];
    sortOrder: "ascending" | "descending";
    primaryCaseIndicator: "first" | "last";
}

interface ProcessedResult {
    primaryValues: number[];
    sequenceValues: number[];
    reorderedData: any[][] | null;
}

/**
 * Identifies duplicate cases based on a set of matching variables, with options for sorting.
 */
export function processDuplicates({
    data,
    matchingVariables,
    sortingVariables,
    sortOrder,
    primaryCaseIndicator,
}: ProcessDuplicatesArgs): ProcessedResult {
    if (data.length < 2) {
        return { primaryValues: [], sequenceValues: [], reorderedData: data };
    }

    const headers = data[0];
    const dataRows = data.slice(1);

    const matchingIndices = matchingVariables.map(v => v.columnIndex!);
    const sortingIndices = sortingVariables.map(v => v.columnIndex!);

    const duplicateGroups = new Map<string, { rowIndex: number; row: any[] }[]>();

    dataRows.forEach((row, rowIndex) => {
        const key = matchingIndices.map(idx => row[idx]).join('|');
        if (!duplicateGroups.has(key)) {
            duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key)!.push({ rowIndex, row });
    });

    if (sortingIndices.length > 0) {
        duplicateGroups.forEach(group => {
            group.sort((a, b) => {
                for (const idx of sortingIndices) {
                    const aVal = a.row[idx];
                    const bVal = b.row[idx];
                    const aNum = !isNaN(parseFloat(aVal)) ? parseFloat(aVal) : aVal;
                    const bNum = !isNaN(parseFloat(bVal)) ? parseFloat(bVal) : bVal;
                    if (aNum !== bNum) {
                        return sortOrder === "ascending"
                            ? (aNum < bNum ? -1 : 1)
                            : (aNum > bNum ? -1 : 1);
                    }
                }
                return 0;
            });
        });
    }

    const primaryValues = new Array(dataRows.length).fill(0);
    const sequenceValues = new Array(dataRows.length).fill(0);
    const matchingRowIndices = new Set<number>();

    duplicateGroups.forEach(group => {
        if (group.length > 1) {
            const primaryIndexInGroup = primaryCaseIndicator === "first" ? 0 : group.length - 1;
            const primaryRowIndex = group[primaryIndexInGroup].rowIndex;
            primaryValues[primaryRowIndex] = 1;

            group.forEach((item, i) => {
                sequenceValues[item.rowIndex] = i + 1;
                matchingRowIndices.add(item.rowIndex);
            });
        } else {
            const uniqueRowIndex = group[0].rowIndex;
            primaryValues[uniqueRowIndex] = 1; // Also mark unique as primary
            sequenceValues[uniqueRowIndex] = 0; // 0 for non-matching
        }
    });

    const duplicateRows = dataRows.filter((_, rowIndex) => matchingRowIndices.has(rowIndex));
    const uniqueRows = dataRows.filter((_, rowIndex) => !matchingRowIndices.has(rowIndex));
    const reorderedData = [headers, ...duplicateRows, ...uniqueRows];
    
    return {
        primaryValues,
        sequenceValues,
        reorderedData,
    };
}

export interface Statistic {
    title: string;
    description: string;
    component: string;
    output_data: {
        rows: {
            label: string;
            value: string;
            count: number;
            percent: string;
        }[];
        headers: string[];
    };
}

interface GenerateStatisticsArgs {
    primaryValues: number[];
    sequenceValues: number[];
    primaryName: string;
    sequentialCount: boolean;
    sequentialName: string;
}

export function generateStatistics({
    primaryValues,
    sequenceValues,
    primaryName,
    sequentialCount,
    sequentialName,
}: GenerateStatisticsArgs): Statistic[] {
    const statistics: Statistic[] = [];

    if (primaryValues.length === 0) return [];

    const primaryCount = primaryValues.filter(v => v === 1).length;
    const duplicateCount = primaryValues.length - primaryCount;

    statistics.push({
        title: `Frequency Table: ${primaryName}`,
        description: "Frequency distribution of primary and duplicate cases",
        component: "FrequencyTable",
        output_data: {
            rows: [
                { label: "Duplicate case", value: "0", count: duplicateCount, percent: (duplicateCount / primaryValues.length * 100).toFixed(1) },
                { label: "Primary case", value: "1", count: primaryCount, percent: (primaryCount / primaryValues.length * 100).toFixed(1) },
                { label: "Total", value: "", count: primaryValues.length, percent: "100.0" }      
            ],
            headers: ["Category", "Value", "Count", "Percent"]
        }
    });

    if (sequentialCount) {
        const sequenceCounts: { [key: number]: number } = {};
        sequenceValues.forEach(val => {
            sequenceCounts[val] = (sequenceCounts[val] || 0) + 1;
        });

        const sequenceRows = Object.keys(sequenceCounts)
            .map(Number)
            .sort((a, b) => a - b)
            .map(key => {
                const count = sequenceCounts[key];
                return {
                    label: key === 0 ? "Non-matching case" : `Sequence ${key}`,
                    value: String(key),
                    count: count,
                    percent: (count / sequenceValues.length * 100).toFixed(1)
                };
            });

        sequenceRows.push({
            label: "Total",
            value: "",
            count: sequenceValues.length,
            percent: "100.0"
        });

        statistics.push({
            title: `Frequency Table: ${sequentialName}`,
            description: "Frequency distribution of case sequence numbers",
            component: "FrequencyTable",
            output_data: {
                rows: sequenceRows,
                headers: ["Sequence", "Value", "Count", "Percent"]
            }
        });
    }

    return statistics;
} 