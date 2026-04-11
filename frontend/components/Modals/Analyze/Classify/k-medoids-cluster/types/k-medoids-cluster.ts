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
 */
export enum DistanceMetric {
    Euclidean = "euclidean",
    Manhattan = "manhattan",
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
 * Mode pemilihan jumlah cluster (k)
 * - Manual: user menentukan k secara eksplisit
 * - Automatic: sistem mencari k optimal dalam rentang [kMin, kMax]
 */
export enum ClusterMode {
    Manual = "manual",
    Automatic = "automatic",
}

/**
 * Metode pencarian k optimal (hanya relevan jika ClusterMode = Automatic)
 * - Silhouette: pilih k dengan rata-rata Silhouette tertinggi
 * - Elbow: pilih k di titik "siku" kurva total within-cluster distance (SSE/inertia)
 */
export enum AutoKMethod {
    Silhouette = "silhouette",
    Elbow = "elbow",
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
    /** Mode pemilihan k: Manual (user tentukan) atau Automatic (sistem cari optimal) */
    ClusterMode: ClusterMode;
    /** k eksplisit — hanya dipakai jika ClusterMode = Manual */
    Cluster: number | null;
    /** k minimum untuk pencarian otomatis (ClusterMode = Automatic) */
    AutoKMin: number | null;
    /** k maksimum untuk pencarian otomatis (ClusterMode = Automatic) */
    AutoKMax: number | null;
    /** Metode pencarian k optimal (ClusterMode = Automatic) */
    AutoKMethod: AutoKMethod;
    /** Ukuran jarak untuk menghitung dissimilarity - mempengaruhi hasil clustering */
    DistanceMetric: DistanceMetric;
    OpenDataset: boolean;
    ExternalDatafile: boolean;
    NewDataset: boolean;
    DataFile: boolean;
    OpenDatasetMethod: string | null;
    NewData: string | null;
};

export type KMedoidsClusterDialogProps = {
    updateFormData: (
        field: keyof KMedoidsClusterMainType,
        value: string[] | string | boolean | number | ClusterMode | AutoKMethod | DistanceMetric | null
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
    
    /** Strategi pemilihan medoid awal */
    InitialStrategy: InitialMedoidsStrategy;
    
    /** Maksimum iterasi sebelum stop (default: 300 untuk PAM) */
    MaximumIterations: number | null;
    
    /** Convergence criterion: stop jika perubahan cost < threshold (default: 0) */
    ConvergenceCriterion: number | null;
    
    /** Random seed untuk reproducibility (null = random) */
    RandomSeed: number | null;
    
    /** Number of initializations untuk mencari hasil terbaik (default: 10) */
    NumberOfInitializations: number | null;
    
    /** CLARA only: ukuran sample (default: 40 + 2k) */
    SampleSize: number | null;
    
    /** CLARA only: jumlah sampling iterations (default: 5) */
    NumSamples: number | null;
    
    /** CLARANS only: jumlah local minima yang dicari (default: 2) */
    NumLocal: number | null;
    
    /** CLARANS only: maksimum neighbors yang diperiksa (default: max(250, 1.25% of n*(k-1))) */
    MaxNeighbor: number | null;

    /**
     * Standardize variables before clustering (setara R pam stand=TRUE).
     * Setiap variabel dikurangi mean-nya lalu dibagi mean absolute deviation-nya.
     * Wajib diaktifkan agar total cost sebanding dengan output R.
     */
    Standardize: boolean;
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
    
    /** Tampilkan silhouette plot per case */
    ShowSilhouettePlot: boolean;

    /** Elbow Method — grafik SSE vs k untuk menentukan titik siku optimal */
    ShowElbowPlot: boolean;

    /** Grafik evaluasi k — menampilkan Silhouette dan/atau Elbow dalam satu panel
     *  hanya relevan jika ClusterMode = Automatic */
    ShowOptimalKChart: boolean;
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
