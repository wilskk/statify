import type { UnivariateType } from "./univariate";
import type { ResultJson } from "@/types/Table";
import type { Variable } from "@/types/Variable";

export type UnivariateAnalysisType = {
    configData: UnivariateType;
    dataVariables: any[];
    variables: Variable[];
};

export type UnivariateFinalResultType = {
    formattedResult: ResultJson;
    configData: UnivariateType;
    variables: Variable[];
};
