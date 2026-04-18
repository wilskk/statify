import type { KMedoidsClusterType } from "@/components/Modals/Analyze/Clustering/k-medoids-cluster/types/k-medoids-cluster";
import { ClusterMode, AutoKMethod } from "@/components/Modals/Analyze/Clustering/k-medoids-cluster/types/k-medoids-cluster";
import type { Variable } from "@/types/Variable";
import { ClusterWorker, type ClusteringInput, type ClusteringResult, type ClusteringRangeInput, type ClusteringRangeItem, type ProgressUpdate, type ClusteringMethod, type DistanceMetric } from "../types/worker";
import { generateComprehensiveKMedoidsOutput } from "./k-medoids-cluster-comprehensive-output";

type WasmModule = {
    default: (moduleOrPath?: unknown) => Promise<unknown>;
    run_k_medoids: (input: ClusteringInput) => unknown;
    test_connection: () => string;
    run_k_medoids_range?: (input: ClusteringRangeInput) => unknown[];
};

export type KMedoidsClusterAnalysisType = {
    configData: KMedoidsClusterType;
    dataVariables: any[];
    variables: Variable[];
    allVariables?: Variable[];
    onProgress?: (progress: ProgressUpdate) => void;
    useWorker?: boolean; // Enable/disable web worker
};

type PreprocessingSummary = {
    initialN: number;
    afterPreprocessingN: number;
    missingRowsRemoved: number;
    outlierRowsRemoved: number;
    missingByVariable: Record<string, number>;
};

type MissingHandlingResult = {
    matrix: number[][];
    rows: any[];
    removedCount: number;
};

type ZScoreResult = {
    matrix: number[][];
    means: number[];
    stdDevs: number[];
};

let wasmInitialized = false;
let wasmModuleCache: WasmModule | null = null;
let wasmImportPromise: Promise<WasmModule> | null = null;
let worker: ClusterWorker | null = null;
let warmupPromise: Promise<void> | null = null;

async function loadWasmModule(): Promise<WasmModule> {
    if (wasmModuleCache) {
        return wasmModuleCache;
    }

    if (!wasmImportPromise) {
        wasmImportPromise = import("@/public/workers/Clustering/K-Medoids/wasm")
            .then((mod) => mod as unknown as WasmModule);
    }

    wasmModuleCache = await wasmImportPromise;
    return wasmModuleCache;
}

function getInitializedWasmModule(): WasmModule {
    if (!wasmInitialized || !wasmModuleCache) {
        throw new Error("WASM module is not initialized");
    }
    return wasmModuleCache;
}


/**
 * Missing handling aligned with k-means preprocessing behavior:
 * - Listwise: keep rows only when all selected vars are valid.
 * - Pairwise: keep rows with at least one valid value, then impute remaining
 *   missing entries using per-feature mean to keep matrix numeric.
 */
function applyMissingHandling(
    rowsWithNumeric: Array<{ source: any; numeric: number[] }>,
    useListWise: boolean,
    usePairWise: boolean
): MissingHandlingResult {
    if (rowsWithNumeric.length === 0) {
        return { matrix: [], rows: [], removedCount: 0 };
    }

    if (useListWise || !usePairWise) {
        const kept = rowsWithNumeric.filter(item => item.numeric.every(v => Number.isFinite(v)));
        return {
            matrix: kept.map(item => item.numeric),
            rows: kept.map(item => item.source),
            removedCount: rowsWithNumeric.length - kept.length,
        };
    }

    // Pairwise mode: keep rows with at least one valid value.
    const pairwiseKept = rowsWithNumeric.filter(item => item.numeric.some(v => Number.isFinite(v)));
    if (pairwiseKept.length === 0) {
        return {
            matrix: [],
            rows: [],
            removedCount: rowsWithNumeric.length,
        };
    }

    const d = pairwiseKept[0].numeric.length;
    const means = Array.from({ length: d }, (_, j) => {
        const valid = pairwiseKept
            .map(item => item.numeric[j])
            .filter(v => Number.isFinite(v));
        if (valid.length === 0) return 0;
        return valid.reduce((s, v) => s + v, 0) / valid.length;
    });

    const imputedMatrix = pairwiseKept.map(item =>
        item.numeric.map((v, j) => (Number.isFinite(v) ? v : means[j]))
    );

    return {
        matrix: imputedMatrix,
        rows: pairwiseKept.map(item => item.source),
        removedCount: rowsWithNumeric.length - pairwiseKept.length,
    };
}

