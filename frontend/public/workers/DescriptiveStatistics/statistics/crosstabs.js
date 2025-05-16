/**
 * crosstabs.js
 * Implementasi algoritma CROSSTABS untuk analisis tabel kontingensi
 */

/**
 * Membuat tabel kontingensi dari data mentah
 * @param {Array<*>} xValues - Array nilai variabel baris
 * @param {Array<*>} yValues - Array nilai variabel kolom
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi tabel kontingensi dan informasi terkait
 */
const createCrosstab = (xValues, yValues, weights = null) => {
    if (xValues.length !== yValues.length) {
        throw new Error('Panjang array nilai X dan Y harus sama');
    }

    const useWeights = Array.isArray(weights) && weights.length === xValues.length;

    // Temukan nilai unik pada variabel X dan Y
    const uniqueX = [...new Set(xValues.filter(x => x !== null && x !== undefined))];
    const uniqueY = [...new Set(yValues.filter(y => y !== null && y !== undefined))];

    // Urutkan nilai unik
    uniqueX.sort((a, b) => a - b);
    uniqueY.sort((a, b) => a - b);

    // Inisialisasi tabel kontingensi
    const table = {};
    for (const x of uniqueX) {
        table[x] = {};
        for (const y of uniqueY) {
            table[x][y] = 0;
        }
    }

    // Hitung total pada sel
    let W = 0; // Grand total

    for (let i = 0; i < xValues.length; i++) {
        const x = xValues[i];
        const y = yValues[i];

        // Skip nilai yang null atau undefined
        if (x === null || x === undefined || y === null || y === undefined) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        // Tambahkan ke tabel
        if (uniqueX.includes(x) && uniqueY.includes(y)) {
            table[x][y] += w;
            W += w;
        }
    }

    // Hitung marginal totals (row dan column totals)
    const rowTotals = {};
    const colTotals = {};

    for (const x of uniqueX) {
        rowTotals[x] = 0;
        for (const y of uniqueY) {
            rowTotals[x] += table[x][y];
        }
    }

    for (const y of uniqueY) {
        colTotals[y] = 0;
        for (const x of uniqueX) {
            colTotals[y] += table[x][y];
        }
    }

    return {
        table,
        uniqueX,
        uniqueY,
        rowTotals,
        colTotals,
        grandTotal: W
    };
};

/**
 * Menghitung expected counts untuk tabel kontingensi
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi expected counts untuk tiap sel
 */
const calculateExpectedCounts = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    const expectedCounts = {};

    for (const x of uniqueX) {
        expectedCounts[x] = {};
        for (const y of uniqueY) {
            // Expected count = (row total * column total) / grand total
            expectedCounts[x][y] = (rowTotals[x] * colTotals[y]) / grandTotal;
        }
    }

    return expectedCounts;
};

/**
 * Menghitung persentase (row, column, total) untuk tabel kontingensi
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi persentase untuk tiap sel
 */
const calculatePercentages = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    const rowPercents = {};
    const colPercents = {};
    const totalPercents = {};

    for (const x of uniqueX) {
        rowPercents[x] = {};
        colPercents[x] = {};
        totalPercents[x] = {};

        for (const y of uniqueY) {
            // Row percent = (cell count / row total) * 100
            rowPercents[x][y] = rowTotals[x] > 0 ? (table[x][y] / rowTotals[x]) * 100 : 0;

            // Column percent = (cell count / column total) * 100
            colPercents[x][y] = colTotals[y] > 0 ? (table[x][y] / colTotals[y]) * 100 : 0;

            // Total percent = (cell count / grand total) * 100
            totalPercents[x][y] = grandTotal > 0 ? (table[x][y] / grandTotal) * 100 : 0;
        }
    }

    return { rowPercents, colPercents, totalPercents };
};

/**
 * Menghitung residual untuk tabel kontingensi
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @param {Object} expectedCounts - Hasil dari calculateExpectedCounts
 * @return {Object} Objek berisi residual, standardized residual, dan adjusted residual
 */
const calculateResiduals = (crosstab, expectedCounts) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    const residuals = {};
    const stdResiduals = {};
    const adjResiduals = {};

    for (const x of uniqueX) {
        residuals[x] = {};
        stdResiduals[x] = {};
        adjResiduals[x] = {};

        for (const y of uniqueY) {
            // Residual = observed - expected
            residuals[x][y] = table[x][y] - expectedCounts[x][y];

            // Standardized residual = residual / sqrt(expected)
            stdResiduals[x][y] = expectedCounts[x][y] > 0 ?
                residuals[x][y] / Math.sqrt(expectedCounts[x][y]) : 0;

            // Adjusted residual = standardized residual / sqrt((1 - row proportion) * (1 - column proportion))
            const rowProportion = rowTotals[x] / grandTotal;
            const colProportion = colTotals[y] / grandTotal;

            adjResiduals[x][y] = expectedCounts[x][y] > 0 ?
                residuals[x][y] / Math.sqrt(expectedCounts[x][y] * (1 - rowProportion) * (1 - colProportion)) : 0;
        }
    }

    return { residuals, stdResiduals, adjResiduals };
};

/**
 * Menghitung statistik Chi-Square untuk tabel kontingensi
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @param {Object} expectedCounts - Hasil dari calculateExpectedCounts
 * @return {Object} Objek berisi statistik Chi-Square dan signifikansi
 */
