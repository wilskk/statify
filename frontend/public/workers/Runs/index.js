// import { resultRanks } from './ranks.js';
// import { resultFriedman } from './testStatisticsFriedman.js';
import { resultDescriptive } from './descriptives.js';
import { resultRuns } from './runs.js';

self.onmessage = (e) => {
    const { variableData, cutPoint, customValue, displayStatistics } = e.data;
    let result = { success: true, error: null, cutPoint, displayStatistics };

    try {
        // Convert variableData to formats expected by calculation functions
        const data = extractData(variableData);
        const variables = variableData.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label,
            type: vd.variable.type
        }));

        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            const descriptives = resultDescriptive(data, variables, displayStatistics);
            result.descriptives = JSON.stringify(descriptives);
            console.log('Descriptives:', JSON.stringify(descriptives));
        }

        if (cutPoint.median) {
            const runsMedian = resultRuns(data, variables, 'median');
            result.runsMedian = JSON.stringify(runsMedian);
            console.log('Runs Median:', JSON.stringify(runsMedian));
        }
        if (cutPoint.mode) {
            const runsMode = resultRuns(data, variables, 'mode');
            result.runsMode = JSON.stringify(runsMode);
            console.log('Runs Mode:', JSON.stringify(runsMode));
        }
        if (cutPoint.mean) {
            const runsMean = resultRuns(data, variables, 'mean');
            result.runsMean = JSON.stringify(runsMean);
            console.log('Runs Mean:', JSON.stringify(runsMean));
        }
        if (cutPoint.custom) {
            const runsCustom = resultRuns(data, variables, customValue);
            result.runsCustom = JSON.stringify(runsCustom);
            console.log('Runs Custom:', JSON.stringify(runsCustom));
        }

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