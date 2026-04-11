import type {
    KMedoidsClusterIterateType,
    KMedoidsClusterMainType,
    KMedoidsClusterOptionsType,
    KMedoidsClusterResultsType,
    KMedoidsClusterEvaluationType,
    KMedoidsClusterSaveType,
    KMedoidsClusterType,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import {
    KMedoidsMethod,
    DistanceMetric,
    InitialMedoidsStrategy,
    ClusterMode,
    AutoKMethod,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";

/**
 * ========================================
 * K-MEDOIDS DEFAULT VALUES
 * ========================================
 * Default values berdasarkan best practices clustering statistik
 */

export const KMedoidsClusterMainDefault: KMedoidsClusterMainType = {
    TargetVar: null,
    CaseTarget: null,
    IterateClassify: true,
    ClassifyOnly: false,
    // --- Cluster selection mode ---
    ClusterMode: ClusterMode.Manual,
    Cluster: 2,
    AutoKMin: 2,
    AutoKMax: 10,
    AutoKMethod: AutoKMethod.Silhouette,
    // --- Distance Metric ---
    DistanceMetric: DistanceMetric.Euclidean, // Euclidean sebagai default standard
    OpenDataset: true,
    ExternalDatafile: false,
    NewDataset: true,
    DataFile: false,
    OpenDatasetMethod: null,
    NewData: null,
};

/**
 * Iterate defaults - mengikuti best practices PAM
 */
export const KMedoidsClusterIterateDefault: KMedoidsClusterIterateType = {
    Method: KMedoidsMethod.PAM, // PAM sebagai default (optimal quality)
    InitialStrategy: InitialMedoidsStrategy.Random, // Random initialization
    MaximumIterations: 300, // PAM biasanya konvergen cepat
    ConvergenceCriterion: 0, // Stop jika tidak ada improvement
    RandomSeed: null, // null = truly random, set angka untuk reproducibility
    NumberOfInitializations: 10, // 10 initializations untuk hasil optimal
    SampleSize: null, // Only for CLARA: akan di-set auto = 40 + 2*k
    NumSamples: 5, // Only for CLARA: jumlah sampling iterations
    NumLocal: 2, // Only for CLARANS: jumlah local minima
    MaxNeighbor: null, // Only for CLARANS: akan di-set auto = max(250, 1.25% of n*(k-1))
    Standardize: false, // Standardize variables before clustering (setara R pam stand=TRUE)
};

/**
 * Results defaults - tampilkan output utama
 */
export const KMedoidsClusterResultsDefault: KMedoidsClusterResultsType = {
    ShowFinalMedoids: true, // Wajib tampilkan (setara Final Cluster Centers)
    ShowClusterMembership: true, // Wajib tampilkan (per case)
    ShowCaseCount: true, // Wajib tampilkan (Number of Cases)
    ShowIterationHistory: false, // Optional detail
    ShowTotalCost: true, // Transparency metric
};

/**
 * Evaluation defaults - minimal Silhouette wajib
 */
export const KMedoidsClusterEvaluationDefault: KMedoidsClusterEvaluationType = {
    ComputeSilhouette: true,   // Wajib (pengganti ANOVA untuk clustering)
    ShowSilhouettePlot: false, // Optional: visualisasi bar-chart silhouette per case
    ShowElbowPlot: false,      // Optional: grafik SSE vs k (Elbow Method)
    ShowOptimalKChart: false,  // Optional: gabungan Silhouette + Elbow chart
};

export const KMedoidsClusterSaveDefault: KMedoidsClusterSaveType = {
    ClusterMembership: false,
    DistanceClusterCenter: false,
};

export const KMedoidsClusterOptionsDefault: KMedoidsClusterOptionsType = {
    InitialCluster: true, // Tampilkan initial medoids
    ClusterInfo: false, // Optional detail per case
    ClusterPlot: false, // Future feature
    ExcludeListWise: true, // Default: listwise deletion
    ExcludePairWise: false,
};

export const KMedoidsClusterDefault: KMedoidsClusterType = {
    main: KMedoidsClusterMainDefault,
    iterate: KMedoidsClusterIterateDefault,
    results: KMedoidsClusterResultsDefault,
    evaluation: KMedoidsClusterEvaluationDefault,
    save: KMedoidsClusterSaveDefault,
    options: KMedoidsClusterOptionsDefault,
};
