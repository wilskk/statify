import { Analytic, Log, Statistic } from "@/types/Result";
import { KMeansClusterType } from "./k-means-cluster";

export type KMeansClusterAnalysisType = {
    configData: KMeansClusterType;
    dataVariables: any[];
    variables: any[];
    addLog: (log: Omit<Log, "id" | "analytics">) => Promise<number>;
    addAnalytic: (
        logId: number,
        analytic: Omit<Analytic, "id" | "log_id" | "statistics">
    ) => Promise<number>;
    addStatistic: (
        analyticId: number,
        statistic: Omit<Statistic, "id" | "analytic_id">
    ) => Promise<number>;
};

export type KMeansClusterFinalResultType = {
    addLog: (log: Omit<Log, "id" | "analytics">) => Promise<number>;
    addAnalytic: (
        logId: number,
        analytic: Omit<Analytic, "id" | "log_id" | "statistics">
    ) => Promise<number>;
    addStatistic: (
        analyticId: number,
        statistic: Omit<Statistic, "id" | "analytic_id">
    ) => Promise<number>;
    initialClusterCentersTable: any;
    iterationHistoryTable: any;
    finalClusterCentersTable: any;
    numberOfCasesTable: any;
    clusterMembershipTable: any;
    clusterStatisticsTable: any;
    distancesFromClusterCentersTable: any;
};
