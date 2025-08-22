import type {RocAnalysisType} from "./roc-analysis";
import type {ResultJson} from "@/types/Table";

export type RocAnalysisAnalysisType = {
    configData: RocAnalysisType;
    dataVariables: any[];
    variables: any[];
};

export type RocAnalysisFinalResultType = {
    formattedResult: ResultJson;
};
