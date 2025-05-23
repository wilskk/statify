"use client";

import React from "react";
import { ImportExcelContainerProps } from "./ImportExcel.types";
import { useImportExcelLogic } from "./useImportExcelLogic";
import { ImportExcelUI } from "./ImportExcel";

const ImportExcelContainer: React.FC<ImportExcelContainerProps> = ({
    isOpen,
    onClose,
    containerType = "dialog",
}) => {
    const logicProps = useImportExcelLogic({ isOpen, onClose });

    if (!isOpen) return null;

    return <ImportExcelUI {...logicProps} containerType={containerType} />;
};

export default ImportExcelContainer; 