// public/workers/duplicateCases.worker.js

// This worker processes duplicate cases and generates statistics
self.onmessage = function(e) {
    const {
        data,                // The dataset to analyze (array of arrays)
        matchingVariables,   // Variables used to identify duplicates
        sortingVariables,    // Variables used to sort within groups
        sortOrder,           // "ascending" or "descending"
        primaryCaseIndicator, // "first" or "last"
        primaryName,         // Name for primary indicator variable
        sequentialCount,     // Boolean - create sequential counter?
        sequentialName,      // Name for sequential counter variable
        moveMatchingToTop,   // Boolean - reorder data?
        displayFrequencies   // Boolean - display frequency tables?
    } = e.data;

    try {
        // Process the duplicate cases
        const result = processDuplicates({
            data,
            matchingVariables,
            sortingVariables,
            sortOrder,
            primaryCaseIndicator,
            primaryName,
            sequentialCount,
            sequentialName,
            moveMatchingToTop
        });

        // Generate statistics output
        const statistics = generateStatistics(result, {
            primaryName,
            sequentialName,
            sequentialCount,
            displayFrequencies,
            primaryCaseIndicator
        });

        // Send results back to main thread
        self.postMessage({
            success: true,
            result: result,
            statistics: statistics
        });
    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message
        });
    }
};

// Process the duplicate cases
function processDuplicates(params) {
    const {
        data,
        matchingVariables,
        sortingVariables,
        sortOrder,
        primaryCaseIndicator,
        sequentialCount
    } = params;

    // Step 1: Group records by matching variables
    const groups = {};
    let totalDuplicates = 0;

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        const keyParts = [];

        // Create composite key from all matching variables
        for (const variable of matchingVariables) {
            const colIndex = variable.columnIndex;
            keyParts.push(row[colIndex] || "");
        }

        const key = JSON.stringify(keyParts);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(rowIndex);
    }

    // Step 2: Sort groups if sorting variables provided
    for (const key in groups) {
        if (groups[key].length > 1) {
            totalDuplicates += groups[key].length - 1;
        }

        if (sortingVariables.length > 0) {
            groups[key].sort((rowIdxA, rowIdxB) => {
                for (const sortVar of sortingVariables) {
                    const colIndex = sortVar.columnIndex;
                    const valueA = data[rowIdxA][colIndex] || "";
                    const valueB = data[rowIdxB][colIndex] || "";

                    // Handle numeric comparison
                    if (typeof valueA === 'number' && typeof valueB === 'number') {
                        const diff = sortOrder === "ascending" ? valueA - valueB : valueB - valueA;
                        if (diff !== 0) return diff;
                    }
                    // String comparison
                    else {
                        const strA = String(valueA).toLowerCase();
                        const strB = String(valueB).toLowerCase();
                        const compare = strA.localeCompare(strB);
                        if (compare !== 0) return sortOrder === "ascending" ? compare : -compare;
                    }
                }
                return 0;
            });
        }
    }

    // Step 3: Create reordered data if needed
    let reorderedData = [...data];
    let rowMapping = {};
    let newGroups = {...groups};

    if (params.moveMatchingToTop) {
        const duplicateRows = [];
        const nonDuplicateRows = [];

        for (const key in groups) {
            const groupRows = groups[key];
            if (groupRows.length > 1) {
                duplicateRows.push(...groupRows);
            } else {
                nonDuplicateRows.push(groupRows[0]);
            }
        }

        const newRowOrder = [...duplicateRows, ...nonDuplicateRows];
        reorderedData = newRowOrder.map(idx => data[idx]);

        // Create mapping from old indices to new indices
        for (let i = 0; i < newRowOrder.length; i++) {
            rowMapping[newRowOrder[i]] = i;
        }

        // Update groups with new indices
        newGroups = {};
        for (const key in groups) {
            newGroups[key] = groups[key].map(oldIdx => rowMapping[oldIdx]);
        }
    } else {
        // If not reordering, create 1:1 mapping
        for (let i = 0; i < data.length; i++) {
            rowMapping[i] = i;
        }
    }

    // Step 4: Create indicator variables
    const primaryValues = Array(reorderedData.length).fill(0);
    const sequenceValues = Array(reorderedData.length).fill(0);

    for (const key in newGroups) {
        const group = newGroups[key];
        if (group.length > 0) {
            // Set primary indicator
            const primaryIndex = primaryCaseIndicator === "last" ? group.length - 1 : 0;
            primaryValues[group[primaryIndex]] = 1;

            // Create sequence values if needed
            if (sequentialCount) {
                for (let i = 0; i < group.length; i++) {
                    sequenceValues[group[i]] = i + 1;
                }
            }
        }
    }

    // Count frequencies for primary indicator
    const primaryFrequencies = {
        0: 0, // Duplicates
        1: 0  // Primary cases
    };

    for (const value of primaryValues) {
        primaryFrequencies[value]++;
    }

    // Count frequencies for sequential counter if needed
    const sequenceFrequencies = {};

    if (sequentialCount) {
        for (const value of sequenceValues) {
            if (!sequenceFrequencies[value]) {
                sequenceFrequencies[value] = 0;
            }
            sequenceFrequencies[value]++;
        }
    }

    return {
        reorderedData,
        primaryValues,
        sequenceValues,
        primaryFrequencies,
        sequenceFrequencies,
        totalDuplicates,
        totalGroups: Object.keys(newGroups).filter(key => newGroups[key].length > 1).length,
        groups: newGroups
    };
}