const calculateChiSquare = (crosstab, expectedCounts) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Pearson's Chi-Square
    let pearsonChiSquare = 0;
    for (const x of uniqueX) {
        for (const y of uniqueY) {
            const observed = table[x][y];
            const expected = expectedCounts[x][y];

            if (expected > 0) {
                pearsonChiSquare += Math.pow(observed - expected, 2) / expected;
            }
        }
    }

    // Degrees of freedom
    const df = (uniqueX.length - 1) * (uniqueY.length - 1);

    // Likelihood Ratio
    let likelihoodRatio = 0;
    for (const x of uniqueX) {
        for (const y of uniqueY) {
            const observed = table[x][y];
            const expected = expectedCounts[x][y];

            if (observed > 0 && expected > 0) {
                likelihoodRatio += observed * Math.log(observed / expected);
            }
        }
    }
    likelihoodRatio *= 2;

    // Mantel-Haenszel Test of Linear Association
    const pearsonCorrelation = calculatePearsonCorrelation(crosstab);
    const mantelHaenszel = grandTotal * Math.pow(pearsonCorrelation.r, 2);

    // Fisher's Exact Test dan Yates' Correction (hanya untuk tabel 2x2)
    let fisherExact = null;
    let yatesContinuity = null;

    if (uniqueX.length === 2 && uniqueY.length === 2) {
        // Fisher's Exact Test untuk tabel 2x2
        const a = table[uniqueX[0]][uniqueY[0]];
        const b = table[uniqueX[0]][uniqueY[1]];
        const c = table[uniqueX[1]][uniqueY[0]];
        const d = table[uniqueX[1]][uniqueY[1]];

        fisherExact = calculateFishersExact(a, b, c, d);

        // Yates' Continuity Correction
        const correctionTerm = Math.max(0, Math.abs(a * d - b * c) - grandTotal / 2);
        yatesContinuity = grandTotal * Math.pow(correctionTerm, 2) /
            (rowTotals[uniqueX[0]] * rowTotals[uniqueX[1]] * colTotals[uniqueY[0]] * colTotals[uniqueY[1]]);
    }

    // Hitung signifikansi (p-value) menggunakan distribusi Chi-Square
    const pearsonPValue = 1 - jStat.chisquare.cdf(pearsonChiSquare, df);
    const likelihoodPValue = 1 - jStat.chisquare.cdf(likelihoodRatio, df);
    const mantelHaenszelPValue = 1 - jStat.chisquare.cdf(mantelHaenszel, 1);
    const yatesPValue = yatesContinuity !== null ? 1 - jStat.chisquare.cdf(yatesContinuity, 1) : null;

    return {
        pearsonChiSquare: {
            value: pearsonChiSquare,
            df,
            pValue: pearsonPValue
        },
        likelihoodRatio: {
            value: likelihoodRatio,
            df,
            pValue: likelihoodPValue
        },
        mantelHaenszel: {
            value: mantelHaenszel,
            df: 1,
            pValue: mantelHaenszelPValue
        },
        fisherExact,
        yatesContinuity: yatesContinuity !== null ? {
            value: yatesContinuity,
            df: 1,
            pValue: yatesPValue
        } : null
    };
};

/**
 * Menghitung Fisher's Exact Test untuk tabel 2x2
 * @param {number} a - Nilai pada sel (1,1)
 * @param {number} b - Nilai pada sel (1,2)
 * @param {number} c - Nilai pada sel (2,1)
 * @param {number} d - Nilai pada sel (2,2)
 * @return {Object} Objek berisi p-value untuk Fisher's Exact Test
 */
const calculateFishersExact = (a, b, c, d) => {
    // Implementasi sederhana untuk Fisher's Exact Test
    // Menghitung p-value exact untuk tabel 2x2

    // Margin totals
    const n1 = a + b;
    const n2 = c + d;
    const m1 = a + c;
    const m2 = b + d;
    const n = a + b + c + d;

    // Fungsi untuk menghitung factorial
    const factorial = (num) => {
        if (num === 0 || num === 1) return 1;
        let result = 1;
        for (let i = 2; i <= num; i++) {
            result *= i;
        }
        return result;
    };

    // p-value untuk konfigurasi saat ini
    const p = (factorial(n1) * factorial(n2) * factorial(m1) * factorial(m2)) /
        (factorial(n) * factorial(a) * factorial(b) * factorial(c) * factorial(d));

    // Untuk p-value two-tailed, kita perlu menghitung p-value untuk semua konfigurasi
    // yang sama atau lebih ekstrem
    // Ini adalah pendekatan yang disederhanakan
    let pValue = 0;
    for (let i = 0; i <= Math.min(n1, m1); i++) {
        const cell_a = i;
        const cell_b = n1 - i;
        const cell_c = m1 - i;
        const cell_d = n2 - (m1 - i);

        const tableProbability = (factorial(n1) * factorial(n2) * factorial(m1) * factorial(m2)) /
            (factorial(n) * factorial(cell_a) * factorial(cell_b) * factorial(cell_c) * factorial(cell_d));

        if (tableProbability <= p) {
            pValue += tableProbability;
        }
    }

    return {
        exact1Sided: p,
        exact2Sided: pValue
    };
};

/**
 * Menghitung measures of association untuk tabel kontingensi
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @param {Object} chiSquare - Hasil dari calculateChiSquare
 * @return {Object} Objek berisi berbagai measures of association
 */
