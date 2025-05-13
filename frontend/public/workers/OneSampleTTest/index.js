import { resultStatistics } from './statistics.js';
import { resultTest } from './test.js';

self.onmessage = (e) => {
    const { variableData, testValue, estimateEffectSize } = e.data;
    let result = { success: true, error: null };

    try {
        // Convert variableData to formats expected by calculation functions
        const data = extractData(variableData);
        const variables = variableData.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label,
            type: vd.variable.type,
            decimals: vd.variable.decimals
        }));

        console.log("data", JSON.stringify(data));
        console.log("variables", JSON.stringify(variables));

        const statistics = resultStatistics(data, variables);
        result.statistics = JSON.stringify(statistics);

        const test = resultTest(data, variables, testValue);
        result.test = JSON.stringify(test);

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
                [data.variable.name]: value
            });
        }
        return result;
    }
    
    // Handle case when input is an array of objects (variableData)
    if (!Array.isArray(data) || !data.length) return [];

    // Get the length of the first variable's data to determine dataset size
    const rowCount = Math.max(...data.map(vd => vd.data?.length || 0));
    const result = [];
    for (let i = 0; i < rowCount; i++) {
        const row = {};
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