// Generate statistics output for display
function generateStatistics(result, options) {
    const {
        primaryName,
        sequentialName,
        sequentialCount,
        displayFrequencies,
        primaryCaseIndicator
    } = options;

    const {
        primaryFrequencies,
        sequenceFrequencies
    } = result;

    const totalCases = result.primaryValues.length;

    // Create statistics output
    const statistics = [];

    // TABLE 1: Basic statistics
    const statsTable = {
        "title": "Statistics",
        "columnHeaders": [
            { "header": "" },
            { "header": `Indicator of each ${primaryCaseIndicator} matching case as Primary` },
            { "header": "Sequential count of matching cases" }
        ],
        "rows": [
            {
                "rowHeader": ["N", "Valid"],
                [`Indicator of each ${primaryCaseIndicator} matching case as Primary`]: totalCases,
                "Sequential count of matching cases": totalCases
            },
            {
                "rowHeader": ["N", "Missing"],
                [`Indicator of each ${primaryCaseIndicator} matching case as Primary`]: 0,
                "Sequential count of matching cases": 0
            }
        ]
    };

    statistics.push({
        title: "Basic Statistics",
        component: "table",
        output_data: JSON.stringify({ tables: [statsTable] }),
        description: "Basic statistics for created variables"
    });

    // TABLE 2: Primary indicator frequencies
    if (displayFrequencies) {
        const primaryTable = {
            "title": `${primaryName}`,
            "columnHeaders": [
                { "header": "" },
                { "header": "" },
                { "header": "Frequency" },
                { "header": "Percent" },
                { "header": "Valid Percent", "key": "ValidPercent" },
                { "header": "Cumulative Percent", "key": "CumulativePercent" }
            ],
            "rows": [
                {
                    "rowHeader": ["Valid"],
                    "children": [
                        {
                            "rowHeader": [null, "Duplicate Case"],
                            "Frequency": primaryFrequencies[0],
                            "Percent": Number(((primaryFrequencies[0] / totalCases) * 100).toFixed(1)),
                            "ValidPercent": Number(((primaryFrequencies[0] / totalCases) * 100).toFixed(1)),
                            "CumulativePercent": Number(((primaryFrequencies[0] / totalCases) * 100).toFixed(1))
                        },
                        {
                            "rowHeader": [null, "Primary Case"],
                            "Frequency": primaryFrequencies[1],
                            "Percent": Number(((primaryFrequencies[1] / totalCases) * 100).toFixed(1)),
                            "ValidPercent": Number(((primaryFrequencies[1] / totalCases) * 100).toFixed(1)),
                            "CumulativePercent": 100.0
                        },
                        {
                            "rowHeader": [null, "Total"],
                            "Frequency": totalCases,
                            "Percent": 100.0,
                            "ValidPercent": 100.0,
                            "CumulativePercent": ""
                        }
                    ]
                }
            ]
        };

        statistics.push({
            title: "Primary Case Indicator",
            component: "table",
            output_data: JSON.stringify({ tables: [primaryTable] }),
            description: "Frequency distribution of primary case indicator variable"
        });
    }

    // TABLE 3: Sequential counter frequencies
    if (displayFrequencies && sequentialCount) {
        // Get all sequence values and sort them
        const sequenceKeys = Object.keys(sequenceFrequencies)
            .map(Number)
            .sort((a, b) => a - b);

        const sequenceRows = [];
        let cumulativePercent = 0;

        for (const value of sequenceKeys) {
            const frequency = sequenceFrequencies[value];
            const percent = Number(((frequency / totalCases) * 100).toFixed(1));
            cumulativePercent += percent;

            sequenceRows.push({
                "rowHeader": [null, String(value)],
                "Frequency": frequency,
                "Percent": percent,
                "ValidPercent": percent,
                "CumulativePercent": Number(cumulativePercent.toFixed(1))
            });
        }

        // Add total row
        sequenceRows.push({
            "rowHeader": [null, "Total"],
            "Frequency": totalCases,
            "Percent": 100.0,
            "ValidPercent": 100.0,
            "CumulativePercent": ""
        });

        const sequenceTable = {
            "title": sequentialName,
            "columnHeaders": [
                { "header": "" },
                { "header": "" },
                { "header": "Frequency" },
                { "header": "Percent" },
                { "header": "Valid Percent", "key": "ValidPercent" },
                { "header": "Cumulative Percent", "key": "CumulativePercent" }
            ],
            "rows": [
                {
                    "rowHeader": ["Valid"],
                    "children": sequenceRows
                }
            ]
        };

        statistics.push({
            title: "Sequential Count",
            component: "table",
            output_data: JSON.stringify({ tables: [sequenceTable] }),
            description: "Frequency distribution of sequential count variable"
        });
    }

    return statistics;
}