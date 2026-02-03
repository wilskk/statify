<<<<<<< HEAD
import { UnivariateType } from "./univariate";
import { ResultJson } from "@/types/Table";
import { Variable } from "@/types/Variable";
=======
import type { UnivariateType } from "./univariate";
import type { ResultJson } from "@/types/Table";
import type { Variable } from "@/types/Variable";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

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
