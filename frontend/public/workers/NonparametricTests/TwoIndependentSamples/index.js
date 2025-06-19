import { resultDescriptive } from './descriptives.js';
import { resultRanks, resultFrequencies } from './ranksFrequencies.js';
import { resultMannWhitneyU } from './testStatisticsMannWhitney.js';
import { resultKolmogorovSmirnov } from './testStatisticsKolmogorovSmirnov.js';

self.onmessage = (e) => {
    const { variableData, groupData, group1, group2, testType, displayStatistics } = e.data;
    let result = { success: true, error: null, testType, displayStatistics };

    try {
        // Convert variableData to formats expected by calculation functions
        const data = extractData(variableData);
        const variables = variableData.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label,
            type: vd.variable.type
        }));

        console.log("data", JSON.stringify(data));
        console.log("variables", JSON.stringify(variables));

        const dataGrouping = extractData(groupData);
        const groupingVariable = {
            name: groupData.variable.name,
            label: groupData.variable.label,
            type: groupData.variable.type,
            values: groupData.variable.values
        };

        console.log("dataGrouping", JSON.stringify(dataGrouping));
        console.log("groupingVariable", JSON.stringify(groupingVariable));

        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            const descriptives = resultDescriptive(data, variables, dataGrouping, groupingVariable, displayStatistics);
            result.descriptives = JSON.stringify(descriptives);
        }

        // Handle different statistical tests
        if (testType.mannWhitneyU) {
            const ranks = resultRanks(data, variables, dataGrouping, groupingVariable, group1, group2, testType);
            result.ranks = JSON.stringify(ranks);
            console.log('Mann-Whitney U Ranks:', JSON.stringify(ranks));

            const mannWhitneyU = resultMannWhitneyU(data, variables, dataGrouping, groupingVariable, group1, group2);
            result.mannWhitneyU = JSON.stringify(mannWhitneyU);
            console.log('Mann-Whitney U Test:', JSON.stringify(mannWhitneyU));
        }

        if (testType.mosesExtremeReactions) {
            // Reserved for future implementation
            // const jonckheereTerpstra = resultJonckheereTerpstra(arrays, variables, groupArrays, group1, group2);
            // result.jonckheereTerpstraTest = JSON.stringify(jonckheereTerpstra);
        }

        if (testType.kolmogorovSmirnovZ) {
            const kolmogorovSmirnovZFrequencies = resultFrequencies(data, variables, dataGrouping, groupingVariable, group1, group2, testType);
            result.kolmogorovSmirnovZFrequencies = JSON.stringify(kolmogorovSmirnovZFrequencies);
            console.log('Kolmogorov-Smirnov Z Frequencies:', JSON.stringify(kolmogorovSmirnovZFrequencies));

            const kolmogorovSmirnovZ = resultKolmogorovSmirnov(data, variables, dataGrouping, groupingVariable, group1, group2);
            result.kolmogorovSmirnovZ = JSON.stringify(kolmogorovSmirnovZ);
            console.log('Kolmogorov-Smirnov Z Test:', JSON.stringify(kolmogorovSmirnovZ));
        }

        if (testType.waldWolfowitzRuns) {
            // Reserved for future implementation
            // const median = resultMedian(arrays, variables, groupArrays, group1, group2);
            // result.medianTest = JSON.stringify(median);
        }

        self.postMessage(result);
    } catch (err) {
        self.postMessage({
            success: false,
            error: err.message || "An error occurred in the worker"
        });
    }
};

function extractData(data) {
    // Handle case when input is a single object (groupData)
    if (data && !Array.isArray(data) && data.variable && data.data) {
        const result = [];
        for (let i = 0; i < data.data.length; i++) {
            const value = data.data[i];
            // Skip empty values for single object
            if (value === "" || value === null || value === undefined) {
                continue;
            }
            result.push({
                [data.variable.name]: value,
                originalIndex: i
            });
        }
        return result;
    }
    
    // Handle case when input is an array of objects (variableData)
    if (!Array.isArray(data) || !data.length) return [];

    // Get the length of the first variable's data to determine dataset size
    let rowCount = 0;
    data.forEach(vd => {
        if (vd.data && vd.data.length > rowCount) {
            rowCount = vd.data.length;
        }
    });

    const result = [];
    for (let i = 0; i < rowCount; i++) {
        const row = {
            originalIndex: i
        };
        let allValuesEmpty = true;
        
        data.forEach(vd => {
            // Handle potentially missing or empty values
            const value = vd.data && i < vd.data.length ? vd.data[i] : "";
            
            // Use the variable name as the key
            row[vd.variable.name] = value;
            
            // Check if any value is not empty
            if (value !== "" && value !== null && value !== undefined) {
                allValuesEmpty = false;
            }
        });
        
        // Only push if not all values are empty
        if (!allValuesEmpty) {
            result.push(row);
        }
    }
    return result;
}

self.addEventListener('error', (e) => {
    console.error('Worker error:', e.message);
    self.postMessage({
        success: false,
        error: e.message || "An error occurred in the worker"
    });
});