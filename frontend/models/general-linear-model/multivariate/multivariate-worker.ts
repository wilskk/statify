import { Analytic, Log, Statistic } from "@/types/Result";
import { MultivariateType } from "./multivariate";

export type MultivariateAnalysisType = {
    configData: MultivariateType;
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

export type MultivariateFinalResultType = {
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