const calculateAssociationMeasures = (crosstab, chiSquare) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Phi Coefficient
    let phi = Math.sqrt(chiSquare.pearsonChiSquare.value / grandTotal);

    // Jika tabel 2x2, pastikan tanda sesuai dengan korelasi Pearson
    if (uniqueX.length === 2 && uniqueY.length === 2) {
        const a = table[uniqueX[0]][uniqueY[0]];
        const b = table[uniqueX[0]][uniqueY[1]];
        const c = table[uniqueX[1]][uniqueY[0]];
        const d = table[uniqueX[1]][uniqueY[1]];

        if (a * d < b * c) {
            phi = -phi;
        }
    }

    // Coefficient of Contingency
    const contingencyCoef = Math.sqrt(chiSquare.pearsonChiSquare.value / (chiSquare.pearsonChiSquare.value + grandTotal));

    // Cramér's V
    const cramerV = Math.sqrt(chiSquare.pearsonChiSquare.value / (grandTotal * Math.min(uniqueX.length - 1, uniqueY.length - 1)));

    return {
        phi,
        contingencyCoef,
        cramerV
    };
};

/**
 * Menghitung Lambda (measures of proportional reduction in predictive error)
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi Lambda dan error standar
 */
const calculateLambda = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Temukan maksimum untuk setiap baris dan kolom
    const rowMaxCounts = {};
    for (const x of uniqueX) {
        let maxCount = 0;
        for (const y of uniqueY) {
            if (table[x][y] > maxCount) {
                maxCount = table[x][y];
            }
        }
        rowMaxCounts[x] = maxCount;
    }

    const colMaxCounts = {};
    for (const y of uniqueY) {
        let maxCount = 0;
        for (const x of uniqueX) {
            if (table[x][y] > maxCount) {
                maxCount = table[x][y];
            }
        }
        colMaxCounts[y] = maxCount;
    }

    // Temukan maksimum row dan column total
    let maxRowTotal = 0;
    let maxRowIndex = null;
    for (const x of uniqueX) {
        if (rowTotals[x] > maxRowTotal) {
            maxRowTotal = rowTotals[x];
            maxRowIndex = x;
        }
    }

    let maxColTotal = 0;
    let maxColIndex = null;
    for (const y of uniqueY) {
        if (colTotals[y] > maxColTotal) {
            maxColTotal = colTotals[y];
            maxColIndex = y;
        }
    }

    // Hitung Lambda
    const lambdaRow = maxRowTotal > 0 ?
        (Object.values(rowMaxCounts).reduce((sum, val) => sum + val, 0) - maxColTotal) /
        (grandTotal - maxColTotal) : 0;

    const lambdaCol = maxColTotal > 0 ?
        (Object.values(colMaxCounts).reduce((sum, val) => sum + val, 0) - maxRowTotal) /
        (grandTotal - maxRowTotal) : 0;

    const lambdaSymmetric = (grandTotal - maxRowTotal - maxColTotal + Math.max(maxRowTotal, maxColTotal)) > 0 ?
        (Object.values(rowMaxCounts).reduce((sum, val) => sum + val, 0) +
            Object.values(colMaxCounts).reduce((sum, val) => sum + val, 0) -
            maxRowTotal - maxColTotal) /
        (2 * grandTotal - maxRowTotal - maxColTotal) : 0;

    // Hitung standard errors (implementasi sederhana)
    // Ini adalah pendekatan yang sangat disederhanakan untuk standard errors
    const seRow = Math.sqrt((1 - Math.pow(lambdaRow, 2)) / (grandTotal - 1));
    const seCol = Math.sqrt((1 - Math.pow(lambdaCol, 2)) / (grandTotal - 1));
    const seSymmetric = Math.sqrt((1 - Math.pow(lambdaSymmetric, 2)) / (grandTotal - 1));

    return {
        row: {
            value: lambdaRow,
            standardError: seRow
        },
        column: {
            value: lambdaCol,
            standardError: seCol
        },
        symmetric: {
            value: lambdaSymmetric,
            standardError: seSymmetric
        }
    };
};

/**
 * Menghitung Goodman dan Kruskal's Tau
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi Tau dan error standar
 */
const calculateGoodmanKruskalTau = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Hitung Tau untuk memprediksi Y dari X
    let sumSquaredColTotals = 0;
    for (const y of uniqueY) {
        sumSquaredColTotals += Math.pow(colTotals[y], 2);
    }

    let sumRowSumSquaredCells = 0;
    for (const x of uniqueX) {
        let sumSquaredCells = 0;
        for (const y of uniqueY) {
            sumSquaredCells += Math.pow(table[x][y], 2);
        }
        sumRowSumSquaredCells += sumSquaredCells;
    }

    const tauYX = (sumRowSumSquaredCells - sumSquaredColTotals / grandTotal) /
        (grandTotal * grandTotal - sumSquaredColTotals / grandTotal);

    // Hitung Tau untuk memprediksi X dari Y
    let sumSquaredRowTotals = 0;
    for (const x of uniqueX) {
        sumSquaredRowTotals += Math.pow(rowTotals[x], 2);
    }

    let sumColSumSquaredCells = 0;
    for (const y of uniqueY) {
        let sumSquaredCells = 0;
        for (const x of uniqueX) {
            sumSquaredCells += Math.pow(table[x][y], 2);
        }
        sumColSumSquaredCells += sumSquaredCells;
    }

    const tauXY = (sumColSumSquaredCells - sumSquaredRowTotals / grandTotal) /
        (grandTotal * grandTotal - sumSquaredRowTotals / grandTotal);

    // Standard errors (implementasi sederhana)
    const seYX = Math.sqrt((1 - Math.pow(tauYX, 2)) / (grandTotal - 1));
    const seXY = Math.sqrt((1 - Math.pow(tauXY, 2)) / (grandTotal - 1));

    return {
        YgivenX: {
            value: tauYX,
            standardError: seYX
        },
        XgivenY: {
            value: tauXY,
            standardError: seXY
        }
    };
};

