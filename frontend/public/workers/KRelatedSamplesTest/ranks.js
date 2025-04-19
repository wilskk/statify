/* Fungsi-fungsi untuk Ranks */
export function resultRanks(data, variables) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Ranks', columnHeaders: [], rows: [] }] };
    }
    
    // Siapkan array data untuk masing-masing variabel
    const arrays = variables.map(variable => 
        data.map(row => parseFloat(row[variable.name]))
    );
    
    const n = arrays[0].length;
    const k = variables.length;
    
    // Hitung ranks dan tabel hasil
    const ranksResult = computeRanks(arrays, variables, n, k);
    
    return {
        tables: [
            {
                title: 'Ranks',
                columnHeaders: [{ header: "" }, { header: "Mean Rank" }],
                rows: ranksResult.rows,
            },
        ],
    };
}

// Menghitung peringkat dengan penanganan ties
function computeRanksForRow(values) {
    // Buat array index [0,1,2,3,...] agar kita tahu posisi aslinya
    const indices = values.map((v, i) => i);
    // Urutkan index berdasarkan nilai data
    indices.sort((a, b) => values[a] - values[b]);

    // Siapkan array output (peringkat) dengan panjang sama
    const ranks = new Array(values.length).fill(0);

    let i = 0;
    while (i < values.length) {
        let start = i,
            sumRanks = 0,
            count = 0,
            currentVal = values[indices[i]];
        while (i < values.length && values[indices[i]] === currentVal) {
            sumRanks += (i + 1); // Peringkat dihitung 1-indexed
            count++;
            i++;
        }
        let avgRank = sumRanks / count;
        for (let j = start; j < start + count; j++) {
            ranks[indices[j]] = avgRank;
        }
    }

    return ranks;
}

function computeRanks(arrays, variables, n, k) {
    // Lakukan ranking per baris
    let ranksMatrix = [];
    for (let i = 0; i < n; i++) {
        const rowValues = arrays.map(arr => arr[i]); // Ambil data baris ke-i dari semua variabel
        const rowRanks = computeRanksForRow(rowValues); // Hitung ranking
        ranksMatrix.push(rowRanks);
    }

    // Hitung total rank per kondisi (untuk menghitung Mean Rank)
    let sumRanks = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < k; j++) {
            sumRanks[j] += ranksMatrix[i][j];
        }
    }
    
    // Buat rows untuk output
    let rows = [];
    for (let i = 0; i < k; i++) {
        rows.push({
            rowHeader: [variables[i].name],
            "Mean Rank": +(sumRanks[i] / n).toFixed(2)
        });
    }
    
    return {
        ranksMatrix: ranksMatrix,
        sumRanks: sumRanks,
        meanRanks: sumRanks.map(sum => +(sum / n).toFixed(2)),
        rows: rows
    };
}

// Menyimpan ranks untuk digunakan dalam perhitungan Friedman, Kendall's W, dan Cochran's Q
export function getRanksData(data, variables) {
    // Siapkan array data untuk masing-masing variabel
    const arrays = variables.map(variable => 
        data.map(row => parseFloat(row[variable.name]))
    );
    
    const n = arrays[0].length;
    const k = variables.length;
    
    // Hitung ranks
    const ranksResult = computeRanks(arrays, variables, n, k);
    
    return {
        ranksMatrix: ranksResult.ranksMatrix,
        sumRanks: ranksResult.sumRanks,
        meanRanks: ranksResult.meanRanks,
        n: n,
        k: k
    };
}