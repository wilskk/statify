// SmartDataProcessingService.ts
// Service yang otomatis pilih method terbaik untuk data processing

import { DataProcessingService } from "./DataProcessingService";
import { DataProcessingWorkerService } from "./DataProcessingWorkerService";

// Interface untuk input data processing
interface DataProcessingInput {
  // Required
  chartType: string;
  rawData: any[][]; // Raw data dari CSV/SPSS
  variables: Array<{ name: string; type?: string }>; // Variable definitions

  // Chart variables mapping
  chartVariables: {
    x?: string[]; // X-axis variables
    y?: string[]; // Y-axis variables
    z?: string[]; // Z-axis variables (3D)
    groupBy?: string[]; // Grouping variables
    low?: string[]; // Low values (range charts)
    high?: string[]; // High values (range charts)
    close?: string[]; // Close values (financial charts)
    y2?: string[]; // Secondary Y-axis
  };

  // Data processing options
  processingOptions?: {
    aggregation?: "sum" | "count" | "average" | "none";
    filterEmpty?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
  };

  // Smart processing options
  smartOptions?: {
    forceSync?: boolean; // Force synchronous processing
    forceAsync?: boolean; // Force asynchronous processing
    threshold?: number; // Data size threshold (default: 1000)
    timeout?: number; // Timeout for async processing (default: 30000ms)
    onProgress?: (progress: number) => void; // Progress callback
  };
}

// Interface untuk output
interface DataProcessingOutput {
  processedData: any[];
  method: "sync" | "async";
  processingTime: number;
  dataSize: number;
}

export class SmartDataProcessingService {
  private static readonly DEFAULT_THRESHOLD = 1000;
  private static readonly DEFAULT_TIMEOUT = 30000;

