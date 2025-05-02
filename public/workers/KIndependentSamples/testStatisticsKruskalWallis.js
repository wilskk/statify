import stdlibstatsBaseDistsChisquareCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-chisquare-cdf@0.2.2/+esm'
import { computeRanks } from './ranks.js';

export function resultKruskalWallisH(data, variables, groupData, groupingVariable, group1, group2) {
    // Validasi input
    if (!data || !variables || !groupData || !groupingVariable) {
        console.error('Missing required parameters');
        return { tables: [{ title: 'Kruskal-Wallis H Test', columnHeaders: [], rows: [] }] };
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
        return { tables: [{ title: 'Kruskal-Wallis H Test', columnHeaders: [], rows: [] }] };
    }
    
    // Calculate Kruskal-Wallis H test results for each variable
    const testResults = calculateKruskalWallisH(arrays, variables, groupArrays, group1, group2);
    
    const rows = [];
    
    // Tambahkan baris untuk setiap statistik
    ['Kruskal-Wallis H', 'df', 'Asymp. Sig.'].forEach(statName => {
        const row = { rowHeader: [statName] };
        
        testResults.forEach((result, i) => {
            const variableName = variables[i].label || variables[i].name;
            
            switch(statName) {
                case 'Kruskal-Wallis H':
                    row[variableName] = result.H.toFixed(3);
                    break;
                case 'df':
                    row[variableName] = result.df;
                    break;
                case 'Asymp. Sig.':
                    row[variableName] = result.pValue < 0.001 ? "<.001" : result.pValue.toFixed(3);
                    break;
            }
        });
        
        rows.push(row);
    });

    // Construct the results table
    const resultTable = {
        tables: [
            {
                title: 'Test Statistics',
                columnHeaders: [
                    { header: "" },
                    ...variables.map(variable => ({ header: variable.label || variable.name }))
                ],
                rows: rows
            }
        ]
    };
    return resultTable;
}

function calculateKruskalWallisH(arrays, variables, groupArrays, group1, group2) {
    if (!arrays || !variables || !groupArrays) {
        console.error('Missing required parameters for calculateKruskalWallisH');
        return [];
    }

    const testResults = [];
    const resultRanks = computeRanks(arrays, variables, groupArrays, null, group1, group2);

    for (let varIndex = 0; varIndex < variables.length; varIndex++) {
        const variable = variables[varIndex];
        const uniqueGroups = resultRanks.groupTotal[varIndex];
        const N = resultRanks.N[varIndex];  // total data
        
        if (N === 0) {
            console.warn(`No valid data found for variable ${variable.name}`);
            continue;
        }
        
        // Calculate tie correction
        let tieSum = 0;
        const tieGroups = findTieGroups(resultRanks.dataVariable[varIndex]);
        tieGroups.forEach(tieGroup => {
           tieSum += (tieGroup.count ** 3 - tieGroup.count);
        });
        
        // Calculate H statistic with tie correction
        const H = calculateHStatistic(resultRanks.groupsLength[varIndex], resultRanks.sumRankMatrix[varIndex], N, tieSum);
        
        // Degrees of freedom = k - 1 (k = number of groups)
        const df = uniqueGroups - 1;
        
        // p-value from Chi-square distribution
        const pValue = 1 - stdlibstatsBaseDistsChisquareCdf(H, df);

        testResults.push({
            H,
            df,
            pValue
        });
    }
    
    return testResults;
}

// Find tie groups in an array
function findTieGroups(arr) {
    if (!arr || arr.length === 0) {
        console.warn('Empty array passed to findTieGroups');
        return [];
    }

    // Hitung frekuensi setiap nilai
    const valueCount = arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    
    // Kembalikan objek dengan detail tie groups
    return Object.entries(valueCount)
        .filter(([_, count]) => count > 1)
        .map(([value, count]) => ({
            value: Number(value),
            count: count
        }));
}

function calculateHStatistic(groupLengths, sumRanks, N, tieSum) {
    if (!groupLengths || !sumRanks || N === 0) {
        console.error('Invalid parameters for calculateHStatistic');
        return 0;
    }

    // Calculate H statistic using the formula:
    // H = [12 / (N*(N+1))] * Σ(R_i^2/n_i) - 3(N+1)
    // With tie correction: H' = H / [1 - Σ(t_i^3-t_i)/(N^3-N)]
    
    // Calculate sum of squares: Σ(R_i^2/n_i)
    let sumSq = 0;
    groupLengths.forEach((n_i, i) => {
        sumSq += (sumRanks[i] ** 2) / n_i;
    });
    
    // Numerator (upper part)
    const numerator = (12 / (N * (N + 1))) * sumSq - 3 * (N + 1);
    
    // Denominator (tie correction)
    const denominator = 1 - (tieSum / (N * (N**2 - 1)));
    
    // Calculate H statistic with tie correction
    return numerator / denominator;
}