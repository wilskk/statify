import stdlibstatsBaseDistsChisquareCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-chisquare-cdf@0.2.2/+esm'
import { getRanksData } from './ranks.js';

export function resultFriedman(data, variables) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Friedman Test', columnHeaders: [], rows: [] }] };
    }
    
    // Dapatkan data ranks yang sudah dihitung
    const { ranksMatrix, sumRanks, n, k } = getRanksData(data, variables);
    
    // Hitung tie correction
    let tieSum = 0;
    for (let i = 0; i < n; i++) {
        // Dapatkan nilai di baris ini
        const rowValues = variables.map(v => data[i][v.name]);
        
        // Cari tie groups
        const tieGroups = findTieGroups(rowValues);
        
        // Hitung tieSum untuk baris ini
        tieGroups.forEach(t => {
            tieSum += (t ** 3 - t);
        });
    }
    
    // Hitung statistik Friedman
    const friedmanResult = calculateFriedman(n, k, sumRanks, tieSum);
    
    return {
        tables: [
            {
                title: 'Test Statistics',
                columnHeaders: [
                    { header: "" }, 
                    { header: "Value" }
                ],
                rows: [
                    {
                        rowHeader: ["N"],
                        "Value": n
                    },
                    {
                        rowHeader: ["Chi-Square"],
                        "Value": friedmanResult.chiSquare.toFixed(3)
                    },
                    {
                        rowHeader: ["df"],
                        "Value": friedmanResult.df
                    },
                    {
                        rowHeader: ["Asymp. Sig."],
                        "Value": (friedmanResult.pValue < 0.001) ? "<.001" : friedmanResult.pValue.toFixed(3)
                    }
                ],
            },
        ],
    };
}

// Fungsi untuk menemukan kelompok tie dalam array
function findTieGroups(arr) {
    const valueCount = {};
    
    // Hitung frekuensi setiap nilai
    arr.forEach(val => {
        if (valueCount[val] === undefined) {
            valueCount[val] = 0;
        }
        valueCount[val]++;
    });
    
    // Ambil hanya kelompok dengan count > 1 (tie groups)
    return Object.values(valueCount).filter(count => count > 1);
}

function calculateFriedman(n, k, sumRanks, tieSum) {
    // Hitung sum of squares: \sum C_l^2
    let sumSq = 0;
    for (let j = 0; j < k; j++) {
        sumSq += sumRanks[j] * sumRanks[j];
    }
    
    // Numerator (bagian atas)
    const numerator = (12 / (n * k * (k + 1))) * sumSq - 3 * n * (k + 1);
    
    // Denominator (koreksi ties)
    const denominator = 1 - (tieSum / (n * k * (k**2 - 1)));
    
    const chiSquare = numerator / denominator;
    
    // df = k-1
    const df = k - 1;
    
    // Hitung p-value menggunakan fungsi chi-square CDF
    // Dari stdlib/stats-base-dists-chisquare-cdf
    const pValue = 1 - stdlibstatsBaseDistsChisquareCdf(chiSquare, df);
    
    return {
        chiSquare,
        df,
        pValue
    };
}