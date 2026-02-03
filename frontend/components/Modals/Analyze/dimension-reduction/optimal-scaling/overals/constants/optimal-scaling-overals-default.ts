<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    OptScaOveralsDefineRangeScaleType,
    OptScaOveralsDefineRangeType,
    OptScaOveralsMainType,
    OptScaOveralsOptionsType,
    OptScaOveralsType,
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/types/optimal-scaling-overals";

export const OptScaOveralsMainDefault: OptScaOveralsMainType = {
    SetTargetVariable: null,
    PlotsTargetVariable: null,
    Dimensions: 2,
};

export const OptScaOveralsDefineRangeScaleDefault: OptScaOveralsDefineRangeScaleType =
    {
        Minimum: 1,
        Maximum: null,
        Ordinal: true,
        SingleNominal: false,
        MultipleNominal: false,
        DiscreteNumeric: false,
    };

export const OptScaOveralsDefineRangeDefault: OptScaOveralsDefineRangeType = {
    Minimum: 1,
    Maximum: null,
};

export const OptScaOveralsOptionsDefault: OptScaOveralsOptionsType = {
    Freq: true,
    SingMult: true,
    Centroid: true,
    CategoryQuant: true,
    IterHistory: false,
    ObjScore: false,
    WeightCompload: false,
    CategCoord: false,
    CategCentroid: false,
    PlotObjScore: true,
    Trans: false,
    Compload: true,
    SaveObjscore: false,
    UseRandconf: false,
    MaxIter: 100,
    Conv: 0.00001,
};

export const OptScaOveralsDefault: OptScaOveralsType = {
    main: OptScaOveralsMainDefault,
    defineRangeScale: OptScaOveralsDefineRangeScaleDefault,
    defineRange: OptScaOveralsDefineRangeDefault,
    options: OptScaOveralsOptionsDefault,
};
