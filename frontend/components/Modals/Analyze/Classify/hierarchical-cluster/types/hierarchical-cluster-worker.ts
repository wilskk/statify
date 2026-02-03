import type {HierClusType} from "./hierarchical-cluster";
import type {ResultJson} from "@/types/Table";

export type HierClusAnalysisType = {
    configData: HierClusType;
    dataVariables: any[];
    variables: any[];
};

export type HierClusFinalResultType = {
    formattedResult: ResultJson;
};
