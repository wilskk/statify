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
import RecodeSameVariablesModal from "@/components/Modals/Transform/recodeSameVariables";
import { Dialog } from '@/components/ui/dialog';
import ModalAutomaticLinearModeling from '@/components/Modals/Regression/AutomaticLinearModeling/ModalAutomaticLinearModeling';
import ModalLinear from './Regression/Linear/ModalLinear';
import ModalCurveEstimation from './Regression/CurveEstimation/ModalCurveEstimation';
import ModalPartialLeastSquares from './Regression/PartialLeastSquares/ModalPartialLeastSquares';
import ModalBinaryLogistic from './Regression/BinaryLogistic/ModalBinaryLogistic';
import ModalMultinomialLogistic from './Regression/MultinomialLogistic/ModalMultinomialLogistic';
import ModalOrdinal from './Regression/Ordinal/ModalOrdinal';
import ModalProbit from './Regression/Probit/ModalProbit';
import ModalNonlinear from './Regression/Nonlinear/ModalNonlinear';
import ModalTwoStageLeastSquares from './Regression/TwoStageLeastSquares/ModalTwoStageLeastSquares';
import ModalWeightEstimation from './Regression/WeightEstimation/ModalWeightEstimation';
import ModalQuantiles from './Regression/Quantiles/ModalQuantiles';
import ModalOptimalScaling from './Regression/OptimalScaling/ModalOptimalScaling';
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
import { ContainerType } from "@/types/ui";

interface ModalContainerProps {
    modalType?: ModalType; // Optional: if passed, this specific modal is rendered
    props?: any;           // Optional: props for the specific modal
    onClose?: () => void;  // Optional: specific close handler
    containerType?: ContainerType;
}

const ModalContainer: React.FC<ModalContainerProps> = ({
    modalType: specificModalType,
    props: specificProps,
    onClose: specificOnClose,
    containerType = "dialog", // Default to dialog if not provided by parent
}) => {
    const { modals, closeModal } = useModal();

    // Determine which modal to render
    // If specificModalType is provided, render that one (used by SidebarContainer)
    // Otherwise, render the latest modal from the global store (used by DashboardLayout for mobile)
    const currentGlobalModal = modals.length > 0 ? modals[modals.length - 1] : null;
    
    const modalToRender = specificModalType 
        ? { type: specificModalType, props: specificProps }
        : currentGlobalModal;

    const effectiveOnClose = specificOnClose || closeModal;

    if (!modalToRender) return null;

    // The actual rendering logic for a given modal
    const renderSpecificModal = (type: ModalType, props: any, onCloseHandler: () => void, currentContainerType: ContainerType) => {
        if (isFileModal(type)) {
            return (
                <FileModals
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                />
            );
        }
        if (isDataModal(type)) {
            return (
                <DataModals
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                />
            );
        }
        if (isEditModal(type)) {
            return (
                <EditModals
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                />
            );
        }
        if (isDescriptiveModal(type)) {
            return (
                <DescriptiveModal
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                    containerType={currentContainerType}
                />
            );
        }
        if (isLegacyDialogsModal(type)) {
            return (
                <LegacyDialogsModal
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                />
            );
        }
        if (isCompareMeansModal(type)) {
            return (
                <CompareMeansModal
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                />
            );
        }
        if (isClassifyModal(type)) {
            return (
                <ClassifyModals
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                />
            );
        }
        if (isDimensionReductionModal(type)) {
            return (
                <DimensionReductionModals
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                />
            );
        }
        if (isGeneralLinearModelModal(type)) {
            return (
                <GeneralLinearModelModals
                    modalType={type}
                    onClose={onCloseHandler}
                    props={props}
                />
            );
        }

        switch (type) {
            case ModalType.ComputeVariable:
                return <ComputeVariableModal onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.RecodeSameVariables:
                return <RecodeSameVariablesModal onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalAutomaticLinearModeling:
                return <ModalAutomaticLinearModeling onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalLinear:
                return <ModalLinear onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.Statistics:
                return <Statistics onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.SaveLinear:
                return <SaveLinear onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.OptionsLinear:
                return <OptionsLinear onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.PlotsLinear:
                return <PlotsLinear onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalCurveEstimation:
                return <ModalCurveEstimation onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalPartialLeastSquares:
                return <ModalPartialLeastSquares onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalBinaryLogistic:
                return <ModalBinaryLogistic onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalMultinomialLogistic:
                return <ModalMultinomialLogistic onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalOrdinal:
                return <ModalOrdinal onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalProbit:
                return <ModalProbit onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalNonlinear:
                return <ModalNonlinear onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalWeightEstimation:
                return <ModalWeightEstimation onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalTwoStageLeastSquares:
                return <ModalTwoStageLeastSquares onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalQuantiles:
                return <ModalQuantiles onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ModalOptimalScaling:
                return <ModalOptimalScaling onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.ChartBuilderModal:
                return <ChartBuilderModal onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.SimpleBarModal:
                return <SimpleBarModal onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.Smoothing:
                return <SmoothingModal onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.Decomposition:
                return <DecompositionModal  onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.Autocorrelation:
                return <AutocorrelationModal  onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.UnitRootTest:
                return <UnitRootTestModal  onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            case ModalType.BoxJenkinsModel:
                return <BoxJenkinsModelModal  onClose={onCloseHandler} containerType={currentContainerType} {...props} />;
            default:
                // Exhaustive check for ModalType, though not strictly necessary with TypeScript
                // const _exhaustiveCheck: never = type;
                return null;
        }
    };

    const modalContent = renderSpecificModal(modalToRender.type, modalToRender.props, effectiveOnClose, containerType);

    if (!modalContent) return null;

    // If this ModalContainer instance is for a sidebar, or if it's rendering a modal
    // that handles its own dialog structure (because its group component was removed earlier),
    // return content directly.
    // The main distinction for Dialog wrapping is now primarily for the mobile case in DashboardLayout.
    if (containerType === "sidebar") {
        return modalContent;
    }

    // For dialog containerType, wrap in Dialog. 
    // This is mainly used by DashboardLayout for mobile view.
    return (
        <Dialog open={true} onOpenChange={(open) => !open && effectiveOnClose()}>
            {modalContent}
        </Dialog>
    );
};

export default ModalContainer;
