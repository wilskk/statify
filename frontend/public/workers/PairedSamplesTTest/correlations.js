import stdlibstatsBaseDistsTCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm'

export function resultCorrelations(data1, variables1, data2, variables2) {
    if (!data1.length || !variables1.length || !data2.length || !variables2.length) {
        return { tables: [{ title: 'Paired Samples Correlations', columnHeaders: [], rows: [] }] };
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
        let corrValue = correlation(arrays1[i], arrays2[i]);
        let t = corrValue * Math.sqrt((arrays1[i].length - 2) / (1 - Math.pow(corrValue, 2)));
        let sigValue = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), arrays1[i].length - 2)); // Two-tailed p-value
                
        stats.push({
            rowHeader: [`Pair ${i+1}`],
            pair: [`${variables1[i].label || variables1[i].name} & ${variables2[i].label || variables2[i].name}`],
            N: arrays1[i].length,
            Correlation: corrValue.toFixed(3),
            "Sig.": sigValue < 0.001 ? "<.001" : sigValue.toFixed(3)
        });
    }

    return {
        tables: [
            {
                title: "Paired Samples Correlations",
                columnHeaders: [
                    { header: "" },
                    { header: "", key: "pair" },
                    { header: "N" },
                    { header: "Correlation" },
                    { header: "Sig." }
                ],
                rows: stats
            }
        ]
    };
}

function mean(arr) {
    return arr.reduce((sum, x) => sum + x.value, 0) / arr.length;
}

function correlation(arr1, arr2) {
    let mean1 = mean(arr1);
    let mean2 = mean(arr2);
    let numerator = arr1.reduce((sum, x, i) => sum + ((x.value - mean1) * (arr2[i].value - mean2)), 0);
    let denominator = Math.sqrt(arr1.reduce((sum, x) => sum + Math.pow(x.value - mean1, 2), 0) * 
                              arr2.reduce((sum, x) => sum + Math.pow(x.value - mean2, 2), 0));
    return numerator / denominator;
}
