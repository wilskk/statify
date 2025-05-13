import { resultDescriptive } from './descriptives.js';
import { resultFrequencies } from './frequencies.js';
import { resultChiSquare } from './chiSquare.js';

self.onmessage = (e) => {
    const { variableData, expectedRange, rangeValue, expectedValue, expectedValueList, displayStatistics } = e.data;
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

        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            const descriptives = resultDescriptive(data, variables, displayStatistics);
            result.descriptives = JSON.stringify(descriptives);
        }

        console.log('Expected Range:', JSON.stringify(expectedRange));
        console.log('Range Value:', JSON.stringify(rangeValue));
        console.log('Expected Value:', JSON.stringify(expectedValue));
        console.log('Expected Value List:', JSON.stringify(expectedValueList));
        const frequencies = resultFrequencies(data, variables, expectedRange, rangeValue, expectedValue, expectedValueList);
        result.frequencies = [JSON.stringify(frequencies)];
        
        const chiSquare = resultChiSquare(data, variables, expectedRange, rangeValue, expectedValue, expectedValueList);
        result.chiSquare = JSON.stringify(chiSquare);

        self.postMessage(result);
    } catch (err) {
        self.postMessage({
            success: false,
            error: err.message || "An error occurred in the worker"
        });
    }
};

function extractData(variableData) {
    if (!variableData || !variableData.length) return [];

    // Get the length of the first variable's data to determine dataset size
    let rowCount = 0;
    variableData.forEach(vd => {
        if (vd.data && vd.data.length > rowCount) {
            rowCount = vd.data.length;
        }
    });

    const result = [];
    for (let i = 0; i < rowCount; i++) {
        const row = {};
        let allValuesEmpty = true;
        
        variableData.forEach(vd => {
            // Handle potentially missing or empty values
            const value = vd.data && i < vd.data.length ? vd.data[i] : "";
            
            // Use the variable name as the key
            row[vd.variable.name] = value;

            // Check if any value is not empty
            if (value !== "" && value !== null && value !== undefined) {
                allValuesEmpty = false;
            }
        });
        
        // Hanya tambahkan row ke result jika tidak ada nilai kosong
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