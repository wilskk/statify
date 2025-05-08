"use client"

import React from "react";
import { ModalType } from "@/hooks/useModal";
import DefineVariableProperties from "@/components/Modals/Data/DefineVarProps";
import DefineDateTime from "@/components/Modals/Data/DefineDateTime";
import SortCases from "@/components/Modals/Data/SortCases";
import SortVariables from "@/components/Modals/Data/SortVars";
import Transpose from "@/components/Modals/Data/Transpose";
import Restructure from "@/components/Modals/Data/Restructure";
import Aggregate from "@/components/Modals/Data/Aggregate";
import WeightCases from "@/components/Modals/Data/WeightCases";
import DuplicateCases from "@/components/Modals/Data/DuplicateCases";
import SetMeasurementLevel from "@/components/Modals/Data/SetMeasurementLevel";
import SelectCases from "@/components/Modals/Data/SelectCases";
import UnusualCases from "@/components/Modals/Data/UnusualCases";
import DefineValidationRules from "@/components/Modals/Data/Validate/DefineValidationRules";
import PropertiesEditor from "@/components/Modals/Data/DefineVarProps/PropertiesEditor";

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

interface DataModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const DataModals: React.FC<DataModalsProps> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        case ModalType.DefineVarProps:
            return <DefineVariableProperties onClose={onClose} {...props} />;
        case ModalType.VarPropsEditor:
            return <PropertiesEditor onClose={onClose} {...props} />;
        case ModalType.DefineDateTime:
            return <DefineDateTime onClose={onClose} {...props} />;
        case ModalType.SortCases:
            return <SortCases onClose={onClose} {...props} />;
        case ModalType.SortVars:
            return <SortVariables onClose={onClose} {...props} />;
        case ModalType.Transpose:
            return <Transpose onClose={onClose} {...props} />;
        case ModalType.Restructure:
            return <Restructure onClose={onClose} {...props} />;
        case ModalType.Aggregate:
            return <Aggregate onClose={onClose} {...props} />;
        case ModalType.WeightCases:
            return <WeightCases onClose={onClose} {...props} />;
        case ModalType.DuplicateCases:
            return <DuplicateCases onClose={onClose} {...props} />;
        case ModalType.SetMeasurementLevel:
            return <SetMeasurementLevel onClose={onClose} {...props} />;
        case ModalType.SelectCases:
            return <SelectCases onClose={onClose} {...props} />;
        case ModalType.UnusualCases:
            return <UnusualCases onClose={onClose} {...props} />;
        case ModalType.DefineValidationRules:
            return <DefineValidationRules onClose={onClose} {...props} />;
        default:
            return null;
    }
};

export const isDataModal = (type: ModalType): boolean => {
    return [
        ModalType.DefineVarProps,
        ModalType.VarPropsEditor,
        ModalType.DefineDateTime,
        ModalType.SortCases,
        ModalType.SortVars,
        ModalType.Transpose,
        ModalType.MergeFiles,
        ModalType.Restructure,
        ModalType.Aggregate,
        ModalType.SplitFile,
        ModalType.WeightCases,
        ModalType.DuplicateCases,
        ModalType.SetMeasurementLevel,
        ModalType.MultipleResponse,
        ModalType.NewCustomAttr,
        ModalType.SelectCases,
        ModalType.UnusualCases,
        ModalType.DefineValidationRules
    ].includes(type);
};