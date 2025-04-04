"use client"

import React from "react";
import { ModalType } from "@/hooks/useModal";
import Descriptive from "@/components/Modals/Analyze/Descriptive/Descriptive";
import Explore from "@/components/Modals/Analyze/Descriptive/Explore";
import Frequencies from "@/components/Modals/Analyze/Descriptive/Frequencies";
import Crosstabs from "@/components/Modals/Analyze/Descriptive/Crosstabs";
import Ratio from "@/components/Modals/Analyze/Descriptive/Ratio";
import PPPlots from "@/components/Modals/Analyze/Descriptive/PPPlots";
import QQPlots from "@/components/Modals/Analyze/Descriptive/QQPlots";

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

interface DescriptiveModalProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const DescriptiveModal: React.FC<DescriptiveModalProps> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        case ModalType.Descriptive:
            return <Descriptive onClose={onClose} {...props} />;
        case ModalType.Explore:
            return <Explore onClose={onClose} {...props} />;
        case ModalType.Frequencies:
            return <Frequencies onClose={onClose} {...props} />;
        case ModalType.Crosstabs:
            return <Crosstabs onClose={onClose} {...props} />;
        case ModalType.Ratio:
            return <Ratio onClose={onClose} {...props} />;
        case ModalType.PPPlots:
            return <PPPlots onClose={onClose} {...props} />;
        case ModalType.QQPlots:
            return <QQPlots onClose={onClose} {...props} />;
        default:
            return null;
    }
};

export const isDescriptiveModal = (type: ModalType): boolean => {
    return [
        ModalType.Descriptive,
        ModalType.Explore,
        ModalType.Frequencies,
        ModalType.Crosstabs,
        ModalType.Ratio,
        ModalType.PPPlots,
        ModalType.QQPlots
    ].includes(type);
};