/**
 * Menghitung Uncertainty Coefficient
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi Uncertainty Coefficient dan error standar
 */
const calculateUncertaintyCoefficient = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Hitung entropy untuk X, Y, dan XY
    let entropyX = 0;
    for (const x of uniqueX) {
        const p = rowTotals[x] / grandTotal;
        if (p > 0) {
            entropyX -= p * Math.log(p);
        }
    }

    let entropyY = 0;
    for (const y of uniqueY) {
        const p = colTotals[y] / grandTotal;
        if (p > 0) {
            entropyY -= p * Math.log(p);
        }
    }

    let entropyXY = 0;
    for (const x of uniqueX) {
        for (const y of uniqueY) {
            const p = table[x][y] / grandTotal;
            if (p > 0) {
                entropyXY -= p * Math.log(p);
            }
        }
    }

    // Hitung Uncertainty Coefficients
    const uYX = entropyY > 0 ? (entropyX + entropyY - entropyXY) / entropyY : 0;
    const uXY = entropyX > 0 ? (entropyX + entropyY - entropyXY) / entropyX : 0;

    // Symmetric Uncertainty Coefficient
    const uSymmetric = (entropyX + entropyY) > 0 ?
        2 * (entropyX + entropyY - entropyXY) / (entropyX + entropyY) : 0;

    // Standard errors (implementasi sederhana)
    const seYX = Math.sqrt((1 - Math.pow(uYX, 2)) / (grandTotal - 1));
    const seXY = Math.sqrt((1 - Math.pow(uXY, 2)) / (grandTotal - 1));
    const seSymmetric = Math.sqrt((1 - Math.pow(uSymmetric, 2)) / (grandTotal - 1));

    return {
        YgivenX: {
            value: uYX,
            standardError: seYX
        },
        XgivenY: {
            value: uXY,
            standardError: seXY
        },
        symmetric: {
            value: uSymmetric,
            standardError: seSymmetric
        }
    };
};

/**
 * Menghitung Cohen's Kappa (untuk tabel persegi)
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi Kappa dan error standar
 */
const calculateCohensKappa = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Kappa hanya didefinisikan untuk tabel persegi
    if (uniqueX.length !== uniqueY.length) {
        return {
            value: NaN,
            standardError: NaN
        };
    }

    // Pastikan kategori X dan Y sama dan dalam urutan yang sama
    for (let i = 0; i < uniqueX.length; i++) {
        if (uniqueX[i] !== uniqueY[i]) {
            return {
                value: NaN,
                standardError: NaN
            };
        }
    }

    // Hitung observed agreement
    let observedAgreement = 0;
    for (let i = 0; i < uniqueX.length; i++) {
        observedAgreement += table[uniqueX[i]][uniqueY[i]];
    }
    observedAgreement /= grandTotal;

    // Hitung expected agreement
    let expectedAgreement = 0;
    for (let i = 0; i < uniqueX.length; i++) {
        expectedAgreement += (rowTotals[uniqueX[i]] * colTotals[uniqueY[i]]) / (grandTotal * grandTotal);
    }

    // Hitung Kappa
    const kappa = (observedAgreement - expectedAgreement) / (1 - expectedAgreement);

    // Hitung variance
    let variance = 0;

    // Total terms untuk variance
    let term1 = 0;
    let term2 = 0;
    let term3 = 0;
    let term4 = 0;

    for (let i = 0; i < uniqueX.length; i++) {
        const x = uniqueX[i];
        const y = uniqueY[i];

        // theta_i
        const theta = (rowTotals[x] + colTotals[y]) / (2 * grandTotal);

        term1 += table[x][y] * Math.pow(1 - (rowTotals[x] + colTotals[y]) / (2 * grandTotal), 2);
        term2 += Math.pow(1 - theta, 2) * rowTotals[x] * colTotals[y] / grandTotal;

        for (let j = 0; j < uniqueX.length; j++) {
            if (i === j) continue;

            const x2 = uniqueX[j];
            const y2 = uniqueY[j];

            term3 += (rowTotals[x] * colTotals[y2] + colTotals[y] * rowTotals[x2]) *
                (1 - (rowTotals[x] + colTotals[y]) / (2 * grandTotal)) *
                (1 - (rowTotals[x2] + colTotals[y2]) / (2 * grandTotal));

            term4 += rowTotals[x] * colTotals[y2] * colTotals[y] * rowTotals[x2] / Math.pow(grandTotal, 3);
        }
    }

    variance = (1 / (grandTotal * Math.pow(1 - expectedAgreement, 4))) *
        (term1 * Math.pow(1 - expectedAgreement, 2) -
            term2 * 2 * (1 - expectedAgreement) * (1 - observedAgreement) +
            Math.pow(1 - observedAgreement, 2) * (term3 - term4 * Math.pow(1 - expectedAgreement, 2)));

    const standardError = Math.sqrt(variance);

    return {
        value: kappa,
        standardError
    };
};

/**
 * Menghitung Kendall's Tau-b dan Tau-c
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi Tau-b, Tau-c, dan error standar
 */
