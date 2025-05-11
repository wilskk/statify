import { resultRanks, resultFrequencies } from './ranksFrequencies.js';
import { resultDescriptive } from './descriptives.js';
import { resultWilcoxon } from './testStatisticsWilcoxon.js';
import { resultSign } from './testStatisticsSign.js';

self.onmessage = (e) => {
    const { variableData1, variableData2, testType, displayStatistics } = e.data;
    let result = { success: true, error: null, testType, displayStatistics };

    try {
        // Convert variableData to formats expected by calculation functions
        const data1 = extractData(variableData1);
        const variables1 = variableData1.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label,
            type: vd.variable.type
        }));

        const data2 = extractData(variableData2);
        const variables2 = variableData2.map(vd => ({
            name: vd.variable.name,
            label: vd.variable.label,
            type: vd.variable.type
        }));
        console.log('variableData1:', JSON.stringify(variableData1));
        console.log('variableData2:', JSON.stringify(variableData2));
        console.log('data1:', JSON.stringify(data1));
        console.log('data2:', JSON.stringify(data2));
        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            const descriptives = resultDescriptive(data1, data2, variables1, variables2, displayStatistics);
            result.descriptives = JSON.stringify(descriptives);
            console.log('Descriptives:', descriptives);
        }

        // Handle different actions
        if (testType.wilcoxon) {
            const ranksResult = resultRanks(data1, data2, variables1, variables2);
            result.ranks = JSON.stringify(ranksResult);

            const wilcoxon = resultWilcoxon(data1, data2, variables1, variables2);
            result.wilcoxonTest = JSON.stringify(wilcoxon);
        }
        if (testType.sign) {
            const frequenciesResult = resultFrequencies(data1, data2, variables1, variables2);
            result.frequencies = JSON.stringify(frequenciesResult);

            const sign = resultSign(data1, data2, variables1, variables2);
            result.signTest = JSON.stringify(sign);
        }
        // if (mcNemarOption) {
        //     const mcNemar = resultMcNemar(data, variables, dataGrouping, groupingVariable, group1, group2);
        //     result.mcNemarTest = JSON.stringify(mcNemar);
        // }
        // if (marginalHomogeneityOption) {
        //     const marginalHomogeneity = resultMarginalHomogeneity(data, variables, dataGrouping, groupingVariable, group1, group2);
        //     result.marginalHomogeneityTest = JSON.stringify(marginalHomogeneity);
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