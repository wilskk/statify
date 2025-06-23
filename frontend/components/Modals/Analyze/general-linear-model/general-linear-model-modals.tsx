"use client";

import React from "react";
import { ModalType } from "@/hooks/useModal";
import { UnivariateContainer } from "@/components/Modals/Analyze/general-linear-model/univariate/dialogs/univariate-main";
import { MultivariateContainer } from "@/components/Modals/Analyze/general-linear-model/multivariate/dialogs/multivariate-main";
import { RepeatedMeasuresDefineContainer } from "@/components/Modals/Analyze/general-linear-model/repeated-measures/dialogs/define/repeated-measures-define";
import { VarianceCompsContainer } from "@/components/Modals/Analyze/general-linear-model/variance-components/dialogs/variance-components-main";
import { RepeatedMeasuresContainer } from "@/components/Modals/Analyze/general-linear-model/repeated-measures/dialogs/repeated-measures-main";

interface GeneralLinearModelModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const GeneralLinearModelModals: React.FC<
    GeneralLinearModelModalsProps
> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        // case ModalType.Univariate:
        //     return <UnivariateContainer onClose={onClose} {...props} />;
        // case ModalType.Multivariate:
        //     return <MultivariateContainer onClose={onClose} {...props} />;
        // case ModalType.RepeatedMeasures:
        //     return (
        //         <RepeatedMeasuresDefineContainer onClose={onClose} {...props} />
        //     );
        // case ModalType.RepeatedMeasuresDialog:
        //     return <RepeatedMeasuresContainer onClose={onClose} {...props} />;
        // case ModalType.VarianceComponents:
        //     return <VarianceCompsContainer onClose={onClose} {...props} />;
        default:
            return null;
    }
};

export const isGeneralLinearModelModal = (type: ModalType): boolean => {
    return false; // Always return false as all modals are disabled
    // return [
    //     // ModalType.Univariate,
    //     // ModalType.Multivariate,
    //     // ModalType.RepeatedMeasures,
    //     // ModalType.RepeatedMeasuresDialog,
    //     // ModalType.VarianceComponents,
    // ].includes(type);
};
