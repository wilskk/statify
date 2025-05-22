"use client"

import React from "react";
import { ModalType } from "@/hooks/useModal";
import Smoothing from "@/components/Modals/Analyze/TimeSeriesNew/Smoothing";
import Decomposition from "@/components/Modals/Analyze/TimeSeriesNew/Decomposition";
import Autocorrelation from "@/components/Modals/Analyze/TimeSeriesNew/Autocorrelation";
import UnitRootTest from "@/components/Modals/Analyze/TimeSeriesNew/UnitRootTest";
import BoxJenkinsModel from "@/components/Modals/Analyze/TimeSeriesNew/BoxJenkinsModel";

export const modalStyles = {
    dialogContent: "bg-white p-0 shadow-[0px_4px_12px_rgba(0,0,0,0.08)]",
    dialogHeader: "bg-[#F7F7F7] px-6 py-5 border-b border-[#E6E6E6] h-16",
    dialogBody: "px-6 py-6",
    dialogFooter: "bg-[#F7F7F7] px-6 py-5 border-t border-[#E6E6E6] h-16",
    dialogTitle: "text-lg font-semibold text-black",
    dialogDescription: "text-sm text-[#888888]",
    primaryButton: "bg-black text-white hover:opacity-90 h-8",
    secondaryButton: "border-[#CCCCCC] text-black hover:bg-[#F7F7F7] h-8",
    formGroup: "space-y-2 mb-6",
    label: "text-[#444444] text-xs font-medium",
    input: "h-10 border-[#CCCCCC] focus:border-black"
};

interface TimeSeriesModalProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const TimeSeriesModal: React.FC<TimeSeriesModalProps> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        case ModalType.Smoothing:
            return <Smoothing onClose={onClose} {...props} />;
        case ModalType.Decomposition:
            return <Decomposition onClose={onClose} {...props} />;
        case ModalType.Autocorrelation:
            return <Autocorrelation onClose={onClose} {...props} />;
        case ModalType.UnitRootTest:
            return <UnitRootTest onClose={onClose} {...props} />;
        case ModalType.BoxJenkinsModel:
            return <BoxJenkinsModel onClose={onClose} {...props} />;
        default:
            return null;
    }
};

export const isTimeSeriesModal = (type: ModalType): boolean => {
    return [
        ModalType.Smoothing,
        ModalType.Decomposition,
        ModalType.Autocorrelation,
        ModalType.UnitRootTest,
        ModalType.BoxJenkinsModel
    ].includes(type);
};