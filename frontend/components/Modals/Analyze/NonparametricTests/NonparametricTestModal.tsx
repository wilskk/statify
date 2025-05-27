"use client"
import React, { FC } from "react";
import { ModalType } from "@/hooks/useModal";
// import OneSample from "@/components/Modals/Analyze/NonparametricTests/OneSample";
// import IndependentSamples from "@/components/Modals/Analyze/NonparametricTests/IndependentSamples";
// import RelatedSamples from "@/components/Modals/Analyze/NonparametricTests/RelatedSamples";

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

interface NonparametricTestModalProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const NonparametricTestModal: FC<NonparametricTestModalProps> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        default:
            return null;
    }
};

export const isNonparametricTestModal = (type: ModalType): boolean => {
    return [
        ModalType.Descriptive,
        ModalType.Explore,
        ModalType.Frequencies
    ].includes(type);
};