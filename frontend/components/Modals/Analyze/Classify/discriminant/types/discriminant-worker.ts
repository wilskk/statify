import type {DiscriminantType} from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant";
import type {ResultJson} from "@/types/Table";

export type DiscriminantAnalysisType = {
    configData: DiscriminantType;
    dataVariables: any[];
    variables: any[];
};

export type DiscriminantFinalResultType = {
    formattedResult: ResultJson;
};
