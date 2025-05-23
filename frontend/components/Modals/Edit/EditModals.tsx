"use client"

import React from "react";
import { ModalType } from "@/hooks/useModal";
import { ContainerType } from "@/types/ui";
import { FindAndReplaceModal, FindReplaceMode } from "@/components/Modals/Edit/FindReplace/FindReplace";
import GoToModal, { GoToMode } from "@/components/Modals/Edit/GoTo/GoTo";

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

interface EditModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
    containerType?: ContainerType;
}

export const EditModals: React.FC<EditModalsProps> = ({ 
    modalType, 
    onClose, 
    props,
    containerType = "dialog"
}) => {
    switch (modalType) {
        case ModalType.Find:
            return (
                <FindAndReplaceModal
                    onClose={onClose}
                    defaultTab={FindReplaceMode.FIND}
                    containerType={containerType}
                    {...props}
                />
            );
        case ModalType.Replace:
            return (
                <FindAndReplaceModal
                    onClose={onClose}
                    defaultTab={FindReplaceMode.REPLACE}
                    containerType={containerType}
                    {...props}
                />
            );
        case ModalType.GoToCase:
            return (
                <GoToModal
                    onClose={onClose}
                    defaultMode={GoToMode.CASE}
                    containerType={containerType}
                    {...props}
                />
            );
        case ModalType.GoToVariable:
            return (
                <GoToModal
                    onClose={onClose}
                    defaultMode={GoToMode.VARIABLE}
                    containerType={containerType}
                    {...props}
                />
            );
        default:
            return null;
    }
};

export const isEditModal = (type: ModalType): boolean => {
    return [
        ModalType.Find,
        ModalType.Replace,
        ModalType.GoToCase,
        ModalType.GoToVariable
    ].includes(type);
};