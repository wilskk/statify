import type {KMeansClusterType} from "./k-means-cluster";
import type {ResultJson} from "@/types/Table";
import type {Variable} from "@/types/Variable";

export type KMeansClusterAnalysisType = {
    configData: KMeansClusterType;
    dataVariables: any[];
    variables: any[];
};

export type KMeansClusterFinalResultType = {
    formattedResult: ResultJson;
    configData: KMeansClusterType;
    variables: Variable[];
};
