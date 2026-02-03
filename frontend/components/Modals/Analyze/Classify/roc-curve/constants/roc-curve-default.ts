<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    RocCurveMainType,
    RocCurveOptionsType,
    RocCurveType,
} from "@/components/Modals/Analyze/Classify/roc-curve/types/roc-curve";

export const RocCurveMainDefault: RocCurveMainType = {
    StateTargetVariable: null,
    StateVarVal: null,
    TestTargetVariable: null,
    CoordPt: false,
    DiagRef: false,
    ErrInterval: false,
    RocCurve: true,
};

export const RocCurveOptionsDefault: RocCurveOptionsType = {
    IncludeCutoff: true,
    ExcludeCutoff: false,
    LargerTest: true,
    SmallerTest: false,
    DistAssumptMethod: "Nonparametric",
    ConfLevel: 95,
    ExcludeMissValue: true,
    MissValueAsValid: false,
};

export const RocCurveDefault: RocCurveType = {
    main: RocCurveMainDefault,
    options: RocCurveOptionsDefault,
};