const calculateKendallsTau = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Hitung P (concordant pairs) dan Q (discordant pairs)
    let P = 0;
    let Q = 0;

    for (let i = 0; i < uniqueX.length; i++) {
        const x1 = uniqueX[i];
        for (let j = i + 1; j < uniqueX.length; j++) {
            const x2 = uniqueX[j];

            for (let k = 0; k < uniqueY.length; k++) {
                const y1 = uniqueY[k];
                for (let l = k + 1; l < uniqueY.length; l++) {
                    const y2 = uniqueY[l];

                    // Hitung kontribusi untuk P dan Q
                    const n11 = table[x1][y1];
                    const n12 = table[x1][y2];
                    const n21 = table[x2][y1];
                    const n22 = table[x2][y2];

                    P += n11 * n22;
                    Q += n12 * n21;
                }
            }
        }
    }

    // Dalam dokumen, P dan Q adalah double dari "usual", jadi kita mengalikan dengan 2
    P *= 2;
    Q *= 2;

    // Hitung Tx dan Ty
    let Tx = 0;
    for (const x of uniqueX) {
        Tx += rowTotals[x] * (rowTotals[x] - 1);
    }

    let Ty = 0;
    for (const y of uniqueY) {
        Ty += colTotals[y] * (colTotals[y] - 1);
    }

    // Tx dan Ty juga double dari "usual"
    Tx *= 2;
    Ty *= 2;

    // Hitung m dan n untuk Tau-c
    const m = Math.min(uniqueX.length, uniqueY.length);

    // Hitung Tau-b
    const tauB = (P - Q) / Math.sqrt((P + Q + Tx) * (P + Q + Ty));

    // Hitung Tau-c
    const tauC = (m * (P - Q)) / (grandTotal * grandTotal * (m - 1));

    // Hitung standard errors
    const N = grandTotal;
    let varTauB = 0;

    // Variance untuk Tau-b
    // Ini adalah pendekatan yang disederhanakan
    varTauB = 4 / (N * (N - 1)) * (
        (N * (N - 1) * (2 * N + 5) - Tx * (2 * N + 5) - Ty * (2 * N + 5) + 3 * Tx * Ty / (N * (N - 1))) / 9 +
        (P + Q) / (2 * (N - 2)) +
        (Tx * Ty) / (9 * N * (N - 1) * (N - 2))
    );

    // Variance untuk Tau-c
    const varTauC = 4 * (1 - tauC * tauC) / (N * (m - 1) * (m - 1));

    return {
        tauB: {
            value: tauB,
            standardError: Math.sqrt(varTauB)
        },
        tauC: {
            value: tauC,
            standardError: Math.sqrt(varTauC)
        }
    };
};

/**
 * Menghitung Gamma
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi Gamma dan error standar
 */
const calculateGamma = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Hitung P (concordant pairs) dan Q (discordant pairs)
    let P = 0;
    let Q = 0;

    for (let i = 0; i < uniqueX.length; i++) {
        const x1 = uniqueX[i];
        for (let j = i + 1; j < uniqueX.length; j++) {
            const x2 = uniqueX[j];

            for (let k = 0; k < uniqueY.length; k++) {
                const y1 = uniqueY[k];
                for (let l = k + 1; l < uniqueY.length; l++) {
                    const y2 = uniqueY[l];

                    // Hitung kontribusi untuk P dan Q
                    const n11 = table[x1][y1];
                    const n12 = table[x1][y2];
                    const n21 = table[x2][y1];
                    const n22 = table[x2][y2];

                    P += n11 * n22;
                    Q += n12 * n21;
                }
            }
        }
    }

    // Dalam dokumen, P dan Q adalah double dari "usual", jadi kita mengalikan dengan 2
    P *= 2;
    Q *= 2;

    // Hitung Gamma
    const gamma = (P - Q) / (P + Q);

    // Hitung standard error
    // Pendekatan yang disederhanakan
    const varGamma = 4 * (1 - gamma * gamma) * (1 - gamma * gamma) / (P + Q);

    return {
        value: gamma,
        standardError: Math.sqrt(varGamma)
    };
};

/**
 * Menghitung Somers' d
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi Somers' d dan error standar
 */
const calculateSomersD = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Hitung P (concordant pairs) dan Q (discordant pairs)
    let P = 0;
    let Q = 0;

    for (let i = 0; i < uniqueX.length; i++) {
        const x1 = uniqueX[i];
        for (let j = i + 1; j < uniqueX.length; j++) {
            const x2 = uniqueX[j];

            for (let k = 0; k < uniqueY.length; k++) {
                const y1 = uniqueY[k];
                for (let l = k + 1; l < uniqueY.length; l++) {
                    const y2 = uniqueY[l];

                    // Hitung kontribusi untuk P dan Q
                    const n11 = table[x1][y1];
                    const n12 = table[x1][y2];
                    const n21 = table[x2][y1];
                    const n22 = table[x2][y2];

                    P += n11 * n22;
                    Q += n12 * n21;
                }
            }
        }
    }

    // Dalam dokumen, P dan Q adalah double dari "usual", jadi kita mengalikan dengan 2
    P *= 2;
    Q *= 2;

    // Hitung Tx dan Ty
    let Tx = 0;
    for (const x of uniqueX) {
        Tx += rowTotals[x] * (rowTotals[x] - 1);
    }

    let Ty = 0;
    for (const y of uniqueY) {
        Ty += colTotals[y] * (colTotals[y] - 1);
    }

    // Tx dan Ty juga double dari "usual"
    Tx *= 2;
    Ty *= 2;

    // Hitung Somers' d
    const dYX = (P - Q) / (P + Q + Ty); // Y dependent, X independent
    const dXY = (P - Q) / (P + Q + Tx); // X dependent, Y independent
    const dSymmetric = (P - Q) / ((P + Q) + (Tx + Ty) / 2);

    // Hitung standard errors
    // Ini adalah pendekatan yang disederhanakan
    const varDYX = 4 * (1 - dYX * dYX) * (1 - dYX * dYX) / (P + Q + Ty);
    const varDXY = 4 * (1 - dXY * dXY) * (1 - dXY * dXY) / (P + Q + Tx);

    // Untuk symmetric d, kita gunakan pendekatan berdasarkan variance of Kendall's tau-b
    const kendallsTau = calculateKendallsTau(crosstab);
    const varTauB = Math.pow(kendallsTau.tauB.standardError, 2);

    return {
        YdependentX: {
            value: dYX,
            standardError: Math.sqrt(varDYX)
        },
        XdependentY: {
            value: dXY,
            standardError: Math.sqrt(varDXY)
        },
        symmetric: {
            value: dSymmetric,
            standardError: Math.sqrt(varTauB) // Menggunakan variance of Kendall's tau-b
        }
    };
};

