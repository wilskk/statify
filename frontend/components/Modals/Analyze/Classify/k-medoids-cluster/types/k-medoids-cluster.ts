import type React from "react";

/**
 * ========================================
 * K-MEDOIDS CLUSTERING - STATISTICAL ENUMS
 * ========================================
 * Definisi enum untuk parameter clustering yang statistik-aware
 */

/**
 * Metode K-Medoids yang didukung
 * - PAM (Partitioning Around Medoids): Metode klasik, optimal tapi lambat O(n²)
 * - CLARA (Clustering Large Applications): Sampling untuk dataset besar
 * - CLARANS (Clustering Large Applications based on RANdomized Search): Hybrid PAM-CLARA
 */
export enum KMedoidsMethod {
    PAM = "PAM",
    CLARA = "CLARA",
    CLARANS = "CLARANS",
}

/**
 * Ukuran jarak (distance measure) untuk menghitung dissimilarity
 * - Euclidean: Jarak geometris standar, sensitif terhadap magnitude
 * - Manhattan: City-block distance, lebih robust terhadap outlier
 * - Gower: Untuk data campuran (numeric + categorical) - optional advanced
 */
export enum DistanceMetric {
    Euclidean = "euclidean",
    Manhattan = "manhattan",
    Gower = "gower", // Optional: untuk mixed data types
}

/**
 * Strategi pemilihan medoid awal
 * - Random: Pilih k data points secara acak
 * - KMeansPlusPlus: Strategi smart initialization (adaptasi dari k-means++)
 * - FirstK: Ambil k data pertama (untuk reproducibility testing)
 * - UserDefined: User memilih medoid awal sendiri (advanced)
 */
export enum InitialMedoidsStrategy {
    Random = "random",
    KMeansPlusPlus = "kmeans++",
    FirstK = "first_k",
    UserDefined = "user_defined",
}

/**
 * Metrik evaluasi clustering
 * - Silhouette: Range [-1, 1], semakin tinggi semakin baik
 * - DaviesBouldin: Semakin rendah semakin baik
 * - DunnIndex: Semakin tinggi semakin baik
 */
export enum EvaluationMetric {
    Silhouette = "silhouette",
    DaviesBouldin = "davies_bouldin",
    DunnIndex = "dunn_index",
}

/**
 * ========================================
 * MAIN DIALOG - Variable Selection & Basic Config
 * ========================================
 */
export type KMedoidsClusterMainType = {
    TargetVar: string[] | null;
    CaseTarget: string | null;
    IterateClassify: boolean;
    ClassifyOnly: boolean;
    Cluster: number | null; // k = jumlah cluster yang diinginkan
    OpenDataset: boolean;
    ExternalDatafile: boolean;
    NewDataset: boolean;
    DataFile: boolean;
    ReadInitial: boolean;
    WriteFinal: boolean;
    OpenDatasetMethod: string | null;
    NewData: string | null;
    InitialData: string | null;
    FinalData: string | null;
};

export type KMedoidsClusterDialogProps = {
    updateFormData: (
        field: keyof KMedoidsClusterMainType,
        value: string[] | string | boolean | number | null
    ) => void;
    data: KMedoidsClusterMainType;
    globalVariables: string[];
};

/**
 * ========================================
 * ITERATE DIALOG - Algorithmic Parameters
 * ========================================
 * Parameter yang mempengaruhi proses iterasi & konvergensi
 */
export type KMedoidsClusterIterateType = {
    /** Metode K-Medoids: PAM, CLARA, atau CLARANS */
    Method: KMedoidsMethod;
    
    /** Ukuran jarak untuk menghitung dissimilarity */
    DistanceMetric: DistanceMetric;
    
    /** Strategi pemilihan medoid awal */
    InitialStrategy: InitialMedoidsStrategy;
    
    /** Maksimum iterasi sebelum stop (default: 300 untuk PAM) */
    MaximumIterations: number | null;
    
    /** Convergence criterion: stop jika perubahan cost < threshold (default: 0) */
    ConvergenceCriterion: number | null;
    
    /** CLARA only: ukuran sample (default: 40 + 2k) */
    SampleSize: number | null;
    
    /** CLARA only: jumlah sampling iterations (default: 5) */
    NumSamples: number | null;
};

