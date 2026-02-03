<<<<<<< HEAD
import {HierClusType} from "./hierarchical-cluster";
import {ResultJson} from "@/types/Table";
=======
import type {HierClusType} from "./hierarchical-cluster";
import type {ResultJson} from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export type HierClusAnalysisType = {
    configData: HierClusType;
    dataVariables: any[];
    variables: any[];
};

export type HierClusFinalResultType = {
    formattedResult: ResultJson;
};
