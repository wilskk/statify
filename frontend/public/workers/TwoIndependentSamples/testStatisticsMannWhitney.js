import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm';
import { computeRanks } from './ranksFrequencies.js';

export function resultMannWhitneyU(data, variables, groupData, groupingVariable, group1, group2) {
    // Validasi input
    if (!data || !variables || !groupData || !groupingVariable) {
        console.error('Missing required parameters');
        return { tables: [{ title: 'Mann-Whitney U Test', columnHeaders: [], rows: [] }] };
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
        return { tables: [{ title: 'Mann-Whitney U Test', columnHeaders: [], rows: [] }] };
    }
    console.log("disini");
    // Calculate Mann-Whitney U test results for each variable
    const testResults = calculateMannWhitneyU(arrays, variables, groupArrays, groupingVariable, group1, group2);
    console.log("disini 2");
    const rows = [];
    
    // Tambahkan baris untuk setiap statistik
    ['Mann-Whitney U', 'Wilcoxon W', 'Z', 'Asymp. Sig. (2-tailed)', 'Exact Sig. [2*(1-tailed Sig.)]'].forEach(statName => {
        const row = { rowHeader: [statName] };
        
        testResults.forEach((result, i) => {
            const variableName = variables[i].label || variables[i].name;
            
            switch(statName) {
                case 'Mann-Whitney U':
                    row[variableName] = result.U.toFixed(3);
                    break;
                case 'Wilcoxon W':
                    row[variableName] = result.W.toFixed(3);
                    break;
                case 'Z':
                    row[variableName] = result.Z.toFixed(3);
                    break;
                case 'Asymp. Sig. (2-tailed)':
                    row[variableName] = result.pAsymp.toFixed(3);
                    break;
                case 'Exact Sig. [2*(1-tailed Sig.)]':
                    if (result.showExact) {
                        row[variableName] = result.pExact.toFixed(3);
                    }
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

function calculateMannWhitneyU(arrays, variables, groupArrays, groupingVariable, group1, group2) {
    if (!arrays || !variables || !groupArrays) {
        console.error('Missing required parameters for calculateMannWhitneyU');
        return [];
    }

    const testResults = [];
    const ranksResult = computeRanks(arrays, variables, groupArrays, groupingVariable, group1, group2, { mannWhitneyU: true });
    console.log("disini 3");
    for (let varIndex = 0; varIndex < variables.length; varIndex++) {
        const variable = variables[varIndex];
        const n1 = ranksResult.groupsLength[varIndex][0];
        const n2 = ranksResult.groupsLength[varIndex][1];
        const R1 = ranksResult.sumRankMatrix[varIndex][0];
        const R2 = ranksResult.sumRankMatrix[varIndex][1];

        if (!n1 || !n2 || n1 === 0 || n2 === 0) {
            console.warn(`No valid data found for variable ${variable.name}`);
            continue;
        }

        const result = computeMannWhitney(n1, n2, R1, R2, ranksResult, varIndex);
        testResults.push(result);
    }
    console.log("disini 6");

    return testResults;
}

function computeMannWhitney(n1, n2, R1, R2, ranksResult, varIndex) {
    // Hitung statistik U
    const U1 = R1 - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;

    let U, W;
    if (U1 > (n1 * n2) / 2) {
        U = U2;
        W = R2;
    } else {
        U = U1;
        W = R1;
    }

    // Hitung expected value dan variance
    const expectedU = (n1 * n2) / 2;
    let varianceU = (n1 * n2 * (n1 + n2 + 1)) / 12;

    // Hitung tie correction
    const tieSum = ranksResult.dataVariable[varIndex].reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    
    const tieCorrection = Object.values(tieSum).reduce((sum, t) => sum + (t > 1 ? (t ** 3 - t) : 0), 0);

    if (tieCorrection > 0) {
        const N = n1 + n2;
        varianceU = varianceU - (n1 * n2 * tieCorrection / (N * (N - 1) * 12));
    }

    // Hitung Z-score dan p-value
    const Z = (U - expectedU) / Math.sqrt(varianceU);
    const pAsymp = 2 * (1 - stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1));
    const pExact = computeExactPValue(n1, n2, U, "two-sided");

    // Tentukan apakah akan menampilkan p-value eksak
    const showExact = (n1 * n2) < 400 && (((n1 * n2) / 2) + Math.min(n1, n2)) <= 220;

    return { n1, n2, U, U1, U2, W, expectedU, varianceU, Z, pAsymp, pExact, showExact };
}

function computeExactPValue(n1, n2, U_obs, side = "one-sided") {
    const distribution = computeExactDistribution(n1, n2);
    const total = combination(n1 + n2, n1);
    
    let cumulative = 0;
    for (let u = 0; u <= U_obs; u++) {
        cumulative += (distribution[u] || 0);
    }
    
    const pOneSided = cumulative / total;
    
    if (side === "one-sided") {
        return pOneSided;
    } else if (side === "two-sided") {
        return Math.min(2 * pOneSided, 1);
    }
}

function computeExactDistribution(n1, n2) {
    let dp = new Array(n1 + 1);
    for (let i = 0; i <= n1; i++) {
        dp[i] = new Array(n2 + 1);
    }
    
    for (let j = 0; j <= n2; j++) {
        dp[0][j] = [1];
    }
    for (let i = 0; i <= n1; i++) {
        dp[i][0] = [1];
    }
    
    for (let i = 1; i <= n1; i++) {
        for (let j = 1; j <= n2; j++) {
            let size = i * j + 1;
            let arr = new Array(size).fill(0);
            
            let prevJ = dp[i][j - 1];
            for (let u = 0; u < prevJ.length; u++) {
                arr[u] += prevJ[u];
            }
            
            let prevI = dp[i - 1][j];
            for (let u = 0; u < prevI.length; u++) {
                if (u + j < size) {
                    arr[u + j] += prevI[u];
                }
            }
            
            dp[i][j] = arr;
        }
    }
    
    return dp[n1][n2];
}

function combination(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - (k - i));
        result /= i;
    }
    return result;
}