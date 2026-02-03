<<<<<<< HEAD
import {KNNType} from "./nearest-neighbor";
import {ResultJson} from "@/types/Table";
=======
import type {KNNType} from "./nearest-neighbor";
import type {ResultJson} from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export type KNNAnalysisType = {
    configData: KNNType;
    dataVariables: any[];
    variables: any[];
};

export type KNNFinalResultType = {
    formattedResult: ResultJson;
};
