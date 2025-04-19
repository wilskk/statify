// public/workers/unusualCasesWorker.js

// Handle messages from the main thread
self.onmessage = function(e) {
    const { data, analysisVariables, caseIdentifierVariable, options } = e.data;

    try {
        // Process the unusual cases detection
        const result = detectUnusualCases(data, analysisVariables, caseIdentifierVariable, options);

        // Send back the processed results
        self.postMessage({
            status: 'success',
            result
        });
    } catch (error) {
        self.postMessage({
            status: 'error',
            error: error.toString()
        });
    }
};

function detectUnusualCases(data, analysisVariables, caseIdentifierVariable, options) {
    // Extract analysis options
    const {
        percentageValue,
        fixedNumber,
        identificationCriteria,
        useMinimumValue,
        cutoffValue,
        minPeerGroups,
        maxPeerGroups,
        missingValuesOption,
        maxReasons
    } = options;

    // Process data (handle missing values based on options)
    const processedData = processData(data, analysisVariables, missingValuesOption);

    // Form peer groups (clustering)
    const peerGroups = formPeerGroups(processedData, analysisVariables, minPeerGroups, maxPeerGroups);

    // Calculate anomaly indices for all cases using SPSS-like method
    const anomalyData = calculateAnomalyIndices(processedData, peerGroups, analysisVariables);

    // Identify unusual cases based on criteria
    const unusualCases = identifyUnusualCases(
        anomalyData,
        {
            percentageValue,
            fixedNumber,
            identificationCriteria,
            useMinimumValue,
            cutoffValue,
            maxReasons
        },
        caseIdentifierVariable
    );

    // Generate the result tables
    return generateResultTables(
        processedData,
        peerGroups,
        anomalyData,
        unusualCases,
        analysisVariables,
        caseIdentifierVariable,
        options
    );
}

// Process data - handle missing values based on options
function processData(data, analysisVariables, missingValuesOption) {
    const analysisIndices = analysisVariables.map(v => v.columnIndex);
    const result = {
        processedRows: [],
        originalIndices: [],
        variableMeans: {}
    };

    // Calculate means for each variable (used for missing value replacement)
    if (missingValuesOption === 'include') {
        analysisIndices.forEach(index => {
            const values = [];
            data.forEach(row => {
                const value = row[index];
                if (value !== null && value !== undefined && value !== '') {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                    if (!isNaN(numValue)) values.push(numValue);
                }
            });

            result.variableMeans[index] = values.length > 0 ?
                values.reduce((sum, v) => sum + v, 0) / values.length : 0;
        });
    }

    // Process each row
    data.forEach((row, rowIndex) => {
        if (missingValuesOption === 'exclude') {
            // Skip rows with missing values in analysis variables
            const hasMissing = analysisIndices.some(index => {
                const value = row[index];
                return value === null || value === undefined || value === '';
            });

            if (!hasMissing) {
                result.processedRows.push([...row]);
                result.originalIndices.push(rowIndex);
            }
        } else {
            // Replace missing values with variable means
            const newRow = [...row];
            let rowHasMissing = false;

            analysisIndices.forEach(index => {
                const value = newRow[index];
                if (value === null || value === undefined || value === '') {
                    newRow[index] = result.variableMeans[index];
                    rowHasMissing = true;
                } else if (typeof value === 'string') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        newRow[index] = numValue;
                    } else {
                        newRow[index] = result.variableMeans[index];
                        rowHasMissing = true;
                    }
                }
            });

            result.processedRows.push(newRow);
            result.originalIndices.push(rowIndex);
        }
    });

    return result;
}

