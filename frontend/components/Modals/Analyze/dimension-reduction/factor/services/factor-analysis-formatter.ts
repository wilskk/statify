// perbaikan 14/1/2026
// perbaikan (10/1/2026)
// PERBAIKAN 4/1/2026

import * as math from "mathjs";
import {formatDisplayNumber, formatCorrelationValue} from "@/hooks/useFormatter";
import {ResultJson, Table} from "@/types/Table";
import {FactorType} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import {
    generateKMODescription,
    generateCommunalitiesDescription,
    generateTotalVarianceDescription,
    generateRotatedMatrixDescription,
    generateComponentMatrixDescription,
    generateExtractionTerminationDescription,
    generateDescriptiveDescription,
    generateCorrelationMatrixDescription,
    generateCovarianceMatrixDescription,
    generateInverseCorrelationDescription,
    generateAntiImageRefinedDescription,
    generateReproducedRefinedDescription,
    generateComponentTransformationDescription,
    generateGoodnessOfFitDescription,
    fmtSig,
    formatScientificNotationSPSSStyle,
} from "./formatter_utils";

// Helper function untuk mapping value extraction method ke nama tampilan
const EXTRACTION_METHOD_MAP: Record<string, string> = {
    "PrincipalComp": "Principal Component Analysis",
    "UnweightLeastSqr": "Unweighted Least Squares",
    "GeneralizedLeastSqr": "Generalized Least Squares",
    "MaxLikelihood": "Maximum Likelihood",
    "PrincipalAxisFactoring": "Principal Axis Factoring",
    "AlphaFactoring": "Alpha Factoring",
    "ImageFactoring": "Image Factoring",
};

function getExtractionMethodDisplayName(methodValue: string): string {
    return EXTRACTION_METHOD_MAP[methodValue] || methodValue;
}

// Helper format KHUSUS untuk Score Coefficient (hilangkan scientific notation, paksa 3 desimal)
function formatScoreCoefficientValue(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) return ".";
    if (!isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";

    // SPSS membulatkan ke 3 desimal untuk matriks ini.
    // Jika nilai absolutnya di bawah 0.0005, kita paksa menjadi 0 mutlak 
    // untuk menghancurkan sisa presisi negatif (mencegah minus nol).
    let normalized = value;
    if (Math.abs(value) < 0.0005) {
        normalized = 0;
    }

    // Kunci ketat ke 3 desimal (sehingga 1 menjadi 1.000)
    const fixed = normalized.toFixed(4);

    // Hapus angka nol di depan desimal (contoh: "0.453" -> ".453", "0.000" -> ".000")
    if (Math.abs(normalized) < 1) {
        let result = fixed.replace(/^(-?)0\./, "$1.");
        
        // Pengaman lapis kedua: pastikan benar-benar tidak ada minus nol yang lolos
        if (result === "-.000") {
            return ".000";
        }
        return result;
    }

    return fixed;
}

// SPSS-style communalities formatting: 3 decimals and no leading zero for |x| < 1
function formatCommunalityValue(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) return ".";
    if (!isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";

    const normalized = Math.abs(value) < 1e-12 ? 0 : value;
    const fixed = normalized.toFixed(3);
    return fixed.replace(/^(-?)0\./, "$1.");
}

/**
 * formatting for Component/Factor Score Covariance Matrix.
 * - Always 4 decimals
 * - Suppress scientific notation
 * - Avoid negative zero from floating-point precision noise
 */
function formatScoreCovarianceMatrixValue(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) return ".";
    if (!isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";

    const normalized = Math.abs(value) < 1e-12 ? 0 : value;

    if (normalized === 0) {
        return ".0000";
    }

    const fixed = normalized.toFixed(4);

    // SPSS style: no leading zero for values with |x| < 1
    if (Math.abs(normalized) < 1) {
        return fixed.replace(/^(-?)0\./, "$1.");
    }

    return fixed;
}

function buildCovarianceStdDevMap(covarianceData: any): Map<string, number> {
    const stdDevMap = new Map<string, number>();

    if (!covarianceData || !Array.isArray(covarianceData.covariances)) {
        return stdDevMap;
    }

    covarianceData.covariances.forEach((row: any) => {
        const varName = row?.variable;
        if (!varName || !Array.isArray(row.values)) return;

        const diagEntry = row.values.find((entry: any) => entry?.variable === varName);
        const rawValue = typeof diagEntry?.value === "number"
            ? diagEntry.value
            : typeof diagEntry?.value === "string"
            ? Number(diagEntry.value)
            : typeof diagEntry === "number"
            ? diagEntry
            : null;

        if (rawValue !== null && Number.isFinite(rawValue) && rawValue > 0) {
            stdDevMap.set(varName, Math.sqrt(rawValue));
        }
    });

    return stdDevMap;
}

/**
 * Calculate determinant from correlation matrix data
 * Rebuilds the correlation matrix from the raw correlation values and computes its determinant
 */
