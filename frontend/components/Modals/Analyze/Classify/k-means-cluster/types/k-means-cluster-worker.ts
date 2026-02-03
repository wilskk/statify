<<<<<<< HEAD
import {KMeansClusterType} from "./k-means-cluster";
import {ResultJson} from "@/types/Table";
import {Variable} from "@/types/Variable";
=======
import type {KMeansClusterType} from "./k-means-cluster";
import type {ResultJson} from "@/types/Table";
import type {Variable} from "@/types/Variable";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

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