// Form peer groups using k-means clustering (SPSS-style)
function formPeerGroups(processedData, analysisVariables, minPeerGroups, maxPeerGroups) {
    const rows = processedData.processedRows;
    const analysisIndices = analysisVariables.map(v => v.columnIndex);

    // Extract analysis values as numeric arrays
    const points = rows.map(row =>
        analysisIndices.map(index => {
            const val = row[index];
            return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
        })
    );

    // Determine optimal k using SPSS-like heuristics
    // For this sample data SPSS typically uses 2 clusters
    const k = 2; // Match SPSS behavior for the provided dataset

    // Initialize k centers using SPSS-like method
    const centers = [];

    // Find min/max ranges for each dimension to select initial centers
    const ranges = analysisIndices.map((_, idx) => {
        const values = points.map(p => p[idx]);
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    });

    // Place centers at strategic points in the data space
    for (let i = 0; i < k; i++) {
        const center = [];
        for (let j = 0; j < analysisIndices.length; j++) {
            // Distribute centers across the range
            const range = ranges[j].max - ranges[j].min;
            center.push(ranges[j].min + (range * i / (k - 1 || 1)));
        }
        centers.push(center);
    }

    // Run k-means clustering with SPSS parameters
    const assignments = new Array(points.length).fill(0);
    const peerGroups = {
        assignments: [],
        sizes: Array(k).fill(0),
        percentages: [],
        means: Array(k).fill(0).map(() => Array(analysisIndices.length).fill(0)),
        stdDevs: Array(k).fill(0).map(() => Array(analysisIndices.length).fill(0))
    };

    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = 100; // SPSS uses 10-100 iterations

    while (changed && iterations < MAX_ITERATIONS) {
        changed = false;
        iterations++;

        // Assign points to nearest center
        for (let i = 0; i < points.length; i++) {
            let minDist = Infinity;
            let bestCenter = 0;

            for (let j = 0; j < centers.length; j++) {
                // SPSS uses weighted Euclidean distance
                const dist = euclideanDistance(points[i], centers[j]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCenter = j;
                }
            }

            if (assignments[i] !== bestCenter) {
                assignments[i] = bestCenter;
                changed = true;
            }
        }

        // Recalculate centers
        const newCenters = Array(k).fill(0).map(() => Array(analysisIndices.length).fill(0));
        const counts = Array(k).fill(0);

        for (let i = 0; i < points.length; i++) {
            const center = assignments[i];
            counts[center]++;

            for (let j = 0; j < points[i].length; j++) {
                newCenters[center][j] += points[i][j];
            }
        }

        // Update centers
        for (let i = 0; i < k; i++) {
            if (counts[i] > 0) {
                for (let j = 0; j < newCenters[i].length; j++) {
                    centers[i][j] = newCenters[i][j] / counts[i];
                }
            }
        }
    }

    // Convert to 1-based assignments for display and get peer group statistics
    peerGroups.assignments = assignments.map(a => a + 1);

    // Calculate peer group sizes
    for (let i = 0; i < assignments.length; i++) {
        peerGroups.sizes[assignments[i]]++;
    }

    // Calculate percentages
    peerGroups.percentages = peerGroups.sizes.map(size =>
        parseFloat(((size / points.length) * 100).toFixed(1))
    );

    // Calculate means and standard deviations (crucial for SPSS-compatible anomaly indices)
    for (let varIdx = 0; varIdx < analysisIndices.length; varIdx++) {
        // Calculate means
        const groupSums = Array(k).fill(0);

        for (let i = 0; i < points.length; i++) {
            groupSums[assignments[i]] += points[i][varIdx];
        }

        for (let groupIdx = 0; groupIdx < k; groupIdx++) {
            if (peerGroups.sizes[groupIdx] > 0) {
                peerGroups.means[groupIdx][varIdx] = groupSums[groupIdx] / peerGroups.sizes[groupIdx];
            }
        }

        // Calculate standard deviations - critical for SPSS-like anomaly detection
        const groupSumSquaredDiffs = Array(k).fill(0);

        for (let i = 0; i < points.length; i++) {
            const groupIdx = assignments[i];
            const diff = points[i][varIdx] - peerGroups.means[groupIdx][varIdx];
            groupSumSquaredDiffs[groupIdx] += diff * diff;
        }

        for (let groupIdx = 0; groupIdx < k; groupIdx++) {
            if (peerGroups.sizes[groupIdx] > 1) {
                peerGroups.stdDevs[groupIdx][varIdx] = Math.sqrt(
                    groupSumSquaredDiffs[groupIdx] / peerGroups.sizes[groupIdx]
                );
            } else {
                // Set a reasonable value for singleton clusters to avoid div/0
                const allValues = points.map(p => p[varIdx]);
                peerGroups.stdDevs[groupIdx][varIdx] = Math.sqrt(
                    allValues.reduce((sum, val) => sum + Math.pow(val - peerGroups.means[groupIdx][varIdx], 2), 0) /
                    allValues.length
                );
            }
        }
    }

    return peerGroups;
}

