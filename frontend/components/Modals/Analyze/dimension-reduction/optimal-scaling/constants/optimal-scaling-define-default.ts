<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    OptScaDefineMainType,
    OptScaDefineType,
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/types/optimal-scaling-define";

export const OptScaDefineMainDefault: OptScaDefineMainType = {
    AllVarsMultiNominal: true,
    SomeVarsNotMultiNominal: false,
    OneSet: true,
    MultipleSets: false,
};

export const OptScaDefineDefault: OptScaDefineType = {
    main: OptScaDefineMainDefault,
};
