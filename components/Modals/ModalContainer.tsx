"use client"

import React from "react";
import { ModalType, useModal } from "@/hooks/useModal";
import { FileModals, isFileModal } from "@/components/Modals/File/FileModals";
import { DataModals, isDataModal } from "@/components/Modals/Data/DataModals";
import { EditModals, isEditModal } from "@/components/Modals/Edit/EditModals";
import { DescriptiveModal, isDescriptiveModal } from "@/components/Modals/Analyze/Descriptive/DescriptiveModal";
import ComputeVariableModal from "@/components/Modals/Transform/ComputeVariableModal";
import { Dialog } from "@/components/ui/dialog";
import SimpleBarModal from "./Graphs/LegacyDialogs/BarModal/SimpleBarModal";
import ModalAutomaticLinearModeling from "@/components/Modals/Regression/AutomaticLinearModeling/ModalAutomaticLinearModeling";
import ModalLinear from "./Regression/Linear/ModalLinear";
import ModalCurveEstimation from "./Regression/CurveEstimation/ModalCurveEstimation";
import ModalPartialLeastSquares from "./Regression/PartialLeastSquares/ModalPartialLeastSquares";
import ModalBinaryLogistic from "./Regression/BinaryLogistic/ModalBinaryLogistic";
import ModalMultinomialLogistic from "./Regression/MultinomialLogistic/ModalMultinomialLogistic";
import ModalOrdinal from "./Regression/Ordinal/ModalOrdinal";
import ModalProbit from "./Regression/Probit/ModalProbit";
import ModalNonlinear from "./Regression/Nonlinear/ModalNonlinear";
import ModalTwoStageLeastSquares from "./Regression/TwoStageLeastSquares/ModalTwoStageLeastSquares";
import ModalWeightEstimation from "./Regression/WeightEstimation/ModalWeightEstimation";
import ModalQuantiles from "./Regression/Quantiles/ModalQuantiles";
import ModalOptimalScaling from "./Regression/OptimalScaling/ModalOptimalScaling";
import ChartBuilderModal from "./Graphs/ChartBuilder/ChartBuilderModal";
import KRelatedSamplesTestModal from "./Analyze/NonparametricTests/LegacyDialogs/KRelatedSamplesTestModal";
import SmoothingModal from "./Analyze/TimeSeries/SmoothingModal";
import DecompositionModal from "./Analyze/TimeSeries/DecompositionModal";
import AutocorrelationModal from "./Analyze/TimeSeries/AutocorrelationModal";
import UnitRootTestModal from "./Analyze/TimeSeries/UnitRootTestModal";
import BoxJenkinsModelModal from "./Analyze/TimeSeries/BoxJenkinsModelModal";

const ModalContainer: React.FC = () => {
    const { modals, closeModal } = useModal();

    if (modals.length === 0) return null;

    const currentModal = modals[modals.length - 1];

    if (isFileModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <FileModals
                    modalType={currentModal.type}
                    onClose={closeModal}
                    props={currentModal.props}
                />
            </Dialog>
        );
    }

    if (isDataModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <DataModals
                    modalType={currentModal.type}
                    onClose={closeModal}
                    props={currentModal.props}
                />
            </Dialog>
        );
    }

    if (isEditModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <EditModals
                    modalType={currentModal.type}
                    onClose={closeModal}
                    props={currentModal.props}
                />
            </Dialog>
        );
    }

    if (isDescriptiveModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <DescriptiveModal
                    modalType={currentModal.type}
                    onClose={closeModal}
                    props={currentModal.props}
                />
            </Dialog>
        );
    }

    const renderModal = () => {
        switch (currentModal.type) {
            case ModalType.ComputeVariable:
                return <ComputeVariableModal onClose={closeModal} {...currentModal.props} />;

            case ModalType.ModalAutomaticLinearModeling:
                return (
                    <ModalAutomaticLinearModeling
                        onClose={closeModal}
                        {...currentModal.props}
                    />
                );
            case ModalType.ModalLinear:
                return <ModalLinear onClose={closeModal} {...currentModal.props} />;
            case ModalType.ModalCurveEstimation:
                return (
                    <ModalCurveEstimation onClose={closeModal} {...currentModal.props} />
                );
            case ModalType.ModalPartialLeastSquares:
                return (
                    <ModalPartialLeastSquares
                        onClose={closeModal}
                        {...currentModal.props}
                    />
                );
            case ModalType.ModalBinaryLogistic:
                return (
                    <ModalBinaryLogistic onClose={closeModal} {...currentModal.props} />
                );
            case ModalType.ModalMultinomialLogistic:
                return (
                    <ModalMultinomialLogistic
                        onClose={closeModal}
                        {...currentModal.props}
                    />
                );
            case ModalType.ModalOrdinal:
                return <ModalOrdinal onClose={closeModal} {...currentModal.props} />;
            case ModalType.ModalProbit:
                return <ModalProbit onClose={closeModal} {...currentModal.props} />;
            case ModalType.ModalNonlinear:
                return <ModalNonlinear onClose={closeModal} {...currentModal.props} />;
            case ModalType.ModalWeightEstimation:
                return (
                    <ModalWeightEstimation onClose={closeModal} {...currentModal.props} />
                );
            case ModalType.ModalTwoStageLeastSquares:
                return (
                    <ModalTwoStageLeastSquares
                        onClose={closeModal}
                        {...currentModal.props}
                    />
                );
            case ModalType.ModalQuantiles:
                return <ModalQuantiles onClose={closeModal} {...currentModal.props} />;
            case ModalType.ModalOptimalScaling:
                return (
                    <ModalOptimalScaling onClose={closeModal} {...currentModal.props} />
                );

            case ModalType.KRelatedSamplesTest:
                return <KRelatedSamplesTestModal onClose={closeModal} {...currentModal.props} />;

            case ModalType.ChartBuilderModal:
                return (
                    <ChartBuilderModal onClose={closeModal} {...currentModal.props} />
                );
            case ModalType.SimpleBarModal:
                return <SimpleBarModal onClose={closeModal} {...currentModal.props} />;

            // Time Series
            case ModalType.Smoothing:
                return <SmoothingModal onClose={closeModal} {...currentModal.props} />;
            case ModalType.Decomposition:
                return (
                <DecompositionModal onClose={closeModal} {...currentModal.props} />
                );
            case ModalType.Autocorrelation:
                return (
                <AutocorrelationModal onClose={closeModal} {...currentModal.props} />
                );
            case ModalType.UnitRootTest:
                return (
                    <UnitRootTestModal onClose={closeModal} {...currentModal.props} />
                );
            case ModalType.BoxJenkinsModel:
                return (
                <BoxJenkinsModelModal onClose={closeModal} {...currentModal.props} />
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
            {renderModal()}
        </Dialog>
    );
};

export default ModalContainer;