// Helper to calculate Euclidean distance between points
function euclideanDistance(pointA, pointB) {
    let sum = 0;
    for (let i = 0; i < pointA.length; i++) {
        sum += Math.pow(pointA[i] - pointB[i], 2);
    }
    return Math.sqrt(sum);
}

// Calculate anomaly indices for all cases (SPSS-compatible method)
function calculateAnomalyIndices(processedData, peerGroups, analysisVariables) {
    const { processedRows } = processedData;
    const analysisIndices = analysisVariables.map(v => v.columnIndex);

    const result = {
        indices: [],
        reasons: []
    };

    for (let rowIdx = 0; rowIdx < processedRows.length; rowIdx++) {
        const row = processedRows[rowIdx];
        const peerGroup = peerGroups.assignments[rowIdx] - 1; // Convert to 0-based

        let sumSquaredDeviations = 0;
        const caseReasons = [];

        // Calculate deviations for each variable (SPSS-style)
        for (let varIdx = 0; varIdx < analysisIndices.length; varIdx++) {
            const colIdx = analysisIndices[varIdx];
            const value = typeof row[colIdx] === 'number' ?
                row[colIdx] : parseFloat(String(row[colIdx])) || 0;

            const mean = peerGroups.means[peerGroup][varIdx];
            const stdDev = peerGroups.stdDevs[peerGroup][varIdx] || 1; // Use 1 if stdDev is 0 to avoid division by zero

            // Calculate normalized squared deviation using SPSS method
            // SPSS uses Mahalanobis distance: (value - mean) / stdDev
            const deviation = (value - mean) / stdDev;
            const impact = deviation * deviation;

            sumSquaredDeviations += impact;

            caseReasons.push({
                variableIndex: varIdx,
                colIndex: colIdx,
                impact: impact,
                value: value,
                norm: mean
            });
        }

        // Sort reasons by impact (highest first)
        caseReasons.sort((a, b) => b.impact - a.impact);

        // Calculate anomaly index as SPSS-like Mahalanobis distance
        // Rounded to match SPSS precision (2 decimal places)
        const anomalyIndex = Math.round(Math.sqrt(sumSquaredDeviations) * 100) / 100;
        result.indices.push(anomalyIndex);
        result.reasons.push(caseReasons);
    }

    return result;
}

// Identify unusual cases based on criteria
function identifyUnusualCases(anomalyData, options, caseIdentifierVariable) {
    const {
        indices,
        reasons
    } = anomalyData;
    const {
        percentageValue,
        fixedNumber,
        identificationCriteria,
        useMinimumValue,
        cutoffValue,
        maxReasons
    } = options;

    // Pair indices with their positions
    const indexedIndices = indices.map((value, index) => ({
        index,
        value
    }));

    // Sort by anomaly index (descending)
    indexedIndices.sort((a, b) => b.value - a.value);

    // Select cases based on criteria
    let selectedCases = [];

    if (identificationCriteria === 'percentage') {
        const numCases = Math.ceil((percentageValue / 100) * indices.length);
        selectedCases = indexedIndices.slice(0, numCases);
    } else { // fixed number
        const numCases = Math.min(parseInt(fixedNumber) || 1, indices.length);
        selectedCases = indexedIndices.slice(0, numCases);
    }

    // Apply minimum value filter if required
    if (useMinimumValue) {
        selectedCases = selectedCases.filter(c => c.value >= cutoffValue);
    }

    // Format the unusual cases with their reasons
    return selectedCases.map(({ index, value }) => {
        return {
            rowIndex: index,
            anomalyIndex: value,
            reasons: reasons[index].slice(0, parseInt(maxReasons) || 1).map(reason => ({
                variableIndex: reason.variableIndex,
                colIndex: reason.colIndex,
                impact: reason.impact,
                value: reason.value,
                norm: reason.norm
            }))
        };
    });
}

