<<<<<<< HEAD
import {RocCurveType} from "./roc-curve";
import {ResultJson} from "@/types/Table";
=======
import type {RocCurveType} from "./roc-curve";
import type {ResultJson} from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export type RocCurveAnalysisType = {
    configData: RocCurveType;
    dataVariables: any[];
    variables: any[];
};

export type RocCurveFinalResultType = {
    formattedResult: ResultJson;
};
