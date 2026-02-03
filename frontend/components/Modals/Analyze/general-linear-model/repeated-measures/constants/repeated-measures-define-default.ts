<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    RepeatedMeasure,
    RepeatedMeasureDefineData,
    RepeatedMeasureDefineFactor,
    RepeatedMeasureDefineType,
} from "@/components/Modals/Analyze/general-linear-model/repeated-measures/types/repeated-measure-define";

export const RepeatedMeasureDefineFactorDefault: RepeatedMeasureDefineFactor = {
    name: null,
    levels: null,
};

export const RepeatedMeasureDefault: RepeatedMeasure = {
    name: null,
};

export const RepeatedMeasureDefineMainDefault: RepeatedMeasureDefineData = {
    factors: [],
    measures: [],
    factorName: null,
    factorLevels: null,
    measureName: null,
    selectedFactor: null,
    selectedMeasure: null,
};

export const RepeatedMeasureDefineDefault: RepeatedMeasureDefineType = {
    main: RepeatedMeasureDefineMainDefault,
};