/**
 * Standardize matrix with Z-score per variable.
 * Uses sample standard deviation (n-1), aligned with R scale() default behavior.
 */
function standardizeZScore(matrix: number[][]): ZScoreResult {
    if (matrix.length === 0) {
        return { matrix: [], means: [], stdDevs: [] };
    }

    const nRows = matrix.length;
    const nCols = matrix[0].length;
    const means = Array.from({ length: nCols }, (_, col) =>
        matrix.reduce((sum, row) => sum + row[col], 0) / nRows
    );

    const stdDevs = Array.from({ length: nCols }, (_, col) => {
        if (nRows <= 1) return 1;
        const mean = means[col];
        const variance = matrix.reduce((sum, row) => {
            const diff = row[col] - mean;
            return sum + diff * diff;
        }, 0) / (nRows - 1);
        const std = Math.sqrt(variance);
        return std > 1e-12 ? std : 1;
    });

    const standardized = matrix.map(row =>
        row.map((value, col) => (value - means[col]) / stdDevs[col])
    );

    return {
        matrix: standardized,
        means,
        stdDevs,
    };
}

/**
 * Calculate Euclidean distance between two points
 */
function euclideanDistance(p1: number[], p2: number[]): number {
    let sum = 0;
    for (let i = 0; i < p1.length; i++) {
        sum += Math.pow(p1[i] - p2[i], 2);
    }
    return Math.sqrt(sum);
}

/**
 * Calculate Silhouette Score for a clustering result
 * Returns average silhouette score across all points.
 * For large datasets, sub-samples up to MAX_SILHOUETTE_SAMPLE points
 * (stratified by cluster) to keep the O(n²) cost manageable.
 */
const MAX_SILHOUETTE_SAMPLE = 300;

function calculateSilhouetteScore(
    data: number[][],
    labels: number[],
    n_clusters: number
): number {
    if (!labels || !Array.isArray(labels) || labels.length === 0) return 0;
    const n = data.length;
    if (n_clusters <= 1 || n_clusters >= n) return 0;

    // Sub-sample when dataset is large
    let sampleData = data;
    let sampleLabels = labels;
    if (n > MAX_SILHOUETTE_SAMPLE) {
        // Stratified sample: take ~equal share from each cluster
        const perCluster = Math.max(1, Math.floor(MAX_SILHOUETTE_SAMPLE / n_clusters));
        const indices: number[] = [];
        for (let c = 0; c < n_clusters; c++) {
            const clusterIdx = labels.reduce<number[]>((acc, l, i) => { if (l === c) acc.push(i); return acc; }, []);
            const step = Math.max(1, Math.floor(clusterIdx.length / perCluster));
            for (let j = 0; j < clusterIdx.length && indices.length < MAX_SILHOUETTE_SAMPLE; j += step) {
                indices.push(clusterIdx[j]);
            }
        }
        sampleData = indices.map(i => data[i]);
        sampleLabels = indices.map(i => labels[i]);
    }

    const sn = sampleData.length;

    // Group sample points by cluster
    const clusters: number[][] = Array.from({ length: n_clusters }, () => []);
    for (let i = 0; i < sn; i++) {
        clusters[sampleLabels[i]].push(i);
    }

    // Calculate silhouette for each sample point
    const silhouettes: number[] = [];

    for (let i = 0; i < sn; i++) {
        const clusterIdx = sampleLabels[i];
        const cluster = clusters[clusterIdx];

        // a(i): average distance to points in same cluster
        let a = 0;
        if (cluster.length > 1) {
            for (const j of cluster) {
                if (i !== j) {
                    a += euclideanDistance(sampleData[i], sampleData[j]);
                }
            }
            a /= (cluster.length - 1);
        }

        // b(i): minimum average distance to points in other clusters
        let b = Infinity;
        for (let otherCluster = 0; otherCluster < n_clusters; otherCluster++) {
            if (otherCluster === clusterIdx) continue;
            const otherPoints = clusters[otherCluster];
            if (otherPoints.length === 0) continue;
            let avgDist = 0;
            for (const j of otherPoints) {
                avgDist += euclideanDistance(sampleData[i], sampleData[j]);
            }
            avgDist /= otherPoints.length;
            b = Math.min(b, avgDist);
        }

        const s = b === Infinity ? 0 : (b - a) / Math.max(a, b);
        silhouettes.push(s);
    }

    return silhouettes.reduce((sum, s) => sum + s, 0) / sn;
}

