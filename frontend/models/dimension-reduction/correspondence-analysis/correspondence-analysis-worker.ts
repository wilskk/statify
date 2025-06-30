import { Analytic, Log, Statistic } from "@/types/Result";
import { CorrespondenceType } from "./correspondence-analysis";
import { ResultJson } from "@/types/Table";

export type CorrespondenceAnalysisType = {
    configData: CorrespondenceType;
    dataVariables: any[];
    variables: any[];
    meta: any;
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

export type CorrespondenceFinalResultType = {
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
