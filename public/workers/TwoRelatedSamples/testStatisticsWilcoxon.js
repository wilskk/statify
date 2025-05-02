import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm';
import { extractArraysFromData } from './ranksFrequencies.js';

export function resultWilcoxon(data1, data2, variables1, variables2) {
    if (!data1.length || !variables1.length || !data2.length || !variables2.length) {
        return { tables: [{ title: 'Test Statistics', columnHeaders: [], rows: [] }] };
    }
    
    // Ekstrak data array dari objek data
    const { arrays1, arrays2 } = extractArraysFromData(data1, data2, variables1, variables2);
    
    let rows = [];
    let columnHeaders = [{ "header": "" }];
    
    for (let i = 0; i < variables1.length; i++) {
        // Panggil fungsi perhitungan
        let result = wilcoxonSignedRankTest(arrays1[i], arrays2[i]);
        
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

        addToRow("Z", variableLabel, result.zValue);
        addToRow("Asymp. Sig. (2-tailed)", variableLabel, result.pValue);
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

function wilcoxonSignedRankTest(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        throw new Error("Panjang array harus sama!");
    }

    console.log("Wilcoxon Signed Rank Test: ", arr1, arr2);

    // 1. Buat array selisih
    let diffs = [];
    for (let i = 0; i < arr1.length; i++) {
        const d = arr2[i] - arr1[i];
        diffs.push({ 
            index: i,
            diff: d,
            absDiff: Math.abs(d)
        });
    }

    // 2. Buang data dengan selisih = 0 (tie)
    diffs = diffs.filter(item => item.diff !== 0);

    // Jika setelah di-filter semua habis, uji tidak dapat dijalankan
    const n = diffs.length;
    if (n === 0) {
        return {
            sumPos: 0,
            sumNeg: 0,
            zValue: 0,
            pValue: 1,
            message: "Semua selisih = 0, tidak ada perbedaan."
        };
    }

    // 3. Urutkan berdasarkan |diff| dari kecil ke besar
    diffs.sort((a, b) => a.absDiff - b.absDiff);

    // 4. Beri peringkat dengan memperhitungkan ties (average rank)
    let rank = 1;
    while (rank <= n) {
        let startRank = rank;
        let currentAbsDiff = diffs[rank - 1].absDiff;
        let countTie = 1;
    
        // Cek berapa banyak data yang punya absDiff sama
        while (
            rank + countTie <= n &&
            diffs[rank - 1 + countTie].absDiff === currentAbsDiff
        ) {
            countTie++;
        }
    
        // Hitung rata-rata peringkat untuk tie group
        let avgRank = (2 * startRank + (countTie - 1)) / 2;
    
        // Set rank untuk group
        for (let j = 0; j < countTie; j++) {
            diffs[rank - 1 + j].rank = avgRank;
        }
    
        // Lanjut ke grup berikutnya
        rank += countTie;
    }

    // 5. Pisahkan sum rank positif dan negatif
    let sumPos = 0;
    let sumNeg = 0;

    // Untuk tie correction: kita butuh info ukuran tiap tie group
    let tieGroups = {}; // key = absDiff, value = berapa banyak kemunculan

    for (let item of diffs) {
        // Hitung sum rank
        if (item.diff > 0) {
            sumPos += item.rank;
        } else {
            sumNeg += item.rank;
        }

        // Hitung tie group
        let ad = item.absDiff;
        tieGroups[ad] = (tieGroups[ad] || 0) + 1;
    }

    // 6. Hitung nilai Z dengan koreksi untuk ties
    // Rumus var(W) = [ n(n+1)(2n+1) / 24 ] - [ Σ(t_j * (t_j^2 - 1)) / 48 ]
    // t_j = jumlah data yang punya absDiff sama
    let nFloat = n; // agar lebih jelas
    let baseVar = nFloat * (nFloat + 1) * (2 * nFloat + 1) / 24.0;
    let tieCorrection = 0;
    for (let key in tieGroups) {
        let t = tieGroups[key];
        tieCorrection += t * (t * t - 1);
    }
    tieCorrection /= 48.0;

    let sdW = Math.sqrt(baseVar - tieCorrection);

    // Jika sumNeg < sumPos, berarti mayoritas selisih negatif → T = sumNeg (zValue negatif)
    // Jika sumPos < sumNeg, berarti mayoritas selisih positif → T = sumPos (zValue positif)
    let T;
    if (sumNeg < sumPos) {
        T = sumNeg;
    } else {
        T = sumPos;
    }

    // W+ = sumPos. Nilai ekspektasi E(W+) = n(n+1)/4
    // Z = (W+ - E(W+)) / SD(W+)
    let expectedW = nFloat * (nFloat + 1) / 4.0;
    let zValue = (T - expectedW) / sdW;

    // 7. p-value (two-tailed) dengan asumsi normal
    let pValue = 2 * (1 - stdlibstatsBaseDistsNormalCdf(Math.abs(zValue), 0, 1));

    // Pastikan pValue tidak melebihi 1 karena pembulatan
    if (pValue > 1) pValue = 1;

    return {
        zValue: zValue,
        pValue: pValue
    };
}