<<<<<<< HEAD
import {CorrespondenceType} from "./correspondence-analysis";
import {ResultJson} from "@/types/Table";
=======
import type {CorrespondenceType} from "./correspondence-analysis";
import type {ResultJson} from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export type CorrespondenceAnalysisType = {
    configData: CorrespondenceType;
    dataVariables: any[];
    variables: any[];
    meta: any;
};

export type CorrespondenceFinalResultType = {
    formattedResult: ResultJson;
};