export type KMedoidsClusterIterateProps = {
    updateFormData: (
        field: keyof KMedoidsClusterIterateType,
        value: string | boolean | number | null
    ) => void;
    data: KMedoidsClusterIterateType;
};

/**
 * ========================================
 * RESULTS DIALOG - Clustering Output
 * ========================================
 * Hasil clustering: medoids, cluster membership, case counts
 */
export type KMedoidsClusterResultsType = {
    /** Tampilkan final medoids (setara "Final Cluster Centers" SPSS) */
    ShowFinalMedoids: boolean;
    
    /** Tampilkan cluster membership untuk setiap case */
    ShowClusterMembership: boolean;
    
    /** Tampilkan jumlah case per cluster */
    ShowCaseCount: boolean;
    
    /** Tampilkan iteration history (perubahan medoid per iterasi) */
    ShowIterationHistory: boolean;
    
    /** Tampilkan total cost / dissimilarity */
    ShowTotalCost: boolean;
};

export type KMedoidsClusterResultsProps = {
    updateFormData: (
        field: keyof KMedoidsClusterResultsType,
        value: boolean | null
    ) => void;
    data: KMedoidsClusterResultsType;
};

/**
 * ========================================
 * EVALUATION DIALOG - Cluster Quality Metrics
 * ========================================
 * Metrik evaluasi untuk menilai kualitas clustering
 */
export type KMedoidsClusterEvaluationType = {
    /** Silhouette Coefficient (range: -1 to 1, higher is better) */
    ComputeSilhouette: boolean;
    
    /** Davies-Bouldin Index (lower is better) */
    ComputeDaviesBouldin: boolean;
    
    /** Dunn Index (higher is better) */
    ComputeDunnIndex: boolean;
    
    /** Tampilkan silhouette plot per case */
    ShowSilhouettePlot: boolean;
};

export type KMedoidsClusterEvaluationProps = {
    updateFormData: (
        field: keyof KMedoidsClusterEvaluationType,
        value: boolean | null
    ) => void;
    data: KMedoidsClusterEvaluationType;
};

/**
 * ========================================
 * SAVE DIALOG - Variable Output Options
 * ========================================
 * Opsi untuk menyimpan hasil ke dataset sebagai variable baru
 */
export type KMedoidsClusterSaveType = {
    /** Simpan cluster membership (variable: CLU_1, CLU_2, ...) */
    ClusterMembership: boolean;
    
    /** Simpan distance dari medoid cluster (variable: DIS_1, DIS_2, ...) */
    DistanceClusterCenter: boolean;
};

export type KMedoidsClusterSaveProps = {
    updateFormData: (
        field: keyof KMedoidsClusterSaveType,
        value: string | boolean | null
    ) => void;
    data: KMedoidsClusterSaveType;
};

/**
 * ========================================
 * OPTIONS DIALOG - Statistical Output Options
 * ========================================
 */
export type KMedoidsClusterOptionsType = {
    /** Tampilkan initial medoids sebelum iterasi */
    InitialCluster: boolean;
    
    /** Tampilkan cluster information per case (optional detail) */
    ClusterInfo: boolean;
    
    /** Plot cluster visualization (optional, mungkin future) */
    ClusterPlot: boolean;
    
    /** Missing value handling: exclude listwise */
    ExcludeListWise: boolean;
    
    /** Missing value handling: exclude pairwise */
    ExcludePairWise: boolean;
};

export type KMedoidsClusterOptionsProps = {
    updateFormData: (
        field: keyof KMedoidsClusterOptionsType,
        value: string | boolean | null
    ) => void;
    data: KMedoidsClusterOptionsType;
};

/**
 * ========================================
 * COMPLETE FORM STATE
 * ========================================
 */
export type KMedoidsClusterType = {
    main: KMedoidsClusterMainType;
    iterate: KMedoidsClusterIterateType;
    results: KMedoidsClusterResultsType;
    evaluation: KMedoidsClusterEvaluationType;
    save: KMedoidsClusterSaveType;
    options: KMedoidsClusterOptionsType;
};

export type KMedoidsClusterContainerProps = {
    onClose: () => void;
};