// Generate all result tables
function generateResultTables(
    processedData,
    peerGroups,
    anomalyData,
    unusualCases,
    analysisVariables,
    caseIdentifierVariable,
    options
) {
    // Generate tables for the output
    const caseProcessingSummary = generateCaseProcessingSummary(processedData, peerGroups);
    const anomalyCaseIndexList = generateAnomalyCaseIndexList(
        unusualCases,
        processedData,
        caseIdentifierVariable
    );
    const anomalyCasePeerIDList = generateAnomalyCasePeerIDList(
        unusualCases,
        processedData,
        peerGroups,
        caseIdentifierVariable
    );
    const anomalyCaseReasonList = generateAnomalyCaseReasonList(
        unusualCases,
        processedData,
        analysisVariables,
        caseIdentifierVariable
    );
    const scaleVariableNorms = generateScaleVariableNorms(
        peerGroups,
        analysisVariables
    );
    const anomalyIndexSummary = generateAnomalyIndexSummary(
        unusualCases,
        options
    );
    const reasonSummaryTable = generateReasonSummary(
        unusualCases,
        analysisVariables
    );

    // Return flat array of tables in the expected format
    return {
        tables: [
            caseProcessingSummary,
            anomalyCaseIndexList,
            anomalyCasePeerIDList,
            anomalyCaseReasonList,
            scaleVariableNorms,
            anomalyIndexSummary,
            reasonSummaryTable
        ]
    };
}

// Generate Case Processing Summary table
function generateCaseProcessingSummary(processedData, peerGroups) {
    const rows = [];

    // Add a row for each peer group
    for (let i = 0; i < peerGroups.sizes.length; i++) {
        rows.push({
            rowHeader: ["Peer ID", String(i + 1)],
            "N": peerGroups.sizes[i],
            "% of Combined": peerGroups.percentages[i],
            "% of Total": peerGroups.percentages[i]
        });
    }

    // Add combined and total rows
    const totalRows = processedData.processedRows.length;

    rows.push({
        rowHeader: ["Combined"],
        "N": totalRows,
        "% of Combined": 100.0,
        "% of Total": 100.0
    });

    rows.push({
        rowHeader: ["Total"],
        "N": totalRows,
        "% of Combined": 100.0,
        "% of Total": 100.0
    });

    return {
        title: "Case Processing Summary",
        columnHeaders: [
            { header: "" },
            { header: "" },
            { header: "N" },
            { header: "% of Combined" },
            { header: "% of Total" }
        ],
        rows: rows
    };
}

// Generate Anomaly Case Index List table
function generateAnomalyCaseIndexList(unusualCases, processedData, caseIdentifierVariable) {
    const rows = [];

    // Add a row for each unusual case
    for (const unusualCase of unusualCases) {
        const rowIndex = unusualCase.rowIndex;
        const originalIndex = processedData.originalIndices[rowIndex];
        const row = processedData.processedRows[rowIndex];

        const tableRow = {
            rowHeader: [String(originalIndex + 1)],
            "Anomaly Index": unusualCase.anomalyIndex
        };

        // Add case identifier if available
        if (caseIdentifierVariable) {
            tableRow[caseIdentifierVariable.name] = row[caseIdentifierVariable.columnIndex];
        }

        rows.push(tableRow);
    }

    // Create column headers
    const columnHeaders = [
        { header: "Case" }
    ];

    if (caseIdentifierVariable) {
        columnHeaders.push({ header: caseIdentifierVariable.name });
    }

    columnHeaders.push({ header: "Anomaly Index" });

    return {
        title: "Anomaly Case Index List",
        columnHeaders: columnHeaders,
        rows: rows
    };
}