  /**
   * Smart data processing - otomatis pilih method terbaik
   * @param input DataProcessingInput
   * @returns Promise<DataProcessingOutput>
   */
  static async processData(
    input: DataProcessingInput
  ): Promise<DataProcessingOutput> {
    const startTime = Date.now();
    const dataSize = input.rawData.length;
    const smartOptions = input.smartOptions || {};

    // Determine processing method
    const method = this.determineProcessingMethod(input, smartOptions);

    console.log(
      `SmartDataProcessingService: Using ${method} method for ${dataSize} rows`
    );

    let processedData: any[];

    try {
      if (method === "sync") {
        // Synchronous processing
        processedData = DataProcessingService.processDataForChart(input);
      } else {
        // Asynchronous processing
        if (smartOptions.onProgress) {
          processedData =
            await DataProcessingWorkerService.processDataWithProgress(
              input,
              smartOptions.onProgress
            );
        } else if (smartOptions.timeout) {
          processedData =
            await DataProcessingWorkerService.processDataWithTimeout(
              input,
              smartOptions.timeout
            );
        } else {
          processedData = await DataProcessingWorkerService.processData(input);
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        processedData,
        method,
        processingTime,
        dataSize,
      };
    } catch (error) {
      // Fallback to sync if async fails
      if (method === "async" && !smartOptions.forceAsync) {
        console.warn("Async processing failed, falling back to sync:", error);
        const fallbackStartTime = Date.now();
        processedData = DataProcessingService.processDataForChart(input);
        const fallbackTime = Date.now() - fallbackStartTime;

        return {
          processedData,
          method: "sync" as const,
          processingTime: fallbackTime,
          dataSize,
        };
      }
      throw error;
    }
  }

  /**
   * Determine processing method berdasarkan data dan options
   */
  private static determineProcessingMethod(
    input: DataProcessingInput,
    smartOptions: any
  ): "sync" | "async" {
    const dataSize = input.rawData.length;
    const threshold = smartOptions.threshold || this.DEFAULT_THRESHOLD;

    // Force sync
    if (smartOptions.forceSync) {
      return "sync";
    }

    // Force async
    if (smartOptions.forceAsync) {
      return "async";
    }

    // Check Web Worker support
    if (!DataProcessingWorkerService.isSupported()) {
      console.warn("Web Workers not supported, using sync method");
      return "sync";
    }

    // Auto-detect based on data size
    if (dataSize <= threshold) {
      return "sync";
    } else {
      return "async";
    }
  }

  /**
   * Process data dengan progress tracking
   */
  static async processDataWithProgress(
    input: DataProcessingInput,
    onProgress: (progress: number) => void
  ): Promise<DataProcessingOutput> {
    const smartInput = {
      ...input,
      smartOptions: {
        ...input.smartOptions,
        onProgress,
      },
    };

    return this.processData(smartInput);
  }

  /**
   * Process data dengan timeout
   */
  static async processDataWithTimeout(
    input: DataProcessingInput,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<DataProcessingOutput> {
    const smartInput = {
      ...input,
      smartOptions: {
        ...input.smartOptions,
        timeout,
      },
    };

    return this.processData(smartInput);
  }

  /**
   * Batch process multiple datasets
   */
  static async processBatchData(
    inputs: DataProcessingInput[]
  ): Promise<DataProcessingOutput[]> {
    const promises = inputs.map((input) => this.processData(input));
    return Promise.all(promises);
  }

  /**
   * Get processing recommendations
   */
  static getRecommendations(input: DataProcessingInput): {
    recommendedMethod: "sync" | "async";
    reason: string;
    estimatedTime: string;
  } {
    const dataSize = input.rawData.length;
    const threshold = input.smartOptions?.threshold || this.DEFAULT_THRESHOLD;
    const hasWorkerSupport = DataProcessingWorkerService.isSupported();

    let recommendedMethod: "sync" | "async";
    let reason: string;
    let estimatedTime: string;

    if (!hasWorkerSupport) {
      recommendedMethod = "sync";
      reason = "Web Workers not supported";
      estimatedTime = `${Math.max(100, dataSize * 0.1)}ms`;
    } else if (dataSize <= threshold) {
      recommendedMethod = "sync";
      reason = `Data size (${dataSize}) <= threshold (${threshold})`;
      estimatedTime = `${Math.max(50, dataSize * 0.05)}ms`;
    } else {
      recommendedMethod = "async";
      reason = `Data size (${dataSize}) > threshold (${threshold})`;
      estimatedTime = `${Math.max(200, dataSize * 0.02)}ms`;
    }

    return {
      recommendedMethod,
      reason,
      estimatedTime,
    };
  }

  /**
   * Check if Web Workers are supported
   */
  static isWorkerSupported(): boolean {
    return DataProcessingWorkerService.isSupported();
  }

  /**
   * Get current threshold
   */
  static getThreshold(): number {
    return this.DEFAULT_THRESHOLD;
  }

  /**
   * Set custom threshold
   */
  static setThreshold(threshold: number): void {
    (this as any).DEFAULT_THRESHOLD = threshold;
  }
}

// Utility functions untuk common use cases
export const SmartDataProcessingUtils = {
  /**
   * Process simple bar chart data
   */
  async processBarChart(
    rawData: any[][],
    variables: Array<{ name: string; type?: string }>,
    xVariable: string,
    yVariable: string,
    options?: {
      aggregation?: "sum" | "count" | "average" | "none";
      filterEmpty?: boolean;
      forceAsync?: boolean;
      onProgress?: (progress: number) => void;
    }
  ): Promise<DataProcessingOutput> {
    return SmartDataProcessingService.processData({
      chartType: "Vertical Bar Chart",
      rawData,
      variables,
      chartVariables: {
        x: [xVariable],
        y: [yVariable],
      },
      processingOptions: {
        aggregation: options?.aggregation,
        filterEmpty: options?.filterEmpty,
      },
      smartOptions: {
        forceAsync: options?.forceAsync,
        onProgress: options?.onProgress,
      },
    });
  },

  /**
   * Process scatter plot data
   */
  async processScatterPlot(
    rawData: any[][],
    variables: Array<{ name: string; type?: string }>,
    xVariable: string,
    yVariable: string,
    options?: {
      filterEmpty?: boolean;
      forceAsync?: boolean;
      onProgress?: (progress: number) => void;
    }
  ): Promise<DataProcessingOutput> {
    return SmartDataProcessingService.processData({
      chartType: "Scatter Plot",
      rawData,
      variables,
      chartVariables: {
        x: [xVariable],
        y: [yVariable],
      },
      processingOptions: {
        filterEmpty: options?.filterEmpty,
      },
      smartOptions: {
        forceAsync: options?.forceAsync,
        onProgress: options?.onProgress,
      },
    });
  },

  /**
   * Process stacked bar chart data
   */
  async processStackedBarChart(
    rawData: any[][],
    variables: Array<{ name: string; type?: string }>,
    xVariable: string,
    yVariables: string[],
    options?: {
      aggregation?: "sum" | "count" | "average" | "none";
      filterEmpty?: boolean;
      forceAsync?: boolean;
      onProgress?: (progress: number) => void;
    }
  ): Promise<DataProcessingOutput> {
    return SmartDataProcessingService.processData({
      chartType: "Vertical Stacked Bar Chart",
      rawData,
      variables,
      chartVariables: {
        x: [xVariable],
        y: yVariables,
      },
      processingOptions: {
        aggregation: options?.aggregation,
        filterEmpty: options?.filterEmpty,
      },
      smartOptions: {
        forceAsync: options?.forceAsync,
        onProgress: options?.onProgress,
      },
    });
  },

  /**
   * Process 3D chart data
   */
  async process3DChart(
    rawData: any[][],
    variables: Array<{ name: string; type?: string }>,
    xVariable: string,
    yVariable: string,
    zVariable: string,
    options?: {
      aggregation?: "sum" | "count" | "average" | "none";
      filterEmpty?: boolean;
      forceAsync?: boolean;
      onProgress?: (progress: number) => void;
    }
  ): Promise<DataProcessingOutput> {
    return SmartDataProcessingService.processData({
      chartType: "3D Scatter Plot",
      rawData,
      variables,
      chartVariables: {
        x: [xVariable],
        y: [yVariable],
        z: [zVariable],
      },
      processingOptions: {
        aggregation: options?.aggregation,
        filterEmpty: options?.filterEmpty,
      },
      smartOptions: {
        forceAsync: options?.forceAsync,
        onProgress: options?.onProgress,
      },
    });
  },
};

// Export types
export type { DataProcessingInput, DataProcessingOutput };
