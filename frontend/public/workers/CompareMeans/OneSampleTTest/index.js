// Worker for One-Sample T-Test calculation

// Import dependencies with error handling
try {
    self.importScripts('./statistics.js', './test.js');
} catch (e) {
    console.error("Worker importScripts failed:", e);
    // Send error message if import fails & stop worker
    self.postMessage({ 
        success: false, 
        error: `Failed to load dependency scripts: ${e.message}${e.stack ? '\nStack: ' + e.stack : ''}` 
    });
    throw e;
}

self.onmessage = function(e) {
    try {
        // Destructure data from the message
        const { action, variableData, testValue, estimateEffectSize } = e.data;
        
        // Validate action type
        if (action !== 'CALCULATE_ONE_SAMPLE_T_TEST') {
            throw new Error(`Unknown action: ${action}`);
        }
        
        // Convert variableData to formats expected by calculation functions
        const data = extractData(variableData);
        const variables = variableData.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label || vd.variable.name,
            type: vd.variable.type,
            decimals: vd.variable.decimals || 2
        }));

        // Calculate statistics
        const statistics = self.resultStatistics(data, variables);
        
        // Calculate test results
        const test = self.resultTest(data, variables, testValue);
        
        // Send successful result back to main thread
        self.postMessage({
            success: true,
            statistics: {
                title: "One-Sample Statistics",
                output_data: JSON.stringify(statistics),
                components: "OneSampleStatisticsTable",
                description: `One-Sample T-Test statistics for ${variables.map(v => v.name).join(', ')}`
            },
            test: {
                title: "One-Sample Test",
                output_data: JSON.stringify(test),
                components: "OneSampleTestTable",
                description: `One-Sample T-Test results with test value = ${testValue}`
            }
        });
    } catch (err) {
        console.error("Worker error:", err);
        self.postMessage({
            success: false,
            error: err.message || "An error occurred in the worker"
        });
    }
};

/**
 * Extract and format data from variable data objects
 * @param {Array} data - Array of variable data objects
 * @returns {Array} - Formatted data array
 */
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

// Add error event listener
self.addEventListener('error', (e) => {
    console.error('Worker error:', e.message);
    self.postMessage({
        success: false,
        error: e.message || "An error occurred in the worker"
    });
});