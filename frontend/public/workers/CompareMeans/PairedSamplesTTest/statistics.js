export function resultStatistics(data1, variables1, data2, variables2) {
    if (!data1.length || !variables1.length || !data2.length || !variables2.length) {
        return { tables: [{ title: 'Paired Samples Statistics', columnHeaders: [], rows: [] }] };
    }

    // Prepare data arrays for processing
    let arrays1 = variables1.map(variable => {
        const values = data1.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null,
            originalIndex: row.originalIndex
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });

    let arrays2 = variables2.map(variable => {
        const values = data2.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null,
            originalIndex: row.originalIndex
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });
    
    // Filter arrays to only include pairs with matching originalIndex
    const filteredArrays1 = arrays1.map((arr1, i) => {
        const arr2 = arrays2[i];
        const matchingPairs = arr1.filter(item1 => {
            const matchingItem = arr2.find(item2 => item2.originalIndex === item1.originalIndex);
            return matchingItem !== undefined;
        });
        return matchingPairs;
    });

    const filteredArrays2 = arrays2.map((arr2, i) => {
        const arr1 = arrays1[i];
        const matchingPairs = arr2.filter(item2 => {
            const matchingItem = arr1.find(item1 => item1.originalIndex === item2.originalIndex);
            return matchingItem !== undefined;
        });
        return matchingPairs;
    });

    // Replace original arrays with filtered ones
    arrays1 = filteredArrays1;
    arrays2 = filteredArrays2;

    let stats = [];
    for (let i = 0; i < variables1.length; i++) {
        let mean1 = mean(arrays1[i]);
        let stdDev1 = stdDev(arrays1[i], mean1);
        let stdErr1 = stdError(stdDev1, arrays1[i].length);

        let mean2 = mean(arrays2[i]);
        let stdDev2 = stdDev(arrays2[i], mean2);
        let stdErr2 = stdError(stdDev2, arrays2[i].length);
        
        stats.push({
            rowHeader: [`Pair ${i+1}`],
            variable: variables1[i].label || variables1[i].name,
            Mean: mean1.toFixed(2),
            N: arrays1[i].length,
            "Std. Deviation": stdDev1.toFixed(3),
            "Std. Error Mean": stdErr1.toFixed(3)
        });
        
        stats.push({
            rowHeader: [`Pair ${i+1}`],
            variable: variables2[i].label || variables2[i].name,
            Mean: mean2.toFixed(2),
            N: arrays2[i].length,
            "Std. Deviation": stdDev2.toFixed(3),
            "Std. Error Mean": stdErr2.toFixed(3)
        });
    }

    return {
        tables: [
            {
                title: "Paired Samples Statistics",
                columnHeaders: [
                    { header: "" },
                    { header: "", key: "variable" },
                    { header: "Mean" },
                    { header: "N" },
                    { header: "Std. Deviation" },
                    { header: "Std. Error Mean" }
                ],
                rows: stats
            }
        ]
    };
}

function mean(arr) {
    return arr.reduce((sum, x) => sum + x.value, 0) / arr.length;
}

function stdDev(arr, meanValue) {
    const sumSq = arr.reduce((sum, x) => sum + Math.pow(x.value - meanValue, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
}

function stdError(sd, n) {
    return sd / Math.sqrt(n);
}
