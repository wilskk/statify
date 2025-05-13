import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm';
import stdlibstatsBaseDistsBinomialCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-binomial-cdf@0.2.2/+esm';
import { extractArraysFromData } from './ranksFrequencies.js';

export function resultSign(data1, data2, variables1, variables2) {
    if (!data1.length || !variables1.length || !data2.length || !variables2.length) {
        return { tables: [{ title: 'Test Statistics', columnHeaders: [], rows: [] }] };
    }
    
    // Ekstrak data array dari objek data
    const { arrays1, arrays2 } = extractArraysFromData(data1, data2, variables1, variables2);
    
    let rows = [];
    let columnHeaders = [{ "header": "" }];
    
    for (let i = 0; i < variables1.length; i++) {
        // Panggil fungsi perhitungan
        let result = signTest(arrays2[i], arrays1[i]);
        
        const var1Label = variables1[i].label || variables1[i].name;
        const var2Label = variables2[i].label || variables2[i].name;
        const variableLabel = `${var2Label} - ${var1Label}`;
        columnHeaders.push({ "header": variableLabel });

        function addToRow(rowHeaderText, variableName, value) {
            let row = rows.find(r => r.rowHeader[0] === rowHeaderText);
            if (!row) {
                row = { rowHeader: [rowHeaderText] };
                rows.push(row);
            }
            row[variableName] = value.toFixed(3);
        }

        if (0 < result.n && result.n <= 25) {
            addToRow("Exact Sig. (2-tailed)", variableLabel, result.pValue);
        } else {
            if (result.pValue !== 1) {
                addToRow("Z", variableLabel, result.zValue);
            }
            addToRow("Asymp. Sig. (2-tailed)", variableLabel, result.pValue);
        }
    }

    return {
        tables: [
            { 
                title: "Test Statistics", 
                columnHeaders: columnHeaders, 
                rows: rows 
            }
        ]
    };
}

function signTest(data1, data2) {
    if (data1.length !== data2.length) {
        throw new Error("Panjang data1 dan data2 harus sama!");
    }
    
    let nPositive = 0;
    let nNegative = 0;
    let nTie = 0;
    
    // Hitung selisih dan tentukan tanda
    for (let i = 0; i < data1.length; i++) {
        const diff = data1[i] - data2[i];
        if (diff > 0) {
            nPositive++;
        } else if (diff < 0) {
            nNegative++;
        } else {
            nTie++;
        }
    }
    
    // Hitung n efektif (tanpa tie)
    const n = nPositive + nNegative;
    
    let pValue = 0;
    let zValue = 0;
    if (n === 0) {
        pValue = 1; 
    } else if (0 < n && n <= 25) {
        const pLeft = stdlibstatsBaseDistsBinomialCdf(nPositive, n, 0.5);
        const pRight = 1 - stdlibstatsBaseDistsBinomialCdf(nPositive - 1, n, 0.5);
        pValue = 2 * Math.min(pLeft, pRight);
    } else {
        const diffCount = nPositive - nNegative;
        const diff = Math.max(nPositive, nNegative) - 0.5 * n - 0.5;
        const denom = Math.sqrt(n) / 2;
        zValue = (diffCount <= 0 ? 1 : -1) * (diff / denom);

        // p-value dua sisi dari Z
        const pOneSide = 1 - stdlibstatsBaseDistsNormalCdf(Math.abs(zValue), 0, 1);
        pValue = 2 * pOneSide;
    }
    
    // Pastikan pValue tidak melebihi 1 karena pembulatan
    if (pValue > 1) pValue = 1;
    
    return {
        n: n,
        zValue: zValue,
        pValue: pValue
    };
}