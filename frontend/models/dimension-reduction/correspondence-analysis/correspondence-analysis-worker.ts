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
        analytic: Omit<Analytic, "id" | "log_id" | "statistics">
    ) => Promise<number>;
    addStatistic: (
        analyticId: number,
        statistic: Omit<Statistic, "id" | "analytic_id">
    ) => Promise<number>;
};

export type CorrespondenceFinalResultType = {
    addLog: (log: Omit<Log, "id" | "analytics">) => Promise<number>;
    addAnalytic: (
        logId: number,
        analytic: Omit<Analytic, "id" | "log_id" | "statistics">
    ) => Promise<number>;
    addStatistic: (
        analyticId: number,
        statistic: Omit<Statistic, "id" | "analytic_id">
    ) => Promise<number>;

    formattedResult: ResultJson;
};
