import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";

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
export interface FrequenciesAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    selectedVariables: Variable[];
    showFrequencyTables: boolean;
    showStatistics: boolean;
    statisticsOptions: StatisticsOptions | null;
    showCharts: boolean;
    chartOptions: ChartOptions | null;
}

// === Results Types ===
export interface FrequenciesResults {
    frequencies?: RawFrequencyData[];
    descriptive?: any;
}

// === Worker Types ===
export interface WorkerInput {
    variableData: {
        variable: import('@/types/Variable').Variable;
        data: any[];
    }[];
    weightVariableData: any[] | null;
    statisticsOptions?: StatisticsOptions | null;
    chartOptions?: ChartOptions | null;
}

export interface WorkerCalculationPromise {
    resolve: (result: { frequencies?: RawFrequencyData[]; descriptive?: any; } | null) => void;
    reject: (reason: any) => void;
}

export interface FrequencyWorkerResult {
    success: boolean;
    frequencies?: RawFrequencyData[];
    error?: string;
}

export interface DescriptiveWorkerResult {
    success: boolean;
    descriptive?: any;
    error?: string;
}

// For variable selection
export interface VariableSelectionResult {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: Variable | null;
    setHighlightedVariable: (variable: Variable | null) => void;
    moveToSelectedVariables: (variable: Variable) => void;
    moveToAvailableVariables: (variable: Variable) => void;
    reorderVariables: (startIndex: number, endIndex: number) => void;
    resetVariableSelection: () => void;
}

// For statistics settings management
export interface StatisticsSettingsResult {
    showStatistics: boolean;
    setShowStatistics: (show: boolean) => void;
    quartilesChecked: boolean;
    setQuartilesChecked: (checked: boolean) => void;
    cutPointsChecked: boolean;
    setCutPointsChecked: (checked: boolean) => void;
    cutPointsValue: number;
    setCutPointsValue: (value: number) => void;
    enablePercentiles: boolean;
    setEnablePercentiles: (enable: boolean) => void;
    percentileValues: string[];
    setPercentileValues: (values: string[]) => void;
    currentPercentileInput: string;
    setCurrentPercentileInput: (value: string) => void;
    selectedPercentileItem: number;
    setSelectedPercentileItem: (index: number) => void;
    meanChecked: boolean;
    setMeanChecked: (checked: boolean) => void;
    medianChecked: boolean;
    setMedianChecked: (checked: boolean) => void;
    modeChecked: boolean;
    setModeChecked: (checked: boolean) => void;
    sumChecked: boolean;
    setSumChecked: (checked: boolean) => void;
    stdDevChecked: boolean;
    setStdDevChecked: (checked: boolean) => void;
    varianceChecked: boolean;
    setVarianceChecked: (checked: boolean) => void;
    rangeChecked: boolean;
    setRangeChecked: (checked: boolean) => void;
    minChecked: boolean;
    setMinChecked: (checked: boolean) => void;
    maxChecked: boolean;
    setMaxChecked: (checked: boolean) => void;
    seMeanChecked: boolean;
    setSeMeanChecked: (checked: boolean) => void;
    skewnessChecked: boolean;
    setSkewnessChecked: (checked: boolean) => void;
    kurtosisChecked: boolean;
    setKurtosisChecked: (checked: boolean) => void;
    getCurrentStatisticsOptions: () => StatisticsOptions | null;
    resetStatisticsSettings: () => void;
}

// For charts settings management
export interface ChartsSettingsResult {
    showCharts: boolean;
    setShowCharts: (show: boolean) => void;
    chartType: string;
    setChartType: (type: string) => void;
    chartValues: string;
    setChartValues: (values: string) => void;
    showNormalCurve: boolean;
    setShowNormalCurve: (show: boolean) => void;
    getCurrentChartOptions: () => ChartOptions | null;
    resetChartsSettings: () => void;
}

// For data fetching from variables
export interface FetchedData {
    variableData: {
        variable: Variable;
        data: any[];
    }[];
    weightVariableData: any[] | null;
}

// For data fetching hook
export interface DataFetchingResult {
    fetchData: (variables: Variable[]) => Promise<FetchedData>;
    isLoading: boolean;
    error: string | null;
}

// For worker communication
export interface FrequenciesWorkerResult {
    calculate: (data: any, options: any) => Promise<any>;
    isCalculating: boolean;
    error: string | null;
    cancelCalculation: () => void;
}

// For table formatting
export interface TableColumnHeader {
    header: string;
    key?: string;
    children?: TableColumnHeader[];
}

export interface TableRow {
    rowHeader: (string | null)[];
    children?: TableRow[];
    [key: string]: any;
}

// For raw frequency data structure
export interface RawFrequencyData {
    variableLabel: string;
    validRowsData: {
        label: string;
        frequency: number;
        percent: number;
        validPercent: number;
        cumulativePercent: number;
    }[];
    missingRowsData: {
        label: string;
        frequency: number;
        percent: number;
        isSystem: boolean;
    }[];
    totalN: number;
    validN: number;
    totalMissingN: number;
} 