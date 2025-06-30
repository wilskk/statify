import { Analytic, Log, Statistic } from "@/types/Result";
import { KMeansClusterType } from "./k-means-cluster";
import { ResultJson } from "@/types/Table";

export type KMeansClusterAnalysisType = {
    configData: KMeansClusterType;
    dataVariables: any[];
    variables: any[];
    addLog: (log: Omit<Log, "id" | "analytics">) => Promise<number>;
    addAnalytic: (
        logId: number,
        analytic: Omit<Analytic, "id" | "logId" | "statistics">
    ) => Promise<number>;
    addStatistic: (
        analyticId: number,
        statistic: Omit<Statistic, "id" | "analyticId">
    ) => Promise<number>;
};

export type KMeansClusterFinalResultType = {
    addLog: (log: Omit<Log, "id" | "analytics">) => Promise<number>;
    addAnalytic: (
        logId: number,
        analytic: Omit<Analytic, "id" | "logId" | "statistics">
    ) => Promise<number>;
    addStatistic: (
        analyticId: number,
        statistic: Omit<Statistic, "id" | "analyticId">
    ) => Promise<number>;

    formattedResult: ResultJson;
};
