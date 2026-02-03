<<<<<<< HEAD
import {DiscriminantType} from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant";
import {ResultJson} from "@/types/Table";
=======
import type {DiscriminantType} from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant";
import type {ResultJson} from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export type DiscriminantAnalysisType = {
    configData: DiscriminantType;
    dataVariables: any[];
    variables: any[];
};

export type DiscriminantFinalResultType = {
    formattedResult: ResultJson;
};
