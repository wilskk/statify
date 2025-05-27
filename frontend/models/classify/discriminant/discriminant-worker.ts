import { DiscriminantType } from "@/models/classify/discriminant/discriminant";
import { ResultJson } from "@/types/Table";

export type DiscriminantAnalysisType = {
    configData: DiscriminantType;
    dataVariables: any[];
    variables: any[];
};

export type DiscriminantFinalResultType = {
    formattedResult: ResultJson;
};
