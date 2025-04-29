/* Fungsi-fungsi untuk Descriptives */
export function resultDescriptive(data, variables, displayStatistics) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Descriptive Statistics', columnHeaders: [], rows: [] }] };
    }

    // Tentukan kolom header berdasarkan opsi displayStatistics
    const columnHeaders = getColumnHeaders(displayStatistics);

    // Siapkan array data untuk masing-masing variabel
    const variableData = {};
    variables.forEach(variable => {
        variableData[variable.name] = data.map(row => parseFloat(row[variable.name]));
    });

    // Hitung statistik deskriptif berdasarkan opsi yang dipilih
    const descriptiveStats = computeDescriptiveStats(variableData, displayStatistics, variables);

    return {
        tables: [
            {
                title: 'Descriptive Statistics',
                columnHeaders: columnHeaders,
                rows: descriptiveStats.rows
            }
        ]
    };
}

// Fungsi untuk menentukan kolom header berdasarkan opsi displayStatistics
function getColumnHeaders(displayStatistics) {
    const { descriptive, quartile } = displayStatistics;
    const headers = [{ header: "" }, { header: "N" }];

    // Tambahkan header untuk statistik deskriptif jika opsi descriptive diaktifkan
    if (descriptive) {
        headers.push(
            { header: "Mean" },
            { header: "Std. Deviation" },
            { header: "Minimum" },
            { header: "Maximum" }
        );
    }

    // Tambahkan header untuk quartile jika opsi quartile diaktifkan
    if (quartile) {
        headers.push({
            header: "Percentiles",
            children: [
                { header: "25th", key: "25th" },
                { header: "50th (Median)", key: "50th" },
                { header: "75th", key: "75th" }
            ]
        });
    }

    return headers;
}

// Fungsi untuk menghitung statistik deskriptif
function computeDescriptiveStats(variableData, displayStatistics, variables) {
    const { descriptive, quartile } = displayStatistics;
    const variableNames = Object.keys(variableData);

    // Inisialisasi baris-baris untuk hasil
    let rows = [];

    // Buat baris untuk setiap variabel
    variableNames.forEach(variableName => {
        const variable = variables.find(v => v.name === variableName);
        const row = {
            rowHeader: [variable.label || variableName],
            "N": variableData[variableName].length
        };

        // Tambahkan statistik deskriptif jika opsi descriptive diaktifkan
        if (descriptive) {
            const mean = calculateMean(variableData[variableName]);
            const stdDev = calculateStdDev(variableData[variableName], mean);
            
            row["Mean"] = mean.toFixed(2);
            row["Std. Deviation"] = stdDev.toFixed(3);
            row["Minimum"] = Math.min(...variableData[variableName]);
            row["Maximum"] = Math.max(...variableData[variableName]);
        }

        // Tambahkan statistik quartile jika opsi quartile diaktifkan
        if (quartile) {
            row["25th"] = calculatePercentile(variableData[variableName], 25).toFixed(2);
            row["50th"] = calculatePercentile(variableData[variableName], 50).toFixed(2);
            row["75th"] = calculatePercentile(variableData[variableName], 75).toFixed(2);
        }

        rows.push(row);
    });

    return {
        rows: rows
    };
}

// Fungsi helper untuk menghitung mean
function calculateMean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Fungsi helper untuk menghitung standard deviation
function calculateStdDev(arr, mean) {
    const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
}

// Fungsi helper untuk menghitung percentiles
function calculatePercentile(arr, percentile) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length + 1);
    if (Number.isInteger(index)) {
        return sorted[index - 1];
    } else {
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const weight = index - lowerIndex;
        return sorted[lowerIndex - 1] * (1 - weight) + sorted[upperIndex - 1] * weight;
    }
}