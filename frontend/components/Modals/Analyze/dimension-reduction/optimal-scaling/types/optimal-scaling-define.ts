<<<<<<< HEAD
import React from "react";
=======
import type React from "react";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export type OptScaDefineMainType = {
    AllVarsMultiNominal: boolean;
    SomeVarsNotMultiNominal: boolean;
    OneSet: boolean;
    MultipleSets: boolean;
};

export type OptScaDefineProps = {
    isDefineOpen: boolean;
    setIsDefineOpen: React.Dispatch<React.SetStateAction<boolean>>;
    updateFormData: (field: keyof OptScaDefineMainType, value: boolean) => void;
    data: OptScaDefineMainType;
    onContinue: (mainState: OptScaDefineMainType) => void;
    onReset: () => void;
};

export type OptScaDefineType = {
    main: OptScaDefineMainType;
};

export type OptScaContainerProps = {
    onClose: () => void;
};