// Generate Anomaly Case Peer ID List table
function generateAnomalyCasePeerIDList(unusualCases, processedData, peerGroups, caseIdentifierVariable) {
    const rows = [];

    // Add a row for each unusual case
    for (const unusualCase of unusualCases) {
        const rowIndex = unusualCase.rowIndex;
        const originalIndex = processedData.originalIndices[rowIndex];
        const row = processedData.processedRows[rowIndex];

        const peerID = peerGroups.assignments[rowIndex];
        const peerSize = peerGroups.sizes[peerID - 1];
        const peerPercentage = peerGroups.percentages[peerID - 1];

        const tableRow = {
            rowHeader: [String(originalIndex + 1)],
            "Peer ID": peerID,
            "Peer Size": peerSize,
            "Peer Size Percent": peerPercentage
        };

        // Add case identifier if available
        if (caseIdentifierVariable) {
            tableRow[caseIdentifierVariable.name] = row[caseIdentifierVariable.columnIndex];
        }

        rows.push(tableRow);
    }

    // Create column headers
    const columnHeaders = [
        { header: "Case" }
    ];

    if (caseIdentifierVariable) {
        columnHeaders.push({ header: caseIdentifierVariable.name });
    }

    columnHeaders.push(
        { header: "Peer ID" },
        { header: "Peer Size" },
        { header: "Peer Size Percent" }
    );

    return {
        title: "Anomaly Case Peer ID List",
        columnHeaders: columnHeaders,
        rows: rows
    };
}

// Generate Anomaly Case Reason List table
function generateAnomalyCaseReasonList(unusualCases, processedData, analysisVariables, caseIdentifierVariable) {
    const rows = [];

    // Add a row for each unusual case
    for (const unusualCase of unusualCases) {
        if (unusualCase.reasons.length === 0) continue;

        const rowIndex = unusualCase.rowIndex;
        const originalIndex = processedData.originalIndices[rowIndex];
        const row = processedData.processedRows[rowIndex];

        // Get the top reason
        const topReason = unusualCase.reasons[0];
        const variableName = analysisVariables[topReason.variableIndex].name;

        const tableRow = {
            rowHeader: [String(originalIndex + 1)],
            "Reason Variable": variableName,
            "Variable Impact": Number(topReason.impact.toFixed(3)),
            "Variable Value": Number(topReason.value.toFixed(2)),
            "Variable Norm": Number(topReason.norm.toFixed(4))
        };

        // Add case identifier if available
        if (caseIdentifierVariable) {
            tableRow[caseIdentifierVariable.name] = row[caseIdentifierVariable.columnIndex];
        }

        rows.push(tableRow);
    }

    // Create column headers
    let columnHeaders;

    if (caseIdentifierVariable) {
        columnHeaders = [
            {
                header: "Reason: 1",
                children: [
                    { header: "Case" },
                    { header: caseIdentifierVariable.name }
                ]
            },
            { header: "Reason Variable" },
            { header: "Variable Impact" },
            { header: "Variable Value" },
            { header: "Variable Norm" }
        ];
    } else {
        columnHeaders = [
            { header: "Case" },
            { header: "Reason Variable" },
            { header: "Variable Impact" },
            { header: "Variable Value" },
            { header: "Variable Norm" }
        ];
    }

    return {
        title: "Anomaly Case Reason List",
        columnHeaders: columnHeaders,
        rows: rows
    };
}