function calculateDeterminantFromCorrelationMatrix(correlationData: any): number | undefined {
    try {
        if (
            !correlationData ||
            !Array.isArray(correlationData.correlations) ||
            correlationData.correlations.length === 0
        ) {
            console.log("[FA] Cannot calculate determinant: invalid correlation data");
            return undefined;
        }

        // Get variable count
        const varCount = correlationData.correlations.length;
        console.log("[FA] Building correlation matrix for determinant calculation with", varCount, "variables");

        // Rebuild correlation matrix
        const matrix: number[][] = [];

        for (let i = 0; i < varCount; i++) {
            matrix[i] = [];
            const row = correlationData.correlations[i];

            if (!row || !Array.isArray(row.values)) {
                console.log("[FA] Invalid row structure at index", i);
                return undefined;
            }

            for (let j = 0; j < varCount; j++) {
                // Get correlation value from row, defaulting to 1.0 for diagonal
                const valueObj = row.values[j];
                if (typeof valueObj === "object" && valueObj !== null && "value" in valueObj) {
                    matrix[i][j] = valueObj.value;
                } else if (typeof valueObj === "number") {
                    matrix[i][j] = valueObj;
                } else {
                    matrix[i][j] = i === j ? 1.0 : 0.0;
                }
            }
        }

        console.log("[FA] Correlation matrix rebuilt:", matrix);

        // Calculate determinant using mathjs
        const det = math.det(matrix as any);
        console.log("[FA] Calculated determinant from correlation matrix:", det);

        return typeof det === "number" ? det : undefined;
    } catch (error) {
        console.error("[FA] Error calculating determinant from correlation matrix:", error);
        return undefined;
    }
}

        export function transformFactorAnalysisResult(data: any, configData?: FactorType): ResultJson & {
            screePlotChart?: any,
            loadingPlotChart?: any,
            factorScores?: any[] } {
                const resultJson: ResultJson & { screePlotChart?: any, loadingPlotChart?: any, factorScores?: any[] } = {
                tables: [],
    };

    console.log("Transforming factor analysis result data:", data);
    console.log("ConfigData extraction method:", configData?.extraction?.Method);

    // Ambil metode ekstraksi dari configData (prioritas) atau dari data WASM (fallback)
    const extractionMethod = configData?.extraction?.Method || data?.extraction_method || "PrincipalComp";
    console.log("Using extraction method:", extractionMethod);

    if (!data) {
        console.error("No data provided to transformFactorAnalysisResult");
        return resultJson;
    }

    const analysisStatus = data.analysis_status
        ? {
              isConverged: Boolean(data.analysis_status.is_converged),
              extractedFactors: Number(data.analysis_status.extracted_factors ?? 0),
              terminatedEarly: Boolean(data.analysis_status.terminated_early),
              terminationReason: data.analysis_status.termination_reason ?? undefined,
              hasHeywoodCase: Boolean(data.analysis_status.has_heywood_case ?? false),
          }
        : undefined;

    resultJson.analysisStatus = analysisStatus;

    const hasSuccessfulExtraction = Boolean(
        analysisStatus?.isConverged && analysisStatus.extractedFactors > 0
    );
    const shouldDisplayScoreMatrices = configData?.scores?.DisplayFactor ?? true;

    // 1. Descriptive Statistics
    if (data.descriptive_statistics) {
        const table: Table = {
            key: "descriptive_statistics",
            title: "Descriptive Statistics",
            columnHeaders: [
                { header: "Variable", key: "var" },
                { header: "Mean", key: "mean" },
                { header: "Std. Deviation", key: "std_deviation" },
                { header: "Analysis N", key: "analysis_n" },
            ],
            rows: [],
        };

        data.descriptive_statistics.forEach((stat: any, index: number) => {
            table.rows.push({
                rowHeader: [stat.variable],
                mean: formatDisplayNumber(stat.mean),
                std_deviation: formatDisplayNumber(stat.std_deviation),
                analysis_n: formatDisplayNumber(stat.analysis_n),
            });
        });

        const numVariables = data.descriptive_statistics.length;
        const sampleSize = data.descriptive_statistics[0]?.analysis_n || 0;
        table.interpretation = generateDescriptiveDescription(numVariables, sampleSize);

        resultJson.tables.push(table);
    }

    // 2. Correlation Matrix - SPSS Style with grouped row headers
    if (data.correlation_matrix) {
        const variables = data.correlation_matrix.correlations.map(
            (entry: any) => entry.variable
        );

        const table: Table = {
            key: "correlation_matrix",
            title: "Correlation Matrix",
            columnHeaders: [
                { header: "", key: "var_level1" },
                { header: "", key: "var_level2" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        // Debug: Log full correlation_matrix to understand structure
        console.log("[FA-Formatter] Full correlation_matrix:", JSON.stringify(data.correlation_matrix).substring(0, 500));
        
        // Correlation values with 2-level row header: ["Correlation", "VAR_NAME"]
        data.correlation_matrix.correlations.forEach(
            (entry: any, rowIndex: number) => {
                const rowData: any = {
                    rowHeader: ["Correlation", entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    rowData[`var_${colIndex}`] = formatCorrelationValue(val.value);
                });

                table.rows.push(rowData);
            }
        );

        // Significance values - only add if they exist and have length
        if (
            data.correlation_matrix.sig_values &&
            data.correlation_matrix.sig_values.length > 0
        ) {
            // Add significance values with 2-level row header: ["Sig. (1-tailed)", "VAR_NAME"]
            data.correlation_matrix.sig_values.forEach(
                (entry: any, rowIndex: number) => {
                    const rowData: any = {
                        rowHeader: ["Sig. (1-tailed)", entry.variable],
                    };

                    entry.values.forEach((val: any, colIndex: number) => {
                        rowData[`var_${colIndex}`] = formatCorrelationValue(
                            val.value
                        );
                    });

                    table.rows.push(rowData);
                }
            );
        }

        // Try to find determinant value
        // Note: Determinant will be added in post-processing from covariance_matrix
        let correlationDeterminant: any = undefined;
        
        table.interpretation = generateCorrelationMatrixDescription(correlationDeterminant);

        resultJson.tables.push(table);
    }

    // 3. Inverse Correlation Matrix
    if (data.inverse_correlation_matrix) {
        const variables =
            data.inverse_correlation_matrix.inverse_correlations.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "inverse_correlation_matrix",
            title: "Inverse of Correlation Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        data.inverse_correlation_matrix.inverse_correlations.forEach(
            (entry: any, rowIndex: number) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
                });

                table.rows.push(rowData);
            }
        );

        table.interpretation = generateInverseCorrelationDescription();

        resultJson.tables.push(table);
    }

    // 3b. Covariance Matrix
    if (data.covariance_matrix) {
        const variables =
            data.covariance_matrix.covariances.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "covariance_matrix",
            title: "Covariance Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
            interpretation: "", // Will be set in post-processing if determinant checkbox is checked
        };

        data.covariance_matrix.covariances.forEach(
            (entry: any, rowIndex: number) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
                });

                table.rows.push(rowData);
            }
        );

        // Add determinant note with SPSS-style formatting
        const determinantValue = data.covariance_matrix.determinant;
        const determinantDisplay = determinantValue !== undefined 
            ? (Math.abs(determinantValue) < 0.001 
                ? formatScientificNotationSPSSStyle(determinantValue)
                : formatDisplayNumber(determinantValue))
            : "N/A";
        
        table.rows.push({
            rowHeader: [`a. Determinant = ${determinantDisplay}`],
        });

        resultJson.tables.push(table);
    }

    // 3c. Inverse of Covariance Matrix
    if (data.inverse_covariance_matrix) {
        const variables =
            data.inverse_covariance_matrix.inverse_covariances.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "inverse_covariance_matrix",
            title: "Inverse of Covariance Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        data.inverse_covariance_matrix.inverse_covariances.forEach(
            (entry: any, rowIndex: number) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
                });

                table.rows.push(rowData);
            }
        );

        resultJson.tables.push(table);
    }

    // 4. KMO and Bartlett's Test
    if (data.kmo_bartletts_test) {
        const kmoValue = data.kmo_bartletts_test.kaiser_meyer_olkin || 0;
        const bartlettSig = data.kmo_bartletts_test.significance || 1;
        const bartlettChiSquare = data.kmo_bartletts_test.bartletts_test_chi_square;
        const bartlettDf = data.kmo_bartletts_test.df;

        // Generate description menggunakan formatter_utils
        const kmoDescription = generateKMODescription(kmoValue, bartlettSig, bartlettChiSquare, bartlettDf);

        const table: Table = {
            key: "kmo_bartletts_test",
            title: "KMO and Bartlett's Test",
            columnHeaders: [
                { header: "", key: "test" },
                { header: "", key: "var" },
                { header: "", key: "value" },
            ],
            rows: [
                {
                    rowHeader: [
                        "Kaiser-Meyer-Olkin Measure of Sampling Adequacy",
                    ],
                    value: formatDisplayNumber(
                        data.kmo_bartletts_test.kaiser_meyer_olkin
                    ),
                },
                {
                    rowHeader: [
                        "Bartlett's Test of Sphericity",
                        "Approx. Chi-Square",
                    ],
                    value: formatDisplayNumber(
                        data.kmo_bartletts_test.bartletts_test_chi_square
                    ),
                },
                {
                    rowHeader: ["", "df"],
                    value: formatDisplayNumber(data.kmo_bartletts_test.df),
                },
                {
                    rowHeader: ["", "Sig."],
                    value: formatDisplayNumber(
                        data.kmo_bartletts_test.significance
                    ),
                },
            ],
            interpretation: kmoDescription, // ← ADD INTERPRETASI
        };

        resultJson.tables.push(table);
    }

    // 5. Anti-image Matrices - SPSS Style with grouped row headers
    if (data.anti_image_matrices) {
        const variables = data.anti_image_matrices.anti_image_covariance.map(
            (entry: any) => entry.variable
        );

        const table: Table = {
            key: "anti_image_matrices",
            title: "Anti-image Matrices",
            columnHeaders: [
                { header: "", key: "var_level1" },
                { header: "", key: "var_level2" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        // Anti-image Covariance with 2-level row header: ["Anti-image Covariance", "VAR_NAME"]
        data.anti_image_matrices.anti_image_covariance.forEach((entry: any) => {
            const rowData: any = {
                rowHeader: ["Anti-image Covariance", entry.variable],
            };

            entry.values.forEach((val: any, colIndex: number) => {
                rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
            });

            table.rows.push(rowData);
        });

        // Anti-image Correlation with 2-level row header: ["Anti-image Correlation", "VAR_NAME"]
        data.anti_image_matrices.anti_image_correlation.forEach(
            (entry: any) => {
                const rowData: any = {
                    rowHeader: ["Anti-image Correlation", entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    const value = val.value;
                    // Add 'a' superscript to diagonal elements (MSA values)
                    if (entry.variable === val.variable) {
                        console.log(`[DEBUG TS FORMATTER] Diagonal ${entry.variable} value from Rust = ${value}`);
                        rowData[`var_${colIndex}`] =
                            formatDisplayNumber(value) + "ᵃ";
                    } else {
                        rowData[`var_${colIndex}`] = formatDisplayNumber(value);
                    }
                });

                table.rows.push(rowData);
            }
        );

        table.interpretation = generateAntiImageRefinedDescription();

        resultJson.tables.push(table);
    }



    // ==================================================================================
    // 6. COMMUNALITIES (PERBAIKAN UTAMA)
    // ==================================================================================
    if (data.communalities) {
        const isCovariance = data.communalities.extraction_matrix_type === "covariance";
        
        // Cek apakah ada data ekstraksi dari backend
        const hasExtractionData = data.communalities.extraction && data.communalities.extraction.length > 0;
        
        // BACKEND FLAGS - Dari logika backend:
        // heywood_warning_flag: true jika ada Heywood Case (communality >= 0.9999)
        // suppress_extraction: true jika ada fatal error (NaN/Infinite atau n_factors == 0)
        const heywoodWarningFlag = data.communalities.heywood_warning_flag ?? false;
        const suppressExtraction = data.communalities.suppress_extraction ?? false;
        
        // SPSS RULE: Tampilkan kolom Extraction jika:
        // 1. Ada data extraction
        // 2. Tidak disuppress oleh backend karena fatal error
        // Catatan: Heywood Case hanya warning, bukan suppress.
        const showExtractionColumn = hasExtractionData && !suppressExtraction;

        const columnHeaders: any = [{ header: "", key: "var" }];

        if (isCovariance) {
            // ================================================================
            // COVARIANCE CASE: Format dengan kolom Raw dan Rescaled
            // ================================================================
            if (showExtractionColumn) {
                // Unrotated ON: Raw (Initial + Extraction) dan Rescaled (Initial + Extraction)
                columnHeaders.push({
                    header: "Raw",
                    key: "raw",
                    children: [
                        { header: "Initial", key: "raw_initial" },
                        { header: "Extraction", key: "raw_extraction" },
                    ]
                });
                columnHeaders.push({
                    header: "Rescaled",
                    key: "rescaled",
                    children: [
                        { header: "Initial", key: "rescaled_initial" },
                        { header: "Extraction", key: "rescaled_extraction" },
                    ]
                });
            } else {
                // Fatal/suppress case: hanya Initial values
                columnHeaders.push({ header: "Raw Initial", key: "raw_initial" });
                columnHeaders.push({ header: "Rescaled Initial", key: "rescaled_initial" });
            }
        } else {
            // ================================================================
            // CORRELATION CASE: Format dengan kolom Initial dan Extraction
            // ================================================================
            columnHeaders.push({ header: "Initial", key: "initial" });
            
            if (showExtractionColumn) {
                columnHeaders.push({ header: "Extraction", key: "extraction" });
            }
        }

        const table: Table = {
            key: "communalities",
            title: heywoodWarningFlag ? "Communalities<sup>a</sup>" : "Communalities",
            columnHeaders,
            rows: [],
        };

        // Buat map untuk akses cepat
        const rawInitialMap = new Map();
        const rescaledInitialMap = new Map();
        const extractionMap = new Map();

        if (Array.isArray(data.communalities.raw_initial)) {
            data.communalities.raw_initial.forEach((item: any) => rawInitialMap.set(item.variable, item.value));
        }
        if (Array.isArray(data.communalities.rescaled_initial)) {
            data.communalities.rescaled_initial.forEach((item: any) => rescaledInitialMap.set(item.variable, item.value));
        }
        
        // Map extraction hanya diisi jika data ada
        if (hasExtractionData && Array.isArray(data.communalities.extraction)) {
            data.communalities.extraction.forEach((item: any) => extractionMap.set(item.variable, item.value));
        }

        // Map rescaled extraction (dari backend)
        const rescaledExtractionMap = new Map();
        if (hasExtractionData && Array.isArray(data.communalities.rescaled_extraction)) {
            data.communalities.rescaled_extraction.forEach((item: any) => rescaledExtractionMap.set(item.variable, item.value));
        }

        // Get variables
        const variables = data.communalities.raw_initial && Array.isArray(data.communalities.raw_initial)
            ? (data.communalities.raw_initial as any[]).map((item: any) => item.variable)
            : []; 

        variables.forEach((variable: string) => {
            const rowData: any = { rowHeader: [variable] };

            if (isCovariance) {
                // COVARIANCE CASE
                rowData.raw_initial = formatCommunalityValue(rawInitialMap.get(variable));
                rowData.rescaled_initial = formatCommunalityValue(rescaledInitialMap.get(variable));
                
                if (showExtractionColumn) {
                    // Gunakan nilai dari backend untuk extraction
                    const rawExtraction = extractionMap.get(variable);
                    const rescaledExtraction = rescaledExtractionMap.get(variable);
                    
                    if (rawExtraction !== undefined) {
                        rowData.raw_extraction = formatCommunalityValue(rawExtraction);
                    }
                    if (rescaledExtraction !== undefined) {
                        rowData.rescaled_extraction = formatCommunalityValue(rescaledExtraction);
                    }
                }
            } else {
                // CORRELATION CASE
                // Untuk correlation, initial selalu 1.0 untuk PCA atau SMC untuk PAF
                rowData.initial = formatCommunalityValue(rescaledInitialMap.get(variable));

                if (showExtractionColumn) {
                    const val = extractionMap.get(variable);
                    if (val !== undefined) {
                        rowData.extraction = formatCommunalityValue(val);
                    }
                }
            }

            table.rows.push(rowData);
        });

        const methodDisplayNameComm = getExtractionMethodDisplayName(extractionMethod);
        table.rows.push({ rowHeader: [`Extraction Method: ${methodDisplayNameComm}.`] });
        
        // Generate description untuk Communalities
        const communalitiesData = variables.map((v: string) => ({
            name: v,
            value: extractionMap.get(v) || rescaledExtractionMap.get(v) || 0
        })).filter(c => c.value > 0);
        
        const commDescription = generateCommunalitiesDescription(communalitiesData, methodDisplayNameComm);
        
        // HEYWOOD CASE WARNING: Jika ada Heywood Case (communality >= 1.0), tambahkan warning footnote
        // Footnote ini ditampilkan di description/interpretation yang akan ditampilkan oleh UI
        let finalDescription = commDescription;
        if (heywoodWarningFlag) {
            const heywoodWarning = "One or more communality estimates greater than 1 were encountered during iterations. The resulting solution should be interpreted with caution.";
            finalDescription = commDescription + "\n\n" + heywoodWarning;
        }
        
        table.interpretation = finalDescription;
        
        resultJson.tables.push(table);
    }

    // ==================================================================================
    // 7. TOTAL VARIANCE EXPLAINED (PERBAIKAN UTAMA)
    // ==================================================================================
    if (data.total_variance_explained) {
        try {
            const renderExtractionDetails = hasSuccessfulExtraction;
            const varianceBlocks = Array.isArray(data.total_variance_explained)
                ? data.total_variance_explained
                : [["Total", data.total_variance_explained]];

            const isCovariance = varianceBlocks.some((block: any) => {
                const label = Array.isArray(block) ? block[0] : (block.matrix_type || "");
                return label === "Raw" || label === "Rescaled";
            });

            if (isCovariance) {
                const rowLabel = extractionMethod === "PrincipalComp" ? "Component" : "Factor";
                const blockEntries: Array<{ blockLabel: string; blockData: any }> = varianceBlocks.map((block: any) => {
                    const [blockLabel, blockData] = Array.isArray(block)
                        ? block
                        : [block.matrix_type || "Total", block];

                    return { blockLabel, blockData };
                });

                const hasExtractionColumns = renderExtractionDetails && blockEntries.some(
                    ({ blockData }: { blockData: any }) => blockData?.extraction?.rows?.length > 0
                );

                const table: Table = {
                    key: "total_variance_explained",
                    title: "Total Variance Explained",
                    columnHeaders: [
                        { header: "", key: "group_label" }, 
                        { header: rowLabel, key: "component", width: "auto" },
                        {
                            header: "Initial Eigenvaluesᵃ",
                            key: "initial_eigenvalues",
                            children: [
                                { header: "Total", key: "initial_total" },
                                { header: "% of Variance", key: "initial_percent_var" },
                                { header: "Cumulative %", key: "initial_cumulative_percent" },
                            ],
                        },
                    ],
                    rows: [],
                };

                if (hasExtractionColumns) {
                    table.columnHeaders.push({
                        header: "Extraction Sums of Squared Loadings",
                        key: "extraction_sums",
                        children: [
                            { header: "Total", key: "extraction_total" },
                            { header: "% of Variance", key: "extraction_percent_var" },
                            { header: "Cumulative %", key: "extraction_cumulative_percent" },
                        ],
                    });
                }

                blockEntries.forEach(({ blockLabel, blockData }: { blockLabel: string; blockData: any }) => {
                    if (!blockData?.initial?.rows) return;

                    blockData.initial.rows.forEach((rowValues: number[], i: number) => {
                        const rowData: any = {
                            group_label: i === 0 ? blockLabel : "", 
                            rowHeader: [], 
                            component: (i + 1).toString(),
                            initial_total: formatDisplayNumber(rowValues[0]),
                            initial_percent_var: formatDisplayNumber(rowValues[1]),
                            initial_cumulative_percent: formatDisplayNumber(rowValues[2]),
                        };

                        const extractionRow = blockData.extraction?.rows?.[i];
                        if (hasExtractionColumns && extractionRow) {
                            rowData.extraction_total = formatDisplayNumber(extractionRow[0]);
                            rowData.extraction_percent_var = formatDisplayNumber(extractionRow[1]);
                            rowData.extraction_cumulative_percent = formatDisplayNumber(extractionRow[2]);
                        }

                        table.rows.push(rowData);
                    });
                });
                
                // Generate description untuk Total Variance Explained
                const firstBlock = blockEntries[0]?.blockData;
                const lastRowValues = firstBlock?.initial?.rows?.[firstBlock?.initial?.rows?.length - 1];
                const cumulativeVarExplained = lastRowValues?.[2] || 0; // cumulative percentage
                const numComponentsExtr = firstBlock?.initial?.rows?.length || 0;
                const methodDisplayNameVar = getExtractionMethodDisplayName(extractionMethod);
                table.interpretation = hasSuccessfulExtraction
                    ? generateTotalVarianceDescription(numComponentsExtr, cumulativeVarExplained / 100, methodDisplayNameVar)
                    : generateExtractionTerminationDescription(
                        analysisStatus?.extractedFactors,
                        analysisStatus?.terminationReason
                    );
                
                resultJson.tables.push(table);

            } else {
                // LOGIKA CORRELATION
                const block = varianceBlocks[0];
                const [blockLabel, blockData] = Array.isArray(block) ? block : [block.matrix_type || "Total", block];

                const table: Table = {
                    key: "total_variance_explained",
                    title: "Total Variance Explained",
                    columnHeaders: [
                        { header: "Component", key: "component" },
                        {
                            header: "Initial Eigenvalues",
                            key: "initial_eigenvalues",
                            children: blockData.initial.headers.map((header: string, idx: number) => ({
                                header,
                                key: `initial_${idx}`,
                            })),
                        },
                    ],
                    rows: [],
                };

                // --- CEK: APAKAH ADA DATA EKSTRAKSI? ---
                if (renderExtractionDetails && blockData.extraction?.rows?.length > 0) {
                    table.columnHeaders.push({
                        header: "Extraction Sums of Squared Loadings",
                        key: "extraction_sums",
                        children: blockData.extraction.headers.map((header: string, idx: number) => ({
                            header,
                            key: `extraction_${idx}`,
                        })),
                    });
                }

                // --- CEK: APAKAH ADA DATA ROTASI? ---
                if (renderExtractionDetails && blockData.rotation?.rows?.length > 0) {
                    table.columnHeaders.push({
                        header: "Rotation Sums of Squared Loadings",
                        key: "rotation_sums",
                        children: blockData.rotation.headers.map((header: string, idx: number) => ({
                            header,
                            key: `rotation_${idx}`,
                        })),
                    });
                }

                const numComponents = blockData.initial.rows.length;
                for (let i = 0; i < numComponents; i++) {
                    const rowData: any = { rowHeader: [(i + 1).toString()] };

                    // Initial Data (Selalu Ada)
                    blockData.initial.rows[i].forEach((val: number, idx: number) => {
                        rowData[`initial_${idx}`] = formatDisplayNumber(val);
                    });

                    // Extraction Data (Hanya jika ada)
                    if (renderExtractionDetails && blockData.extraction?.rows[i]) {
                        blockData.extraction.rows[i].forEach((val: number, idx: number) => {
                            rowData[`extraction_${idx}`] = formatDisplayNumber(val);
                        });
                    }

                    // Rotation Data (Hanya jika ada)
                    if (renderExtractionDetails && blockData.rotation?.rows[i]) {
                        blockData.rotation.rows[i].forEach((val: number, idx: number) => {
                            rowData[`rotation_${idx}`] = formatDisplayNumber(val);
                        });
                    }

                    table.rows.push(rowData);
                }

                // Footer dinamis berdasarkan metode ekstraksi
                const methodDisplayName = getExtractionMethodDisplayName(extractionMethod);
                table.rows.push({ rowHeader: [`Extraction Method: ${methodDisplayName}.`] });
                
                // Generate description untuk Total Variance Explained (Correlation case)
                const lastInitialRow = blockData.initial.rows?.[blockData.initial.rows.length - 1];
                const cumulativePctCorr = lastInitialRow?.[2] || 0;
                const numComponentsCorr = blockData.initial.rows?.length || 0;
                const varianceDescCorr = generateTotalVarianceDescription(numComponentsCorr, cumulativePctCorr / 100, methodDisplayName);
                table.interpretation = hasSuccessfulExtraction
                    ? varianceDescCorr
                    : generateExtractionTerminationDescription(
                        analysisStatus?.extractedFactors,
                        analysisStatus?.terminationReason
                    );
                
                resultJson.tables.push(table);
            }
        } catch (error) {
            console.error("Error processing total_variance_explained:", error);
        }
    }

    // 7b. Goodness-of-fit Test (ML / GLS)
    const isGLSOrML = extractionMethod === "GeneralizedLeastSqr" || extractionMethod === "MaxLikelihood";
    if (hasSuccessfulExtraction && isGLSOrML && data.goodness_of_fit_test) {
        const goodnessOfFitTable: Table = {
            key: "goodness_of_fit_test",
            title: "Goodness-of-fit Test",
            columnHeaders: [
                { header: "", key: "test" },
                { header: "Chi-Square", key: "chi_square" },
                { header: "df", key: "df" },
                { header: "Sig.", key: "sig" },
            ],
            rows: [
                {
                    rowHeader: ["Goodness-of-fit Test"],
                    chi_square: formatDisplayNumber(data.goodness_of_fit_test.chi_square),
                    df: formatDisplayNumber(data.goodness_of_fit_test.df),
                    sig: formatDisplayNumber(data.goodness_of_fit_test.significance),
                },
            ],
        };

        goodnessOfFitTable.interpretation = generateGoodnessOfFitDescription(
            data.goodness_of_fit_test.chi_square,
            data.goodness_of_fit_test.df,
            data.goodness_of_fit_test.significance,
            getExtractionMethodDisplayName(extractionMethod),
            analysisStatus?.extractedFactors
        );

        resultJson.tables.push(goodnessOfFitTable);
    }




    // // 8. Component Matrix
    // if (data.component_matrix) {
    //     const extractedComponents =
    //         data.component_matrix.components[0]?.values.length || 0;

    //     const table: Table = {
    //         key: "component_matrix",
    //         title: "Component Matrix",
    //         columnHeaders: [
    //             { header: "", key: "var" },
    //             {
    //                 header: "Component",
    //                 key: "component",
    //                 children: Array.from(
    //                     { length: extractedComponents },
    //                     (_, i) => ({
    //                         header: (i + 1).toString(),
    //                         key: `component_${i + 1}`,
    //                     })
    //                 ),
    //             },
    //         ],
    //         rows: [],
    //     };

    //     data.component_matrix.components.forEach((component: any) => {
    //         const rowData: any = {
    //             rowHeader: [component.variable],
    //         };

    //         // component.values.forEach((value: number, index: number) => {
    //         //     rowData[`component_${index + 1}`] = formatDisplayNumber(value);
    //         // });

    //         component.values.forEach((value: number | null, index: number) => {
    //             // REVISI: Cek apakah null (suppressed)
    //             if (value === null || value === undefined) {
    //                 rowData[`component_${index + 1}`] = ""; // Kosongkan sel
    //             } else {
    //                 rowData[`component_${index + 1}`] = formatDisplayNumber(value);
    //             }
    //         });

    //         table.rows.push(rowData);
    //     });

    //     // Add footnote
    //     table.rows.push({
    //         rowHeader: [`Extraction Method: Principal Component Analysis.`],
    //     });

    //     if (extractedComponents > 0) {
    //         table.rows.push({
    //             rowHeader: [`a. ${extractedComponents} components extracted.`],
    //         });
    //     }

    //     resultJson.tables.push(table);
    // }




    // 8. Component Matrix / Factor Matrix
    if (data.component_matrix) {
        const extractedComponents = hasSuccessfulExtraction
            ? (data.component_matrix.components[0]?.values.length || 0)
            : 0;

        // --- LOGIKA DINAMIS (BARU) ---
        // Cek metode ekstraksi untuk menentukan Label Judul & Header
        // Value dari frontend: "PrincipalComp", "UnweightLeastSqr", "MaxLikelihood", dll.
        const methodValue = extractionMethod;
        // Jika metode BUKAN PCA, SPSS menggunakan istilah "Factor", jika PCA gunakan "Component"
        const isPCA = methodValue === "PrincipalComp";
        
        // Mapping value ke nama tampilan untuk footer
        const methodDisplayName = getExtractionMethodDisplayName(methodValue);
        
        // 1. Tentukan Judul Tabel (Factor Matrix vs Component Matrix)
        // Tambahkan superscript 'a' (ᵃ) jika bukan PCA, sesuai style SPSS
        const tableTitle = isPCA ? "Component Matrix" : "Factor Matrixᵃ";
        
        // 2. Tentukan Header Kolom (Factor vs Component)
        const columnGroupHeader = isPCA ? "Component" : "Factor";

        const isCovarianceExtraction = configData?.extraction?.Covariance === true;
        const covarianceStdDevs = isCovarianceExtraction
            ? buildCovarianceStdDevMap(data.covariance_matrix)
            : new Map<string, number>();
        const showRescaledColumns = isCovarianceExtraction;

        const columnHeaders: any[] = [{ header: "", key: "var" }];
        if (showRescaledColumns) {
            columnHeaders.push({
                header: "Raw",
                key: "raw_group",
                children: [
                    {
                        header: columnGroupHeader,
                        key: "raw_factor_group",
                        children: Array.from({ length: extractedComponents }, (_, i) => ({
                            header: (i + 1).toString(),
                            key: `raw_component_${i + 1}`,
                        })),
                    },
                ],
            });
            columnHeaders.push({
                header: "Rescaled",
                key: "rescaled_group",
                children: [
                    {
                        header: columnGroupHeader,
                        key: "rescaled_factor_group",
                        children: Array.from({ length: extractedComponents }, (_, i) => ({
                            header: (i + 1).toString(),
                            key: `rescaled_component_${i + 1}`,
                        })),
                    },
                ],
            });
        } else {
            columnHeaders.push({
                header: columnGroupHeader,
                key: "component",
                children: Array.from(
                    { length: extractedComponents },
                    (_, i) => ({
                        header: (i + 1).toString(),
                        key: `component_${i + 1}`,
                    })
                ),
            });
        }

        const table: Table = {
            key: "component_matrix",
            title: tableTitle, // <--- Gunakan judul dinamis
            columnHeaders,
            rows: [],
        };

        // ... (Bagian pengisian data baris tetap sama) ...
        data.component_matrix.components.forEach((component: any) => {
            const rowData: any = { rowHeader: [component.variable] };
            component.values.forEach((value: number | null, index: number) => {
                if (!hasSuccessfulExtraction || value === null || value === undefined) {
                    if (showRescaledColumns) {
                        rowData[`raw_component_${index + 1}`] = "";
                        rowData[`rescaled_component_${index + 1}`] = "";
                    } else {
                        rowData[`component_${index + 1}`] = "";
                    }
                    return;
                }

                if (showRescaledColumns) {
                    rowData[`raw_component_${index + 1}`] = formatDisplayNumber(value);
                    const stdDev = covarianceStdDevs.get(component.variable);
                    rowData[`rescaled_component_${index + 1}`] =
                        stdDev && stdDev > 0
                            ? formatDisplayNumber(value / stdDev)
                            : "";
                } else {
                    rowData[`component_${index + 1}`] = formatDisplayNumber(value);
                }
            });
            table.rows.push(rowData);
        });

        // --- BAGIAN FOOTER (SESUAI GAMBAR SPSS) ---
        
        // Footer 1: Nama Metode
        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayName}.`],
        });

        // Footer 2: Keterangan 'a' (Iterasi)
        // Logic: Jika ada data iterasi (dari backend), tampilkan.
        // Jika tidak ada data iterasi tapi bukan PCA, tampilkan format standar tanpa angka iterasi.
        if (!hasSuccessfulExtraction) {
            table.rows.push({
                rowHeader: ["a. Extraction terminated before convergence or no factor solution was retained."],
            });
        } else if (data.component_matrix.iterations_required) {
            table.rows.push({
                rowHeader: [`a. ${extractedComponents} factors extracted. ${data.component_matrix.iterations_required} iterations required.`],
            });
        } else if (!isPCA) {
            // Fallback jika backend belum kirim 'iterations_required' tapi metode adalah Factor Analysis
            table.rows.push({
                rowHeader: [`a. ${extractedComponents} factors extracted.`], 
            });
        } else if (extractedComponents > 0 && isPCA) {
             // Fallback untuk PCA
             table.rows.push({
                rowHeader: [`a. ${extractedComponents} components extracted.`],
            });
        }

        // Generate description untuk Component Matrix
        const componentMatrixDesc = hasSuccessfulExtraction
            ? generateComponentMatrixDescription(extractedComponents, data.component_matrix.components?.[0]?.values?.length || 0)
            : generateExtractionTerminationDescription(analysisStatus?.extractedFactors, analysisStatus?.terminationReason);
        table.interpretation = componentMatrixDesc;

        resultJson.tables.push(table);
    }

    // 9. Reproduced Correlations - SPSS Style with grouped row headers
    if (hasSuccessfulExtraction && data.reproduced_correlations) {
        const variables =
            data.reproduced_correlations.reproduced_correlation.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "reproduced_correlations",
            title: "Reproduced Correlations",
            columnHeaders: [
                { header: "", key: "var_level1" },
                { header: "", key: "var_level2" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        // Reproduced correlation values with 2-level row header: ["Reproduced Correlation", "VAR_NAME"]
        data.reproduced_correlations.reproduced_correlation.forEach(
            (entry: any) => {
                const rowData: any = {
                    rowHeader: ["Reproduced Correlation", entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    // Add 'a' superscript to diagonal elements
                    if (entry.variable === val.variable) {
                        rowData[`var_${colIndex}`] =
                            formatDisplayNumber(val.value) + "ᵃ";
                    } else {
                        rowData[`var_${colIndex}`] = formatDisplayNumber(
                            val.value
                        );
                    }
                });

                table.rows.push(rowData);
            }
        );

        // Residual values with 2-level row header: ["Residualᵇ", "VAR_NAME"]
        data.reproduced_correlations.residual.forEach((entry: any) => {
            const rowData: any = {
                rowHeader: ["Residualᵇ", entry.variable],
            };

            entry.values.forEach((val: any, colIndex: number) => {
                rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
            });

            table.rows.push(rowData);
        });

        // Add footnotes - Dinamis berdasarkan metode ekstraksi
        const methodValueRC = extractionMethod;
        const methodDisplayNameRC = getExtractionMethodDisplayName(methodValueRC);
        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayNameRC}.`],
        });
        table.rows.push({
            rowHeader: ["a. Reproduced communalities"],
        });
        table.rows.push({
            rowHeader: [
                "b. Residuals are computed between observed and reproduced correlations. There are X (X%) nonredundant residuals with absolute values greater than 0.05.",
            ],
        });

        // Calculate residual count and percentage
        let residualCount = 0;
        data.reproduced_correlations.residual.forEach((entry: any) => {
            entry.values.forEach((val: any) => {
                if (Math.abs(val.value) > 0.05) {
                    residualCount++;
                }
            });
        });
        const totalNonredundant = variables.length * (variables.length - 1) / 2;
        const residualPct = totalNonredundant > 0 ? (residualCount / totalNonredundant * 100) : 0;
        table.interpretation = generateReproducedRefinedDescription(residualCount, residualPct);

        resultJson.tables.push(table);
    }

    // 9b. Reproduced Covariances - SPSS Style with grouped row headers
    if (hasSuccessfulExtraction && data.reproduced_covariances) {
        const variables =
            data.reproduced_covariances.reproduced_covariance.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "reproduced_covariances",
            title: "Reproduced Covariances",
            columnHeaders: [
                { header: "", key: "var_level1" },
                { header: "", key: "var_level2" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        // Reproduced covariance values with 2-level row header: ["Reproduced Covariance", "VAR_NAME"]
        data.reproduced_covariances.reproduced_covariance.forEach(
            (entry: any) => {
                const rowData: any = {
                    rowHeader: ["Reproduced Covariance", entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    // Add 'a' superscript to diagonal elements
                    if (entry.variable === val.variable) {
                        rowData[`var_${colIndex}`] =
                            formatDisplayNumber(val.value) + "ᵃ";
                    } else {
                        rowData[`var_${colIndex}`] = formatDisplayNumber(
                            val.value
                        );
                    }
                });

                table.rows.push(rowData);
            }
        );

        // Residual values with 2-level row header: ["Residualᵇ", "VAR_NAME"]
        data.reproduced_covariances.residual.forEach((entry: any) => {
            const rowData: any = {
                rowHeader: ["Residualᵇ", entry.variable],
            };

            entry.values.forEach((val: any, colIndex: number) => {
                rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
            });

            table.rows.push(rowData);
        });

        // Add footnotes - Dinamis berdasarkan metode ekstraksi
        const methodValueRCov = extractionMethod;
        const methodDisplayNameRCov = getExtractionMethodDisplayName(methodValueRCov);
        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayNameRCov}.`],
        });
        table.rows.push({
            rowHeader: ["a. Reproduced communalities"],
        });
        table.rows.push({
            rowHeader: [
                "b. Residuals are computed between observed and reproduced covariances. There are X (X%) nonredundant residuals with absolute values greater than 0.05.",
            ],
        });

        resultJson.tables.push(table);
    }

    // 10. Rotated Component Matrix (Orthogonal rotations only)
    const rotationRequested = configData?.rotation
        ? !configData.rotation.None && configData.rotation.RotatedSol !== false
        : false;
    const extractedFactors = analysisStatus?.extractedFactors ?? 0;

    if (rotationRequested && extractedFactors <= 1) {
        const isPCA = extractionMethod === "PrincipalComp";
        const tableTitle = isPCA ? "Rotated Component Matrixᵃ" : "Rotated Factor Matrixᵃ";
        const entityLabel = isPCA ? "component" : "factor";
        const rotationNote = `a. Only one ${entityLabel} was extracted. The solution cannot be rotated.`;

        const table: Table = {
            key: "rotated_component_matrix",
            title: tableTitle,
            columnHeaders: [{ header: "", key: "var" }],
            rows: [
                {
                    rowHeader: [rotationNote],
                },
            ],
            interpretation: rotationNote,
        };

        resultJson.tables.push(table);
    } else if (hasSuccessfulExtraction && data.rotated_component_matrix && !data.pattern_matrix) {
        const extractedComponents =
            data.rotated_component_matrix.components[0]?.values.length || 0;

        const methodValue = extractionMethod;
        const isPCA = methodValue === "PrincipalComp";
        const methodDisplayName = getExtractionMethodDisplayName(methodValue);
        const tableTitle = isPCA ? "Rotated Component Matrixᵃ" : "Rotated Factor Matrixᵃ";
        const columnGroupHeader = isPCA ? "Component" : "Factor";

        const isCovarianceExtraction = configData?.extraction?.Covariance === true;
        const covarianceStdDevs = isCovarianceExtraction
            ? buildCovarianceStdDevMap(data.covariance_matrix)
            : new Map<string, number>();
        const showRescaledColumns = isCovarianceExtraction;

        const columnHeaders: any[] = [{ header: "", key: "var" }];
        if (showRescaledColumns) {
            columnHeaders.push({
                header: "Raw",
                key: "raw_group",
                children: [
                    {
                        header: columnGroupHeader,
                        key: "raw_factor_group",
                        children: Array.from({ length: extractedComponents }, (_, i) => ({
                            header: (i + 1).toString(),
                            key: `raw_component_${i + 1}`,
                        })),
                    },
                ],
            });
            columnHeaders.push({
                header: "Rescaled",
                key: "rescaled_group",
                children: [
                    {
                        header: columnGroupHeader,
                        key: "rescaled_factor_group",
                        children: Array.from({ length: extractedComponents }, (_, i) => ({
                            header: (i + 1).toString(),
                            key: `rescaled_component_${i + 1}`,
                        })),
                    },
                ],
            });
        } else {
            columnHeaders.push({
                header: columnGroupHeader,
                key: "component",
                children: Array.from(
                    { length: extractedComponents },
                    (_, i) => ({
                        header: (i + 1).toString(),
                        key: `component_${i + 1}`,
                    })
                ),
            });
        }

        const table: Table = {
            key: "rotated_component_matrix",
            title: tableTitle,
            columnHeaders,
            rows: [],
        };

        data.rotated_component_matrix.components.forEach((component: any) => {
            const rowData: any = {
                rowHeader: [component.variable],
            };

            component.values.forEach((value: number | null, index: number) => {
                if (value === null || value === undefined) {
                    if (showRescaledColumns) {
                        rowData[`raw_component_${index + 1}`] = "";
                        rowData[`rescaled_component_${index + 1}`] = "";
                    } else {
                        rowData[`component_${index + 1}`] = "";
                    }
                    return;
                }

                if (showRescaledColumns) {
                    rowData[`raw_component_${index + 1}`] = formatDisplayNumber(value);
                    const stdDev = covarianceStdDevs.get(component.variable);
                    rowData[`rescaled_component_${index + 1}`] =
                        stdDev && stdDev > 0
                            ? formatDisplayNumber(value / stdDev)
                            : "";
                } else {
                    rowData[`component_${index + 1}`] = formatDisplayNumber(value);
                }
            });

            table.rows.push(rowData);
        });

        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayName}.`],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Varimax with Kaiser Normalization."],
        });
        table.rows.push({
            rowHeader: ["a. Rotation converged in X iterations."],
        });

        const rotationMethod = "Varimax";
        const rotatedMatrixDesc = generateRotatedMatrixDescription(rotationMethod, extractedComponents);
        table.interpretation = rotatedMatrixDesc;

        resultJson.tables.push(table);
    }

    // 11. Component Transformation Matrix (Orthogonal rotations only)
    if (hasSuccessfulExtraction && extractedFactors > 1 && data.component_transformation_matrix && !data.pattern_matrix) {
        const components =
            data.component_transformation_matrix.components.length;

        const methodValue = extractionMethod;
        const isPCA = methodValue === "PrincipalComp";
        const methodDisplayName = getExtractionMethodDisplayName(methodValue);
        const tableTitle = isPCA ? "Component Transformation Matrix" : "Factor Transformation Matrix";
        const columnRowHeader = isPCA ? "Component" : "Factor";

        const table: Table = {
            key: "component_transformation_matrix",
            title: tableTitle,
            columnHeaders: [
                { header: columnRowHeader, key: "component" },
                ...Array.from({ length: components }, (_, i) => ({
                    header: (i + 1).toString(),
                    key: `component_${i + 1}`,
                })),
            ],
            rows: [],
        };

        for (let i = 0; i < components; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
            };

            for (let j = 0; j < components; j++) {
                rowData[`component_${j + 1}`] = formatDisplayNumber(
                    data.component_transformation_matrix.components[i][j]
                );
            }

            table.rows.push(rowData);
        }

        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayName}.`],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Varimax with Kaiser Normalization."],
        });

        let rotationMethod = "Varimax";
        if (configData?.rotation) {
            if (configData.rotation.Quartimax) rotationMethod = "Quartimax";
            if (configData.rotation.Varimax) rotationMethod = "Varimax";
            if (configData.rotation.Equimax) rotationMethod = "Equimax";
            if (configData.rotation.Oblimin) rotationMethod = "Oblimin";
            if (configData.rotation.Promax) rotationMethod = "Promax";
        }
        table.interpretation = generateComponentTransformationDescription(rotationMethod);

        resultJson.tables.push(table);
    }

    // 11a. Pattern Matrix (Oblique rotations only)
    if (hasSuccessfulExtraction && extractedFactors > 1 && data.pattern_matrix) {
        const extractedComponents =
            data.pattern_matrix.components[0]?.values.length || 0;

        const methodValue = extractionMethod;
        const isPCA = methodValue === "PrincipalComp";
        const methodDisplayName = getExtractionMethodDisplayName(methodValue);
        const columnGroupHeader = isPCA ? "Component" : "Factor";

        const table: Table = {
            key: "pattern_matrix",
            title: "Pattern Matrixᵃ",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: columnGroupHeader,
                    key: "component",
                    children: Array.from(
                        { length: extractedComponents },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `component_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
        };

        data.pattern_matrix.components.forEach((component: any) => {
            const rowData: any = {
                rowHeader: [component.variable],
            };

            component.values.forEach((value: number | null, index: number) => {
                if (value === null || value === undefined) {
                    rowData[`component_${index + 1}`] = "";
                } else {
                    rowData[`component_${index + 1}`] = formatDisplayNumber(value);
                }
            });

            table.rows.push(rowData);
        });

        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayName}.`],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Promax with Kaiser Normalization."],
        });
        table.rows.push({
            rowHeader: ["a. Rotation converged in X iterations."],
        });

        resultJson.tables.push(table);
    }

    // 11b. Structure Matrix (Oblique rotations only)
    if (hasSuccessfulExtraction && extractedFactors > 1 && data.structure_matrix) {
        const extractedComponents =
            data.structure_matrix.components[0]?.values.length || 0;

        const methodValue = extractionMethod;
        const isPCA = methodValue === "PrincipalComp";
        const methodDisplayName = getExtractionMethodDisplayName(methodValue);
        const columnGroupHeader = isPCA ? "Component" : "Factor";

        const table: Table = {
            key: "structure_matrix",
            title: "Structure Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: columnGroupHeader,
                    key: "component",
                    children: Array.from(
                        { length: extractedComponents },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `component_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
        };

        data.structure_matrix.components.forEach((component: any) => {
            const rowData: any = {
                rowHeader: [component.variable],
            };

            component.values.forEach((value: number | null, index: number) => {
                if (value === null || value === undefined) {
                    rowData[`component_${index + 1}`] = "";
                } else {
                    rowData[`component_${index + 1}`] = formatDisplayNumber(value);
                }
            });

            table.rows.push(rowData);
        });

        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayName}.`],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Promax with Kaiser Normalization."],
        });

        resultJson.tables.push(table);
    }

    // 11c. Component Correlation Matrix (Oblique rotations only)
    if (hasSuccessfulExtraction && extractedFactors > 1 && data.component_correlation_matrix) {
        const components =
            data.component_correlation_matrix.correlations.length;

        const methodValue = extractionMethod;
        const isPCA = methodValue === "PrincipalComp";
        const tableTitle = isPCA ? "Component Correlation Matrix" : "Factor Correlation Matrix";
        const columnRowHeader = isPCA ? "Component" : "Factor";

        const table: Table = {
            key: "component_correlation_matrix",
            title: tableTitle,
            columnHeaders: [
                { header: columnRowHeader, key: "component" },
                ...Array.from({ length: components }, (_, i) => ({
                    header: (i + 1).toString(),
                    key: `component_${i + 1}`,
                })),
            ],
            rows: [],
        };

        for (let i = 0; i < components; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
            };

            for (let j = 0; j < components; j++) {
                rowData[`component_${j + 1}`] = formatDisplayNumber(
                    data.component_correlation_matrix.correlations[i][j]
                );
            }

            table.rows.push(rowData);
        }

        resultJson.tables.push(table);
    }

    // // 12-13. Score matrices are displayed only when user selects DisplayFactor
    // // 12. Component Score Coefficient Matrix
    // if (hasSuccessfulExtraction && shouldDisplayScoreMatrices && data.component_score_coefficient_matrix) {
    //     const extractedComponents =
    //         data.component_score_coefficient_matrix.components[0]?.values.length || 0;

    //     const methodValue = extractionMethod;
    //     const isPCA = methodValue === "PrincipalComp";
    //     const methodDisplayName = getExtractionMethodDisplayName(methodValue);
    //     const tableTitle = isPCA ? "Component Score Coefficient Matrix" : "Factor Score Coefficient Matrix";
    //     const columnGroupHeader = isPCA ? "Component" : "Factor";

    //     const table: Table = {
    //         key: "component_score_coefficient_matrix",
    //         title: tableTitle,
    //         interpretation: "This matrix displays the coefficient weights used to calculate the standardized factor scores for each observation.",
    //         columnHeaders: [
    //             { header: "", key: "var" },
    //             {
    //                 header: columnGroupHeader,
    //                 key: "component",
    //                 children: Array.from(
    //                     { length: extractedComponents },
    //                     (_, i) => ({
    //                         header: (i + 1).toString(),
    //                         key: `component_${i + 1}`,
    //                     })
    //                 ),
    //             },
    //         ],
    //         rows: [],
    //     };

    //     data.component_score_coefficient_matrix.components.forEach(
    //         (component: any) => {
    //             const rowData: any = {
    //                 rowHeader: [component.variable],
    //             };

    //             component.values.forEach((value: number, index: number) => {
    //                 rowData[`component_${index + 1}`] = formatDisplayNumber(value);
    //             });

    //             table.rows.push(rowData);
    //         }
    //     );

    //     table.rows.push({
    //         rowHeader: [`Extraction Method: ${methodDisplayName}.`],
    //     });
    //     table.rows.push({
    //         rowHeader: ["Rotation Method: Varimax with Kaiser Normalization."],
    //     });

    //     resultJson.tables.push(table);
    // }


    // 12. Component Score Coefficient Matrix
    if (hasSuccessfulExtraction && shouldDisplayScoreMatrices && data.component_score_coefficient_matrix) {
        const extractedComponents =
            data.component_score_coefficient_matrix.components[0]?.values.length || 0;

        const methodValue = extractionMethod;
        const isPCA = methodValue === "PrincipalComp";
        const methodDisplayName = getExtractionMethodDisplayName(methodValue);
        const columnGroupHeader = isPCA ? "Component" : "Factor";
        
        // SPSS Style Covariance flag
        const isCovariance = configData?.extraction?.Covariance === true;
        
        let tableTitle = isPCA ? "Component Score Coefficient Matrix" : "Factor Score Coefficient Matrix";
        if (isCovariance) {
            tableTitle += "ᵃ"; // Tambahkan superscript jika Covariance
        }

        const table: Table = {
            key: "component_score_coefficient_matrix",
            title: tableTitle,
            interpretation: "This matrix displays the coefficient weights used to calculate the standardized factor scores for each observation.",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: columnGroupHeader,
                    key: "component",
                    children: Array.from(
                        { length: extractedComponents },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `component_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
        };

        data.component_score_coefficient_matrix.components.forEach(
            (component: any) => {
                const rowData: any = {
                    rowHeader: [component.variable],
                };

                component.values.forEach((value: number, index: number) => {
                    // MENGGUNAKAN FORMATTER BARU
                    rowData[`component_${index + 1}`] = formatScoreCoefficientValue(value);
                });

                table.rows.push(rowData);
            }
        );

        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayName}.`],
        });
        
        // Cek label rotasi
        let rotationMethodStr = "";
        if (configData?.rotation?.Varimax) rotationMethodStr = "Varimax";
        else if (configData?.rotation?.Quartimax) rotationMethodStr = "Quartimax";
        else if (configData?.rotation?.Equimax) rotationMethodStr = "Equimax";
        
        if (rotationMethodStr) {
            table.rows.push({
                rowHeader: [`Rotation Method: ${rotationMethodStr} with Kaiser Normalization.`],
            });
        }

        // Tambahkan footnote standar baku SPSS untuk mode Covariance
        if (isCovariance) {
            table.rows.push({
                rowHeader: ["a. Coefficients are standardized."],
            });
        }

        resultJson.tables.push(table);
    }




    // 13. Component Score Covariance Matrix
    if (hasSuccessfulExtraction && shouldDisplayScoreMatrices && data.component_score_covariance_matrix) {
        const components =
            data.component_score_covariance_matrix.components.length;

        const methodValue = extractionMethod;
        const isPCA = methodValue === "PrincipalComp";
        const methodDisplayName = getExtractionMethodDisplayName(methodValue);
        const tableTitle = isPCA ? "Component Score Covariance Matrix" : "Factor Score Covariance Matrix";
        const columnRowHeader = isPCA ? "Component" : "Factor";

        const table: Table = {
            key: "component_score_covariance_matrix",
            title: tableTitle,
            interpretation: "For orthogonal rotation, the components must be uncorrelated, indicated by an off-diagonal value of 0, or close to 0, and an on-diagonal value of 1.",
            columnHeaders: [
                { header: columnRowHeader, key: "component" },
                ...Array.from({ length: components }, (_, i) => ({
                    header: (i + 1).toString(),
                    key: `component_${i + 1}`,
                })),
            ],
            rows: [],
        };

        for (let i = 0; i < components; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
            };

            for (let j = 0; j < components; j++) {
                rowData[`component_${j + 1}`] = formatScoreCovarianceMatrixValue(
                    data.component_score_covariance_matrix.components[i][j]
                );
            }

            table.rows.push(rowData);
        }

        table.rows.push({
            rowHeader: [`Extraction Method: ${methodDisplayName}.`],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Varimax with Kaiser Normalization."],
        });

        resultJson.tables.push(table);
    }

    // 14. Scree Plot Data (Tabel & Chart)
    if (data.scree_plot) {
        // A. Format sebagai Tabel (Kode Lama - Tetap dipertahankan)
        const table: Table = {
            key: "scree_plot",
            title: "Scree Plot Data",
            columnHeaders: [
                { header: "Component Number", key: "component_number" },
                { header: "Eigenvalue", key: "eigenvalue" },
            ],
            rows: [],
        };

        for (let i = 0; i < data.scree_plot.component_numbers.length; i++) {
            table.rows.push({
                rowHeader: [data.scree_plot.component_numbers[i].toString()],
                eigenvalue: formatDisplayNumber(data.scree_plot.eigenvalues[i]),
            });
        }
        resultJson.tables.push(table);

        // B. Format sebagai Chart Data (KODE BARU DITAMBAHKAN DISINI)
        // Kita meneruskan raw object dari Rust langsung karena strukturnya sudah cocok
        // dengan props yang diharapkan oleh komponen ScreePlot ({component_numbers, eigenvalues})
        resultJson.screePlotChart = data.scree_plot;
    }

    // 15. Loading Plot Data
    if (hasSuccessfulExtraction && data.loading_plot) {
        // Kita teruskan objek loading_plot dari Rust ke UI
        resultJson.loadingPlotChart = data.loading_plot;
    }

    // 16. Factor Scores (untuk Save as Variables)
    // Ekstrak factor_scores dari respons WASM jika ada
    if (hasSuccessfulExtraction && data.factor_scores && Array.isArray(data.factor_scores)) {
        resultJson.factorScores = data.factor_scores;
    }

    // ==================================================================================
    // POST-PROCESSING: Update correlation/covariance matrix description with determinant
    // ==================================================================================
    // Display determinant based on:
    // 1. User checked "Determinant" checkbox in Descriptives tab
    // 2. Extraction method selected (Correlation Matrix vs Covariance Matrix)
    const shouldShowDeterminant = configData?.descriptives?.Determinant === true;
    const isCorrelationExtraction = configData?.extraction?.Correlation === true;
    const isCovarianceExtraction = configData?.extraction?.Covariance === true;
    
    console.log("[FA] POST-PROCESSING: Starting");
    console.log("[FA] shouldShowDeterminant =", shouldShowDeterminant);
    console.log("[FA] isCorrelationExtraction =", isCorrelationExtraction);
    console.log("[FA] isCovarianceExtraction =", isCovarianceExtraction);
    console.log("[FA] configData?.descriptives?.Determinant =", configData?.descriptives?.Determinant);
    console.log("[FA] configData?.extraction?.Covariance =", configData?.extraction?.Covariance);
    console.log("[FA] configData?.extraction?.Correlation =", configData?.extraction?.Correlation);

    if (shouldShowDeterminant) {
        // Try to find determinant from different sources
        let determinantValue = data.covariance_matrix?.determinant;
        console.log("[FA] data.covariance_matrix?.determinant =", determinantValue);

        // If covariance_matrix determinant not found, try other sources
        if (!determinantValue) {
            // Try correlation_matrix.determinant
            determinantValue = (data.correlation_matrix as any)?.determinant;
            console.log("[FA] Covariance determinant not found, trying correlation_matrix:", determinantValue);
        }

        // If still not found, try top-level
        if (!determinantValue) {
            determinantValue = (data as any)?.determinant;
            console.log("[FA] Correlation determinant not found, trying top-level:", determinantValue);
        }

        // If STILL not found, calculate from correlation matrix data if available
        if (!determinantValue && data.correlation_matrix) {
            console.log("[FA] Determinant not in data, attempting to calculate from correlation matrix");
            determinantValue = calculateDeterminantFromCorrelationMatrix(data.correlation_matrix);
            console.log("[FA] Calculated determinant result:", determinantValue);
        }

        console.log("[FA] Final determinantValue:", determinantValue);

        if (determinantValue !== undefined) {
            let targetTable: Table | undefined;
            let tableName: string = "";

            // Determine which table should receive the determinant info based on extraction method
            if (isCorrelationExtraction) {
                // Correlation Matrix extraction → update correlation_matrix table
                targetTable = resultJson.tables.find((table: Table) => table.key === "correlation_matrix");
                tableName = "correlation_matrix";
                console.log("[FA] Routing to correlation_matrix table");
            } else if (isCovarianceExtraction) {
                // Covariance Matrix extraction → update covariance_matrix table
                targetTable = resultJson.tables.find((table: Table) => table.key === "covariance_matrix");
                tableName = "covariance_matrix";
                console.log("[FA] Routing to covariance_matrix table");
            }

            console.log(`[FA] Determined target table: ${tableName}`);
            console.log(`[FA] Found ${tableName} table?`, !!targetTable);
            console.log(`[FA] resultJson.tables keys:`, resultJson.tables.map((t: Table) => t.key));

            if (targetTable) {
                console.log(`[FA] POST-PROCESSING: Updating ${tableName} with determinant:`, determinantValue);

                // Regenerate description with determinant using appropriate generator
                if (tableName === "correlation_matrix") {
                    targetTable.interpretation = generateCorrelationMatrixDescription(determinantValue);
                } else if (tableName === "covariance_matrix") {
                    // Use covariance-specific description generator
                    targetTable.interpretation = generateCovarianceMatrixDescription(determinantValue);
                }

                console.log(`[FA] Updated ${tableName} interpretation:`, targetTable.interpretation);
                console.log(`[FA] Updated ${tableName} interpretation length:`, targetTable.interpretation?.length);
            } else {
                console.log(`[FA] WARNING: Target table ${tableName} not found in resultJson.tables`);
            }
        } else {
            console.log("[FA] POST-PROCESSING: determinant not available");
            console.log("[FA] data.covariance_matrix:", data.covariance_matrix);
            console.log("[FA] data.correlation_matrix:", data.correlation_matrix);
        }
    } else {
        console.log("[FA] POST-PROCESSING: Determinant checkbox NOT checked, setting base descriptions");
        
        // Even when determinant is OFF, set base description for the active matrix type
        let targetTable: Table | undefined;
        let tableName: string = "";

        if (isCorrelationExtraction) {
            targetTable = resultJson.tables.find((table: Table) => table.key === "correlation_matrix");
            tableName = "correlation_matrix";
            console.log("[FA] Routing to correlation_matrix table (no determinant)");
        } else if (isCovarianceExtraction) {
            targetTable = resultJson.tables.find((table: Table) => table.key === "covariance_matrix");
            tableName = "covariance_matrix";
            console.log("[FA] Routing to covariance_matrix table (no determinant)");
        }

        if (targetTable) {
            console.log(`[FA] POST-PROCESSING: Setting base description for ${tableName}`);
            
            // Set base description without determinant using appropriate generator
            if (tableName === "correlation_matrix") {
                targetTable.interpretation = generateCorrelationMatrixDescription();
            } else if (tableName === "covariance_matrix") {
                targetTable.interpretation = generateCovarianceMatrixDescription();
            }
            
            console.log(`[FA] Updated ${tableName} interpretation (no determinant):`, targetTable.interpretation);
        }
    }

    return resultJson;
}