/**
 * Menghitung Pearson's Correlation (r)
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi r dan error standar
 */
const calculatePearsonCorrelation = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Konversi nilai kategori ke nilai numerik untuk perhitungan
    const xValues = uniqueX.map(x => parseFloat(x));
    const yValues = uniqueY.map(y => parseFloat(y));

    // Hitung mean untuk X dan Y
    let xMean = 0;
    for (let i = 0; i < xValues.length; i++) {
        xMean += xValues[i] * rowTotals[uniqueX[i]];
    }
    xMean /= grandTotal;

    let yMean = 0;
    for (let i = 0; i < yValues.length; i++) {
        yMean += yValues[i] * colTotals[uniqueY[i]];
    }
    yMean /= grandTotal;

    // Hitung covariance dan variances
    let covariance = 0;
    let xVariance = 0;
    let yVariance = 0;

    for (let i = 0; i < xValues.length; i++) {
        for (let j = 0; j < yValues.length; j++) {
            covariance += table[uniqueX[i]][uniqueY[j]] * (xValues[i] - xMean) * (yValues[j] - yMean);

            if (j === 0) {
                xVariance += rowTotals[uniqueX[i]] * Math.pow(xValues[i] - xMean, 2);
            }

            if (i === 0) {
                yVariance += colTotals[uniqueY[j]] * Math.pow(yValues[j] - yMean, 2);
            }
        }
    }

    // Hitung Pearson's r
    const r = covariance / Math.sqrt(xVariance * yVariance);

    // Hitung standard error
    // Pendekatan yang disederhanakan
    const standardError = Math.sqrt((1 - r * r) / (grandTotal - 2));

    return {
        r,
        standardError
    };
};

/**
 * Menghitung Spearman's Rank Correlation
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi rho dan error standar
 */
const calculateSpearmanCorrelation = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Assign ranks untuk X dan Y
    const xRanks = {};
    for (let i = 0; i < uniqueX.length; i++) {
        xRanks[uniqueX[i]] = i + 1; // Rank dimulai dari 1
    }

    const yRanks = {};
    for (let i = 0; i < uniqueY.length; i++) {
        yRanks[uniqueY[i]] = i + 1; // Rank dimulai dari 1
    }

    // Buat crosstab baru dengan menggunakan ranks
    const rankCrosstab = {
        table: {},
        uniqueX: Object.values(xRanks),
        uniqueY: Object.values(yRanks),
        rowTotals: {},
        colTotals: {},
        grandTotal: grandTotal
    };

    // Isi tabel dengan ranks
    for (const x of uniqueX) {
        rankCrosstab.table[xRanks[x]] = {};
        for (const y of uniqueY) {
            rankCrosstab.table[xRanks[x]][yRanks[y]] = table[x][y];
        }
    }

    // Isi row dan column totals
    for (const x of uniqueX) {
        rankCrosstab.rowTotals[xRanks[x]] = rowTotals[x];
    }

    for (const y of uniqueY) {
        rankCrosstab.colTotals[yRanks[y]] = colTotals[y];
    }

    // Gunakan Pearson's correlation pada ranks
    return calculatePearsonCorrelation(rankCrosstab);
};

/**
 * Menghitung Eta (Correlation Ratio)
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi eta untuk X dependent dan Y dependent
 */
