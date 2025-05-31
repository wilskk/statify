"use client"
import React, { FC } from "react";
import { ModalType } from "@/hooks/useModal";
import OneSampleTTest from "@/components/Modals/Analyze/CompareMeans/OneSampleTTest";
import IndependentSamplesTTest from "@/components/Modals/Analyze/CompareMeans/IndependentSamplesTTest";
import PairedSamplesTTest from "@/components/Modals/Analyze/CompareMeans/PairedSamplesTTest";

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

interface CompareMeansModalProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const CompareMeansModal: FC<CompareMeansModalProps> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        // case ModalType.OneSampleTTest:
        //     return <OneSampleTTest onClose={onClose} {...props} />;
        // case ModalType.IndependentSamplesTTest:
        //     return <IndependentSamplesTTest onClose={onClose} {...props} />;
        // case ModalType.PairedSamplesTTest:
        //     return <PairedSamplesTTest onClose={onClose} {...props} />;
        default:
            return null;
    }
};

export const isCompareMeansModal = (type: ModalType): boolean => {
    return false;
    // return [
    //     // ModalType.OneSampleTTest,
    //     // ModalType.IndependentSamplesTTest,
    //     // ModalType.PairedSamplesTTest,
    // ].includes(type);
};