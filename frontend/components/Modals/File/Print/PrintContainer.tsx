"use client";

import React from "react";
import { PrintContainerProps } from "./Print.types";
import { usePrintLogic } from "./usePrintLogic";
import { PrintUI } from "./Print";

const PrintContainer: React.FC<PrintContainerProps> = ({
    isOpen,
    onClose,
    containerType = "dialog",
}) => {
    const logicProps = usePrintLogic({ isOpen, onClose });

    if (!isOpen) return null;

    return <PrintUI {...logicProps} containerType={containerType} />;
};

export default PrintContainer; 