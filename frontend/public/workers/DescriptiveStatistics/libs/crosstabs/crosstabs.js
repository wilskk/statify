// importScripts('../utils/utils.js'); // Commented out for tests - utils.js loaded separately

class CrosstabsCalculator {
    constructor({ variable, data, weights, options }) {
        if (!variable || !variable.row || !variable.col) {
            throw new Error("Definisi variabel baris dan kolom diperlukan.");
        }
        this.rowVar = variable.row;
        this.colVar = variable.col;
        this.data = data;
        this.weights = weights;
        this.options = options || {};

        this.initialized = false;
        this.memo = {};

        this.table = []; 
        this.rowTotals = []; 
        this.colTotals = []; 
        this.rowCategories = []; 
        this.colCategories = []; 
        this.W = 0; 
        this.validWeight = 0; 
        this.missingWeight = 0; 
        this.R = 0; 
        this.C = 0;

        // Periksa apakah data baris atau kolom mengandung tanggal dd-mm-yyyy
        const rowData = this.data.map(d => d[this.rowVar.name]);
        const colData = this.data.map(d => d[this.colVar.name]);
        
        this.isRowDateData = rowData.some(value => 
            typeof value === 'string' && isDateString(value)
        );
        this.isColDateData = colData.some(value => 
            typeof value === 'string' && isDateString(value)
        );
    }

    #initialize() {
        if (this.initialized) return;

        const rowData = this.data.map(d => d[this.rowVar.name]);
        const colData = this.data.map(d => d[this.colVar.name]);

        const rowCatSet = new Set();
        const colCatSet = new Set();
        
        for (let i = 0; i < this.data.length; i++) {
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (typeof weight !== 'number' || weight <= 0) continue;

            // Konversi data tanggal ke SPSS seconds jika diperlukan
            let processedRowValue = rowData[i];
            let processedColValue = colData[i];
            
            if (this.isRowDateData && typeof rowData[i] === 'string' && isDateString(rowData[i])) {
                processedRowValue = dateStringToSpssSeconds(rowData[i]);
            }
            if (this.isColDateData && typeof colData[i] === 'string' && isDateString(colData[i])) {
                processedColValue = dateStringToSpssSeconds(colData[i]);
            }

            const isRowMissing = checkIsMissing(processedRowValue, this.rowVar.missing, isNumeric(processedRowValue));
            const isColMissing = checkIsMissing(processedColValue, this.colVar.missing, isNumeric(processedColValue));

            if (!isRowMissing && !isColMissing) {
                rowCatSet.add(processedRowValue);
                colCatSet.add(processedColValue);
                this.validWeight += weight;
            } else {
                this.missingWeight += weight;
            }
        }
        
        this.rowCategories = Array.from(rowCatSet).sort((a, b) => a - b);
        this.colCategories = Array.from(colCatSet).sort((a, b) => a - b);
        this.R = this.rowCategories.length;
        this.C = this.colCategories.length;
        
        this.table = Array(this.R).fill(0).map(() => Array(this.C).fill(0));
        this.rowTotals = Array(this.R).fill(0);
        this.colTotals = Array(this.C).fill(0);

        for (let i = 0; i < this.data.length; i++) {
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            
            // Konversi data tanggal ke SPSS seconds jika diperlukan
            let processedRowValue = rowData[i];
            let processedColValue = colData[i];
            
            if (this.isRowDateData && typeof rowData[i] === 'string' && isDateString(rowData[i])) {
                processedRowValue = dateStringToSpssSeconds(rowData[i]);
            }
            if (this.isColDateData && typeof colData[i] === 'string' && isDateString(colData[i])) {
                processedColValue = dateStringToSpssSeconds(colData[i]);
            }
            
            const isRowMissing = checkIsMissing(processedRowValue, this.rowVar.missing, isNumeric(processedRowValue));
            const isColMissing = checkIsMissing(processedColValue, this.colVar.missing, isNumeric(processedColValue));

            if (isRowMissing || isColMissing || typeof weight !== 'number' || weight <= 0) continue;

            const rowIndex = this.rowCategories.indexOf(processedRowValue);
            const colIndex = this.colCategories.indexOf(processedColValue);

            if (rowIndex > -1 && colIndex > -1) {
                this.table[rowIndex][colIndex] += weight;
                this.rowTotals[rowIndex] += weight;
                this.colTotals[colIndex] += weight;
                this.W += weight; 
            }
        }

