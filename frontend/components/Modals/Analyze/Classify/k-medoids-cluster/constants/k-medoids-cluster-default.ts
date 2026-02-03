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
    Cluster: 2, // Default k=2 (consistent with K-Means)
    ReadInitial: false,
    OpenDataset: true,
    ExternalDatafile: false,
    WriteFinal: false,
    NewDataset: true,
    DataFile: false,
    OpenDatasetMethod: null,
    NewData: null,
    InitialData: null,
    FinalData: null,
};

/**
 * Iterate defaults - mengikuti best practices PAM
 */
export const KMedoidsClusterIterateDefault: KMedoidsClusterIterateType = {
    Method: KMedoidsMethod.PAM, // PAM sebagai default (optimal quality)
    DistanceMetric: DistanceMetric.Euclidean, // Euclidean standard
    InitialStrategy: InitialMedoidsStrategy.Random, // Random initialization
    MaximumIterations: 300, // PAM biasanya konvergen cepat
    ConvergenceCriterion: 0, // Stop jika tidak ada improvement
    SampleSize: null, // Only for CLARA: akan di-set auto = 40 + 2*k
    NumSamples: 5, // Only for CLARA: jumlah sampling iterations
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
    ComputeSilhouette: true, // Wajib (pengganti ANOVA untuk clustering)
    ComputeDaviesBouldin: false, // Optional
    ComputeDunnIndex: false, // Optional
    ShowSilhouettePlot: false, // Optional visualization
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
