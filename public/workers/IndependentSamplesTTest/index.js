import { resultGroup } from './group.js';
import { resultTest } from './test.js';

self.onmessage = (e) => {
    const { variableData, groupData, defineGroups, group1, group2, cutPointValue, estimateEffectSize } = e.data;
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

        const dataGrouping = extractData(groupData);
        const variablesGrouping = {
            name: groupData.variable.name,
            label: groupData.variable.label,
            type: groupData.variable.type,
            values: groupData.variable.values
        };

        console.log("dataGrouping", JSON.stringify(dataGrouping));
        console.log("variablesGrouping", JSON.stringify(variablesGrouping));

        const group = resultGroup(data, dataGrouping, variables, variablesGrouping, defineGroups, group1, group2, cutPointValue);
        result.group = JSON.stringify(group);

        const test = resultTest(data, dataGrouping, variables, variablesGrouping, defineGroups, group1, group2, cutPointValue);
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
        return data.data.map(value => ({
            [data.variable.name]: value
        }));
    }
    
    // Handle case when input is an array of objects (variableData)
    if (!Array.isArray(data) || !data.length) return [];

    // Get the length of the first variable's data to determine dataset size
    const rowCount = Math.max(...data.map(vd => vd.data?.length || 0));
    const result = [];

    // Create row objects with all variables
    for (let i = 0; i < rowCount; i++) {
        const row = {};
        data.forEach(vd => {
            // Handle potentially missing or empty values
            const value = i < vd.data.length ? vd.data[i] : "";
            // Use the variable name as the key
            row[vd.variable.name] = value;
        });
        result.push(row);
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