        this.initialized = true;
    }
    
    _getExpectedCount(i, j) {
        this.#initialize();
        if (this.W === 0) return null;
        const expected = (this.rowTotals[i] * this.colTotals[j]) / this.W;
        return toSPSSFixed(expected, 1);
    }
    
    _calculateConcordantDiscordant() {
        if (this.memo.concordantDiscordant) return this.memo.concordantDiscordant;
        this.#initialize();

        const S = Array(this.R + 1).fill(0).map(() => Array(this.C + 1).fill(0));
        for (let i = this.R - 1; i >= 0; i--) {
            for (let j = this.C - 1; j >= 0; j--) {
                S[i][j] = this.table[i][j] + S[i+1][j] + S[i][j+1] - S[i+1][j+1];
            }
        }
        
        let P = 0;
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                if (this.table[i][j] > 0) {
                    P += this.table[i][j] * S[i+1][j+1];
                }
            }
        }

        const T = Array(this.R + 1).fill(0).map(() => Array(this.C + 1).fill(0));
        for (let i = this.R - 1; i >= 0; i--) {
            for (let j = 0; j < this.C; j++) {
                 T[i][j] = this.table[i][j] + T[i+1][j] + (j > 0 ? T[i][j-1] : 0) - (j > 0 ? T[i+1][j-1] : 0);
            }
        }

        let Q = 0;
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                if (this.table[i][j] > 0) {
                    Q += this.table[i][j] * (j > 0 ? T[i+1][j-1] : 0);
                }
            }
        }

        const sumRowTotalsSq = this.rowTotals.reduce((sum, r_i) => sum + r_i * r_i, 0);
        const D_r = this.W * this.W - sumRowTotalsSq;
        
        const sumColTotalsSq = this.colTotals.reduce((sum, c_j) => sum + c_j * c_j, 0);
        const D_c = this.W * this.W - sumColTotalsSq;
        
        this.memo.concordantDiscordant = { P, Q, D_r, D_c };
        return this.memo.concordantDiscordant;
    }

    getPearsonChiSquare() {
        if (this.memo.pearsonChi2) return this.memo.pearsonChi2;
        this.#initialize();
        if (this.W === 0 || this.R < 2 || this.C < 2) return null;

        let chiSquare = 0;
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                const observed = this.table[i][j];
                const expected = this._getExpectedCount(i, j);
                if (expected > 0) {
                    chiSquare += Math.pow(observed - expected, 2) / expected;
                }
            }
        }
        
        const df = (this.R - 1) * (this.C - 1);
        if (df <= 0) return null;
        
        this.memo.pearsonChi2 = { value: chiSquare, df };
        return this.memo.pearsonChi2;
    }

    getLikelihoodRatioChiSquare() {
        if (this.memo.lrChi2) return this.memo.lrChi2;
        this.#initialize();
        if (this.W === 0 || this.R < 2 || this.C < 2) return null;

        let chiSquareLR = 0;
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                const observed = this.table[i][j];
                const expected = this._getExpectedCount(i, j);
                if (observed > 0 && expected > 0) {
                    chiSquareLR += observed * Math.log(observed / expected);
                }
            }
        }
        
        const df = (this.R - 1) * (this.C - 1);
        if (df <= 0) return null;

        this.memo.lrChi2 = { value: 2 * chiSquareLR, df };
        return this.memo.lrChi2;
    }
    
    getPhi() {
        const chi2 = this.getPearsonChiSquare();
        if (!chi2 || this.W === 0) return null;
        return Math.sqrt(chi2.value / this.W);
    }
    
    getContingencyCoefficient() {
        const chi2 = this.getPearsonChiSquare();
        if (!chi2 || this.W === 0) return null;
        return Math.sqrt(chi2.value / (chi2.value + this.W));
    }

    getCramersV() {
        const chi2 = this.getPearsonChiSquare();
        if (!chi2 || this.W === 0) return null;
        
        const q = Math.min(this.R, this.C);
        if (q <= 1) return null;

        return Math.sqrt(chi2.value / (this.W * (q - 1)));
    }
    
    getGamma() {
        const { P, Q } = this._calculateConcordantDiscordant();
        const denominator = P + Q;
        return denominator === 0 ? null : (P - Q) / denominator;
    }
    
    getKendallsTauB() {
        const { P, Q, D_r, D_c } = this._calculateConcordantDiscordant();
        const denominator = Math.sqrt(D_r * D_c);
        return denominator === 0 ? null : (P - Q) / denominator;
    }

    getKendallsTauC() {
        const { P, Q } = this._calculateConcordantDiscordant();
        const q = Math.min(this.R, this.C);
        if (q <= 1 || this.W === 0) return null;
        
        const numerator = 2 * q * (P - Q);
        const denominator = this.W * this.W * (q - 1);
        return denominator === 0 ? null : numerator / denominator;
    }
    
    getSomersD() {
        const { P, Q, D_r, D_c } = this._calculateConcordantDiscordant();
        return {
            rowDependent: D_c === 0 ? null : (P - Q) / D_c,
            colDependent: D_r === 0 ? null : (P - Q) / D_r,
            symmetric: (D_r + D_c) === 0 ? null : (P - Q) / (0.5 * (D_r + D_c))
        };
    }
    
    getLambda() {
        if (this.memo.lambda) return this.memo.lambda;
        this.#initialize();
        if(this.W === 0) return { colDependent: null, rowDependent: null, symmetric: null };

        let sum_f_im = 0;
        for (let i = 0; i < this.R; i++) {
             if(this.table[i].length > 0) sum_f_im += Math.max(...this.table[i]);
        }
        const c_m = this.colTotals.length > 0 ? Math.max(...this.colTotals) : 0;
        const lambda_Y_given_X = (this.W - c_m) === 0 ? 0 : (sum_f_im - c_m) / (this.W - c_m);

        let sum_f_mj = 0;
        for (let j = 0; j < this.C; j++) {
            let maxInCol = 0;
            for (let i = 0; i < this.R; i++) {
                if(this.table[i][j] > maxInCol) maxInCol = this.table[i][j];
            }
            sum_f_mj += maxInCol;
        }
        const r_m = this.rowTotals.length > 0 ? Math.max(...this.rowTotals) : 0;
        const lambda_X_given_Y = (this.W - r_m) === 0 ? 0 : (sum_f_mj - r_m) / (this.W - r_m);

        const sym_num = sum_f_im + sum_f_mj - c_m - r_m;
        const sym_den = 2 * this.W - c_m - r_m;
        const lambda_symmetric = sym_den === 0 ? 0 : sym_num / sym_den;
        
        this.memo.lambda = {
            colDependent: lambda_Y_given_X,
            rowDependent: lambda_X_given_Y,
            symmetric: lambda_symmetric,
        };
        return this.memo.lambda;
    }

    getGoodmanKruskalTau() {
        if (this.memo.gkTau) return this.memo.gkTau;
        this.#initialize();
        if(this.W === 0) return { colDependent: null, rowDependent: null };

        let term1_Y = 0;
        for (let i = 0; i < this.R; i++) {
            if (this.rowTotals[i] > 0) {
                for (let j = 0; j < this.C; j++) {
                    term1_Y += (this.table[i][j] * this.table[i][j]) / this.rowTotals[i];
                }
            }
        }
        const sum_cj_sq = this.colTotals.reduce((sum, cj) => sum + cj*cj, 0);
        const tau_Y_den = this.W * this.W - sum_cj_sq;
        const tau_Y_given_X = tau_Y_den === 0 ? 0 : (this.W * term1_Y - sum_cj_sq) / tau_Y_den;
        
        let term1_X = 0;
        for (let j = 0; j < this.C; j++) {
            if (this.colTotals[j] > 0) {
                for (let i = 0; i < this.R; i++) {
                    term1_X += (this.table[i][j] * this.table[i][j]) / this.colTotals[j];
                }
            }
        }
        const sum_ri_sq = this.rowTotals.reduce((sum, ri) => sum + ri*ri, 0);
        const tau_X_den = this.W * this.W - sum_ri_sq;
        const tau_X_given_Y = tau_X_den === 0 ? 0 : (this.W * term1_X - sum_ri_sq) / tau_X_den;

        this.memo.gkTau = {
            colDependent: tau_Y_given_X,
            rowDependent: tau_X_given_Y,
        };
        return this.memo.gkTau;
    }

    getCorrelations() {
        if (this.memo.correlations) return this.memo.correlations;
        this.#initialize();

        const rowScores = this.rowCategories.map((cat, idx) => isNumeric(cat) ? parseFloat(cat) : idx);
        const colScores = this.colCategories.map((cat, idx) => isNumeric(cat) ? parseFloat(cat) : idx);

        let sum_XYf = 0, sum_Xr = 0, sum_Yc = 0, sum_X2r = 0, sum_Y2c = 0;
        for (let i = 0; i < this.R; i++) {
            sum_Xr += rowScores[i] * this.rowTotals[i];
            sum_X2r += rowScores[i] * rowScores[i] * this.rowTotals[i];
        }
        for (let j = 0; j < this.C; j++) {
            sum_Yc += colScores[j] * this.colTotals[j];
            sum_Y2c += colScores[j] * colScores[j] * this.colTotals[j];
        }
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                sum_XYf += rowScores[i] * colScores[j] * this.table[i][j];
            }
        }
        const cov_XY = sum_XYf - (sum_Xr * sum_Yc) / this.W;
        const S_X = sum_X2r - (sum_Xr * sum_Xr) / this.W;
        const S_Y = sum_Y2c - (sum_Yc * sum_Yc) / this.W;
        const pearson_r = (S_X <= 0 || S_Y <= 0) ? null : cov_XY / Math.sqrt(S_X * S_Y);

        let cum_row_total = 0;
        const rowRankScores = this.rowTotals.map(r_i => {
            const score = cum_row_total + (r_i + 1) / 2;
            cum_row_total += r_i;
            return score;
        });
        
        let cum_col_total = 0;
        const colRankScores = this.colTotals.map(c_j => {
            const score = cum_col_total + (c_j + 1) / 2;
            cum_col_total += c_j;
            return score;
        });

        let spearman_sum_XYf = 0, spearman_sum_Xr = 0, spearman_sum_Yc = 0, spearman_sum_X2r = 0, spearman_sum_Y2c = 0;
        for (let i = 0; i < this.R; i++) {
            spearman_sum_Xr += rowRankScores[i] * this.rowTotals[i];
            spearman_sum_X2r += rowRankScores[i] * rowRankScores[i] * this.rowTotals[i];
        }
        for (let j = 0; j < this.C; j++) {
            spearman_sum_Yc += colRankScores[j] * this.colTotals[j];
            spearman_sum_Y2c += colRankScores[j] * colRankScores[j] * this.colTotals[j];
        }
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                spearman_sum_XYf += rowRankScores[i] * colRankScores[j] * this.table[i][j];
            }
        }
        
        const spearman_cov_XY = spearman_sum_XYf - (spearman_sum_Xr * spearman_sum_Yc) / this.W;
        const spearman_S_X = spearman_sum_X2r - (spearman_sum_Xr * spearman_sum_Xr) / this.W;
        const spearman_S_Y = spearman_sum_Y2c - (spearman_sum_Yc * spearman_sum_Yc) / this.W;
        const spearman_rho = (spearman_S_X <= 0 || spearman_S_Y <= 0) ? null : spearman_cov_XY / Math.sqrt(spearman_S_X * spearman_S_Y);

        this.memo.correlations = { pearson: pearson_r, spearman: spearman_rho };
        return this.memo.correlations;
    }
    
    getKappa() {
        if (this.memo.kappa) return this.memo.kappa;
        this.#initialize();
        
        if (this.R !== this.C || this.W === 0) return null;

        let sum_diagonal_f_ii = 0;
        for (let i = 0; i < this.R; i++) {
            sum_diagonal_f_ii += this.table[i][i];
        }

        let sum_ri_ci = 0;
        for (let i = 0; i < this.R; i++) {
            sum_ri_ci += this.rowTotals[i] * this.colTotals[i];
        }

        const numerator = this.W * sum_diagonal_f_ii - sum_ri_ci;
        const denominator = this.W * this.W - sum_ri_ci;

        this.memo.kappa = denominator === 0 ? null : numerator / denominator;
        return this.memo.kappa;
    }
    
    getStatistics() {
        this.#initialize();
        const cellStats = Array(this.R).fill(0).map(() => Array(this.C).fill(0));
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                const f_ij = this.table[i][j];

                // 1) Expected count – keep both exact (for computation) and rounded (for display)
                const expectedExact = (this.rowTotals[i] * this.colTotals[j]) / this.W;
                const expectedRounded = toSPSSFixed(expectedExact, 1);

                // 2) Residuals based on the *exact* expected count (matches SPSS behaviour)
                const residual = toSPSSFixed(f_ij - expectedExact, 1);

                let standardizedResidual = null;
                let adjustedResidual = null;

                if (expectedExact && expectedExact > 0) {
                    const unroundedStandardized = (f_ij - expectedExact) / Math.sqrt(expectedExact);
                    standardizedResidual = toSPSSFixed(unroundedStandardized, 3);

                    if (this.W > 0) {
                        const rowProp = this.rowTotals[i] / this.W;
                        const colProp = this.colTotals[j] / this.W;
                        const denom = Math.sqrt(expectedExact * (1 - rowProp) * (1 - colProp));
                        if (denom !== 0) {
                            const unroundedAdjusted = (f_ij - expectedExact) / denom;
                            adjustedResidual = toSPSSFixed(unroundedAdjusted, 3);
                        }
                    }
                }

                cellStats[i][j] = {
                    count: f_ij,
                    expected: expectedRounded,      // display value (1-decimal rounded)
                    residual,                       // unstandardized residual (1-dec)
                    standardizedResidual,           // 3-dec
                    adjustedResidual,               // 3-dec
                    rowPercent: this.rowTotals[i] > 0 ? 100 * (f_ij / this.rowTotals[i]) : 0,
                    colPercent: this.colTotals[j] > 0 ? 100 * (f_ij / this.colTotals[j]) : 0,
                    totalPercent: this.W > 0 ? 100 * (f_ij / this.W) : 0,
                };
            }
        }

        // Konversi kembali kategori ke format tanggal jika diperlukan
        const displayRowCategories = this.isRowDateData 
            ? this.rowCategories.map(value => {
                if (typeof value === 'number') {
                    const dateString = spssSecondsToDateString(value);
                    return dateString || value;
                }
                return value;
            })
            : this.rowCategories;
            
        const displayColCategories = this.isColDateData 
            ? this.colCategories.map(value => {
                if (typeof value === 'number') {
                    const dateString = spssSecondsToDateString(value);
                    return dateString || value;
                }
                return value;
            })
            : this.colCategories;

        return {
            summary: {
                rows: this.R,
                cols: this.C,
                totalCases: this.W, // Tetap disediakan untuk kompatibilitas existing UI
                valid: this.validWeight,
                missing: this.missingWeight,
                rowCategories: displayRowCategories,
                colCategories: displayColCategories,
                rowTotals: this.rowTotals,
                colTotals: this.colTotals,
            },
            contingencyTable: this.table,
            cellStatistics: cellStats,
            chiSquare: {
                pearson: this.getPearsonChiSquare(),
                likelihoodRatio: this.getLikelihoodRatioChiSquare(),
            },
            nominalMeasures: {
                phi: this.getPhi(),
                contingencyCoefficient: this.getContingencyCoefficient(),
                cramersV: this.getCramersV(),
            },
            ordinalMeasures: {
                gamma: this.getGamma(),
                kendallsTauB: this.getKendallsTauB(),
                kendallsTauC: this.getKendallsTauC(),
                somersD: this.getSomersD(),
            },
            preMeasures: {
                lambda: this.getLambda(),
                goodmanKruskalTau: this.getGoodmanKruskalTau(),
            },
            correlations: this.getCorrelations(),
            agreement: {
                kappa: this.getKappa(),
            }
        };
    }
}

self.CrosstabsCalculator = CrosstabsCalculator;