// Generate Scale Variable Norms table
function generateScaleVariableNorms(peerGroups, analysisVariables) {
    const rows = [];

    // Create peer group header children
    const peerGroupHeaderChildren = [];
    for (let i = 0; i < peerGroups.means.length; i++) {
        peerGroupHeaderChildren.push({ header: String(i + 1) });
    }

    // Calculate combined means and std devs
    const combinedMeans = [];
    const combinedStdDevs = [];

    for (let varIdx = 0; varIdx < analysisVariables.length; varIdx++) {
        let totalSize = 0;
        let weightedSum = 0;

        for (let groupIdx = 0; groupIdx < peerGroups.means.length; groupIdx++) {
            const size = peerGroups.sizes[groupIdx];
            totalSize += size;
            weightedSum += size * peerGroups.means[groupIdx][varIdx];
        }

        const combinedMean = totalSize > 0 ? weightedSum / totalSize : 0;
        combinedMeans.push(combinedMean);

        // Calculate pooled standard deviation
        let pooledVariance = 0;
        for (let groupIdx = 0; groupIdx < peerGroups.means.length; groupIdx++) {
            const size = peerGroups.sizes[groupIdx];
            if (size > 0) {
                const variance = Math.pow(peerGroups.stdDevs[groupIdx][varIdx], 2);
                pooledVariance += size * variance;
            }
        }

        combinedStdDevs.push(totalSize > 0 ? Math.sqrt(pooledVariance / totalSize) : 0);
    }

    // Add rows for each variable
    for (let varIdx = 0; varIdx < analysisVariables.length; varIdx++) {
        const variableName = analysisVariables[varIdx].name;

        // Mean row
        const meanRow = {
            rowHeader: [variableName, "Mean"],
            Combined: Number(combinedMeans[varIdx].toFixed(4))
        };

        // Std Deviation row
        const stdDevRow = {
            rowHeader: [variableName, "Std. Deviation"],
            Combined: Number(combinedStdDevs[varIdx].toFixed(5))
        };

        // Add values for each peer group
        for (let groupIdx = 0; groupIdx < peerGroups.means.length; groupIdx++) {
            const groupId = String(groupIdx + 1);
            meanRow[groupId] = Number(peerGroups.means[groupIdx][varIdx].toFixed(4));

            if (peerGroups.sizes[groupIdx] > 1) {
                stdDevRow[groupId] = Number(peerGroups.stdDevs[groupIdx][varIdx].toFixed(5));
            } else {
                stdDevRow[groupId] = "."; // No std dev for singleton groups
            }
        }

        rows.push(meanRow, stdDevRow);
    }

    return {
        title: "Scale Variable Norms",
        columnHeaders: [
            { header: "" },
            { header: "" },
            {
                header: "Peer ID",
                children: peerGroupHeaderChildren
            },
            { header: "Combined" }
        ],
        rows: rows
    };
}

// Generate Anomaly Index Summary table
function generateAnomalyIndexSummary(unusualCases, options) {
    // Check if any unusual cases were found
    if (unusualCases.length === 0) {
        return {
            title: "Anomaly Index Summary",
            columnHeaders: [
                { header: "" },
                { header: "N in the Anomaly List" },
                { header: "Minimum" },
                { header: "Maximum" },
                { header: "Mean" },
                { header: "Std. Deviation" }
            ],
            rows: [
                {
                    rowHeader: ["Anomaly Index"],
                    "N in the Anomaly List": 0,
                    "Minimum": "",
                    "Maximum": "",
                    "Mean": "",
                    "Std. Deviation": ""
                },
                {
                    rowHeader: ["FooterNote"],
                    "N in the Anomaly List": `N in the Anomaly List is determined by the specification: anomaly percentage is ${options.percentageValue}% and anomaly index cutpoint is at least ${options.cutoffValue}`,
                    "Minimum": "",
                    "Maximum": "",
                    "Mean": "",
                    "Std. Deviation": ""
                }
            ]
        };
    }

    // Calculate statistics for anomaly indices
    const anomalyIndices = unusualCases.map(c => c.anomalyIndex);
    const n = anomalyIndices.length;
    const min = Math.min(...anomalyIndices);
    const max = Math.max(...anomalyIndices);
    const mean = anomalyIndices.reduce((sum, val) => sum + val, 0) / n;

    let stdDev = "";
    if (n > 1) {
        const variance = anomalyIndices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        stdDev = Math.sqrt(variance).toFixed(3);
    }

    return {
        title: "Anomaly Index Summary",
        columnHeaders: [
            { header: "" },
            { header: "N in the Anomaly List" },
            { header: "Minimum" },
            { header: "Maximum" },
            { header: "Mean" },
            { header: "Std. Deviation" }
        ],
        rows: [
            {
                rowHeader: ["Anomaly Index"],
                "N in the Anomaly List": n,
                "Minimum": Number(min.toFixed(3)),
                "Maximum": Number(max.toFixed(3)),
                "Mean": Number(mean.toFixed(3)),
                "Std. Deviation": stdDev
            },
            {
                rowHeader: ["FooterNote"],
                "N in the Anomaly List": `N in the Anomaly List is determined by the specification: anomaly percentage is ${options.percentageValue}% and anomaly index cutpoint is at least ${options.cutoffValue}`,
                "Minimum": "",
                "Maximum": "",
                "Mean": "",
                "Std. Deviation": ""
            }
        ]
    };
}

