import type { Variable } from "./Variable";

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
    // valuesAreGroupMidpoints: boolean; // Add if needed
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

// Add ChartOptions definition
export interface ChartOptions {
    type: "barCharts" | "pieCharts" | "histograms" | null;
    values: "frequencies" | "percentages";
    showNormalCurveOnHistogram: boolean;
}

export interface FrequenciesAnalysisParams {
    selectedVariables: Variable[];
    showFrequencyTables: boolean;
    showStatistics: boolean;
    statisticsOptions: StatisticsOptions | null;
    showCharts: boolean;
    // Add chartOptions here?
    chartOptions: ChartOptions | null; // Add chartOptions
    onClose: () => void;
} 