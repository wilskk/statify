import { resultStatistics } from './statistics.js';
import { resultCorrelations } from './correlations.js';
import { resultTest } from './test.js';

self.onmessage = (e) => {
    const { variableData1, variableData2, calculateStandardizer, estimateEffectSize } = e.data;
    let result = { success: true, error: null};

    try {
        // Convert variableData to formats expected by calculation functions
        const data1 = extractData(variableData1);
        const variables1 = variableData1.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label,
            type: vd.variable.type
        }));

        console.log("data1", JSON.stringify(data1));
        console.log("variables1", JSON.stringify(variables1));

        const data2 = extractData(variableData2);
        const variables2 = variableData2.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label,
            type: vd.variable.type
        }));

        // Handle different statistical tests
        const statistics = resultStatistics(data1, variables1, data2, variables2);
        result.statistics = JSON.stringify(statistics);
        console.log('Statistics:', JSON.stringify(statistics));

        const correlations = resultCorrelations(data1, variables1, data2, variables2);
        result.correlations = JSON.stringify(correlations);
        console.log('Correlations:', JSON.stringify(correlations));

        const test = resultTest(data1, variables1, data2, variables2);
        result.test = JSON.stringify(test);
        console.log('Test:', JSON.stringify(test));

        // if (estimateEffectSize) {
        //     const effectSize = resultEffectSize(data1, variables1, data2, variables2, calculateStandardizer);
        //     result.effectSize = JSON.stringify(effectSize);
        // }

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