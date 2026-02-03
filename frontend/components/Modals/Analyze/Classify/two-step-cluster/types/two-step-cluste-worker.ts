import type {TwoStepClusterType} from "./two-step-cluster";
import type {ResultJson} from "@/types/Table";

export type TwoStepClusterAnalysisType = {
    configData: TwoStepClusterType;
    dataVariables: any[];
    variables: any[];
};

export type TwoStepClusterFinalResultType = {
    formattedResult: ResultJson;
};
