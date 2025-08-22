import type {KNNType} from "./nearest-neighbor";
import type {ResultJson} from "@/types/Table";

export type KNNAnalysisType = {
    configData: KNNType;
    dataVariables: any[];
    variables: any[];
};

export type KNNFinalResultType = {
    formattedResult: ResultJson;
};