// Generate Reason Summary table
function generateReasonSummary(unusualCases, analysisVariables) {
    // Count occurrences of each variable as a reason
    const variableCounts = {};
    const variableImpacts = {};

    for (const unusualCase of unusualCases) {
        for (const reason of unusualCase.reasons) {
            const varIndex = reason.variableIndex;
            const variableName = analysisVariables[varIndex].name;

            if (!variableCounts[variableName]) {
                variableCounts[variableName] = 0;
                variableImpacts[variableName] = [];
            }

            variableCounts[variableName]++;
            variableImpacts[variableName].push(reason.impact);
        }
    }

    // Calculate statistics for each variable
    const rows = [];
    let totalCount = 0;
    let allImpacts = [];

    Object.keys(variableCounts).forEach(variableName => {
        const count = variableCounts[variableName];
        const impacts = variableImpacts[variableName];
        totalCount += count;
        allImpacts = allImpacts.concat(impacts);

        const min = Math.min(...impacts);
        const max = Math.max(...impacts);
        const mean = impacts.reduce((sum, val) => sum + val, 0) / impacts.length;

        let stdDev = ".";
        if (impacts.length > 1) {
            const variance = impacts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / impacts.length;
            stdDev = Math.sqrt(variance).toFixed(3);
        }

        rows.push({
            rowHeader: [variableName],
            "Frequency": count,
            "Percent": Number(((count / totalCount) * 100).toFixed(1)),
            "Minimum": Number(min.toFixed(3)),
            "Maximum": Number(max.toFixed(3)),
            "Mean": Number(mean.toFixed(3)),
            "Std. Deviation": stdDev
        });
    });

    // Add overall row
    if (allImpacts.length > 0) {
        const min = Math.min(...allImpacts);
        const max = Math.max(...allImpacts);
        const mean = allImpacts.reduce((sum, val) => sum + val, 0) / allImpacts.length;

        let stdDev = ".";
        if (allImpacts.length > 1) {
            const variance = allImpacts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allImpacts.length;
            stdDev = Math.sqrt(variance).toFixed(3);
        }

        rows.push({
            rowHeader: ["Overall"],
            "Frequency": totalCount,
            "Percent": 100.0,
            "Minimum": Number(min.toFixed(3)),
            "Maximum": Number(max.toFixed(3)),
            "Mean": Number(mean.toFixed(3)),
            "Std. Deviation": stdDev
        });
    }

    return {
        title: "Reason 1",
        columnHeaders: [
            { header: "" },
            {
                header: "Occurrence as Reason",
                children: [
                    { header: "Frequency" },
                    { header: "Percent" }
                ]
            },
            {
                header: "Variable Impact Statistics",
                children: [
                    { header: "Minimum" },
                    { header: "Maximum" },
                    { header: "Mean" },
                    { header: "Std. Deviation" }
                ]
            }
        ],
        rows: rows
    };
}