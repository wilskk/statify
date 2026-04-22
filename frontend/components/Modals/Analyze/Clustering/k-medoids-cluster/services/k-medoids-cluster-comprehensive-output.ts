// k-medoids-cluster-comprehensive-output.ts
import { useResultStore } from "@/stores/useResultStore";
import type { Table } from "@/types/Table";
import type { Variable } from "@/types/Variable";
import type { KMedoidsOutput, KMedoidsSummary, ObjectAssignment, MedoidInfo, ClusterProfile, IterationHistory, MedoidDistanceMatrix, SilhouetteClusterScore } from "../types/output";
import { buildCaseProcessingSummary, recoverMedoidsFromMismatch } from "./k-medoids-cluster-guards";

interface ClusteringResult {
    labels: number[];
    medoids: number[];
    cost: number;
    avgCost?: number;
    avg_cost?: number;
    total_cost_build?: number;
    total_cost_swap?: number;
    iterations: number;
    converged: boolean;
    silhouette_scores?: number[]; // Per-object silhouette scores from WASM
    iteration_history?: { iteration: number; cost: number }[];
    /** Raw cost per step: [0]=BUILD cost, [1..n]=cost after each swap (sent by worker). */
    cost_history?: number[];
    /** Medoid indices at each step: [0]=initial, [i]=after swap i. */
    medoid_history?: number[][];
}

interface AutomaticKSelection {
    method: string;
    testedRange: { min: number; max: number };
    scores: Array<{
        k: number;
        score: number;
        silhouetteScore?: number;
        totalCost?: number;
    }>;
    optimalK: number;
    optimalScore: number;
}

interface KMedoidsAnalysisResult {
    success: boolean;
    message: string;
    result: ClusteringResult;
    config: any;
    preprocessingSummary?: {
        initialN: number;
        afterPreprocessingN: number;
        missingRowsRemoved: number;
        outlierRowsRemoved: number;
        missingByVariable: Record<string, number>;
    };
    automaticKSelection?: AutomaticKSelection;
    kChartSelection?: AutomaticKSelection;
}

/**
 * Calculate Euclidean distance between two points
 * Returns 0 if points are invalid
 */
