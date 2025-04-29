import { resultRanks } from './ranks.js';
import { resultFriedman } from './testStatisticsFriedman.js';
import { resultDescriptive } from './descriptives.js';

self.onmessage = (e) => {
    const { variableData, testType, displayStatistics } = e.data;
    let result = { success: true, error: null, testType, displayStatistics };

    try {
        // Convert variableData to formats expected by calculation functions
        const data = extractData(variableData);
        const variables = variableData.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label,
            type: vd.variable.type
        }));

        if (displayStatistics.descriptive || displayStatistics.quartile) {
            const descriptives = resultDescriptive(data, variables, displayStatistics);
            result.descriptives = JSON.stringify(descriptives);
            console.log('Descriptives:', descriptives);
        }

        // Handle different actions
        const ranks = resultRanks(data, variables);
        result.ranks = JSON.stringify(ranks);
        console.log('Ranks:', ranks);

        if (testType.friedman) {
            const friedman = resultFriedman(data, variables);
            result.friedmanTest = JSON.stringify(friedman);
            console.log('Friedman Test:', friedman);
        }
        // if (kendallsWOption) {
        //     const kendallsW = resultKendallsW(data, variables);
        //     result.kendallsW = JSON.stringify(kendallsW);
        // }
        // if (cochransQOption) {
        //     const cochransQ = resultCochransQ(data, variables);
        //     result.cochransQ = JSON.stringify(cochransQ);
        // }

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
        let hasEmptyValue = false;
        
        variableData.forEach(vd => {
            // Handle potentially missing or empty values
            const value = i < vd.data.length ? vd.data[i] : "";
            
            // Cek apakah nilai kosong
            if (value === "" || value === null || value === undefined) {
                hasEmptyValue = true;
            }
            
            // Use the variable name as the key
            row[vd.variable.name] = value;
        });
        
        // Hanya tambahkan row ke result jika tidak ada nilai kosong
        if (!hasEmptyValue) {
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