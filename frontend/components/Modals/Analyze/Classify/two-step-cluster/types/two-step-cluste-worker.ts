<<<<<<< HEAD
import {TwoStepClusterType} from "./two-step-cluster";
import {ResultJson} from "@/types/Table";
=======
import type {TwoStepClusterType} from "./two-step-cluster";
import type {ResultJson} from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export type TwoStepClusterAnalysisType = {
    configData: TwoStepClusterType;
    dataVariables: any[];
    variables: any[];
};

export type TwoStepClusterFinalResultType = {
    formattedResult: ResultJson;
};
