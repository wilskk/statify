import { computeRanks } from './ranksFrequencies.js';

export function resultKolmogorovSmirnov(data, variables, groupData, groupingVariable, group1, group2) {
    // Validasi input
    if (!data || !variables || !groupData || !groupingVariable) {
        console.error('Missing required parameters');
        return { tables: [{ title: 'Two-Samples Kolmogorov-Smirnov Test', columnHeaders: [], rows: [] }] };
    }

    // Prepare data arrays for processing
    const arrays = variables.map(variable => {
        const values = data.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null,
            originalIndex: row.originalIndex
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });
    
    // Prepare group arrays
    const groupArrays = groupData.map(row => ({
        value: row[groupingVariable.name] !== "" && row[groupingVariable.name] !== null && row[groupingVariable.name] !== undefined ? 
               parseFloat(row[groupingVariable.name]) : null,
        originalIndex: row.originalIndex
    })).filter(item => item.value !== null && !isNaN(item.value));
    
    if (groupArrays.length === 0) {
        console.warn('No valid group values found');
        return { tables: [{ title: 'Two-Samples Kolmogorov-Smirnov Test', columnHeaders: [], rows: [] }] };
    }

    // Calculate Kolmogorov-Smirnov test results for each variable
    const testResults = calculateKolmogorovSmirnov(arrays, variables, groupArrays, groupingVariable, group1, group2);
    console.log("testResults", JSON.stringify(testResults));
    const rows = [];
    
    // Tambahkan baris untuk setiap statistik
    ['Most Extreme Differences', 'Kolmogorov-Smirnov Z', 'Asymp. Sig. (2-tailed)'].forEach(statName => {
        if (statName === 'Most Extreme Differences') {
            ['Absolute', 'Positive', 'Negative'].forEach(type => {
                const row = { rowHeader: [statName], type: type };
                
                testResults.forEach((result, i) => {
                    const variableName = variables[i].label || variables[i].name;
                    
                    switch(type) {
                        case 'Absolute':
                            row[variableName] = result.D_absolute.toFixed(3);
                            break;
                        case 'Positive':
                            row[variableName] = result.D_positive.toFixed(3);
                            break;
                        case 'Negative':
                            row[variableName] = result.D_negative.toFixed(3);
                            break;
                    }
                });
                
                rows.push(row);
            });
        } else {
            const row = { rowHeader: [statName], type: "" };
            
            testResults.forEach((result, i) => {
                const variableName = variables[i].label || variables[i].name;
                
                switch(statName) {
                    case 'Kolmogorov-Smirnov Z':
                        row[variableName] = result.d_stat.toFixed(3);
                        break;
                    case 'Asymp. Sig. (2-tailed)':
                        row[variableName] = result.pValue.toFixed(3);
                        break;
                }
            });
            
            rows.push(row);
        }
    });

    // Construct the results table
    const resultTable = {
        tables: [
            {
                title: 'Test Statistics',
                columnHeaders: [
                    { header: "" },
                    { header: "type" },
                    ...variables.map(variable => ({ header: variable.label || variable.name }))
                ],
                rows: rows
            }
        ]
    };
    return resultTable;
}

function calculateKolmogorovSmirnov(arrays, variables, groupArrays, groupingVariable, group1, group2) {
    if (!arrays || !variables || !groupArrays) {
        console.error('Missing required parameters for calculateKolmogorovSmirnov');
        return [];
    }

    const testResults = [];
    const ranksResult = computeRanks(arrays, variables, groupArrays, groupingVariable, group1, group2, { kolmogorovSmirnov: true });
    console.log("ranksResult", JSON.stringify(ranksResult));
    
    for (let varIndex = 0; varIndex < variables.length; varIndex++) {
        const variable = variables[varIndex];
        
        // Ambil data dari dataVariable dan kelompokkan berdasarkan groupedData
        const data1 = [];
        const data2 = [];
        
        for (let i = 0; i < ranksResult.dataVariable[varIndex].length; i++) {
            if (ranksResult.groupedData[varIndex][i] === group1) {
                data1.push(ranksResult.dataVariable[varIndex][i]);
            } else if (ranksResult.groupedData[varIndex][i] === group2) {
                data2.push(ranksResult.dataVariable[varIndex][i]);
            }
        }

        console.log("data1", JSON.stringify(data1));
        console.log("data2", JSON.stringify(data2));

        if (!data1.length || !data2.length) {
            console.warn(`No valid data found for variable ${variable.name}`);
            continue;
        }

        const result = computeKolmogorovSmirnovTest(data1, data2);
        testResults.push(result);
    }

    return testResults;
}

function computeKolmogorovSmirnovTest(sample1, sample2) {
    // Hitung ECDF untuk kedua sampel
    const ecdf1 = computeECDF(sample1);
    const ecdf2 = computeECDF(sample2);

    // Gabungkan dan urutkan nilai unik
    const combinedValues = [...new Set([...ecdf1.values, ...ecdf2.values])].sort((a, b) => a - b);

    // Hitung perbedaan maksimum
    let D_absolute = 0;
    let D_positive = 0;
    let D_negative = 0;

    combinedValues.forEach(x => {
        const F1 = ecdf1.values.filter(v => v <= x).length / sample1.length;
        const F2 = ecdf2.values.filter(v => v <= x).length / sample2.length;
        
        const diff = F1 - F2;
        D_absolute = Math.max(D_absolute, Math.abs(diff));
        D_positive = Math.max(D_positive, diff);
        D_negative = Math.min(D_negative, diff);
    });

    // Hitung statistik Z
    const n1 = sample1.length;
    const n2 = sample2.length;
    const d_stat = D_absolute * Math.sqrt((n1 * n2) / (n1 + n2));

    // Hitung p-value
    const pValue = computeKSPValue(d_stat);

    return { D_absolute, D_positive, D_negative, d_stat, pValue };
}

function computeECDF(data) {
    data.sort((a, b) => a - b);
    return {
        values: data,
        probabilities: data.map((_, i) => (i + 1) / data.length)
    };
}

function computeKSPValue(d) {
    let sum = 0.0;
    for (let k = 1; k < 100; k++) {
        const term = Math.pow(-1, k - 1) * Math.exp(-2 * k * k * d * d);
        sum += term;
        if (Math.abs(term) < 1e-6) break;
    }
    return 2 * sum;
}