/**
 * Calculate within-cluster sum of squares (WCSS) for Elbow method
 */
function calculateWCSS(
    data: number[][],
    labels: number[],
    medoidIndices: number[]
): number {
    let wcss = 0;
    for (let i = 0; i < data.length; i++) {
        const clusterIdx = labels[i];
        const medoidIdx = medoidIndices[clusterIdx];
        wcss += Math.pow(euclideanDistance(data[i], data[medoidIdx]), 2);
    }
    return wcss;
}

/**
 * Find optimal k using Elbow method
 * Returns the k where the rate of decrease sharply changes
 */
function findOptimalKElbow(kValues: number[], wcssValues: number[]): number {
    if (kValues.length < 3) return kValues[0];
    
    // Calculate rate of change (second derivative approximation)
    const changes: number[] = [];
    for (let i = 1; i < wcssValues.length - 1; i++) {
        const change = Math.abs(
            (wcssValues[i + 1] - wcssValues[i]) - (wcssValues[i] - wcssValues[i - 1])
        );
        changes.push(change);
    }
    
    // Find the maximum change (the elbow point)
    let maxChangeIdx = 0;
    let maxChange = changes[0];
    for (let i = 1; i < changes.length; i++) {
        if (changes[i] > maxChange) {
            maxChange = changes[i];
            maxChangeIdx = i;
        }
    }
    
    // Return k at elbow point (add 1 because we started from index 1)
    return kValues[maxChangeIdx + 1];
}

/**
 * Initialize WASM module (direct execution mode)
 */
async function initializeWasm() {
    if (!wasmInitialized) {
        try {
            const wasmModule = await loadWasmModule();
            await wasmModule.default();
            wasmInitialized = true;
            console.log("✅ K-Medoids WASM module initialized (direct)");
            console.log("Connection test:", wasmModule.test_connection());
        } catch (error) {
            console.error("❌ Failed to initialize WASM module:", error);
            throw error;
        }
    }
}

/**
 * Warm up clustering runtime ahead of execution to reduce first-run latency.
 * This is intentionally idempotent and safe to call multiple times.
 */
export async function warmupKMedoidsRuntime(preferWorker: boolean = true): Promise<void> {
    if (warmupPromise) {
        return warmupPromise;
    }

    warmupPromise = (async () => {
        if (preferWorker) {
            const workerInstance = initializeWorker();
            if (workerInstance) {
                try {
                    await workerInstance.init();
                    return;
                } catch (error) {
                    console.warn("Worker warmup failed, falling back to WASM warmup", error);
                }
            }
        }

        await initializeWasm();
    })();

    try {
        await warmupPromise;
    } finally {
        warmupPromise = null;
    }
}

function persistComprehensiveOutputInBackground(
    analysisResult: any,
    processedDataRows: any[],
    variables: Variable[],
    caseLabelColumnIndex: number | null,
    finalMatrix?: number[][]
): void {
    void (async () => {
        try {
            await generateComprehensiveKMedoidsOutput(
                analysisResult,
                processedDataRows,
                variables,
                caseLabelColumnIndex,
                finalMatrix
            );
            console.log("✓ Comprehensive output ready (background)");
        } catch (err) {
            console.error("Failed to generate comprehensive output in background:", err);
        }
    })();
}

