"use client"

import React from "react";
import { ModalType } from "@/hooks/useModal";
import { ContainerType } from "@/types/ui";
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
    dialogContent: "bg-popover text-popover-foreground p-0 shadow-lg",
    dialogHeader: "bg-muted px-6 py-5 border-b border-border h-16",
    dialogBody: "px-6 py-6",
    dialogFooter: "bg-muted px-6 py-5 border-t border-border h-16",
    dialogTitle: "text-lg font-semibold text-foreground",
    dialogDescription: "text-sm text-muted-foreground",
    primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90 h-8",
    secondaryButton: "border-border text-foreground hover:bg-accent h-8",
    formGroup: "space-y-2 mb-6",
    label: "text-muted-foreground text-xs font-medium",
    input: "h-10 border-input focus:border-ring"
};

interface DataModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
    containerType?: ContainerType;
}

export const DataModals: React.FC<DataModalsProps> = ({ 
    modalType, 
    onClose, 
    props,
    containerType = "dialog" 
}) => {
    // Render the appropriate component based on modalType and containerType
    const renderComponent = () => {
        switch (modalType) {
            case ModalType.DefineVarProps:
                return <DefineVariableProperties onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.VarPropsEditor:
                return <PropertiesEditor onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.DefineDateTime:
                return <DefineDateTime onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.SortCases:
                return <SortCases onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.SortVars:
                return <SortVariables onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.Transpose:
                return <Transpose onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.Restructure:
                return <Restructure onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.Aggregate:
                return <Aggregate onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.WeightCases:
                return <WeightCases onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.DuplicateCases:
                return <DuplicateCases onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.SetMeasurementLevel:
                return <SetMeasurementLevel onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.SelectCases:
                return <SelectCases onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.UnusualCases:
                return <UnusualCases onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.DefineValidationRules:
                return <DefineValidationRules onClose={onClose} containerType={containerType} {...props} />;
            default:
                return null;
        }
    };

    // If sidebar mode, just return the component
    if (containerType === "sidebar") {
        return renderComponent();
    }

    // For dialog mode, just return the component as is
    // Each individual modal will handle its own dialog wrapping
    return renderComponent();
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