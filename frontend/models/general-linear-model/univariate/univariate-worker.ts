 
import { UnivariateType } from "./univariate";
import { ResultJson } from "@/types/Table";

export type UnivariateAnalysisType = {
    configData: UnivariateType;
    dataVariables: any[];
    variables: any[];
};

export type UnivariateFinalResultType = {
    formattedResult: ResultJson;
};