/**
 * Initialize Web Worker
 * webpack 5 requires `new Worker(new URL(...))` at the *call site* to statically
 * bundle the worker as a separate chunk. We create the raw Worker here and pass
 * it to ClusterWorker so the URL pattern is visible to webpack's analyzer.
 */
function initializeWorker(): ClusterWorker | null {
    if (!worker) {
        try {
            // webpack 5 / Next.js native worker bundling — must keep new Worker + new URL together
            const rawWorker = new Worker(
                new URL("../../../../../../public/workers/Clustering/cluster-worker.js", import.meta.url)
            );
            worker = new ClusterWorker(rawWorker);
            console.log("✅ K-Medoids Worker initialized");
        } catch (error) {
            console.error("❌ Failed to initialize worker:", error);
            console.log("Falling back to direct execution");
            return null;
        }
    }
    return worker;
}

/**
 * Cleanup worker on page unload
 */
if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
        if (worker) {
            worker.terminate();
            worker = null;
        }
    });
}

/**
 * Map WASM output format to TypeScript ClusteringResult format
 * WASM returns: cluster_assignments, medoids_indices, total_distance
 * TypeScript expects: labels, medoids, cost
 */
function mapWasmOutputToResult(wasmOutput: any): ClusteringResult {
    // Build iteration_history from cost_history if present
    const costHistory: number[] = wasmOutput.cost_history || [];
    const iterationHistory = costHistory.length > 0
        ? costHistory.map((cost: number, idx: number) => ({
              iteration: idx,
              cost,
          }))
        : undefined;

    // Some WASM paths omit `iterations` but still provide history.
    // Derive swap-iteration count from history shape: [init, iter1, ...].
    const explicitIterations = wasmOutput.iterations;
    const inferredIterations = costHistory.length > 0
        ? Math.max(costHistory.length - 1, 0)
        : iterationHistory && iterationHistory.length > 0
        ? Math.max(iterationHistory.length - 1, 0)
        : 0;
    const totalIterations =
        typeof explicitIterations === "number" && explicitIterations > 0
            ? explicitIterations
            : inferredIterations;

    const rawDistances = wasmOutput.distances_to_medoids;
    const distances_to_medoids: number[] | undefined =
        rawDistances instanceof Float64Array
            ? Array.from(rawDistances as Float64Array)
            : Array.isArray(rawDistances) && rawDistances.length > 0
            ? rawDistances
            : undefined;

    return {
        labels: wasmOutput.cluster_assignments || wasmOutput.labels || [],
        medoids: wasmOutput.medoids_indices || wasmOutput.medoid_indices || wasmOutput.medoids || [],
        cost: wasmOutput.total_distance || wasmOutput.total_cost || wasmOutput.cost || 0,
        total_cost_build:
            wasmOutput.total_cost_build ??
            (Array.isArray(costHistory) && costHistory.length > 0 ? costHistory[0] : undefined),
        total_cost_swap:
            wasmOutput.total_cost_swap ??
            (Array.isArray(costHistory) && costHistory.length > 0 ? costHistory[costHistory.length - 1] : undefined),
        iterations: totalIterations,
        converged: wasmOutput.converged || false,
        iteration_history: iterationHistory,
        distances_to_medoids,
    };
}