function euclideanDistance(p1: number[], p2: number[]): number {
    if (!p1 || !p2 || p1.length !== p2.length) return 0;
    let sum = 0;
    for (let i = 0; i < p1.length; i++) {
        const diff = (p1[i] || 0) - (p2[i] || 0);
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Calculate silhouette score for a single object (TypeScript fallback)
 */
function calculateObjectSilhouette(
    objectIdx: number,
    cluster: number,
    dataMatrix: number[][],
    labels: number[]
): number {
    const n = dataMatrix.length;
    const point = dataMatrix[objectIdx];
    
    // Calculate a(i): average distance to points in same cluster
    let sameClusterDistances: number[] = [];
    for (let j = 0; j < n; j++) {
        if (labels[j] === cluster && j !== objectIdx) {
            sameClusterDistances.push(euclideanDistance(point, dataMatrix[j]));
        }
    }
    
    const a_i = sameClusterDistances.length > 0
        ? sameClusterDistances.reduce((a, b) => a + b, 0) / sameClusterDistances.length
        : 0;
    
    // Calculate b(i): minimum average distance to other clusters
    const uniqueClusters = Array.from(new Set(labels)).filter(c => c !== cluster);
    let minAvgDistance = Infinity;
    
    for (const otherCluster of uniqueClusters) {
        let otherDistances: number[] = [];
        for (let j = 0; j < n; j++) {
            if (labels[j] === otherCluster) {
                otherDistances.push(euclideanDistance(point, dataMatrix[j]));
            }
        }
        
        if (otherDistances.length > 0) {
            const avg = otherDistances.reduce((a, b) => a + b, 0) / otherDistances.length;
            if (avg < minAvgDistance) {
                minAvgDistance = avg;
            }
        }
    }
    
    const b_i = minAvgDistance === Infinity ? 0 : minAvgDistance;
    
    // Silhouette score
    if (a_i === 0 && b_i === 0) return 0;
    return (b_i - a_i) / Math.max(a_i, b_i);
}

/**
 * Calculate silhouette scores in chunks to avoid blocking UI
 * Yields control back to browser between chunks
 */
async function calculateSilhouetteScoresAsync(
    dataMatrix: number[][],
    labels: number[],
    chunkSize: number = 50
): Promise<number[]> {
    const n = dataMatrix.length;
    const scores: number[] = new Array(n);
    
    for (let i = 0; i < n; i += chunkSize) {
        const end = Math.min(i + chunkSize, n);
        
        // Calculate chunk
        for (let j = i; j < end; j++) {
            scores[j] = calculateObjectSilhouette(j, labels[j], dataMatrix, labels);
        }
        
        // Yield to browser to keep UI responsive
        if (end < n) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    return scores;
}

/**
 * Calculate distance matrix between medoids
 */
function calculateMedoidDistanceMatrix(
    standardizedMatrix: number[][],
    medoidFilteredIndices: number[]
): MedoidDistanceMatrix {
    const k = medoidFilteredIndices.length;
    const distances: number[][] = Array(k).fill(0).map(() => Array(k).fill(0));
    
    for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
            const medoid1 = medoidFilteredIndices[i];
            const medoid2 = medoidFilteredIndices[j];
            const point1 = standardizedMatrix[medoid1] || [];
            const point2 = standardizedMatrix[medoid2] || [];
            
            const dist = euclideanDistance(point1, point2);
            distances[i][j] = dist;
            distances[j][i] = dist;
        }
    }
    
    return {
        clusterLabels: Array.from({ length: k }, (_, i) => i + 1),
        distances
    };
}

/**
 * Generate descriptive label for cluster based on attributes
 */
function generateClusterLabel(
    meanAttributes: Record<string, number>,
    clusterIdx: number
): string {
    // Simple heuristic: find dominant attribute
    const entries = Object.entries(meanAttributes);
    if (entries.length === 0) return `Cluster ${clusterIdx + 1}`;
    
    entries.sort((a, b) => b[1] - a[1]);
    const dominantAttr = entries[0][0];
    
    return `Cluster ${clusterIdx + 1}: High ${dominantAttr}`;
}

export async function generateComprehensiveKMedoidsOutput(
    analysisResult: KMedoidsAnalysisResult,
    dataVariables: any[],
    variables: Variable[],
    caseLabelColumnIndex: number | null = null,
    standardizedMatrix?: number[][]
) {
    // Tiny helper: yield the main thread so the browser can paint/handle events
    // between heavy synchronous sections.  Costs ~1 ms but prevents "frozen" UI.
    const yieldToUI = () => new Promise<void>(resolve => setTimeout(resolve, 0));

    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();
        const { result, config, automaticKSelection, kChartSelection } = analysisResult;
        const chartSelection = automaticKSelection ?? kChartSelection;

        if (!result || !result.labels || !Array.isArray(result.labels)) {
            throw new Error("Invalid clustering result structure");
        }

        const method = config.iterate.Method || "PAM";
        const useStandardization =
            config?.options?.Standardize ??
            config?.iterate?.Standardize ??
            true;

        // ── Authoritative k: prefer config value over WASM-derived medoid count ──
        // result.medoids.length MUST equal the configured k.  If they differ it
        // means the WASM binary is stale (old pam_build destructuring bug where
        // the n-length assignment vector was mistakenly used as the medoid list).
        // Using the config value protects table generation from reporting k = N.
        const configK: number = (() => {
            // Automatic k: the actual chosen k is stored in automaticKSelection.
            if (automaticKSelection?.optimalK && automaticKSelection.optimalK >= 2) {
                return automaticKSelection.optimalK;
            }
            const manualK = config?.main?.Cluster;
            if (typeof manualK === 'number' && manualK >= 2) return manualK;
            // Last resort: trust the medoid count (correct when WASM is up-to-date).
            return result.medoids.length;
        })();

        if (result.medoids.length !== configK) {
            console.error(
                `[ComprehensiveOutput] ⚠️ k-mismatch: config says k=${configK} but ` +
                `result.medoids has ${result.medoids.length} entries. ` +
                `Stale WASM binary suspected. Using config k=${configK}. ` +
                `Fix: rebuild WASM with wasm-pack build --target web.`
            );
        }
        const k = configK;
        // ── Valid-row mapping ─────────────────────────────────────────────────
        // The analysis service filters dataVariables → dataMatrix (drops rows where
        // any selected variable is non-finite) BEFORE sending to WASM.  WASM therefore
        // returns labels/medoids indexed into the FILTERED matrix (0..N_valid-1), not
        // into the original full dataVariables array (0..N_total-1).
        //
        // We re-derive the same filter here so we can:
        //  1. Map WASM label index → original row index (case number shown to user)
        //  2. Map WASM medoid index → original row index (medoid case numbers)
        //  3. Correctly compute silhouette / cluster profiles on valid rows only
        //
        // This makes case numbers and cluster assignments match R's pam() output.
        const validRowIndices: number[] = [];
        dataVariables.forEach((row: any, origIdx: number) => {
            const valid = variables.every(v => {
                const val = row[v.columnIndex as number];
                return isFinite(typeof val === 'number' ? val : parseFloat(val));
            });
            if (valid) validRowIndices.push(origIdx);
        });

        // n = number of cases actually sent to WASM (= result.labels.length).
        // nTotal = total original rows (used for display only).
        const n = validRowIndices.length;
        const nTotal = dataVariables.length;

        // Reverse map: original index → filtered index (-1 = row excluded due to missing values).
        const origToFiltered = new Array(nTotal).fill(-1);
        validRowIndices.forEach((origIdx, filtIdx) => { origToFiltered[origIdx] = filtIdx; });

        // Re-map labels early (needed by medoid recovery logic below).
        const safeLabels: number[] = result.labels.map(l =>
            (typeof l === 'number' && l >= 0 && l < k) ? l : 0
        );

        // Clamp result.medoids to the first k entries and recover if invalid.
        // safeMedoids[j] is an index into the FILTERED matrix (0..n-1).
        const rawMedoids = Array.isArray(result.medoids) ? result.medoids : [];
        const slicedMedoids = rawMedoids.slice(0, k);
        const hasInvalidMedoid = slicedMedoids.some(
            (m) => !Number.isInteger(m) || m < 0 || m >= n
        );
        const hasDuplicateMedoid = new Set(slicedMedoids).size !== slicedMedoids.length;
        const hasMissingMedoid = slicedMedoids.length < k;

        const safeMedoids: number[] =
            hasInvalidMedoid || hasDuplicateMedoid || hasMissingMedoid
                ? (() => {
                      console.warn(
                          `[ComprehensiveOutput] Invalid medoid set detected ` +
                          `(len=${slicedMedoids.length}, unique=${new Set(slicedMedoids).size}, k=${k}). Recovering medoids from labels.`
                      );
                      return recoverMedoidsFromMismatch(slicedMedoids, safeLabels, k, n);
                  })()
                : slicedMedoids;

        // Map WASM medoid indices (filtered) → original row indices.
        // This is what matches R's id.med output (1-based case numbers).
        const safeMedoidsOrig: number[] = safeMedoids.map(fi => validRowIndices[fi] ?? fi);

        // safeLabels[i] is the cluster for the i-th VALID row (filtIdx i).

        // Build data matrix aligned with safeLabels (valid rows only, same order as WASM input).
        const dataMatrix = validRowIndices.map((origIdx: number) =>
            variables.map(v => {
                const val = dataVariables[origIdx][v.columnIndex as number];
                return typeof val === 'number' && isFinite(val) ? val : 0;
            })
        );

        const clusteringMatrix = standardizedMatrix && standardizedMatrix.length === n
            ? standardizedMatrix
            : dataMatrix;

        // Yield after building the data matrix (O(n×d) work)
        await yieldToUI();

        // Use pre-computed per-object silhouette scores from the worker when available.
        // Fallback: compute asynchronously on main thread (chunked to stay non-blocking).
        let silhouetteScores: number[];
        if (result.silhouette_scores && result.silhouette_scores.length === n) {
            silhouetteScores = result.silhouette_scores;
        } else {
            silhouetteScores = await calculateSilhouetteScoresAsync(clusteringMatrix, safeLabels);
        }

        const averageSilhouette = silhouetteScores.reduce((a, b) => a + b, 0) / silhouetteScores.length;

        // Calculate cluster sizes — iterate safeLabels (N_valid, not N_total)
        const clusterSizes = Array(k).fill(0);
        safeLabels.forEach((label: number) => {
            if (label >= 0 && label < k) clusterSizes[label]++;
        });

        const largestCluster = clusterSizes.reduce(
            (max, size, idx) => size > max.size ? { id: idx + 1, size } : max,
            { id: 1, size: clusterSizes[0] }
        );

        const smallestCluster = clusterSizes.reduce(
            (min, size, idx) => size < min.size ? { id: idx + 1, size } : min,
            { id: 1, size: clusterSizes[0] }
        );

        // Pre-group data rows by cluster — iterate valid rows only so indices align.
        const dataByCluster: Map<number, any[]> = new Map();
        validRowIndices.forEach((origIdx, filtIdx) => {
            const label = safeLabels[filtIdx];
            if (!dataByCluster.has(label)) dataByCluster.set(label, []);
            dataByCluster.get(label)!.push(dataVariables[origIdx]);
        });

        // Yield before building assignment objects (O(n) object allocations)
        await yieldToUI();

        // medoidSet contains ORIGINAL row indices so isMedoid checks work correctly.
        const medoidSet = new Set<number>(safeMedoidsOrig);

        const getCaseLabel = (row: any, fallbackCaseNumber: number): string => {
            if (caseLabelColumnIndex == null || caseLabelColumnIndex < 0) {
                return `Case ${fallbackCaseNumber}`;
            }
            const rawValue = row?.[caseLabelColumnIndex];
            if (rawValue === null || rawValue === undefined) {
                return `Case ${fallbackCaseNumber}`;
            }
            const label = String(rawValue).trim();
            return label.length > 0 ? label : `Case ${fallbackCaseNumber}`;
        };

        // Prefer the per-object distances already computed by WASM from the exact
        // same distance matrix used for PAM.  This matches R pam() precisely.
        // Fall back to JS Euclidean re-computation only if WASM did not supply them
        // (e.g. old WASM binary, CLARA/CLARANS path that skips the field).
        const wasmDistances: number[] | undefined =
            Array.isArray((result as any).distances_to_medoids) &&
            (result as any).distances_to_medoids.length === n
                ? (result as any).distances_to_medoids
                : undefined;

        // Build object assignments — iterate valid rows only.
        // objectId/objectName use the ORIGINAL row index so case numbers match R.
        const assignments: ObjectAssignment[] = validRowIndices.map((origIdx, filtIdx) => {
            const clusterLabel = safeLabels[filtIdx];
            const medoidOrigIdx = safeMedoidsOrig[clusterLabel];
            const isMedoid = medoidSet.has(origIdx);

            let distanceToMedoid: number;
            if (wasmDistances) {
                // Authoritative: from Rust distance matrix (correct metric, no JS rounding).
                // filtIdx aligns with WASM output (both indexed over valid rows only).
                distanceToMedoid = wasmDistances[filtIdx] ?? 0;
            } else if (isMedoid) {
                distanceToMedoid = 0;
            } else {
                // Fallback: JS Euclidean re-computation.
                // safeMedoids[clusterLabel] is the filtered index of the medoid.
                const medoidFiltIdx = safeMedoids[clusterLabel];
                const medoidPoint = medoidFiltIdx != null && clusteringMatrix[medoidFiltIdx] ? clusteringMatrix[medoidFiltIdx] : [];
                const objectPoint = clusteringMatrix[filtIdx] || [];
                distanceToMedoid = medoidPoint.length > 0 && objectPoint.length > 0
                    ? euclideanDistance(objectPoint, medoidPoint)
                    : 0;
            }

            const row = dataVariables[origIdx];
            const attributes: Record<string, number | string> = {};
            const standardizedAttributes: Record<string, number> = {};
            variables.forEach(v => {
                attributes[v.name] = row[v.columnIndex as number] ?? 0;
            });
            variables.forEach((v, varIdx) => {
                const standardizedValue = clusteringMatrix[filtIdx]?.[varIdx];
                standardizedAttributes[v.name] =
                    standardizedValue != null && isFinite(standardizedValue)
                        ? standardizedValue
                        : 0;
            });

            return {
                objectId: origIdx + 1,
                objectName: getCaseLabel(row, origIdx + 1),
                clusterLabel: clusterLabel + 1,
                distanceToMedoid: isFinite(distanceToMedoid) && distanceToMedoid >= 0 ? distanceToMedoid : 0,
                isMedoid,
                silhouetteScore: silhouetteScores[filtIdx] != null && isFinite(silhouetteScores[filtIdx])
                    ? silhouetteScores[filtIdx]
                    : 0,
                attributes,
                standardizedAttributes: useStandardization ? standardizedAttributes : undefined,
            };
        });

        // Single source of truth (R-compatible): gunakan nilai dari WASM.
        // Jangan hitung ulang total cost di JS agar tidak menyimpang dari R.
        const buildCost: number | undefined = typeof result.total_cost_build === "number"
            ? result.total_cost_build
            : Array.isArray(result.cost_history) && result.cost_history.length > 0
            ? result.cost_history[0]
            : result.iteration_history && result.iteration_history.length > 0
            ? result.iteration_history[0].cost
            : undefined;

        const swapCost: number = typeof result.total_cost_swap === "number"
            ? result.total_cost_swap
            : Array.isArray(result.cost_history) && result.cost_history.length > 0
            ? result.cost_history[result.cost_history.length - 1]
            : typeof result.cost === "number"
            ? result.cost
            : 0;

        const avgCost: number = typeof result.avgCost === "number"
            ? result.avgCost
            : typeof result.avg_cost === "number"
            ? result.avg_cost
            : n > 0
            ? swapCost / n
            : 0;

        // Prefer explicit iteration count, but infer from history when absent.
        // History shape is [init, iter1, iter2, ...], so subtract 1 for swap iterations.
        const inferredIterations = Array.isArray(result.cost_history) && result.cost_history.length > 0
            ? Math.max(result.cost_history.length - 1, 0)
            : Array.isArray(result.iteration_history) && result.iteration_history.length > 0
            ? Math.max(result.iteration_history.length - 1, 0)
            : 0;
        const totalIterations =
            typeof result.iterations === "number" && result.iterations > 0
                ? result.iterations
                : inferredIterations;

        // Build summary with calculated total cost
        const summary: KMedoidsSummary = {
            numClusters: k,
            totalCost: swapCost,
            avgCost,
            buildCost,
            swapCost,
            convergenceTolerance:
                typeof config?.iterate?.ConvergenceCriterion === "number"
                    ? config.iterate.ConvergenceCriterion
                    : undefined,
            averageSilhouetteScore: averageSilhouette,
            totalIterations,
            converged: result.converged,
            largestCluster,
            smallestCluster,
            numCases: n,
            numVariables: variables.length
        };

        // Build medoid information
        // safeMedoidsOrig[j] is the ORIGINAL row index of the j-th medoid → matches R's id.med.
        const medoids: MedoidInfo[] = safeMedoidsOrig.map((medoidOrigIdx, clusterIdx) => {
            const medoidRow = dataVariables[medoidOrigIdx];
            const medoidFiltIdx = safeMedoids[clusterIdx];
            const attributes: Record<string, number | string> = {};
            const standardizedAttributes: Record<string, number> = {};
            variables.forEach(v => {
                attributes[v.name] = medoidRow[v.columnIndex as number] ?? 0;
            });
            variables.forEach((v, varIdx) => {
                const value = medoidFiltIdx != null ? clusteringMatrix[medoidFiltIdx]?.[varIdx] : undefined;
                standardizedAttributes[v.name] = value != null && isFinite(value) ? value : 0;
            });

            // Calculate within-cluster distance from already-computed assignments (avoids O(k×n) euclidean recomputation)
            let withinClusterDist = 0;
            let count = 0;
            assignments.forEach(a => {
                if (a.clusterLabel === clusterIdx + 1 && !a.isMedoid) {
                    withinClusterDist += a.distanceToMedoid;
                    count++;
                }
            });

            return {
                clusterLabel: clusterIdx + 1,
                objectId: medoidOrigIdx + 1,
                objectName: getCaseLabel(medoidRow, medoidOrigIdx + 1),
                attributes,
                standardizedAttributes,
                clusterSize: clusterSizes[clusterIdx],
                withinClusterDistance: count > 0 ? withinClusterDist / count : 0
            };
        });

        // Build cluster profiles
        const clusterProfiles: ClusterProfile[] = Array.from({ length: k }, (_, clusterIdx) => {
            const clusterMembers = dataByCluster.get(clusterIdx) || [];
            const size = clusterMembers.length;
            const percentage = (size / n) * 100;

            const meanAttributes: Record<string, number> = {};
            variables.forEach(v => {
                const values = clusterMembers
                    .map(row => {
                        const val = row[v.columnIndex as number];
                        return typeof val === 'number' ? val : parseFloat(val);
                    })
                    .filter(val => isFinite(val));
                meanAttributes[v.name] = values.length > 0
                    ? values.reduce((a: number, b: number) => a + b, 0) / values.length
                    : 0;
            });

            // Calculate silhouette for this cluster
            const clusterSilhouettes = silhouetteScores.filter((_, idx) => safeLabels[idx] === clusterIdx);
            const avgSilhouette = clusterSilhouettes.length > 0
                ? clusterSilhouettes.reduce((a, b) => a + b, 0) / clusterSilhouettes.length
                : 0;

            return {
                clusterLabel: clusterIdx + 1,
                size,
                percentage,
                meanAttributes,
                medoidId: safeMedoidsOrig[clusterIdx] + 1,
                withinClusterDistance: medoids[clusterIdx].withinClusterDistance,
                silhouetteScore: avgSilhouette,
                descriptiveLabel: generateClusterLabel(meanAttributes, clusterIdx)
            };
        });

        // Build iteration history
        // cost_history layout from Rust: [0]=init_cost, [1..n_iter]=cost after each swap.
        // item.iteration is 0-based (0=Init, 1=first swap, ...) — use ?? (not ||) to
        // preserve iteration=0 for Init and avoid duplicate React keys (0||1==1||2==1).
        //
        // The worker path sends `cost_history` (plain number[]) rather than
        // `iteration_history` ({iteration,cost}[]).  Normalise both sources into
        // the same [{iteration, cost}] shape before mapping so that either path
        // produces the full per-iteration table.
        const rawIterHistory: { iteration: number; cost: number }[] | undefined =
            result.iteration_history
                ? result.iteration_history
                : Array.isArray(result.cost_history) && result.cost_history.length > 0
                    ? (result.cost_history as number[]).map((cost, idx) => ({ iteration: idx, cost }))
                    : undefined;

        const iterationHistory: IterationHistory[] = rawIterHistory
            ? rawIterHistory.map((item, idx) => {
                  const cost = item.cost != null ? item.cost : 0;
                  const prevCost = idx > 0 ? rawIterHistory[idx - 1].cost : cost;

                  // Untuk entri terakhir, pakai swapCost dari WASM sebagai final.
                  const isLastIteration = idx === rawIterHistory.length - 1;
                  const finalCost = isLastIteration ? swapCost : cost;

                  return {
                      iteration: item.iteration ?? idx,
                      totalCost: finalCost,
                      improvement: idx > 0 ? prevCost - cost : 0,
                      // Every entry in cost_history[1..] represents an actual swap;
                      // Init (idx=0) has no swap.
                      swapsMade: idx === 0 ? 0 : 1,
                      medoids: result.medoid_history?.[idx],
                  };
              })
            : [{ iteration: 0, totalCost: swapCost, improvement: 0, swapsMade: 0, medoids: result.medoids }];

        const isManualMode = config?.main?.ClusterMode === "manual";
        const shouldBuildManualOptimalKChart =
            !automaticKSelection &&
            isManualMode &&
            (config?.evaluation?.ShowOptimalKChart ?? false);

        // Build optimal-k chart data.
        // Automatic mode gets full k-range scores; manual mode gets the selected k point
        // so the chart can still be shown in output when user chooses k manually.
        const elbowData = chartSelection
            ? chartSelection.scores.map((item: any) => {
                  const isSilhouetteMethod =
                      chartSelection.method === "Silhouette" ||
                      chartSelection.method === "silhouette";
                  const resolvedTotalCost =
                      item.totalCost != null && isFinite(item.totalCost)
                          ? item.totalCost
                          : isSilhouetteMethod
                          ? 0
                          : (item.score ?? 0);
                  return {
                      k: item.k,
                      // totalCost always carries the elbow/WCSS curve if available.
                      totalCost: resolvedTotalCost,
                      // silhouetteScore is always the actual silhouette value
                      silhouetteScore:
                          item.silhouetteScore != null && isFinite(item.silhouetteScore)
                              ? item.silhouetteScore
                              : isSilhouetteMethod
                              ? (item.score ?? 0)
                              : 0,
                  };
              })
                        : shouldBuildManualOptimalKChart
                        ? [{
                                    k,
                                    totalCost: isFinite(swapCost) ? swapCost : (result.cost ?? 0),
                                    silhouetteScore: isFinite(averageSilhouette) ? averageSilhouette : 0,
                            }]
            : undefined;

        // Calculate medoid distance matrix in standardized space
        // (same space used for PAM clustering).
        const medoidDistanceMatrix = calculateMedoidDistanceMatrix(
            clusteringMatrix,
            safeMedoids
        );

        // Silhouette scores per cluster
        const silhouettePerCluster: SilhouetteClusterScore[] = clusterProfiles.map(profile => {
            const clusterIdx = profile.clusterLabel - 1;
            const clusterScores = silhouetteScores
                .filter((score, idx) => safeLabels[idx] === clusterIdx && score != null && isFinite(score));
            
            return {
                clusterLabel: profile.clusterLabel,
                averageScore: profile.silhouetteScore,
                minScore: clusterScores.length > 0 ? Math.min(...clusterScores) : 0,
                maxScore: clusterScores.length > 0 ? Math.max(...clusterScores) : 0,
                count: clusterScores.length
            };
        });

        // Yield before building comprehensive output object + tables
        await yieldToUI();

        // Build comprehensive output
        const resolvedOptimalKMethod: "silhouette" | "elbow" | undefined = chartSelection
            ? (
            chartSelection.method === "Silhouette" ||
            chartSelection.method === "silhouette"
                    ? "silhouette"
                    : "elbow"
            )
            : config?.main?.ClusterMode === "automatic"
            ? (
                config?.main?.AutoKMethod === "elbow"
                    ? "elbow"
                    : "silhouette"
            )
            : shouldBuildManualOptimalKChart
            ? (
                config?.main?.AutoKMethod === "elbow"
                    ? "elbow"
                    : "silhouette"
            )
            : undefined;

        const comprehensiveOutput: KMedoidsOutput = {
            summary,
            assignments,
            medoids,
            clusterProfiles,
            iterationHistory,
            elbowData,
            optimalKMethod: resolvedOptimalKMethod,
            clusterMode: config?.main?.ClusterMode === "automatic" ? "automatic" : "manual",
            autoKMethod: config?.main?.AutoKMethod === "elbow" ? "elbow" : "silhouette",
            medoidDistanceMatrix,
            silhouetteScores: {
                overall: isFinite(averageSilhouette) ? averageSilhouette : 0,
                perCluster: silhouettePerCluster,
                perObject: silhouetteScores.map(s => s != null && isFinite(s) ? s : 0)
            },
            tables: [], // Will be populated below
            visualizationOptions: {
                // Convergence mode always exposes iteration history details.
                showIterationHistory:
                    (config?.results?.ShowConvergenceAlgorithm ?? true)
                        ? true
                        : (config?.results?.ShowIterationHistory ?? true),
                showPCAProjection: config?.options?.ShowPCAProjection ?? true,
                showClusterScatterPlot: config?.options?.ShowClusterScatterPlot ?? false,
                showClusterSizeDistribution: config?.options?.ShowClusterSizeDistribution ?? false,
                showClusterAttributeProfile: config?.options?.ShowClusterAttributeProfile ?? false,
                showDistanceMatrixBetweenMedoids: config?.options?.ShowDistanceMatrixBetweenMedoids ?? false,
                showClusterMedoids: config?.results?.ShowClusterMedoids ?? true,
                showObjectAssignments: config?.results?.ShowClusterMembership ?? false,
                showCaseCount: config?.results?.ShowCaseCount ?? true,
                // Total Cost is always shown in output.
                showTotalCost: true,
                showSilhouettePerObject: config?.evaluation?.ShowSilhouettePlot ?? false,
                showSilhouetteByCluster: config?.evaluation?.ShowSilhouetteByCluster ?? true,
                // The checkbox in Evaluation tab is the source of truth for visibility.
                showOptimalKChart: config?.evaluation?.ShowOptimalKChart ?? false,
                showOverallQualityAssessment: config?.evaluation?.ShowOverallQualityAssessment ?? true,
                showConvergenceAlgorithm: config?.results?.ShowConvergenceAlgorithm ?? true,
            },
            variables: variables.map(v => ({ name: v.name, label: v.label || v.name }))
        };

        // Create tables (keeping existing format for compatibility)
        const allTables: Table[] = [];
        const caseSummary = buildCaseProcessingSummary(n, nTotal, {
            initialN: analysisResult.preprocessingSummary?.initialN,
            preprocessedN: analysisResult.preprocessingSummary?.afterPreprocessingN,
            missingRowsRemoved: analysisResult.preprocessingSummary?.missingRowsRemoved,
            outlierRowsRemoved: analysisResult.preprocessingSummary?.outlierRowsRemoved,
            missingByVariable: analysisResult.preprocessingSummary?.missingByVariable,
        });

        // Case Processing Summary table (should be first)
        allTables.push({
            key: "case_processing_summary",
            title: "Case Processing Summary",
            columnHeaders: [
                {
                    header: "Cases",
                    key: "cases",
                    children: [
                        {
                            header: "Valid",
                            key: "valid",
                            children: [
                                { header: "N", key: "valid_n" },
                                { header: "Percent", key: "valid_percent" },
                            ],
                        },
                        {
                            header: "Missing",
                            key: "missing",
                            children: [
                                { header: "N", key: "missing_n" },
                                { header: "Percent", key: "missing_percent" },
                            ],
                        },
                        {
                            header: "Total",
                            key: "total",
                            children: [
                                { header: "N", key: "total_n" },
                                { header: "Percent", key: "total_percent" },
                            ],
                        },
                    ],
                },
            ],
            rows: [
                {
                    rowHeader: [""],
                    valid_n: caseSummary.validN.toString(),
                    valid_percent: caseSummary.validPercent,
                    missing_n: caseSummary.missingN.toString(),
                    missing_percent: caseSummary.missingPercent,
                    total_n: caseSummary.totalN.toString(),
                    total_percent: caseSummary.totalPercent,
                },
                {
                    rowHeader: [`a. ${method} Method`],
                },
                {
                    rowHeader: [`b. Data awal: ${caseSummary.initialN}`],
                },
                {
                    rowHeader: [`c. Setelah preprocessing: ${caseSummary.preprocessedN}`],
                },
                {
                    rowHeader: [`d. Missing rows dibuang: ${caseSummary.missingRowsRemoved}`],
                },
                {
                    rowHeader: [`e. Outlier rows dibuang (IQR): ${caseSummary.outlierRowsRemoved}`],
                },
                {
                    rowHeader: [`f. Missing per variabel: ${caseSummary.missingVariablesText}`],
                },
            ],
        });

        // Summary table
        allTables.push({
            key: "summary",
            title: "Clustering Summary",
            columnHeaders: [{ header: "Metric" }, { header: "Value" }],
            rows: [
                { rowHeader: [], Metric: "Number of Clusters", Value: k.toString() },
                { rowHeader: [], Metric: "Total Cases", Value: n.toString() },
                { rowHeader: [], Metric: "Average Cost (BUILD)", Value: buildCost != null && n > 0 ? (buildCost / n).toFixed(6) : "N/A" },
                { rowHeader: [], Metric: "Average Cost (Objective)", Value: avgCost.toFixed(6) },
                { rowHeader: [], Metric: "Total Cost (BUILD)", Value: buildCost != null ? buildCost.toFixed(4) : "N/A" },
                { rowHeader: [], Metric: "Total Cost (SWAP)", Value: swapCost.toFixed(4) },
                { rowHeader: [], Metric: "Average Silhouette Score", Value: averageSilhouette.toFixed(4) },
                { rowHeader: [], Metric: "Quality", Value: averageSilhouette >= 0.7 ? "Very Strong" : averageSilhouette >= 0.5 ? "Strong" : "Moderate" },
                { rowHeader: [], Metric: "Iterations", Value: result.iterations.toString() },
                { rowHeader: [], Metric: "Converged", Value: result.converged ? "Yes" : "No" }
            ]
        });

        // Cluster profiles table
        allTables.push({
            key: "cluster_profiles",
            title: "Cluster Profiles",
            columnHeaders: [
                { header: "Cluster" },
                { header: "Size" },
                { header: "%" },
                { header: "Medoid ID" },
                { header: "Silhouette" },
                ...variables.map(v => ({ header: `Avg ${v.label || v.name}` }))
            ],
            rows: clusterProfiles.map(profile => ({
                rowHeader: [],
                Cluster: `Cluster ${profile.clusterLabel}`,
                Size: profile.size,
                Percentage: profile.percentage.toFixed(1) + "%",
                MedoidID: profile.medoidId,
                Silhouette: profile.silhouetteScore.toFixed(3),
                ...Object.fromEntries(
                    variables.map(v => [`Avg_${v.name}`, profile.meanAttributes[v.name].toFixed(2)])
                )
            }))
        });

        // Medoids table
        const medoidStandardizedValues = useStandardization
            ? medoids.flatMap((medoid) =>
                  variables.map((v) => medoid.standardizedAttributes?.[v.name] ?? 0)
              )
            : [];
        const allMedoidZScoresNearZero =
            useStandardization &&
            medoidStandardizedValues.length > 0 &&
            medoidStandardizedValues.every((v) => Math.abs(v) < 1e-9);

        allTables.push({
            key: "medoids",
            title: useStandardization
                ? "Final Medoids (Standardized Z-score)"
                : "Final Medoids (Original Scale)",
            columnHeaders: [
                { header: "Cluster", key: "Cluster" },
                { header: "Medoid ID", key: "MedoidID" },
                ...variables.map(v => ({ header: v.label || v.name, key: v.name }))
            ],
            rows: medoids.map(medoid => ({
                rowHeader: [],
                Cluster: `Cluster ${medoid.clusterLabel}`,
                MedoidID: `★ ${medoid.objectId}`,
                ...Object.fromEntries(
                    variables.map(v => {
                        if (useStandardization) {
                            const standardizedValue = medoid.standardizedAttributes?.[v.name];
                            if (typeof standardizedValue === 'number' && isFinite(standardizedValue)) {
                                return [v.name, standardizedValue.toFixed(4)];
                            }
                            return [v.name, "0.0000"];
                        }

                        const originalValue = medoid.attributes[v.name];
                        if (typeof originalValue === 'number' && isFinite(originalValue)) {
                            return [v.name, originalValue.toFixed(4)];
                        }
                        return [v.name, String(originalValue ?? "-")];
                    })
                )
            })),
            ...(allMedoidZScoresNearZero
                ? {
                      footer:
                          "Semua nilai Z-score medoid ~0. Ini biasanya terjadi ketika variabel yang dipakai memiliki variansi sangat kecil/konstan pada data valid setelah preprocessing.",
                  }
                : {}),
        });

        comprehensiveOutput.tables = allTables;

        console.log("💾 Saving to result store...");

        // Save to result store THE NEW COMPREHENSIVE FORMAT
        const titleMessage = `K-Medoids Cluster Analysis (${method})`;
        const logId = await addLog({ log: titleMessage });
        console.log("✅ Log created:", logId);

        const analyticId = await addAnalytic(logId, {
            title: `K-Medoids Clustering Results`,
            note: automaticKSelection
                ? `Automatic k selection: k=${automaticKSelection.optimalK} (${automaticKSelection.method})`
                : `Manual k selection: k=${k}, Algorithm: ${method}`,
        });
        console.log("✅ Analytic created:", analyticId);

        // Save Case Processing Summary as separate statistic (first output)
        const caseProcessingSummaryTable = allTables.find(t => t.key === "case_processing_summary");
        if (caseProcessingSummaryTable) {
            const statId1 = await addStatistic(analyticId, {
                title: `Case Processing Summary`,
                description: `Case Processing Summary`,
                output_data: JSON.stringify({ tables: [caseProcessingSummaryTable] }),
                components: `Case Processing Summary`,
            });
            console.log("✅ Case Processing Summary saved:", statId1);
        }

        // Yield to UI before the large JSON.stringify + IndexedDB write.
        // The comprehensiveOutput object can be 200 KB–2 MB for large datasets;
        // serialising it synchronously would freeze the main thread for 50–400 ms.
        await yieldToUI();

        // Save comprehensive output - Use custom renderer approach
        // Store as a special marker that will trigger custom OutputRenderer
        const statId2 = await addStatistic(analyticId, {
            title: `K-Medoids Comprehensive Analysis`,
            description: `Complete clustering analysis with ${k} clusters (Silhouette: ${averageSilhouette.toFixed(3)})`,
            output_data: JSON.stringify({
                customRenderer: "KMedoidsOutputRenderer",
                data: comprehensiveOutput
            }),
            components: `K-Medoids Analysis`,
        });
        console.log("✅ Comprehensive Analysis saved:", statId2);

        return { success: true, output: comprehensiveOutput };

    } catch (error) {
        console.error("❌ Error generating comprehensive output:", error);
        console.error("Error details:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}
