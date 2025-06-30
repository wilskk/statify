import { Analytic, Log, Statistic } from "@/types/Result";
import { FactorType } from "./factor";
import { ResultJson } from "@/types/Table";

export type FactorAnalysisType = {
    configData: FactorType;
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

export type FactorFinalResultType = {
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
