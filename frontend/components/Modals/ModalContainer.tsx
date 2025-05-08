"use client";

import React from "react";
import { ModalType, useModal } from "@/hooks/useModal";
import { FileModals, isFileModal } from "@/components/Modals/File/FileModals";
import { DataModals, isDataModal } from "@/components/Modals/Data/DataModals";
import { EditModals, isEditModal } from "@/components/Modals/Edit/EditModals";
import {
    DescriptiveModal,
    isDescriptiveModal,
} from "@/components/Modals/Analyze/Descriptive/DescriptiveModal";
import ComputeVariableModal from "@/components/Modals/Transform/ComputeVariableModal";
import { Dialog } from '@/components/ui/dialog';
import ModalLinear from './Regression/Linear/ModalLinear';
import ModalCurveEstimation from './Regression/CurveEstimation/ModalCurveEstimation';
import Statistics from './Regression/Linear/Statistics';
import SaveLinear from './Regression/Linear/SaveLinear';
import OptionsLinear from './Regression/Linear/OptionsLinear';
import PlotsLinear from './Regression/Linear/PlotsLinear';
import SimpleBarModal from "./Graphs/LegacyDialogs/BarModal/SimpleBarModal";
import ChartBuilderModal from "./Graphs/ChartBuilder/ChartBuilderModal";
import SmoothingModal from "./Analyze/TimeSeries/SmoothingModal";
import DecompositionModal from "./Analyze/TimeSeries/DecompositionModal";
import AutocorrelationModal from "./Analyze/TimeSeries/AutocorrelationModal";
import UnitRootTestModal from "./Analyze/TimeSeries/UnitRootTestModal";
import BoxJenkinsModelModal from "./Analyze/TimeSeries/BoxJenkinsModelModal";
import { CompareMeansModal, isCompareMeansModal } from "@/components/Modals/Analyze/CompareMeans/CompareMeansModal";
import { LegacyDialogsModal, isLegacyDialogsModal } from "@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/LegacyDialogsModal";
import {
    GeneralLinearModelModals,
    isGeneralLinearModelModal,
} from "./Analyze/general-linear-model/general-linear-model-modals";
import {
    ClassifyModals,
    isClassifyModal,
} from "./Analyze/classify/classify-modals";
import {
    DimensionReductionModals,
    isDimensionReductionModal,
} from "./Analyze/dimension-reduction/dimension-reduction-modals";

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

    if (isLegacyDialogsModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <LegacyDialogsModal
                    modalType={currentModal.type}
                    onClose={closeModal}
                    props={currentModal.props}
                />
            </Dialog>
        );
    }

    if (isCompareMeansModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <CompareMeansModal
                    modalType={currentModal.type}
                    onClose={closeModal}
                    props={currentModal.props}
                />
            </Dialog>
        );
    }

    if (isClassifyModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <ClassifyModals
                    modalType={currentModal.type}
                    onClose={closeModal}
                    props={currentModal.props}
                />
            </Dialog>
        );
    }

    if (isDimensionReductionModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <DimensionReductionModals
                    modalType={currentModal.type}
                    onClose={closeModal}
                    props={currentModal.props}
                />
            </Dialog>
        );
    }

    if (isGeneralLinearModelModal(currentModal.type)) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
                <GeneralLinearModelModals
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
                return (
                    <ComputeVariableModal
                        onClose={closeModal}
                        {...currentModal.props}
                    />
                );

            case ModalType.ModalLinear:
                return <ModalLinear onClose={closeModal} {...currentModal.props} />;
            case ModalType.Statistics:
                return <Statistics onClose={closeModal} {...currentModal.props} />;
            case ModalType.SaveLinear:
                return <SaveLinear onClose={closeModal} {...currentModal.props} />;
            case ModalType.OptionsLinear:
                return <OptionsLinear onClose={closeModal} {...currentModal.props} />;
            case ModalType.PlotsLinear:
                return <PlotsLinear onClose={closeModal} {...currentModal.props} />;
                return (
                    <ModalLinear onClose={closeModal} {...currentModal.props} />
                );
            case ModalType.ModalCurveEstimation:
                return (
                    <ModalCurveEstimation
                        onClose={closeModal}
                        {...currentModal.props}
                    />
                );


            case ModalType.ChartBuilderModal:
                return (
                    <ChartBuilderModal
                        onClose={closeModal}
                        {...currentModal.props}
                    />
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
                return (
                    <SimpleBarModal
                        onClose={closeModal}
                        {...currentModal.props}
                    />
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