export async function analyzeKMedoidsCluster({
    configData,
    dataVariables,
    variables,
    allVariables,
    onProgress,
    useWorker = true, // Default to using worker
}: KMedoidsClusterAnalysisType) {
    const n = dataVariables.length;
    const d = variables.length;
    const k = 2;
    const fixedSeed = 123;
    const n_init = 1;
    
    console.log("K-Medoids Cluster Analysis Starting...");
    console.log("Config:", configData);
    console.log("Dataset:", { n: n, dimensions: d, k: k, n_init: n_init, seed: fixedSeed });
    console.log("Mode:", useWorker ? "Web Worker (non-blocking)" : "Direct (blocking)");
    
    // Performance estimation
    const complexity = n * n * k * n_init; // Simplified estimate
    if (n > 1000 && n_init > 5) {
        console.warn(`⚠️ Large dataset detected (n=${n}, n_init=${n_init}). Consider reducing Number of Initializations to 1-3 for faster execution.`);
    }
    if (complexity > 1000000) {
        console.warn(`⚠️ High computational complexity detected. This may take several seconds to complete.`);
    }
    
    try {
        const missingByVariable: Record<string, number> = Object.fromEntries(
            variables.map(v => [v.name, 0])
        );

        // Prepare input data matrix — convert selected vars to numeric and drop invalid rows.
        const parsedRows = dataVariables
            .map((row: any) => {
                const numeric = variables.map(v => {
                    const value = row[v.columnIndex as number];
                    const parsed = typeof value === "number" ? value : parseFloat(value);
                    if (!Number.isFinite(parsed)) {
                        missingByVariable[v.name] = (missingByVariable[v.name] || 0) + 1;
                    }
                    return parsed;
                });
                return {
                    source: row,
                    numeric,
                };
            });

        // Preprocessing flow:
        // 1) non-numeric -> NaN (already done above),
        // 2) remove rows with any NaN/Inf (RemoveRow),
        // 3) optional Z-score standardization.
        const missingHandled = applyMissingHandling(parsedRows, true, false);

        const dataMatrix = missingHandled.matrix;
        const processedDataRows = missingHandled.rows;

        const useStandardization =
            configData.options?.Standardize ??
            configData.iterate?.Standardize ??
            true;

        const standardized = useStandardization
            ? standardizeZScore(dataMatrix)
            : {
                  matrix: dataMatrix,
                  means: [],
                  stdDevs: [],
              };
        const standardizedMatrix = standardized.matrix;

        const preprocessingSummary: PreprocessingSummary = {
            initialN: dataVariables.length,
            afterPreprocessingN: standardizedMatrix.length,
            missingRowsRemoved: missingHandled.removedCount,
            outlierRowsRemoved: 0,
            missingByVariable,
        };
        
        // Early validation: need at least 2 valid data points
        if (standardizedMatrix.length < 2) {
            throw new Error(`Not enough valid data points for clustering (found ${standardizedMatrix.length}). Check that the selected variables contain numeric values.`);
        }

        const finalMatrix = standardizedMatrix;

        const caseLabelVariableName = configData.main.CaseTarget?.trim();
        const sourceVariables = allVariables ?? variables;
        const caseLabelColumnIndex = caseLabelVariableName
            ? (sourceVariables.find(v => v.name === caseLabelVariableName)?.columnIndex ?? null)
            : null;
        
        console.log("🔍 Data Matrix Prepared:", {
            rows: finalMatrix.length,
            cols: finalMatrix[0]?.length,
            hasValidData: finalMatrix.length > 0 && finalMatrix[0].length > 0,
            preprocessing: useStandardization ? "RemoveRow + Z-score" : "RemoveRow",
        });
        
        // Fixed clustering setup per requested parity:
        // PAM, Euclidean, k=2, seed=123.
        const method: ClusteringMethod = "PAM";
        const distanceMetric: DistanceMetric = "euclidean";
        
        // Check if automatic k selection is enabled
        const isAutomatic = false;
        if (configData.main.ClusterMode === ClusterMode.Automatic) {
            console.warn("Automatic k mode ignored: using fixed k=2 for R-parity PAM run.");
        }
        
        if (!isAutomatic) {
            // Validate manual k
            const manualK = 2;
            if (manualK > dataMatrix.length) {
                throw new Error(
                    `Number of clusters (k=${manualK}) cannot exceed number of valid data points (n=${dataMatrix.length}). ` +
                    `Please reduce the number of clusters or check your data.`
                );
            }
        }
        
        if (isAutomatic) {
            // ========== AUTOMATIC K SELECTION ==========
            console.log("🔍 Running automatic k selection...");
            
            const kMin = configData.main.AutoKMin || 2;
            const kMax = Math.min(configData.main.AutoKMax || 10, dataMatrix.length - 1);
            const autoMethod = configData.main.AutoKMethod || AutoKMethod.Silhouette;
            
            if (kMin >= kMax) {
                throw new Error(`AutoKMin (${kMin}) must be less than the effective AutoKMax (${kMax}). Dataset has ${dataMatrix.length} valid data points.`);
            }
            
            console.log(`Testing k from ${kMin} to ${kMax} using ${autoMethod} method`);
            
            // Use Web Worker if available (non-blocking), fall back to direct WASM
            const autoWorker = useWorker ? initializeWorker() : null;
            if (autoWorker) {
                await autoWorker.init(); // ensure WASM in worker is ready
                // Cache data matrix in the worker once — avoids re-serializing on every k iteration
                await autoWorker.setData(finalMatrix);
                console.log("Using Web Worker for automatic k selection (non-blocking)");
            } else {
                await initializeWasm(); // direct WASM fallback (blocks main thread)
                console.log("Worker unavailable, using direct WASM for automatic k selection");
            }
            
            const results: any[] = [];
            const scores: number[] = [];
            const silhouetteScoresPerK: number[] = [];

            // ── Single WASM range call — builds dist matrix once, runs PAM for all k ──
            const rangeInput: ClusteringRangeInput = {
                k_min: kMin,
                k_max: kMax,
                method: method,
                max_iterations: configData.iterate.MaximumIterations || 100,
                distance_metric: distanceMetric,
                random_seed: configData.iterate.RandomSeed ?? 42,
                convergence_tolerance: configData.iterate.ConvergenceCriterion || 0.0,
                // data omitted when using worker (cached via setData above)
                ...(autoWorker ? {} : { data: finalMatrix }),
            };

            if (onProgress) {
                onProgress({ stage: "automatic_k", progress: 10,
                    message: `Testing k=${kMin}..${kMax} with shared distance matrix...` });
            }

            let rangeResults: ClusteringRangeItem[];
            if (autoWorker) {
                rangeResults = await autoWorker.clusterRange(rangeInput, onProgress);
            } else {
                // Direct WASM fallback: call run_k_medoids_range if available in the current build
                const wasmModule = getInitializedWasmModule();
                if (typeof wasmModule.run_k_medoids_range !== "function") {
                    throw new Error("run_k_medoids_range not found in WASM build — please rebuild WASM with wasm-pack.");
                }
                const rawItems = wasmModule.run_k_medoids_range(rangeInput) as any[];
                rangeResults = rawItems.map((item: any) => ({
                    k: item.k,
                    labels: item.cluster_assignments || [],
                    medoids: item.medoids_indices || [],
                    cost: item.total_distance || 0,
                    iterations: item.iterations || 0,
                    converged: item.converged || false,
                    cost_history: item.cost_history || [],
                    silhouetteScore: calculateSilhouetteScore(finalMatrix, item.cluster_assignments || [], item.k),
                    wcssScore: calculateWCSS(finalMatrix, item.cluster_assignments || [], item.medoids_indices || []),
                }));
            }

            // Map range results into the existing arrays shapes
            for (const item of rangeResults) {
                if (!item.labels || item.labels.length === 0) {
                    const fallback = autoMethod === AutoKMethod.Silhouette ? -1 : Infinity;
                    results.push({ labels: [], medoids: [], cost: Infinity, iterations: 0, converged: false });
                    scores.push(fallback);
                    silhouetteScoresPerK.push(-1);
                    continue;
                }
                results.push(item);
                const sil = item.silhouetteScore ?? 0;
                const wcss = item.wcssScore ?? 0;
                if (autoMethod === AutoKMethod.Silhouette) {
                    scores.push(sil);
                    silhouetteScoresPerK.push(sil);
                    console.log(`  k=${item.k}: Silhouette = ${sil.toFixed(4)}`);
                } else {
                    scores.push(wcss);
                    silhouetteScoresPerK.push(sil);
                    console.log(`  k=${item.k}: WCSS = ${wcss.toFixed(2)}, Silhouette = ${sil.toFixed(4)}`);
                }
            }
            
            // Find optimal k
            // kRange is derived from the actual returned range results (preserves order)
            const kRange = rangeResults.map(r => r.k);
            let optimalK: number;
            let optimalIdx: number;
            
            if (autoMethod === AutoKMethod.Silhouette) {
                // Higher silhouette is better
                optimalIdx = scores.indexOf(Math.max(...scores));
                optimalK = kRange[optimalIdx];
                console.log(`✅ Optimal k = ${optimalK} (Silhouette: ${scores[optimalIdx].toFixed(4)})`);
            } else {
                // Elbow method - find the elbow point
                optimalK = findOptimalKElbow(kRange, scores);
                optimalIdx = kRange.indexOf(optimalK);
                console.log(`✅ Optimal k = ${optimalK} (Elbow method)`);
            }
            
            if (onProgress) {
                onProgress({
                    stage: "finalizing",
                    progress: 85,
                    message: `Optimal k=${optimalK} found. Running final clustering...`
                });
            }

            // Run final clustering on the full dataset.
            // The range scan used subsampled data (≤300 pts) so its labels only cover
            // the subsample. We must cluster the full matrix to get assignments for
            // every row.  PAM with BUILD phase is deterministic (effective n_init=1 in
            // Rust regardless of what n_init says), so this is a single fast run.
            const finalInput: ClusteringInput = {
                data: finalMatrix,
                n_clusters: optimalK,
                method: method,
                max_iterations: configData.iterate.MaximumIterations || 100,
                distance_metric: distanceMetric,
                random_seed: configData.iterate.RandomSeed || null,
                n_init: 1, // BUILD phase is deterministic — one run is enough
                convergence_tolerance: configData.iterate.ConvergenceCriterion || 0.0,
            };
            let finalResult: any;
            if (autoWorker) {
                finalResult = await autoWorker.cluster(finalInput);
            } else {
                finalResult = mapWasmOutputToResult(getInitializedWasmModule().run_k_medoids(finalInput));
            }
            console.log(`✅ Final clustering (k=${optimalK}, full dataset) complete`);
            
            if (onProgress) {
                onProgress({
                    stage: "complete",
                    progress: 100,
                    message: "Analysis complete!"
                });
            }
            
            const analysisResult = {
                success: true,
                message: `K-Medoids analysis completed successfully (automatic k=${optimalK})`,
                result: finalResult,
                config: configData,
                preprocessingSummary,
                automaticKSelection: {
                    method: autoMethod,
                    testedRange: { min: kMin, max: kMax },
                    scores: scores.map((score, i) => ({
                        k: kRange[i] ?? (kMin + i),
                        score,
                        silhouetteScore: silhouetteScoresPerK[i] ?? 0,
                    })),
                    optimalK: optimalK,
                    optimalScore: scores[optimalIdx]
                }
            };
            
            // Persist large comprehensive output in background so the main flow can return early.
            console.log("⏳ Scheduling comprehensive output generation in background...");
            persistComprehensiveOutputInBackground(
                analysisResult,
                processedDataRows,
                variables,
                caseLabelColumnIndex
            );
            
            return analysisResult;
            
        } else {
            // ========== MANUAL K SELECTION ==========
            console.log("📊 Running clustering with manual k...");
            
            const clusteringInput: ClusteringInput = {
                data: finalMatrix,
                n_clusters: 2,
                method: method,
                max_iterations: configData.iterate.MaximumIterations || 100,
                distance_metric: distanceMetric,
                random_seed: fixedSeed,
                n_init: 1,
                convergence_tolerance: configData.iterate.ConvergenceCriterion || 0.0,
                clara_num_samples: configData.iterate.NumSamples ?? 5,
                ...(configData.iterate.SampleSize ? { clara_sample_size: configData.iterate.SampleSize } : {}),
            };

            // ── k-pipeline verification (main thread side) ────────────────
            console.log(`[Analysis] k-pipeline CHECK: configData.main.Cluster=${configData.main.Cluster}, ClusterMode=${configData.main.ClusterMode}, clusteringInput.n_clusters=${clusteringInput.n_clusters}`);
            if (clusteringInput.n_clusters !== (configData.main.Cluster ?? 2)) {
                console.error(`[Analysis] k MISMATCH: config says ${configData.main.Cluster} but clusteringInput has ${clusteringInput.n_clusters}`);
            }
            console.log("Clustering input prepared:", {
                dataPoints: clusteringInput.data!.length,
                dimensions: clusteringInput.data![0]?.length || 0,
                clusters: clusteringInput.n_clusters,
                method: clusteringInput.method,
                sampleDataRow0: clusteringInput.data![0],
                sampleDataRow1: clusteringInput.data![1],
                maxIterations: clusteringInput.max_iterations,
                nInit: clusteringInput.n_init,
                distanceMetric: clusteringInput.distance_metric
            });

            let result;

            if (useWorker) {
                // Try to use Web Worker for background execution
                const workerInstance = initializeWorker();
                
                if (workerInstance) {
                    console.log("Using Web Worker for clustering...");
                    await workerInstance.init(); // ensure WASM is ready before clustering
                    result = await workerInstance.cluster(clusteringInput, onProgress);
                    console.log("✅ Result from Worker:", result);
                } else {
                    // Worker not available, fallback to direct execution
                    console.log("Worker not available, using direct execution (main thread)...");
                    await initializeWasm();
                    
                    if (onProgress) {
                        onProgress({ stage: "preparing", progress: 0, message: "Preparing data..." });
                        onProgress({ stage: "clustering", progress: 50, message: "Running algorithm..." });
                    }
                    
                    const wasmResult = getInitializedWasmModule().run_k_medoids(clusteringInput);
                    console.log("⚙️ WASM Result (direct):", {
                        hasResult: !!wasmResult,
                        keys: wasmResult ? Object.keys(wasmResult) : [],
                        cost: wasmResult?.cost || wasmResult?.total_cost || wasmResult?.total_distance,
                        labelsLength: wasmResult?.labels?.length || wasmResult?.cluster_assignments?.length,
                        medoidsLength: wasmResult?.medoids?.length || wasmResult?.medoid_indices?.length || wasmResult?.medoids_indices?.length
                    });
                    result = mapWasmOutputToResult(wasmResult);
                    console.log("✅ Mapped result (direct):", result);
                    
                    if (onProgress) {
                        onProgress({ stage: "complete", progress: 100, message: "Analysis complete!" });
                    }
                }
            } else {
                // Direct execution on main thread (explicitly requested)
                console.log("Using direct execution (main thread)...");
                await initializeWasm();
                
                if (onProgress) {
                    onProgress({ stage: "clustering", progress: 50, message: "Running algorithm..." });
                }
                
                const wasmResult = getInitializedWasmModule().run_k_medoids(clusteringInput);
                result = mapWasmOutputToResult(wasmResult);
            }
            
            console.log("Clustering completed:", result);
            
            const analysisResult = {
                success: true,
                message: "K-Medoids analysis completed successfully",
                result: result,
                config: configData,
                preprocessingSummary,
            };
            
            // Persist large comprehensive output in background so the main flow can return early.
            console.log("⏳ Scheduling comprehensive output generation in background...");
            persistComprehensiveOutputInBackground(
                analysisResult,
                processedDataRows,
                variables,
                caseLabelColumnIndex,
                finalMatrix
            );
            
            return analysisResult;
        }
        
    } catch (error) {
        console.error("Error in K-Medoids analysis:", error);
        return {
            success: false,
            message: `Analysis failed: ${error}`,
            error: error,
        };
    }
}

/**
 * Cancel ongoing clustering (worker mode only)
 */
export function cancelClustering(): void {
    if (worker) {
        worker.cancel();
        console.log("Clustering cancelled");
    }
}

/**
 * Terminate worker and cleanup resources
 */
export function cleanupWorker(): void {
    if (worker) {
        worker.terminate();
        worker = null;
        console.log("Worker terminated");
    }
}
