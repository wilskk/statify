"use client";

import React from "react";
import { OpenSavFileContainerProps } from "./OpenSavFile.types";
import { useOpenSavFileLogic } from "./useOpenSavFileLogic";
import { OpenSavFileUI } from "./OpenSavFile";

const OpenSavFileContainer: React.FC<OpenSavFileContainerProps> = ({
    isOpen,
    onClose,
    containerType = "dialog",
}) => {
    const logicProps = useOpenSavFileLogic({ isOpen, onClose });

    if (!isOpen) return null;

    if (containerType === "sidebar") {
        return <OpenSavFileUI {...logicProps} containerType={containerType} />;
    }

    return <OpenSavFileUI {...logicProps} containerType={containerType} />;
};

export default OpenSavFileContainer; 