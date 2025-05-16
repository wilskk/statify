import type { Variable } from "@/types/Variable";

// === Statistics Options ===
export interface PercentileOptions {
    quartiles: boolean;
    cutPoints: boolean;
    cutPointsN: number;
    enablePercentiles: boolean;
    percentilesList: string[];
}

export interface CentralTendencyOptions {
    mean: boolean;
    median: boolean;
    mode: boolean;
    sum: boolean;
}

export interface DispersionOptions {
    stddev: boolean;
    variance: boolean;
    range: boolean;
    minimum: boolean;
    maximum: boolean;
    stdErrorMean: boolean;
}

export interface DistributionOptions {
    skewness: boolean;
    stdErrorSkewness: boolean;
    kurtosis: boolean;
    stdErrorKurtosis: boolean;
}

export interface StatisticsOptions {
    percentileValues: PercentileOptions;
    centralTendency: CentralTendencyOptions;
    dispersion: DispersionOptions;
    distribution: DistributionOptions;
}

// === Chart Options ===
export interface ChartOptions {
    type: "barCharts" | "pieCharts" | "histograms" | null;
    values: "frequencies" | "percentages";
    showNormalCurveOnHistogram: boolean;
}

// === Analysis Params ===
export interface FrequenciesAnalysisParams {
    selectedVariables: Variable[];
    showFrequencyTables: boolean;
    showStatistics: boolean;
    statisticsOptions: StatisticsOptions | null;
    showCharts: boolean;
    chartOptions: ChartOptions | null;
    onClose: () => void;
}

// === Results Types ===
export interface FrequenciesResults {
    descriptive?: any;
    frequencies?: any[];
}

// === Worker Types ===
export interface WorkerInput {
    variableData: any[];
    weightVariableData: (string | number)[] | null;
    statisticsOptions?: StatisticsOptions | null;
    chartOptions?: ChartOptions | null;
}

export interface FrequencyWorkerResult {
    success: boolean;
    frequencies?: any[];
    error?: string;
}

export interface DescriptiveWorkerResult {
    success: boolean;
    descriptive?: any;
    error?: string;
}

export interface WorkerCalculationPromise {
    resolve: (value: { frequencies?: any[]; descriptive?: any; } | null) => void;
    reject: (reason: any) => void;
} 