const calculateEta = (crosstab) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Konversi nilai kategori ke nilai numerik untuk perhitungan
    const xValues = uniqueX.map(x => parseFloat(x));
    const yValues = uniqueY.map(y => parseFloat(y));

    // Hitung mean untuk X dan Y
    let xMean = 0;
    for (let i = 0; i < xValues.length; i++) {
        xMean += xValues[i] * rowTotals[uniqueX[i]];
    }
    xMean /= grandTotal;

    let yMean = 0;
    for (let i = 0; i < yValues.length; i++) {
        yMean += yValues[i] * colTotals[uniqueY[i]];
    }
    yMean /= grandTotal;

    // Hitung variance Y total
    let yTotalVariance = 0;
    for (let j = 0; j < yValues.length; j++) {
        for (let i = 0; i < xValues.length; i++) {
            yTotalVariance += table[uniqueX[i]][uniqueY[j]] * Math.pow(yValues[j] - yMean, 2);
        }
    }

    // Hitung variance Y within (dengan X sebagai kategori)
    let yWithinVariance = 0;
    for (let i = 0; i < xValues.length; i++) {
        // Hitung mean Y untuk kategori X tertentu
        let yMeanForX = 0;
        for (let j = 0; j < yValues.length; j++) {
            yMeanForX += yValues[j] * table[uniqueX[i]][uniqueY[j]];
        }
        yMeanForX /= rowTotals[uniqueX[i]] || 1; // Hindari pembagian dengan 0

        // Hitung variance Y within X
        for (let j = 0; j < yValues.length; j++) {
            yWithinVariance += table[uniqueX[i]][uniqueY[j]] * Math.pow(yValues[j] - yMeanForX, 2);
        }
    }

    // Hitung variance X total
    let xTotalVariance = 0;
    for (let i = 0; i < xValues.length; i++) {
        for (let j = 0; j < yValues.length; j++) {
            xTotalVariance += table[uniqueX[i]][uniqueY[j]] * Math.pow(xValues[i] - xMean, 2);
        }
    }

    // Hitung variance X within (dengan Y sebagai kategori)
    let xWithinVariance = 0;
    for (let j = 0; j < yValues.length; j++) {
        // Hitung mean X untuk kategori Y tertentu
        let xMeanForY = 0;
        for (let i = 0; i < xValues.length; i++) {
            xMeanForY += xValues[i] * table[uniqueX[i]][uniqueY[j]];
        }
        xMeanForY /= colTotals[uniqueY[j]] || 1; // Hindari pembagian dengan 0

        // Hitung variance X within Y
        for (let i = 0; i < xValues.length; i++) {
            xWithinVariance += table[uniqueX[i]][uniqueY[j]] * Math.pow(xValues[i] - xMeanForY, 2);
        }
    }

    // Hitung Eta
    const etaYdependentX = Math.sqrt(1 - yWithinVariance / yTotalVariance);
    const etaXdependentY = Math.sqrt(1 - xWithinVariance / xTotalVariance);

    return {
        YdependentX: etaYdependentX,
        XdependentY: etaXdependentY
    };
};

/**
 * Menghitung Relative Risk untuk tabel 2x2
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @param {number} confidenceLevel - Tingkat kepercayaan (default: 0.95)
 * @return {Object} Objek berisi Relative Risk dan confidence interval
 */
const calculateRelativeRisk = (crosstab, confidenceLevel = 0.95) => {
    const { table, uniqueX, uniqueY, rowTotals, colTotals, grandTotal } = crosstab;

    // Relative Risk hanya didefinisikan untuk tabel 2x2
    if (uniqueX.length !== 2 || uniqueY.length !== 2) {
        return {
            value: NaN,
            confidenceInterval: { lower: NaN, upper: NaN }
        };
    }

    // Ekstrak nilai sel
    const a = table[uniqueX[0]][uniqueY[0]];
    const b = table[uniqueX[0]][uniqueY[1]];
    const c = table[uniqueX[1]][uniqueY[0]];
    const d = table[uniqueX[1]][uniqueY[1]];

    // Hitung Relative Risk untuk case-control study
    const relativeRisk = (a * d) / (b * c);

    // Hitung confidence interval
    // Pendekatan yang disederhanakan
    const z = confidenceLevel === 0.95 ? 1.96 : (confidenceLevel === 0.99 ? 2.576 : 1.96);

    const logRR = Math.log(relativeRisk);
    const seLogRR = Math.sqrt(1/a + 1/b + 1/c + 1/d);

    const lowerCI = Math.exp(logRR - z * seLogRR);
    const upperCI = Math.exp(logRR + z * seLogRR);

    return {
        value: relativeRisk,
        confidenceInterval: {
            lower: lowerCI,
            upper: upperCI
        }
    };
};

/**
 * Menghitung McNemar-Bowker's Test untuk tabel persegi
 * @param {Object} crosstab - Hasil dari createCrosstab
 * @return {Object} Objek berisi statistik dan signifikansi
 */
const calculateMcNemarBowker = (crosstab) => {
    const { table, uniqueX, uniqueY, grandTotal } = crosstab;

    // Test ini hanya untuk tabel persegi
    if (uniqueX.length !== uniqueY.length) {
        return {
            statistic: NaN,
            df: NaN,
            pValue: NaN
        };
    }

    // Pastikan kategori X dan Y sama dan dalam urutan yang sama
    for (let i = 0; i < uniqueX.length; i++) {
        if (uniqueX[i] !== uniqueY[i]) {
            return {
                statistic: NaN,
                df: NaN,
                pValue: NaN
            };
        }
    }

    // Hitung McNemar-Bowker statistic
    let mcNemarBowker = 0;
    for (let i = 0; i < uniqueX.length; i++) {
        for (let j = i + 1; j < uniqueX.length; j++) {
            const nij = table[uniqueX[i]][uniqueY[j]];
            const nji = table[uniqueX[j]][uniqueY[i]];

            if (nij + nji > 0) {
                mcNemarBowker += Math.pow(nij - nji, 2) / (nij + nji);
            }
        }
    }

    // Degrees of freedom
    const df = (uniqueX.length * (uniqueX.length - 1)) / 2;

    // Hitung p-value menggunakan distribusi Chi-Square
    const pValue = 1 - jStat.chisquare.cdf(mcNemarBowker, df);

    // Untuk tabel 2x2, ini adalah McNemar's test klasik
    if (uniqueX.length === 2) {
        // Untuk kasus 2x2, kita bisa menghitung exact p-value
        const n12 = table[uniqueX[0]][uniqueY[1]];
        const n21 = table[uniqueX[1]][uniqueY[0]];

        // Two-tailed probability level untuk McNemar's test
        const exactPValue = 2 * jStat.binomial.cdf(Math.min(n12, n21), n12 + n21, 0.5);

        return {
            statistic: mcNemarBowker,
            df: 1,
            pValue,
            exactPValue
        };
    }

    return {
        statistic: mcNemarBowker,
        df,
        pValue
    };
};

