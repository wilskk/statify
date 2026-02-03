<<<<<<< HEAD
import {RocAnalysisType} from "./roc-analysis";
import {ResultJson} from "@/types/Table";
=======
import type {RocAnalysisType} from "./roc-analysis";
import type {ResultJson} from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export type RocAnalysisAnalysisType = {
    configData: RocAnalysisType;
    dataVariables: any[];
    variables: any[];
};

export type RocAnalysisFinalResultType = {
    formattedResult: ResultJson;
};