/**
 * Simplified jStat implementation for statistical distributions
 * Ini hanya implementasi sederhana untuk kebutuhan khusus dalam modul ini
 */
const jStat = {
    // Chi-square CDF
    chisquare: {
        cdf: function(x, df) {
            if (x <= 0) return 0;

            // Untuk df kecil, kita gunakan penghitungan eksplisit
            if (df === 1) {
                return 2 * this.normal.cdf(Math.sqrt(x), 0, 1) - 1;
            } else if (df === 2) {
                return 1 - Math.exp(-x / 2);
            }

            // Untuk df lainnya, kita gunakan pendekatan normal
            const z = Math.sqrt(2 * x) - Math.sqrt(2 * df - 1);
            return this.normal.cdf(z, 0, 1);
        }
    },

    // Normal CDF
    normal: {
        cdf: function(x, mean = 0, std = 1) {
            const z = (x - mean) / std;
            return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
        }
    },

    // Error function
    erf: function(x) {
        // Pendekatan untuk error function
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    },

    // Binomial CDF
    binomial: {
        cdf: function(x, n, p) {
            if (x < 0) return 0;
            if (x >= n) return 1;

            let sum = 0;
            for (let i = 0; i <= x; i++) {
                sum += this.pmf(i, n, p);
            }

            return sum;
        },

        pmf: function(k, n, p) {
            if (k < 0 || k > n) return 0;

            // Fungsi untuk menghitung kombinasi (n choose k)
            const combinations = function(n, k) {
                if (k < 0 || k > n) return 0;
                if (k === 0 || k === n) return 1;

                let result = 1;
                for (let i = 1; i <= k; i++) {
                    result *= (n - (k - i)) / i;
                }

                return result;
            };

            return combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        }
    }
};

/**
 * Menghitung semua statistik CROSSTABS untuk tabel kontingensi
 * @param {Array<*>} xValues - Array nilai variabel baris
 * @param {Array<*>} yValues - Array nilai variabel kolom
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {Object} options - Objek berisi opsi tambahan
 * @return {Object} Objek berisi semua statistik CROSSTABS
 */
const calculateCrosstabs = (xValues, yValues, weights = null, options = {}) => {
    // Buat crosstab
    const crosstab = createCrosstab(xValues, yValues, weights);

    // Hitung expected counts
    const expectedCounts = calculateExpectedCounts(crosstab);

    // Hitung persentase
    const percentages = calculatePercentages(crosstab);

    // Hitung residual
    const residuals = calculateResiduals(crosstab, expectedCounts);

    // Hitung statistik Chi-Square
    const chiSquare = calculateChiSquare(crosstab, expectedCounts);

    // Hitung measures of association
    const associationMeasures = calculateAssociationMeasures(crosstab, chiSquare);

    // Hitung lambda
    const lambda = calculateLambda(crosstab);

    // Hitung Goodman dan Kruskal's Tau
    const goodmanKruskalTau = calculateGoodmanKruskalTau(crosstab);

    // Hitung Uncertainty Coefficient
    const uncertaintyCoefficient = calculateUncertaintyCoefficient(crosstab);

    // Hitung Cohen's Kappa (untuk tabel persegi)
    const cohensKappa = calculateCohensKappa(crosstab);

    // Hitung Kendall's Tau
    const kendallsTau = calculateKendallsTau(crosstab);

    // Hitung Gamma
    const gamma = calculateGamma(crosstab);

    // Hitung Somers' d
    const somersD = calculateSomersD(crosstab);

    // Hitung Pearson's Correlation
    const pearsonCorrelation = calculatePearsonCorrelation(crosstab);

    // Hitung Spearman's Correlation
    const spearmanCorrelation = calculateSpearmanCorrelation(crosstab);

    // Hitung Eta
    const eta = calculateEta(crosstab);

    // Hitung Relative Risk (untuk tabel 2x2)
    const relativeRisk = calculateRelativeRisk(crosstab, options.confidenceLevel || 0.95);

    // Hitung McNemar-Bowker's Test (untuk tabel persegi)
    const mcNemarBowker = calculateMcNemarBowker(crosstab);

    return {
        crosstab,
        expectedCounts,
        percentages,
        residuals,
        chiSquare,
        associationMeasures,
        lambda,
        goodmanKruskalTau,
        uncertaintyCoefficient,
        cohensKappa,
        kendallsTau,
        gamma,
        somersD,
        pearsonCorrelation,
        spearmanCorrelation,
        eta,
        relativeRisk,
        mcNemarBowker
    };
};

// Export semua fungsi
export {
    createCrosstab,
    calculateExpectedCounts,
    calculatePercentages,
    calculateResiduals,
    calculateChiSquare,
    calculateAssociationMeasures,
    calculateLambda,
    calculateGoodmanKruskalTau,
    calculateUncertaintyCoefficient,
    calculateCohensKappa,
    calculateKendallsTau,
    calculateGamma,
    calculateSomersD,
    calculatePearsonCorrelation,
    calculateSpearmanCorrelation,
    calculateEta,
    calculateRelativeRisk,
    calculateMcNemarBowker,
    calculateCrosstabs
};